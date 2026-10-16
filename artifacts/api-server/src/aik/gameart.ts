/**
 * Game art: painted sprites and a background for a child's game.
 *
 * A game drawn with canvas rectangles looks like a demo. The movies the same
 * children make look like films, because a real image model paints them. This
 * gives games the same treatment: once the game is planned, the hero, the
 * enemies, the pickups and the backdrop are painted by the image model in the
 * studio's house style, the sprites are cut out of a flat green backdrop, and
 * everything is handed to the game code as `window.AIK_ART`.
 *
 * Nothing here is required for a game to work. If a picture fails, the game
 * gets whatever was painted, and the code is told to draw shapes for the rest.
 */

import sharp from "sharp";
import { generateImage } from "./ai";
import { contentSafetyImage } from "./safety";
import { isContentSafetyConfigured } from "./config";
import { logger } from "../lib/logger";
import type { GamePlan } from "./forge";

export type GameArt = {
  style: string;
  /** data: URL, 1024x576 JPEG */
  background?: string;
  /** entity name -> data: URL, PNG with transparency, longest side 256px */
  sprites: Record<string, string>;
  /** names of entities that were asked for but did not come out */
  missing: string[];
};

/** The house style: what the Video Maker uses, so a class's work looks like one world. */
export const GAME_ART_STYLE = "soft claymation, chunky rounded shapes, bright friendly colours, gentle studio lighting, kid-friendly";

const MAX_SPRITES = 4;
const KEY = { r: 0, g: 255, b: 0 }; // the backdrop the model is asked for, and keyed out

function spritePrompt(look: string, name: string, style: string): string {
  return `A single ${look || name} for a children's video game, ${style}. Whole body in view, facing right, centered, filling most of the frame. Plain flat solid bright green (#00FF00) background with nothing else in it: no shadow, no floor, no text, no border.`;
}

function backgroundPrompt(art: string, pitch: string, style: string): string {
  return `A wide background scene for a children's 2D video game: ${art || pitch}. ${style}. No characters, no creatures, no text, no user interface; soft detail so sprites stand out in front of it.`;
}

/** Key the flat green backdrop out of a sprite and shrink it for the game. */
async function cutOut(bytes: Buffer): Promise<Buffer> {
  const img = sharp(bytes).resize(256, 256, { fit: "inside" }).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const px = data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    // Green-dominant pixels are backdrop. Soft edge: partially green pixels fade.
    const dom = g - Math.max(r, b);
    if (g > 120 && dom > 70) px[i + 3] = 0;
    else if (g > 100 && dom > 35) {
      px[i + 3] = Math.round(px[i + 3] * (1 - (dom - 35) / 35));
      // pull the green fringe back toward neutral
      px[i + 1] = Math.round((r + b) / 2);
    }
  }
  return sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
}

async function safe(bytes: Buffer, label: string): Promise<boolean> {
  if (!isContentSafetyConfigured()) return true;
  try {
    const flags = await contentSafetyImage(bytes.toString("base64"));
    if (flags.length) logger.warn({ label, flags }, "[aik] game art rejected by screening");
    return flags.length === 0;
  } catch (err) {
    logger.warn({ err, label }, "[aik] game art screening unavailable; dropping the picture");
    return false;
  }
}

/**
 * Paint everything the plan asks for. Runs the pictures one after another
 * (the image model allows four requests a minute) and never throws.
 */
export async function paintGameArt(plan: GamePlan, onStep?: (note: string) => void): Promise<GameArt> {
  const style = GAME_ART_STYLE;
  const art: GameArt = { style, sprites: {}, missing: [] };
  const entities = (plan.entities ?? []).filter((e) => e?.name).slice(0, MAX_SPRITES);

  onStep?.("Painting the background");
  try {
    const bg = await generateImage(backgroundPrompt(plan.art, plan.pitch, style), { size: "1536x1024" });
    const bytes = Buffer.from(bg.base64, "base64");
    if (await safe(bytes, "background")) {
      const jpg = await sharp(bytes).resize(1024, 576, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
      art.background = `data:image/jpeg;base64,${jpg.toString("base64")}`;
    }
  } catch (err) {
    logger.warn({ err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] game background failed");
  }

  for (const e of entities) {
    const key = spriteKey(e.name);
    onStep?.(`Painting ${e.name}`);
    try {
      const pic = await generateImage(spritePrompt(e.look, e.name, style), { size: "1024x1024" });
      const bytes = Buffer.from(pic.base64, "base64");
      if (!(await safe(bytes, e.name))) {
        art.missing.push(key);
        continue;
      }
      const png = await cutOut(bytes);
      art.sprites[key] = `data:image/png;base64,${png.toString("base64")}`;
    } catch (err) {
      logger.warn({ err: String((err as Error)?.message ?? err).slice(0, 200), entity: e.name }, "[aik] game sprite failed");
      art.missing.push(key);
    }
  }
  return art;
}

/** "Space Rock" -> "spaceRock": the key the game code uses. */
export function spriteKey(name: string): string {
  const words = String(name).toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "thing";
  return words[0] + words.slice(1).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
}

/** The rules the build prompt gets when art exists, naming exactly what is there. */
export function artRules(plan: GamePlan): string {
  const names = (plan.entities ?? []).filter((e) => e?.name).slice(0, MAX_SPRITES).map((e) => `window.AIK_ART.sprites.${spriteKey(e.name)} (${e.name}: ${e.role})`);
  return `
ARTWORK IS PROVIDED, painted in the studio's style. A script tag defining window.AIK_ART is injected at the top of <body> before your code runs:
- window.AIK_ART.background: a data: URL of a 1024x576 background picture. Draw it first every frame, scaled to fill the canvas (ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)). Do NOT draw a flat fill or gradient over it.
- window.AIK_ART.sprites: data: URLs of transparent PNG sprites, one per character: ${names.join("; ") || "none"}. Each faces right.
- At startup create an Image for each (new Image(); img.src = url) and keep an 'ok' flag set in onload. Draw each entity with ctx.drawImage(sprite, x, y, w, h) sized to the entity; to face left, ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); drawImage at 0,0; ctx.restore().
- Any entry may be missing (undefined) or still loading: in that case draw that one thing as a simple shape instead. Never let a missing picture throw.
- Keep all your own HUD, particles, flashes and effects; the art replaces the character and background drawing only.`;
}

/** Put the art where the game code expects it. The verifier sees it too. */
export function injectArt(html: string, art: GameArt): string {
  const payload = JSON.stringify({ background: art.background ?? null, sprites: art.sprites, style: art.style });
  const tag = `<script>window.AIK_ART=${payload};</script>`;
  if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, (m) => `${m}\n${tag}`);
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}\n${tag}`);
  return tag + html;
}

/** The document without its art payload: what the model is shown when it edits the game. */
export function stripArt(html: string): string {
  return html.replace(/<script>window\.AIK_ART=[\s\S]*?<\/script>\n?/, "<!-- window.AIK_ART is injected here -->\n");
}

/** The art tag of an existing game, so an edited version keeps its pictures. */
export function extractArtTag(html: string): string | null {
  const m = /<script>window\.AIK_ART=[\s\S]*?<\/script>/.exec(html);
  return m ? m[0] : null;
}

/** Carry the previous version's art into a new document that lacks it. */
export function carryArt(html: string, previous: string): string {
  if (/window\.AIK_ART\s*=/.test(html)) return html;
  const tag = extractArtTag(previous);
  if (!tag) return html;
  if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, (m) => `${m}\n${tag}`);
  return tag + html;
}
