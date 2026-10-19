/**
 * The Remix workflow.
 *
 *   Create a hero ──► what they look like (a screened portrait)
 *                └─► what they sound like (a voice, with a sample)
 *        │ save
 *        ▼
 *   put them in a storybook / movie / game / song / picture …   (each saved)
 *        ▲                        │
 *        └──────── remix ◄────────┘   any saved piece becomes the starting
 *                                     point for any other tool, or for ideas
 *        ▼
 *   save the project ──► email the participant, cc the facilitator and the org
 *
 * Everything a tool makes is turned into a plain-text "representation" here.
 * That representation is what travels between tools: it is shown to the next
 * model as source material, it is offered as a words.txt download, and it is
 * what "Generate ideas" reads. Media never travels — a storybook remixed into
 * a movie gets the story, the hero and the look, not the pixels — except for
 * a hero's portrait (used as the drawing reference for a storybook cover) and
 * a hero's voice (used for narration), which are the whole point of a hero.
 */
import { completeText, speak, usableVoice, type VoiceChoice } from "./ai";
import { aikConfig, isImageConfigured, isTtsConfigured } from "./config";
import { drawScreened } from "./book";
import { extractJson, getMode, type ModeDef } from "./modes";
import { putMedia, getMedia, type MediaRef } from "./media";
import { screenInput, screenOutputText, stripLinks, type Flag } from "./safety";
import * as store from "./store";
import type { ArtifactRow, ModeId } from "./store";
import { logger } from "../lib/logger";

/* ------------------------------------------------------------------ *
 * Heroes
 * ------------------------------------------------------------------ */

export const HERO_STYLES = ["cheerful cartoon", "bright watercolor", "soft claymation", "pixel art", "cut-paper collage", "cozy gouache"] as const;

export type Hero = {
  format: "hero";
  name: string;
  /** One detailed visual description, reused for every picture and shot. */
  look: string;
  personality: string;
  style: string;
  portrait?: MediaRef;
  voice?: VoiceChoice;
  /** A short line in the hero's voice. */
  sample?: MediaRef;
  sampleText?: string;
};

export function parseHero(content: string | null | undefined): Hero | null {
  try {
    const j = JSON.parse(content ?? "");
    return j && j.format === "hero" && typeof j.name === "string" ? (j as Hero) : null;
  } catch {
    return null;
  }
}

