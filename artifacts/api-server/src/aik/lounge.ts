/**
 * The Screen Time Lounge: something good to watch when a child is waiting.
 *
 * Two shelves. "Picked for you" is the facilitator's list for the class plus
 * this starter set of long-standing, kid-safe sources; "Made by us" is the
 * class's own approved, published movies, songs and books. Nothing here is
 * generated: every outside link was chosen by a person.
 *
 * YouTube links are embedded through youtube-nocookie.com with related
 * videos switched off; anything else opens in a new tab.
 */

export type LoungeItem = {
  id: number | string;
  title: string;
  url: string;
  source: string;
  note: string;
  /** set when the url is a single YouTube video we can embed */
  youtubeId?: string;
  starter?: boolean;
};

export const LOUNGE_STARTERS: Omit<LoungeItem, "id">[] = [
  { title: "PBS KIDS Videos", url: "https://pbskids.org/videos", source: "PBS KIDS", note: "Full episodes and clips from PBS KIDS shows.", starter: true },
  { title: "Storyline Online", url: "https://storylineonline.net", source: "SAG-AFTRA Foundation", note: "Actors read picture books aloud.", starter: true },
  { title: "National Geographic Kids: Videos", url: "https://kids.nationalgeographic.com/videos", source: "National Geographic Kids", note: "Animals, science and the world.", starter: true },
  { title: "NASA Kids' Club", url: "https://www.nasa.gov/kidsclub/", source: "NASA", note: "Space games, pictures and videos.", starter: true },
  { title: "SciShow Kids", url: "https://www.youtube.com/@SciShowKids", source: "SciShow Kids", note: "Short science answers to big questions.", starter: true },
  { title: "Crash Course Kids", url: "https://www.youtube.com/@CrashCourseKids", source: "Crash Course Kids", note: "Fifth-grade science, one topic at a time.", starter: true },
  { title: "Smithsonian for Kids", url: "https://www.si.edu/kids", source: "Smithsonian", note: "Museums, history and nature.", starter: true },
];

const ALLOWED_HOSTS = [
  "youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com",
  "pbskids.org", "www.pbskids.org", "pbs.org", "www.pbs.org",
  "storylineonline.net", "www.storylineonline.net",
  "kids.nationalgeographic.com", "www.nationalgeographic.com",
  "nasa.gov", "www.nasa.gov", "spaceplace.nasa.gov", "climatekids.nasa.gov",
  "si.edu", "www.si.edu", "ed.ted.com", "www.khanacademy.org", "khanacademy.org",
  "vimeo.com", "player.vimeo.com",
];

export function youtubeIdOf(url: string): string | undefined {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || undefined;
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = /^\/(embed|shorts|live)\/([\w-]{6,})/.exec(u.pathname);
      if (m) return m[2];
    }
  } catch {
    /* not a url */
  }
  return undefined;
}

/** Only https links to a known kids' source; a bare YouTube id is normalized. */
export function validateLoungeUrl(raw: string): { ok: true; url: string; youtubeId?: string } | { ok: false; error: string } {
  const text = String(raw ?? "").trim();
  let url = text;
  if (/^[\w-]{11}$/.test(text)) url = `https://www.youtube.com/watch?v=${text}`;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, error: "That doesn't look like a web address." };
  }
  if (u.protocol !== "https:") return { ok: false, error: "Links must start with https://." };
  if (!ALLOWED_HOSTS.includes(u.hostname)) return { ok: false, error: `Links from ${u.hostname} aren't on the lounge list yet. Allowed: YouTube, PBS KIDS, Storyline Online, National Geographic Kids, NASA, Smithsonian, TED-Ed, Khan Academy, Vimeo.` };
  const id = youtubeIdOf(url);
  if (id && !/^[\w-]{6,}$/.test(id)) return { ok: false, error: "That YouTube link is missing its video id." };
  return { ok: true, url: id ? `https://www.youtube.com/watch?v=${id}` : url, youtubeId: id };
}
