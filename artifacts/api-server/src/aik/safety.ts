/**
 * Kids AI Studio — safety screening.
 *
 * Layers (see Platform Design Brief §4):
 *   - personal-information catcher (local, always on)
 *   - blocklist for real people, brands, weapons, scary/adult themes (local, always on)
 *   - Azure AI Content Safety text analysis + Prompt Shields (remote; fail closed
 *     in production when AIK_REQUIRE_CONTENT_SAFETY is true)
 *   - generated-code scan for games (local, always on)
 *   - output text screening (Content Safety again + link stripping)
 *
 * Every check returns Flag objects rather than throwing, so the caller can
 * record them on the request and show the facilitator exactly what happened.
 */
import { aikConfig, isContentSafetyConfigured } from "./config";
import { logger } from "../lib/logger";

export type Flag = {
  layer: "pii" | "blocklist" | "content_safety" | "prompt_shield" | "code_scan" | "output" | "system";
  category: string;
  detail?: string;
  severity?: number;
};

export type ScreenResult = { ok: true; flags: Flag[] } | { ok: false; flags: Flag[]; kidMessage: string };

/* ------------------------------------------------------------------ *
 * Kid-facing messages. Kind, short, and never scolding.
 * ------------------------------------------------------------------ */
export const KID_MESSAGES = {
  pii: "Let's keep names, phone numbers and places out of the Studio. Try describing your idea without them!",
  blocklist: "That's not something we make in the Studio. Try a different idea — maybe something silly or brave?",
  unsafe: "Hmm, let's try that a different way. Your facilitator can help you think of another idea.",
  injection: "The Studio only takes Director's Orders about your project. Let's try again!",
  unavailable: "The Studio helper is taking a break. Please tell your facilitator.",
  paused: "Your facilitator paused the Studio. Look up front!",
  tickets: "You've used all your Director's Orders for today. Time to play and test what you made!",
  failed: "That one didn't work. Let's try the order a different way.",
} as const;

/* ------------------------------------------------------------------ *
 * Personal information catcher
 * ------------------------------------------------------------------ */

const PII_PATTERNS: { re: RegExp; category: string }[] = [
  { re: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, category: "phone" },
  { re: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/i, category: "email" },
  { re: /\b\d{1,5}\s+\w+(\s+\w+)?\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|court|ct|way)\b/i, category: "address" },
  { re: /\b(my|our)\s+(last\s+name|address|phone|school|teacher|birthday|password|home)\b/i, category: "self_disclosure" },
  { re: /\b(elementary|middle)\s+school\b/i, category: "school" },
  { re: /\b(https?:\/\/|www\.)\S+/i, category: "url" },
  { re: /\b(snap(chat)?|insta(gram)?|tiktok|roblox\s+user|discord|gamertag|username)\b/i, category: "social_handle" },
  { re: /\b\d{5}(-\d{4})?\b/, category: "zip" },
];

export function screenPII(text: string): Flag[] {
  const flags: Flag[] = [];
  for (const { re, category } of PII_PATTERNS) {
    if (re.test(text)) flags.push({ layer: "pii", category });
  }
  return flags;
}

/* ------------------------------------------------------------------ *
 * Blocklist — coarse, local, always on. Content Safety does the nuanced work.
 * Terms are matched as whole words, case-insensitive.
 * ------------------------------------------------------------------ */

const BLOCK_TERMS: { terms: string[]; category: string }[] = [
  {
    category: "weapons",
    terms: ["gun", "guns", "pistol", "rifle", "shotgun", "bomb", "bombs", "grenade", "knife fight", "stab", "shoot", "shooting", "kill", "killing", "murder"],
  },
  {
    category: "adult_or_substances",
    terms: ["sexy", "naked", "nude", "kiss", "kissing", "boyfriend", "girlfriend", "dating", "beer", "wine", "vodka", "drunk", "drugs", "weed", "vape", "cigarette", "gambling", "casino"],
  },
  {
    category: "scary_or_gore",
    terms: ["blood", "bloody", "gore", "corpse", "dead body", "suicide", "self-harm", "cutting myself", "torture", "demon", "possessed", "horror movie"],
  },
  {
    category: "hate",
    terms: ["racist", "nazi", "hitler", "slur", "kkk", "terrorist"],
  },
  {
    category: "brands_and_franchises",
    terms: [
      "pokemon", "pikachu", "mario", "luigi", "sonic the hedgehog", "minecraft steve", "creeper", "fortnite", "roblox", "spider-man", "spiderman", "batman", "superman",
      "elsa", "frozen", "mickey mouse", "disney", "pixar", "marvel", "star wars", "darth vader", "harry potter", "pokémon", "hello kitty", "barbie", "lego", "nintendo", "nike", "mcdonald",
      "coca-cola", "coke", "pepsi", "youtube", "mrbeast", "taylor swift",
    ],
  },
  {
    category: "real_people",
    terms: ["president", "trump", "biden", "obama", "elon musk", "celebrity", "famous person", "my teacher", "my mom", "my dad", "my brother", "my sister", "my friend"],
  },
];