function clean(s: unknown, max: number): string {
  return String(s ?? "")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export type HeroInput = { name: string; look: string; personality: string; style: string };

export function validateHero(raw: any): { ok: true; hero: HeroInput } | { ok: false; error: string } {
  const name = clean(raw?.name, 40);
  const look = clean(raw?.look, 400);
  const personality = clean(raw?.personality, 240);
  const style = HERO_STYLES.includes(raw?.style) ? String(raw.style) : HERO_STYLES[0];
  if (!name) return { ok: false, error: "Give your hero a name." };
  if (look.length < 8) return { ok: false, error: "Describe what your hero looks like: shape, colours, clothes, one special detail." };
  return { ok: true, hero: { name, look, personality, style } };
}

function portraitPrompt(h: HeroInput): string {
  return `${h.style} character portrait for a children's picture book. The character: ${h.look}. Full body, standing, friendly face, facing the viewer, plain soft background. No words, no letters, no signs, no real people, no logos. Kid-friendly, bright.`;
}

function sampleLine(h: { name: string; personality: string }): string {
  const p = h.personality ? ` ${h.personality.replace(/[.!?]*$/, "")}.` : "";
  return `Hi! I'm ${h.name}.${p} Let's make something amazing together!`;
}

/**
 * Build (or rebuild) a hero as a background job behind a request row, so the
 * Hub can poll it like any other tool and the media lands under r<request>/.
 * A rebuild keeps the previous portrait when the look and style did not change,
 * and the previous voice sample when the name, personality and voice did not.
 */
export async function runHeroJob(opts: {
  requestId: number;
  classId: number;
  /** The child who made the hero, or null for a staff workspace. */
  childId?: number | null;
  projectId: number | null;
  input: HeroInput;
  voice: VoiceChoice | null;
  previous: ArtifactRow | null;
}): Promise<void> {
  const { requestId, input } = opts;
  const flags: Flag[] = [];
  const fail = (status: "blocked" | "failed", message: string, more: Flag[] = []) =>
    store.finishRequest(requestId, { status, message, flags: [...flags, ...more] });
  try {
    await store.markWorking(requestId);
    const screen = await screenInput([input.name, input.look, input.personality].join("\n"));
    flags.push(...screen.flags);
    if (!screen.ok) return void (await fail("blocked", screen.kidMessage));

    const before = opts.previous ? parseHero(opts.previous.content) : null;
    const hero: Hero = { format: "hero", name: input.name, look: input.look, personality: input.personality, style: input.style };

    const steps: { key: string; label: string; state: "running" | "done" | "failed" | "skipped"; detail?: string }[] = [];
    const progress = () => store.setProgress(requestId, steps).catch(() => {});

    /* What they look like */
    if (before?.portrait && before.look === hero.look && before.style === hero.style) {
      hero.portrait = before.portrait;
      steps.push({ key: "portrait", label: "Keeping the portrait", state: "done", detail: "look unchanged" });
    } else if (isImageConfigured()) {
      steps.push({ key: "portrait", label: "Drawing what they look like", state: "running" });
      await progress();
      const drawn = await drawScreened(portraitPrompt(hero), undefined, flags);
      if (drawn.blocked) return void (await fail("blocked", drawn.message));
      if (drawn.png) {
        hero.portrait = await putMedia(requestId, "portrait.png", Buffer.from(drawn.png, "base64"), "image/png");
        steps[steps.length - 1] = { ...steps[steps.length - 1], state: "done" };
      } else {
        steps[steps.length - 1] = { ...steps[steps.length - 1], state: "failed", detail: drawn.message || "the picture didn't come out" };
      }
    } else {
      steps.push({ key: "portrait", label: "Portrait", state: "skipped", detail: "pictures aren't switched on" });
    }

    /* What they sound like */
    const voice = usableVoice(opts.voice) ?? (before?.voice ? usableVoice(before.voice) : null);
    if (voice) hero.voice = voice;
    const line = sampleLine(hero);
    const sameSample = before?.sample && before.sampleText === line && JSON.stringify(before.voice ?? null) === JSON.stringify(hero.voice ?? null);
    if (sameSample) {
      hero.sample = before!.sample;
      hero.sampleText = line;
      steps.push({ key: "voice", label: "Keeping the voice", state: "done" });
    } else if (voice || isTtsConfigured()) {
      steps.push({ key: "voice", label: `Recording ${voice?.name ?? "the voice"}`, state: "running" });
      await progress();
      try {
        const a = await speak(line, voice);
        hero.sample = await putMedia(requestId, "voice.mp3", Buffer.from(a.base64, "base64"), a.mime);
        hero.sampleText = line;
        steps[steps.length - 1] = { ...steps[steps.length - 1], state: "done" };
      } catch (err) {
        logger.warn({ requestId, err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] hero voice sample failed");
        steps[steps.length - 1] = { ...steps[steps.length - 1], state: "failed", detail: "the voice didn't record; try another voice" };
      }
    }
    await progress();

    const klass = await store.getClass(opts.classId);
    const artifact = await store.createArtifact({
      classId: opts.classId,
      childId: opts.childId ?? null,
      kind: "hero",
      title: hero.name,
      content: JSON.stringify(hero),
      mime: "application/json",
      summary: `${hero.name}: ${hero.look}`.slice(0, 500),
      // Hub work is approved by the adult who made it; a class hero with a picture waits
      // unless the class auto-approves (the portrait was screened when it was drawn).
      approved: klass?.kind === "workspace" || !hero.portrait || aikConfig.classAutoApprove,
      parentArtifactId: opts.previous?.id ?? null,
      projectId: opts.projectId,
    });
    await store.finishRequest(requestId, { status: "done", message: null, flags, resultArtifactId: artifact.id });
  } catch (err) {
    logger.error({ err, requestId }, "[aik] hero job failed");
    await fail("failed", "Making the hero didn't work this time. Try again in a moment.", [{ layer: "system", category: "error", detail: String((err as any)?.message ?? err).slice(0, 200) }]);
  }
}

/* ------------------------------------------------------------------ *
 * Representation: what one tool's output means to another tool
 * ------------------------------------------------------------------ */

const KIND_NAMES: Record<string, string> = {
  hero: "hero",
  story: "storybook",
  video: "movie",
  game: "game",
  audio: "song",
  image: "picture",
  quest: "fact list",
  robot: "robot plan",
};

export function kindName(kind: string): string {
  return KIND_NAMES[kind] ?? kind;
}

function safeJson(s: string | null | undefined): any {
  try {
    return JSON.parse(s ?? "");
  } catch {
    return null;
  }
}

/** The words of a piece, as plain text a person or a model can reuse. No media, no code. */
export function representation(a: Pick<ArtifactRow, "kind" | "title" | "content" | "summary">, max = 3500): string {
  const lines: string[] = [];
  const add = (label: string, v: unknown) => {
    const t = typeof v === "string" ? v.trim() : "";
    if (t) lines.push(label ? `${label}: ${t}` : t);
  };
  if (a.kind === "hero") {
    const h = parseHero(a.content);
    if (h) {
      add("Hero", h.name);
      add("Looks like", h.look);
      add("Personality", h.personality);
      add("Art style", h.style);
      if (h.voice?.name) add("Voice", h.voice.name);
    }
  } else if (a.kind === "story") {
    const b = safeJson(a.content);
    if (b?.format === "book") {
      add("Title", b.title);
      add("Hero", b.hero?.name);
      add("Hero looks like", b.hero?.look);
      add("Art style", b.style);
      (b.pages ?? []).forEach((p: any, i: number) => add(`Page ${i + 1}`, p?.text));
      add("Last line", b.theEnd);
    } else if (Array.isArray(b?.panels)) {
      add("Title", a.title);
      b.panels.forEach((p: any, i: number) => add(`Panel ${i + 1}`, [p?.narration, p?.dialogue].filter(Boolean).join(" ")));
    } else add("", a.summary ?? a.title);
  } else if (a.kind === "video") {
    const m = safeJson(a.content) ?? safeJson(a.summary);
    add("Title", m?.title ?? a.title);
    add("Look", m?.style);
    (m?.shots ?? []).forEach((s: any, i: number) => add(`Shot ${i + 1}`, s?.description));
  } else if (a.kind === "audio") {
    const j = safeJson(a.summary);
    add("Song title", j?.title ?? a.title);
    add("Sound", j?.musicPrompt);
    add("Lyrics", typeof j?.lyrics === "string" ? j.lyrics : Array.isArray(j?.lyrics) ? j.lyrics.join(" / ") : "");
    if (!j) add("", a.summary);
  } else if (a.kind === "image") {
    add("Picture", a.title);
    add("What it shows", a.summary);
  } else if (a.kind === "game") {
    add("Game", a.title);
    add("How it plays", a.summary);
  } else if (a.kind === "quest") {
    const q = safeJson(a.content);
    add("Topic", q?.title ?? a.title);
    (q?.items ?? []).forEach((it: any, i: number) => add(`${i + 1}`, [it?.text, it?.answer].filter(Boolean).join(" — ")));
    add("Next idea", q?.nextIdea);
  } else if (a.kind === "robot") {
    const r = safeJson(a.content);
    add("Robot", r?.name ?? a.title);
    add("Job", r?.job);
    if (Array.isArray(r?.parts)) add("Parts", r.parts.map((p: any) => (typeof p === "string" ? p : p?.name)).filter(Boolean).join(", "));
    if (Array.isArray(r?.steps)) r.steps.slice(0, 8).forEach((s: any, i: number) => add(`Step ${i + 1}`, typeof s === "string" ? s : s?.text));
  } else {
    add("", a.summary ?? a.title);
  }
  if (!lines.length) add("Title", a.title);
  return stripLinks(lines.join("\n")).slice(0, max);
}

/** What the next model is told about the piece it is remixing. */
export function remixBlock(source: ArtifactRow, targetName: string): string {
  const hero = source.kind === "hero" ? parseHero(source.content) : null;
  const rep = representation(source);
  const head = hero
    ? `PUT THIS HERO IN IT. The director made a hero and wants them in this new ${targetName}. The hero is the main character. Keep their name, how they look and how they act EXACTLY; every picture, shot or sprite of them must match this description.`
    : `REMIX SOURCE. The director is turning their ${kindName(source.kind)} "${source.title}" into this new ${targetName}. Reuse its characters, names, looks, world and best ideas, and transform them to fit the new format. Leave out anything that doesn't fit.`;
  return `\n\n${head}\n---\n${rep}\n---`;
}

/* ------------------------------------------------------------------ *
 * Files: everything a piece can be downloaded as
 * ------------------------------------------------------------------ */

export type FileLink = { label: string; url: string; type: "pdf" | "image" | "audio" | "video" | "html" | "text" | "json" };

const API = "/api/aik";

function mediaUrl(artifactId: number, ref: unknown): string | null {
  if (typeof ref !== "string") return null;
  const m = /^aik:\/\/(r\d+)\/([a-z0-9_-]+\.[a-z0-9]+)$/i.exec(ref);
  return m ? `${API}/artifacts/${artifactId}/media/${m[1]}/${m[2]}` : null;
}

/** Every file a piece has, with a working link for each. Content must be present except for games. */
export function filesOf(a: Pick<ArtifactRow, "id" | "kind" | "title" | "content" | "summary" | "mime" | "approved">): FileLink[] {
  const out: FileLink[] = [];
  const push = (label: string, url: string | null, type: FileLink["type"]) => {
    if (url) out.push({ label, url, type });
  };
  const id = a.id;
  if (a.kind === "game") push("Game (HTML, plays in any browser)", `${API}/artifacts/${id}/download`, "html");
  if (a.kind === "story") {
    const b = safeJson(a.content);
    if (b?.format === "book") {
      push("Picture book (PDF)", `${API}/artifacts/${id}/book.pdf`, "pdf");
      push("Cover picture", mediaUrl(id, b.cover?.image), "image");
      (b.pages ?? []).forEach((p: any, i: number) => {
        push(`Page ${i + 1} picture`, mediaUrl(id, p?.image), "image");
        push(`Page ${i + 1} read-aloud`, mediaUrl(id, p?.audio), "audio");
      });
    }
  }
  if (a.kind === "video") {
    const m = safeJson(a.content);
    if (m?.movie) push("Movie (MP4)", `${API}/artifacts/${id}/download`, "video");
    (m?.shots ?? []).forEach((s: any, i: number) => push(`Shot ${i + 1} clip`, mediaUrl(id, s?.clip), "video"));
    push("Narration", mediaUrl(id, m?.narration), "audio");
    if (!m && a.mime.startsWith("video/")) push("Movie", `${API}/artifacts/${id}/download`, "video");
  }
  if (a.kind === "audio" && a.content && (a.content.startsWith("aik://") || a.content.startsWith("data:"))) push("Song (MP3)", `${API}/artifacts/${id}/download`, "audio");
  if (a.kind === "image" && a.content && (a.content.startsWith("aik://") || a.content.startsWith("data:"))) push("Picture", `${API}/artifacts/${id}/download`, "image");
  if (a.kind === "hero") {
    const h = parseHero(a.content);
    push("Portrait", mediaUrl(id, h?.portrait), "image");
    push(`Voice sample${h?.voice?.name ? ` (${h.voice.name})` : ""}`, mediaUrl(id, h?.sample), "audio");
  }
  if (a.kind === "quest" || a.kind === "robot") push("Data (JSON)", `${API}/artifacts/${id}/download`, "json");
  push("The words (text)", `${API}/artifacts/${id}/words.txt`, "text");
  return out;
}

/* ------------------------------------------------------------------ *
 * Moving between tools
 * ------------------------------------------------------------------ */

/** Tools a piece can be remixed into. Study Desk is a conversation, not a product. */
export const REMIX_TOOLS: ModeId[] = ["story", "language", "video", "game", "music", "prompt", "quest", "robot"];

function fitChoice(v: string, choices: string[]): string {
  const low = v.toLowerCase();
  return choices.find((c) => c.toLowerCase() === low) ?? choices.find((c) => low.includes(c.toLowerCase()) || c.toLowerCase().includes(low)) ?? choices[0];
}

function tidyValues(mode: ModeDef, raw: any, max: number): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of mode.createFields) {
    let v = clean(raw?.[f.key], f.maxChars ?? max);
    if (f.choices) v = v ? fitChoice(v, f.choices) : f.required ? f.choices[0] : "";
    if (v) values[f.key] = v;
  }
  return values;
}

