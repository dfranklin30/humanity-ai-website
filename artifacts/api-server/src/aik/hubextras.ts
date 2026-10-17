/**
 * Hub extras: the AI box on every Hub menu, and the Lounge video finder.
 *
 * 1. Menu assist (POST /hub/assist). Every Hub menu has the same small
 *    screen: type what you want, get an answer back. The answer is written
 *    for the menu you are on (what it is for, what to press next), so a new
 *    facilitator can run the Hub without a manual. It is advice in words: it
 *    never changes anything by itself. Both directions are screened and every
 *    question is in the audit trail.
 *
 * 2. Lounge finder (POST /facilitator/lounge/suggest). Pick a topic and an
 *    age from the drop-downs, optionally describe what you want, and the AI
 *    proposes videos from a short list of trusted children's channels. Then
 *    nothing is taken on trust:
 *      - every link must pass the Lounge allow-list (validateLoungeUrl);
 *      - every YouTube video is looked up with YouTube's public oEmbed
 *        endpoint, so an invented video id is dropped, and the uploading
 *        channel must be one of TRUSTED_CHANNELS;
 *      - every title and note goes through output screening;
 *      - channel-scoped search links for the topic are always offered too,
 *        because they are real by construction.
 *    Suggestions are only suggestions: they reach children when a
 *    facilitator presses Add, through the existing Lounge endpoint.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { completeText } from "./ai";
import { screenInput, screenOutputText, stripLinks } from "./safety";
import { validateLoungeUrl, youtubeIdOf } from "./lounge";
import * as store from "./store";
import { logger } from "../lib/logger";

type Mw = (req: Request, res: Response, next: NextFunction) => unknown;

/* ------------------------------------------------------------------ *
 * Menu assist
 * ------------------------------------------------------------------ */

export const HUB_MENUS: Record<string, { name: string; purpose: string }> = {
  map: { name: "Map", purpose: "the overview of every Hub menu, what each is for, and its current status" },
  remix: { name: "Remix workflow", purpose: "make a hero (look + voice), put them in a storybook, movie, game or song, remix any piece into another tool, then save the project and email it to the participant" },
  library: { name: "Library", purpose: "everything made in this workspace, searchable, each piece openable, downloadable and remixable" },
  claude: { name: "Claude", purpose: "a direct console to the text model for staff work, with model choice and settings" },
  tools: { name: "Tools", purpose: "the studios as no-code forms: Game Maker, Story Maker, Prompt Craft, Quest Helper, Video Maker, Robotics Lab, Music Maker and Homework Help" },
  projects: { name: "Projects", purpose: "named folders that group pieces; create, rename, delete (pieces are kept) and open them" },
  program: { name: "8-week program", purpose: "the eight week modules of Make It With AI, each with a run-sheet for the session" },
  classes: { name: "Classes", purpose: "the live children's classes and the way into the class dashboard, where studios are unlocked and children are managed" },
  review: { name: "Review", purpose: "the approval queue for children's pictures, songs, books and movies, and the audit trail of everything that happened" },
  lounge: { name: "Lounge", purpose: "the Screen Time Lounge: hand-picked kid-safe videos and the class's own published work, for children who finish early" },
  people: { name: "People", purpose: "admin only: accounts, roles and who may run classes" },
};

function assistSystem(menu: string): string {
  const m = HUB_MENUS[menu] ?? HUB_MENUS.map;
  const all = Object.entries(HUB_MENUS)
    .map(([id, v]) => `- ${v.name} (${id}): ${v.purpose}`)
    .join("\n");
  return `You are the built-in helper of the Humanity + AI Hub, a guarded AI workspace where facilitators run an AI club for children aged 8 to 11.
The person is a facilitator or admin (an adult). They are on the "${m.name}" menu, which is for: ${m.purpose}.

THE HUB'S MENUS:
${all}

HOW TO ANSWER:
- Answer what they asked, for this menu, in plain words. Short: at most 120 words, or up to 6 numbered steps when they ask how to do something.
- Name the exact menu, button or field to use. If another menu is the better place, say which one.
- When they ask you to write something (a prompt, a brief, a hero description, a parent note, a lesson idea), write it ready to paste.
- Everything for children must be kind, age-appropriate and safe. Never suggest collecting children's personal details (names, photos, addresses, emails).
- You cannot press buttons or change settings yourself; say what to press.
- No links or web addresses.`;
}

/* ------------------------------------------------------------------ *
 * Lounge finder
 * ------------------------------------------------------------------ */

export const LOUNGE_TOPICS = [
  "Space and planets",
  "Animals and nature",
  "Dinosaurs",
  "Oceans and sea life",
  "Weather and climate",
  "The human body",
  "Science experiments",
  "Robots and coding",
  "How things are made",
  "Math and puzzles",
  "Art and drawing",
  "Music and dance",
  "Stories read aloud",
  "History and inventors",
  "Feelings and kindness",
  "Calm and movement breaks",
] as const;

export const LOUNGE_AGES = ["5-7", "8-10", "11-13"] as const;