export function screenBlocklist(text: string): Flag[] {
  const lower = ` ${text.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ")} `;
  const flags: Flag[] = [];
  for (const group of BLOCK_TERMS) {
    for (const term of group.terms) {
      const re = new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
      if (re.test(lower)) {
        flags.push({ layer: "blocklist", category: group.category, detail: term });
        break;
      }
    }
  }
  return flags;
}

/* ------------------------------------------------------------------ *
 * Azure AI Content Safety (REST). No SDK dependency needed.
 * ------------------------------------------------------------------ */

const CS_API_VERSION = "2024-09-01";

async function csPost(path: string, body: any, timeoutMs = 8000): Promise<any> {
  const { endpoint, key } = aikConfig.contentSafety;
  const url = `${endpoint.replace(/\/$/, "")}/contentsafety/${path}?api-version=${CS_API_VERSION}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Ocp-Apim-Subscription-Key": key },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Content Safety ${path} ${res.status}: ${txt.slice(0, 200)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Text analysis across the four harm categories. Returns flags for any
 * category at or above the configured block severity. Throws when the
 * service is unreachable so the caller can decide to fail closed.
 */
export async function contentSafetyText(text: string): Promise<Flag[]> {
  const data = await csPost("text:analyze", {
    text: text.slice(0, 10_000),
    categories: ["Hate", "SelfHarm", "Sexual", "Violence"],
    outputType: "FourSeverityLevels",
  });
  const flags: Flag[] = [];
  for (const c of data?.categoriesAnalysis ?? []) {
    if (typeof c.severity === "number" && c.severity >= aikConfig.contentSafety.blockAtSeverity) {
      flags.push({ layer: "content_safety", category: String(c.category), severity: c.severity });
    }
  }
  return flags;
}

/** Prompt Shields: detects jailbreak / instruction-override attempts in user text. */
export async function promptShield(text: string): Promise<Flag[]> {
  const data = await csPost("text:shieldPrompt", { userPrompt: text.slice(0, 10_000), documents: [] });
  return data?.userPromptAnalysis?.attackDetected ? [{ layer: "prompt_shield", category: "jailbreak" }] : [];
}

/** Image analysis for generated pictures (Phase 2). `base64` is PNG/JPEG content. */
export async function contentSafetyImage(base64: string): Promise<Flag[]> {
  const data = await csPost("image:analyze", { image: { content: base64 }, outputType: "FourSeverityLevels" }, 15_000);
  const flags: Flag[] = [];
  for (const c of data?.categoriesAnalysis ?? []) {
    if (typeof c.severity === "number" && c.severity >= aikConfig.contentSafety.blockAtSeverity) {
      flags.push({ layer: "content_safety", category: String(c.category), severity: c.severity });
    }
  }
  return flags;
}

/* ------------------------------------------------------------------ *
 * Combined input screening
 * ------------------------------------------------------------------ */

export async function screenInput(text: string): Promise<ScreenResult> {
  const flags: Flag[] = [];

  const pii = screenPII(text);
  if (pii.length) return { ok: false, flags: pii, kidMessage: KID_MESSAGES.pii };

  const blocked = screenBlocklist(text);
  if (blocked.length) return { ok: false, flags: blocked, kidMessage: KID_MESSAGES.blocklist };

  if (isContentSafetyConfigured()) {
    try {
      const [cs, shield] = await Promise.all([contentSafetyText(text), promptShield(text)]);
      if (shield.length) return { ok: false, flags: shield, kidMessage: KID_MESSAGES.injection };
      if (cs.length) return { ok: false, flags: cs, kidMessage: KID_MESSAGES.unsafe };
    } catch (err) {
      logger.error({ err }, "[aik] Content Safety unavailable");
      if (aikConfig.contentSafety.required) {
        return { ok: false, flags: [{ layer: "system", category: "content_safety_unavailable" }], kidMessage: KID_MESSAGES.unavailable };
      }
      flags.push({ layer: "system", category: "content_safety_skipped" });
    }
  } else if (aikConfig.contentSafety.required) {
    return { ok: false, flags: [{ layer: "system", category: "content_safety_not_configured" }], kidMessage: KID_MESSAGES.unavailable };
  } else {
    flags.push({ layer: "system", category: "content_safety_not_configured" });
  }

  return { ok: true, flags };
}

/* ------------------------------------------------------------------ *
 * Output screening
 * ------------------------------------------------------------------ */

export function stripLinks(text: string): string {
  return text.replace(/\b(https?:\/\/|www\.)\S+/gi, "[link removed]").replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/gi, "[email removed]");
}

export async function screenOutputText(text: string): Promise<ScreenResult> {
  const flags: Flag[] = [];
  const blocked = screenBlocklist(text).filter((f) => f.category !== "brands_and_franchises" && f.category !== "real_people");
  if (blocked.length) return { ok: false, flags: blocked.map((f) => ({ ...f, layer: "output" as const })), kidMessage: KID_MESSAGES.unsafe };
  if (isContentSafetyConfigured()) {
    try {
      const cs = await contentSafetyText(text);
      if (cs.length) return { ok: false, flags: cs.map((f) => ({ ...f, layer: "output" as const })), kidMessage: KID_MESSAGES.unsafe };
    } catch (err) {
      logger.error({ err }, "[aik] Content Safety unavailable (output)");
      if (aikConfig.contentSafety.required) {
        return { ok: false, flags: [{ layer: "system", category: "content_safety_unavailable" }], kidMessage: KID_MESSAGES.unavailable };
      }
    }
  }
  return { ok: true, flags };
}

/* ------------------------------------------------------------------ *
 * Generated-code scan for games
 * ------------------------------------------------------------------ */

const FORBIDDEN_CODE: { re: RegExp; category: string }[] = [
  { re: /\bfetch\s*\(/i, category: "network:fetch" },
  { re: /XMLHttpRequest/i, category: "network:xhr" },
  { re: /\bWebSocket\b/i, category: "network:websocket" },
  { re: /\bEventSource\b/i, category: "network:sse" },
  { re: /navigator\.sendBeacon/i, category: "network:beacon" },
  { re: /\bimport\s*\(/i, category: "code:dynamic_import" },
  { re: /<script[^>]+src\s*=/i, category: "code:external_script" },
  { re: /<link\b/i, category: "code:external_link" },
  { re: /<iframe\b|<frame\b|<object\b|<embed\b/i, category: "code:embed" },
  { re: /<form\b/i, category: "code:form" },
  { re: /<a\b[^>]*href/i, category: "code:anchor" },
  { re: /https?:\/\//i, category: "code:url" },
  { re: /localStorage|sessionStorage|indexedDB|document\.cookie/i, category: "storage" },
  { re: /window\.(parent|top|opener)|parent\.postMessage|top\.location/i, category: "escape:parent" },
  { re: /\blocation\s*\.\s*(href|assign|replace)|window\.open\s*\(/i, category: "escape:navigation" },
  { re: /\beval\s*\(|new\s+Function\s*\(/i, category: "code:eval" },
  { re: /navigator\.(geolocation|mediaDevices|clipboard|credentials)/i, category: "device_access" },
  { re: /\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/i, category: "code:dialogs" },
  { re: /\bAudioContext\b|<audio\b|new\s+Audio\s*\(/i, category: "sound" },
];

export function scanGameCode(html: string, allowSound: boolean): Flag[] {
  const flags: Flag[] = [];
  for (const { re, category } of FORBIDDEN_CODE) {
    if (category === "sound" && allowSound) continue;
    if (re.test(html)) flags.push({ layer: "code_scan", category });
  }
  if (html.length > aikConfig.maxGameChars) flags.push({ layer: "code_scan", category: "too_large" });
  return flags;
}

/**
 * Wrap a generated game so it can only ever run inside our sandbox: a strict
 * CSP is injected at the top of <head>, and the document is normalized to a
 * full HTML page. The frontend renders this via <iframe sandbox="allow-scripts" srcdoc>
 * (no allow-same-origin), which gives it an opaque origin.
 */
export function hardenGameHtml(html: string): string {
  const csp = [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    "img-src data:",
    "font-src data:",
    "media-src data:",
    "connect-src 'none'",
    "frame-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "navigate-to 'none'",
  ].join("; ");
  const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
  let out = html.trim();
  if (!/<html[\s>]/i.test(out)) {
    out = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${out}</body></html>`;
  }
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}${meta}`);
  } else {
    out = out.replace(/<html[^>]*>/i, (m) => `${m}<head>${meta}</head>`);
  }
  return out;
}