/** A simple fill used when the model is unavailable: enough that the form is never blank. */
function fallbackValues(mode: ModeDef, source: ArtifactRow): Record<string, string> {
  const hero = source.kind === "hero" ? parseHero(source.content) : null;
  // The main character of whatever the source is, not just its title.
  const j = safeJson(source.content);
  const fromBook = source.kind === "story" && j?.format === "book" && j.hero?.name ? `${j.hero.name}, ${j.hero.look ?? ""}`.replace(/, $/, "") : null;
  const fromMovie = source.kind === "video" && Array.isArray(j?.shots) && j.shots[0]?.description ? String(j.shots[0].description) : null;
  const who = hero ? `${hero.name}, ${hero.look}` : fromBook ?? fromMovie ?? source.title;
  const short = (t: string, n: number) => t.slice(0, n);
  const guess: Record<string, string> = {
    title: short(source.title, 40),
    hero: who,
    what: who,
    name: short(hero?.name ?? (fromBook ? String(j.hero.name) : source.title), 30),
    about: hero ? `${hero.name}'s big adventure` : source.title,
    topic: source.title,
    place: source.kind === "story" && j?.pages?.[0]?.scene ? String(j.pages[0].scene) : "a place from the story",
    where: source.kind === "story" && j?.pages?.[0]?.scene ? String(j.pages[0].scene) : "a place from the story",
    problem: "something goes wrong and needs a clever fix",
    action: "goes on an adventure",
    good: "shiny stars",
    bad: "grumpy clouds",
    job: `helps ${hero?.name ?? "a friend"}`,
    mood: "bright and happy",
  };
  return tidyValues(mode, guess, aikConfig.staffFieldChars);
}

