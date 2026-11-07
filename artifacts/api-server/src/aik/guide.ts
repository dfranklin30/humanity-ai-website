/**
 * Kids AI Studio — the Hero Guide.
 *
 * A child's own hero walks them through the Studio: what remixing is, how
 * to ask for changes, how a piece gets to the Hub, and then the Hub itself,
 * where the hero asks which room they want and listens for the answer.
 *
 * Everything the guide says is written here, on the server, with only the
 * child's nickname and the hero's name dropped in. Nothing a child types is
 * ever spoken back, so there is nothing to screen and nothing for a model
 * to improvise. The voice is the hero's own (chosen when the hero was made)
 * or one the child picks and hears first; the face is the hero's portrait.
 * If the child has no hero yet, the Studio Buddy (their avatar) fills in.
 *
 * Spoken lines are cached per (line, voice) so a class of twenty hearing
 * the same tour costs twenty-ish TTS calls, not hundreds.
 */
import { createHash } from "node:crypto";
import { speak, type VoiceChoice, type MediaResult } from "./ai";

export type GuideStepId = "hello" | "remix" | "changes" | "hub" | "front";

export type GuideStep = {
  id: GuideStepId;
  /** Where the Studio should be while this is said. */
  where: "remix" | "make" | "hub";
  /** Short title for the "More" card. */
  title: string;
  /** What the hero says, with {child} and {hero} filled in. */
  say: string;
  /** The big button under the line, if any. */
  action?: { label: string; go: "remix" | "make" | "hub" | "arcade" | "gallery" | "lounge" };
  /** The front step listens for one of these (and shows them as chips). */
  listen?: { word: string; label: string; go: "arcade" | "gallery" | "lounge" }[];
};

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: "hello",
    where: "remix",
    title: "Hello!",
    say: "Hi {child}! I'm {hero}, and I'm your guide today. Stick with me and I'll show you how the Studio works. Ready? Let's go!",
    action: { label: "Let's go!", go: "remix" },
  },
  {
    id: "remix",
    where: "remix",
    title: "What remixing is",
    say: "This is the Remix tab. Remixing means taking something you already made, like me, and turning it into something new. Pick a piece, pick a room, and the Studio fills in the order for you. A hero can become a storybook, a song, or even a movie star.",
    action: { label: "Show me the rooms", go: "make" },
  },
  {
    id: "changes",
    where: "make",
    title: "Asking for changes",
    say: "After the Studio makes something, you don't have to start over. Look for the Change box under your piece. Tell it one thing, like: make the dragon purple, or add a funny ending. Say it, or tap an idea, and press Change it.",
    action: { label: "Got it, next", go: "hub" },
  },
  {
    id: "hub",
    where: "hub",
    title: "Putting it in the Hub",
    say: "When your facilitator says yes to a piece, press Put in the Hub. Games go to the Arcade. Stories, songs, pictures and robots go to the Gallery. Then the whole class can see what you made!",
    action: { label: "Take me to the Hub", go: "hub" },
  },
  {
    id: "front",
    where: "hub",
    title: "Welcome to the Hub",
    say: "Welcome to the Hub! This is where the whole class meets. The Arcade has games you can play. The Lounge is for hanging out and chatting. The Gallery has everyone's stories, songs and pictures. Where do you want to go? Say Arcade, Lounge, or Gallery, or tap one.",
    listen: [
      { word: "arcade", label: "🕹️ Arcade", go: "arcade" },
      { word: "lounge", label: "🛋️ Lounge", go: "lounge" },
      { word: "gallery", label: "🖼️ Gallery", go: "gallery" },
    ],
  },
];

/** What the hero says when it hears a room, before going there. */
export const GUIDE_REPLIES: Record<"arcade" | "lounge" | "gallery" | "unsure", string> = {
  arcade: "The Arcade it is! Let's go play.",
  lounge: "The Lounge! Let's go hang out.",
  gallery: "The Gallery! Let's go see what everyone made.",
  unsure: "I didn't catch that. Say Arcade, Lounge, or Gallery, or just tap one.",
};

/** The line a child hears when trying out a voice, before choosing it. */
export function previewLine(child: string, hero: string): string {
  return `Hi ${child}! This is how I sound. I'm ${hero}. Shall we go?`;
}

const NAME_RE = /[^\p{L}\p{N} '’.-]/gu;

/** Names go into speech as plain words: letters, digits, spaces and a few marks, 40 characters at most. */
export function sayable(name: string, fallback: string): string {
  const s = (name || "").replace(NAME_RE, "").replace(/\s+/g, " ").trim().slice(0, 40);
  return s || fallback;
}

export function fillLine(text: string, child: string, hero: string): string {
  return text.replaceAll("{child}", sayable(child, "friend")).replaceAll("{hero}", sayable(hero, "Buddy"));
}

/** Which line a request may ask for: a step, a reply, or the preview. */
export type GuideLine = { kind: "step"; id: GuideStepId } | { kind: "reply"; id: keyof typeof GUIDE_REPLIES } | { kind: "preview" };

export function lineText(line: GuideLine, child: string, hero: string): string | null {
  if (line.kind === "preview") return previewLine(sayable(child, "friend"), sayable(hero, "Buddy"));
  if (line.kind === "reply") return GUIDE_REPLIES[line.id] ? fillLine(GUIDE_REPLIES[line.id], child, hero) : null;
  const step = GUIDE_STEPS.find((s) => s.id === line.id);
  return step ? fillLine(step.say, child, hero) : null;
}

/** Hears a room name in what the child said (or typed). */
export function hearRoom(text: string): "arcade" | "lounge" | "gallery" | null {
  const t = text.toLowerCase();
  if (/\barcade\b|\bgames?\b|\bplay\b/.test(t)) return "arcade";
  if (/\blounge\b|\bhang\b|\bchat\b/.test(t)) return "lounge";
  if (/\bgallery\b|\bstories\b|\bpictures\b|\bsongs\b/.test(t)) return "gallery";
  return null;
}

/* ---- spoken-line cache: the same sentence in the same voice is one TTS call an hour ---- */

const TTL_MS = 60 * 60 * 1000;
const MAX = 400;
const cache = new Map<string, { at: number; audio: MediaResult }>();

export async function sayCached(text: string, voice: VoiceChoice | null): Promise<MediaResult> {
  const key = createHash("sha1").update(`${voice?.provider ?? "house"}:${voice?.id ?? ""}|${text}`).digest("hex");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.audio;
  const audio = await speak(text, voice);
  if (cache.size >= MAX) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(key, { at: Date.now(), audio });
  return audio;
}

/** For tests. */
export function clearGuideCache(): void {
  cache.clear();
}