/** The channels a suggested YouTube video may come from, as YouTube names them. */
const TRUSTED_CHANNELS: { name: string; handle: string; topics: string[] }[] = [
  { name: "SciShow Kids", handle: "SciShowKids", topics: ["Space and planets", "Animals and nature", "Science experiments", "The human body", "Weather and climate", "Dinosaurs", "Oceans and sea life"] },
  { name: "Crash Course Kids", handle: "CrashCourseKids", topics: ["Science experiments", "Weather and climate", "Space and planets", "How things are made", "Animals and nature"] },
  { name: "National Geographic Kids", handle: "NatGeoKids", topics: ["Animals and nature", "Oceans and sea life", "Dinosaurs", "Weather and climate", "History and inventors"] },
  { name: "PBS KIDS", handle: "PBSKIDS", topics: ["Feelings and kindness", "Stories read aloud", "Math and puzzles", "Science experiments", "Animals and nature"] },
  { name: "NASA", handle: "NASA", topics: ["Space and planets", "Robots and coding", "Weather and climate"] },
  { name: "TED-Ed", handle: "TEDEd", topics: ["History and inventors", "The human body", "Math and puzzles", "Science experiments", "How things are made"] },
  { name: "Peekaboo Kidz", handle: "PeekabooKidz", topics: ["The human body", "Space and planets", "Animals and nature", "Dinosaurs", "Science experiments"] },
  { name: "Storyline Online", handle: "StorylineOnline", topics: ["Stories read aloud", "Feelings and kindness"] },
  { name: "Art for Kids Hub", handle: "ArtforKidsHub", topics: ["Art and drawing"] },
  { name: "Cosmic Kids Yoga", handle: "CosmicKidsYoga", topics: ["Calm and movement breaks", "Feelings and kindness"] },
  { name: "GoNoodle | Get Moving", handle: "GoNoodle", topics: ["Calm and movement breaks", "Music and dance"] },
  { name: "Sesame Street", handle: "SesameStreet", topics: ["Feelings and kindness", "Music and dance", "Math and puzzles"] },
  { name: "Khan Academy Kids", handle: "KhanAcademyKids", topics: ["Math and puzzles", "Stories read aloud"] },
  { name: "Smithsonian", handle: "smithsonian", topics: ["History and inventors", "Dinosaurs", "Space and planets"] },
  { name: "Code.org", handle: "codeorg", topics: ["Robots and coding"] },
];

function normName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function trustedChannel(authorName: string, authorUrl: string): (typeof TRUSTED_CHANNELS)[number] | undefined {
  const n = normName(authorName);
  const handle = /\/@([\w.-]+)/.exec(authorUrl)?.[1]?.toLowerCase();
  return TRUSTED_CHANNELS.find((c) => normName(c.name) === n || (handle && c.handle.toLowerCase() === handle));
}

export type LoungeSuggestion = {
  title: string;
  url: string;
  source: string;
  note: string;
  youtubeId?: string;
  /** "video": one checked video. "search": that channel's own search for the topic. */
  kind: "video" | "search";
  verified: string;
};

async function oembed(url: string): Promise<{ title: string; author_name: string; author_url: string } | null> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = (await r.json()) as any;
    return typeof j?.title === "string" ? { title: j.title, author_name: String(j.author_name ?? ""), author_url: String(j.author_url ?? "") } : null;
  } catch {
    return null;
  }
}

function channelsFor(topic: string): (typeof TRUSTED_CHANNELS)[number][] {
  const hit = TRUSTED_CHANNELS.filter((c) => c.topics.includes(topic));
  return hit.length ? hit : TRUSTED_CHANNELS.slice(0, 4);
}

