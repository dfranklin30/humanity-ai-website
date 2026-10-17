/**
 * Game art: painted sprites and a background for a child's game.
 *
 * A game drawn with canvas rectangles looks like a demo. The storybooks the
 * same children make look like real picture books, because an image model
 * paints every page in one style from one detailed character description,
 * with the cover as the reference. Games now get that same treatment:
 *
 *   - one picture-book style for the whole game (the hero's own style when
 *     the game was made from a hero, so the book, the movie and the game look
 *     like one world),
 *   - the full, detailed look for every character, never a two-word label,
 *   - the hero's portrait as the drawing reference for the player sprite, so
 *     the character a child plays IS the character they made,
 *   - bigger sprites and a sharper background than before.
 *
 * The sprites are cut out of a flat green backdrop and everything is handed
 * to the game code as `window.AIK_ART`. Nothing here is required for a game
 * to work: if a picture fails, the code is told to draw shapes for the rest.
 */

import sharp from "sharp";
import { generateImage } from "./ai";
import { contentSafetyImage } from "./safety";
import { isContentSafetyConfigured } from "./config";
import { logger } from "../lib/logger";
import type { GamePlan } from "./forge";

export type GameArt = {
  style: string;
  /** data: URL, 1280x720 JPEG */
  background?: string;
  /** entity name -> data: URL, PNG with transparency, longest side SPRITE_PX */
  sprites: Record<string, string>;
  /** names of entities that were asked for but did not come out */
  missing: string[];
  /** the sprite key of the hero the child plays, when the game was made from a hero */
  player?: string;
};

/** A hero from the Remix workflow, carried into the game as the player. */
export type GameHero = {
  name: string;
  look: string;
  style?: string | null;
  /** The hero's screened portrait (base64 PNG), used as the drawing reference. */
  portraitPng?: string | null;
};

/**
 * The house style, worded the way the storybook pages are worded: the same
 * phrasing is what makes the picture model draw at picture-book quality.
 */
export const GAME_ART_STYLE = "cheerful cartoon";
const QUALITY =
  "children's picture-book illustration quality: rich painterly detail, clean confident outlines, soft warm lighting, gentle shading, expressive friendly face, appealing proportions";
const NO_TEXT = "No words, no letters, no signs, no real people, no logos. Kid-friendly, bright.";

const MAX_SPRITES = 5;
const SPRITE_PX = 384;

function spritePrompt(look: string, name: string, style: string, isHero: boolean): string {
  const same = isHero ? " Exactly the same character, colours and outfit as the reference picture." : "";
  return `${style} character art for a children's video game, ${QUALITY}. The character: ${look || name}.${same} One character only, whole body in view, facing right, centred, filling most of the frame. Plain flat solid bright green (#00FF00) background with nothing else in it: no shadow, no floor, no border. ${NO_TEXT}`;
}

function backgroundPrompt(art: string, pitch: string, style: string): string {
  return `${style} children's picture-book illustration of a wide scene for a 2D video game: ${art || pitch}. ${QUALITY.replace(", expressive friendly face, appealing proportions", "")}, depth and atmosphere, a clear open area across the middle where characters will move. No characters, no creatures, no user interface. ${NO_TEXT}`;
}