/**
 * Fill the target tool's form from a source piece, so a remix starts from
 * something rather than a blank form. The person still edits and presses the
 * button; nothing is generated here except the suggested words.
 */
export async function suggestValues(source: ArtifactRow, mode: ModeDef, opts: { staff: boolean }): Promise<{ values: Record<string, string>; ai: boolean }> {
  const max = opts.staff ? aikConfig.staffFieldChars : aikConfig.maxFieldChars;
  const fields = mode.createFields.map((f) => ({ key: f.key, label: f.label, hint: f.hint, required: Boolean(f.required), choices: f.choices }));
  const system = `You help children aged 8 to 11 turn something they made into a new project in a different tool. Fill in the new tool's form so it carries over the characters, names, look and world of the source, adapted to the new format. G-rated, kind, simple words. No real people, brands or links.
Reply with ONLY a JSON object whose keys are the form field keys. For a field with "choices", the value must be exactly one of them. Keep each value short (under ${Math.min(max, 160)} characters).`;
  const user = `NEW TOOL: ${mode.name}\nFORM FIELDS:\n${JSON.stringify(fields)}\n\nSOURCE (${kindName(source.kind)} "${source.title}"):\n${representation(source, 2500)}`;
  try {
    const raw = await completeText({ system, user, maxTokens: 600, temperature: 0.6, tier: "fast", mockKind: "remix" });
    const values = tidyValues(mode, extractJson<any>(raw) ?? {}, max);
    if (!Object.keys(values).length) return { values: fallbackValues(mode, source), ai: false };
    const screened = await screenOutputText(Object.values(values).join("\n"));
    if (!screened.ok) return { values: fallbackValues(mode, source), ai: false };
    // Required fields the model skipped get the simple fill.
    const base = fallbackValues(mode, source);
    for (const f of mode.createFields) if (f.required && !values[f.key] && base[f.key]) values[f.key] = base[f.key];
    return { values, ai: true };
  } catch (err) {
    logger.warn({ err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] remix suggestion failed; using the simple fill");
    return { values: fallbackValues(mode, source), ai: false };
  }
}

export type Idea = { tool: ModeId; title: string; pitch: string; values: Record<string, string> };

/** "Generate ideas": three or four next things to make from a piece, each ready to open in its tool. */
export async function generateIdeas(source: ArtifactRow, tools: ModeId[]): Promise<Idea[]> {
  const allowed = tools.filter((t) => REMIX_TOOLS.includes(t) && getMode(t));
  if (!allowed.length) return [];
  const forms = allowed.map((t) => {
    const m = getMode(t)!;
    return { tool: t, name: m.name, fields: m.createFields.map((f) => ({ key: f.key, label: f.label, choices: f.choices })) };
  });
  const system = `You suggest what a child aged 8 to 11 could make next from something they already made. Each idea uses a DIFFERENT tool from the list, carries over the characters and world, and is fun and specific. G-rated, kind, simple words. No real people, brands or links.
Reply with ONLY JSON: {"ideas":[{"tool": one of the tool ids, "title": short title (max 6 words), "pitch": one sentence (max 25 words), "values": {field key: value}}]} with 3 or 4 ideas. "values" fills that tool's form; for fields with "choices" use exactly one of the choices.`;
  const user = `TOOLS:\n${JSON.stringify(forms)}\n\nSOURCE (${kindName(source.kind)} "${source.title}"):\n${representation(source, 2500)}`;
  const raw = await completeText({ system, user, maxTokens: 1400, temperature: 0.9, tier: "fast", mockKind: "ideas" });
  const j = extractJson<any>(raw);
  const ideas: Idea[] = [];
  for (const it of Array.isArray(j?.ideas) ? j.ideas : []) {
    const mode = getMode(String(it?.tool));
    if (!mode || !allowed.includes(mode.id)) continue;
    ideas.push({ tool: mode.id, title: clean(it?.title, 60) || mode.name, pitch: clean(it?.pitch, 200), values: tidyValues(mode, it?.values ?? {}, aikConfig.staffFieldChars) });
    if (ideas.length >= 4) break;
  }
  if (!ideas.length) return [];
  const screened = await screenOutputText(ideas.map((i) => [i.title, i.pitch, ...Object.values(i.values)].join("\n")).join("\n"));
  return screened.ok ? ideas : [];
}

/* ------------------------------------------------------------------ *
 * Remix context for a running request
 * ------------------------------------------------------------------ */

export type RemixContext = {
  sourceId: number;
  /** Set when the source is a hero: these override what the model invents. */
  hero: Hero | null;
  voice: VoiceChoice | null;
  /** The hero's portrait as base64, used as the reference for a storybook cover. */
  portraitPng: string | null;
};

export async function loadRemixContext(source: ArtifactRow): Promise<RemixContext> {
  const hero = source.kind === "hero" ? parseHero(source.content) : null;
  let portraitPng: string | null = null;
  if (hero?.portrait) {
    const m = await getMedia(hero.portrait).catch(() => null);
    portraitPng = m?.mime.startsWith("image/") ? m.bytes.toString("base64") : null;
  }
  // A storybook or movie remixed from something that itself came from a hero keeps that hero's voice.
  let voice = usableVoice(hero?.voice ?? null);
  if (!voice && source.remix_of) {
    const up = await store.getArtifact(source.remix_of).catch(() => null);
    const upHero = up?.kind === "hero" ? parseHero(up.content) : null;
    voice = usableVoice(upHero?.voice ?? null);
  }
  return { sourceId: source.id, hero, voice, portraitPng };
}