export async function suggestLoungeVideos(opts: { topic: string; ages: string; prompt: string }): Promise<{ items: LoungeSuggestion[]; dropped: number }> {
  const channels = channelsFor(opts.topic);
  const ask = [opts.topic, opts.prompt].filter(Boolean).join(": ");
  const system = `You suggest real, existing YouTube videos for children aged ${opts.ages} to watch in a supervised after-school AI club.
Only suggest videos you are confident exist, uploaded by one of these channels: ${channels.map((c) => c.name).join(", ")}.
Prefer short videos (under 10 minutes), calm and educational, nothing scary, no ads-heavy compilations.
Reply with ONLY a JSON array (no prose, no fences) of up to 8 objects: {"title": string, "url": "https://www.youtube.com/watch?v=VIDEO_ID", "channel": string, "note": string (one short sentence for a facilitator: what it teaches)}.`;
  let proposed: { title?: string; url?: string; channel?: string; note?: string }[] = [];
  try {
    const raw = await completeText({ system, user: `Find videos about: ${ask}`, maxTokens: 900, temperature: 0.3, tier: "fast", mockKind: "chat" });
    const s = raw.indexOf("[");
    const e = raw.lastIndexOf("]");
    if (s !== -1 && e > s) proposed = JSON.parse(raw.slice(s, e + 1));
    if (!Array.isArray(proposed)) proposed = [];
  } catch (err) {
    logger.warn({ err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] lounge suggestion call failed; offering channel searches only");
  }

  const items: LoungeSuggestion[] = [];
  const seen = new Set<string>();
  let dropped = 0;
  for (const p of proposed.slice(0, 10)) {
    const v = validateLoungeUrl(String(p?.url ?? ""));
    if (!v.ok || !v.youtubeId || seen.has(v.youtubeId)) {
      dropped++;
      continue;
    }
    const meta = await oembed(v.url);
    const ch = meta ? trustedChannel(meta.author_name, meta.author_url) : undefined;
    if (!meta || !ch) {
      dropped++;
      continue;
    }
    seen.add(v.youtubeId);
    items.push({
      title: stripLinks(meta.title).slice(0, 120),
      url: v.url,
      source: ch.name,
      note: stripLinks(String(p?.note ?? "")).slice(0, 200),
      youtubeId: v.youtubeId,
      kind: "video",
      verified: `Checked: a real video from ${ch.name}`,
    });
  }

  // Always-real fallbacks: each trusted channel's own search for the topic.
  const q = (opts.prompt || opts.topic).slice(0, 80);
  for (const c of channels.slice(0, 3)) {
    const url = `https://www.youtube.com/@${c.handle}/search?query=${encodeURIComponent(q)}`;
    const v = validateLoungeUrl(url);
    if (!v.ok) continue;
    items.push({
      title: `${c.name}: videos about ${q}`,
      url: v.url,
      source: c.name,
      note: `Opens ${c.name}'s own channel search, so only their videos appear.`,
      youtubeId: youtubeIdOf(v.url),
      kind: "search",
      verified: "Channel search on a trusted channel",
    });
  }

  // Screen every word a child could see.
  const screened: LoungeSuggestion[] = [];
  for (const it of items) {
    const out = await screenOutputText(`${it.title}\n${it.note}`).catch(() => ({ ok: false }) as { ok: boolean });
    if (out.ok) screened.push(it);
    else dropped++;
  }
  return { items: screened, dropped };
}

/* ------------------------------------------------------------------ *
 * Routes
 * ------------------------------------------------------------------ */

function facilitatorOf(req: Request): { id: number } | null {
  const f = (req as any).facilitator;
  return f && typeof f.id === "number" ? f : null;
}

export function registerHubExtrasRoutes(app: Express, base: string, deps: { requireFacilitator: Mw }): void {
  const assistBody = z.object({ menu: z.string().max(40), prompt: z.string().trim().min(2).max(1200) });
  app.post(`${base}/hub/assist`, deps.requireFacilitator, async (req, res) => {
    try {
      const body = assistBody.safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Type a question first (up to 1,200 characters)." });
      const fac = facilitatorOf(req);
      const menu = HUB_MENUS[body.data.menu] ? body.data.menu : "map";
      const inScreen = await screenInput(body.data.prompt);
      if (!inScreen.ok) return void res.status(422).json({ error: "That question was stopped by screening. Try wording it another way." });
      const raw = await completeText({ system: assistSystem(menu), user: body.data.prompt, maxTokens: 700, temperature: 0.4, tier: "fast", mockKind: "chat" });
      const out = await screenOutputText(raw);
      if (!out.ok) return void res.status(422).json({ error: "The answer was stopped by screening. Try asking another way." });
      await store.audit(null, "facilitator", fac?.id ?? null, "hub_assist", { menu }).catch(() => {});
      res.json({ reply: stripLinks(raw).trim().slice(0, 2400), menu });
    } catch (err) {
      logger.error({ err: String((err as Error)?.message ?? err).slice(0, 300) }, "[aik] hub assist failed");
      res.status(503).json({ error: "The helper isn't available right now. Try again in a moment." });
    }
  });

  const suggestBody = z.object({
    topic: z.enum(LOUNGE_TOPICS),
    ages: z.enum(LOUNGE_AGES).default("8-10"),
    prompt: z.string().trim().max(300).default(""),
  });
  app.get(`${base}/facilitator/lounge/topics`, deps.requireFacilitator, (_req, res) => {
    res.json({ topics: LOUNGE_TOPICS, ages: LOUNGE_AGES, channels: TRUSTED_CHANNELS.map((c) => c.name) });
  });
  app.post(`${base}/facilitator/lounge/suggest`, deps.requireFacilitator, async (req, res) => {
    try {
      const body = suggestBody.safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Choose a topic from the list." });
      if (body.data.prompt) {
        const s = await screenInput(body.data.prompt);
        if (!s.ok) return void res.status(422).json({ error: "That description was stopped by screening. Try other words." });
      }
      const fac = facilitatorOf(req);
      const result = await suggestLoungeVideos(body.data);
      await store.audit(null, "facilitator", fac?.id ?? null, "lounge_suggested", { topic: body.data.topic, ages: body.data.ages, found: result.items.length, dropped: result.dropped }).catch(() => {});
      res.json(result);
    } catch (err) {
      logger.error({ err: String((err as Error)?.message ?? err).slice(0, 300) }, "[aik] lounge suggest failed");
      res.status(503).json({ error: "Couldn't look for videos right now. Try again in a moment." });
    }
  });
}