/** Key the flat green backdrop out of a sprite and shrink it for the game. */
async function cutOut(bytes: Buffer): Promise<Buffer> {
  const img = sharp(bytes).resize(SPRITE_PX, SPRITE_PX, { fit: "inside" }).ensureAlpha();
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
  // Trim the empty margin so a sprite's box is the character, not the canvas.
  const keyed = await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  try {
    return await sharp(keyed).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toBuffer();
  } catch {
    return sharp(keyed).png({ compressionLevel: 9 }).toBuffer();
  }
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

/** Which planned entity is the hero: by name first, then the player role, then the first one. */
export function heroEntityIndex(plan: GamePlan, hero: GameHero): number {
  const list = (plan.entities ?? []).filter((e) => e?.name).slice(0, MAX_SPRITES);
  const name = hero.name.trim().toLowerCase();
  let i = list.findIndex((e) => String(e.name).trim().toLowerCase() === name);
  if (i === -1) i = list.findIndex((e) => /player|hero|you\b|main/i.test(String(e.role)));
  return list.length ? Math.max(0, i) : -1;
}

/**
 * Paint everything the plan asks for. The hero (when there is one) is painted
 * first, from their portrait; the other characters are painted with the
 * hero's sprite as a style reference so they belong to the same world. Runs
 * one picture at a time (image models allow few requests a minute) and never throws.
 */
export async function paintGameArt(plan: GamePlan, onStep?: (note: string) => void, opts: { hero?: GameHero | null } = {}): Promise<GameArt> {
  const hero = opts.hero && opts.hero.look ? opts.hero : null;
  const style = (hero?.style && String(hero.style).trim()) || GAME_ART_STYLE;
  const art: GameArt = { style, sprites: {}, missing: [] };
  const entities = (plan.entities ?? []).filter((e) => e?.name).slice(0, MAX_SPRITES).map((e) => ({ ...e }));

  // The hero keeps their own name and their full look.
  const heroAt = hero ? heroEntityIndex(plan, hero) : -1;
  if (hero && heroAt >= 0) {
    entities[heroAt].look = hero.look;
    // Hero first, so their sprite can steer the rest.
    const [h] = entities.splice(heroAt, 1);
    entities.unshift(h);
  }

  onStep?.("Painting the background");
  try {
    const bg = await generateImage(backgroundPrompt(plan.art, plan.pitch, style), { size: "1536x1024" });
    const bytes = Buffer.from(bg.base64, "base64");
    if (await safe(bytes, "background")) {
      const jpg = await sharp(bytes).resize(1280, 720, { fit: "cover" }).jpeg({ quality: 88 }).toBuffer();
      art.background = `data:image/jpeg;base64,${jpg.toString("base64")}`;
    }
  } catch (err) {
    logger.warn({ err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] game background failed");
  }

  let styleRef: string | undefined;
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    const isHero = Boolean(hero) && heroAt >= 0 && i === 0;
    const key = spriteKey(e.name);
    onStep?.(isHero ? `Painting ${e.name}, your hero` : `Painting ${e.name}`);
    try {
      const reference = isHero ? hero?.portraitPng ?? undefined : styleRef;
      const pic = await generateImage(spritePrompt(e.look, e.name, style, isHero), { size: "1024x1024", reference });
      const bytes = Buffer.from(pic.base64, "base64");
      if (!(await safe(bytes, e.name))) {
        art.missing.push(key);
        continue;
      }
      const png = await cutOut(bytes);
      art.sprites[key] = `data:image/png;base64,${png.toString("base64")}`;
      if (isHero) {
        art.player = key;
        styleRef = pic.base64;
      }
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
export function artRules(plan: GamePlan, hero?: GameHero | null): string {
  const names = (plan.entities ?? [])
    .filter((e) => e?.name)
    .slice(0, MAX_SPRITES)
    .map((e) => `window.AIK_ART.sprites.${spriteKey(e.name)} (${e.name}: ${e.role})`);
  const heroLine = hero
    ? `\n- THE PLAYER IS THE HERO "${hero.name}". window.AIK_ART.player names their sprite key. The character the child controls must be drawn with that sprite, a little larger than the others, and named "${hero.name}" on the title screen and in the HUD.`
    : "";
  return `
ARTWORK IS PROVIDED, painted in picture-book style. A script tag defining window.AIK_ART is injected at the top of <body> before your code runs:
- window.AIK_ART.background: a data: URL of a 1280x720 background picture. Draw it first every frame, scaled to fill the canvas (ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)). Do NOT draw a flat fill or gradient over it.
- window.AIK_ART.sprites: data: URLs of transparent PNG sprites, one per character: ${names.join("; ") || "none"}. Each faces right and is trimmed to the character.
- At startup create an Image for each (new Image(); img.src = url) and keep an 'ok' flag set in onload. Draw each entity with ctx.drawImage(sprite, x, y, w, h), keeping the sprite's aspect ratio (w = h * img.naturalWidth / img.naturalHeight); to face left, ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); drawImage at 0,0; ctx.restore().
- Set ctx.imageSmoothingEnabled = true and ctx.imageSmoothingQuality = "high" so the paintings stay crisp.
- Any entry may be missing (undefined) or still loading: in that case draw that one thing as a simple shape instead. Never let a missing picture throw.${heroLine}
- Keep all your own HUD, particles, flashes and effects; the art replaces the character and background drawing only.`;
}

/** Put the art where the game code expects it. The verifier sees it too. */
export function injectArt(html: string, art: GameArt): string {
  const payload = JSON.stringify({ background: art.background ?? null, sprites: art.sprites, style: art.style, player: art.player ?? null });
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
