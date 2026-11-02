/**
 * Finish every order.
 *
 * Until now a screening hit ended an order: the child saw "try a different
 * idea" and nothing was made. This module turns most of those stops into a
 * repair step so the pipeline keeps going and still delivers a product:
 *
 *   words in   PII in the order          → the private details are taken out
 *              blocklist / Content Safety → the order is rewritten kid-safe,
 *                                           keeping the child's idea, and
 *                                           screened again
 *   words out  output screening, redirect,
 *              the provider's own filter  → generate again with a stricter
 *                                           instruction, up to `autofixTries`
 *   pictures   a refused page / keyframe  → redraw it gentler once, then skip
 *                                           that one picture (the words stay)
 *   shots      a refused or flagged shot  → refilm it gentler once, then drop
 *                                           that shot and cut what is left
 *
 * What stays a hard stop, always: a prompt attack (Prompt Shields), a child who
 * is hurting (care alert), and screening itself being unavailable. When the
 * repairs run out the order is HELD for the facilitator (never silently
 * blocked), so the child's idea is not lost. Every repair is written to the
 * flags (`layer: "autofix"`) and the audit log, and the child is told in plain
 * words what changed. The facilitator approval gate for generated media is
 * untouched.
 */
import { aikConfig } from "./config";
import { completeText } from "./ai";
import { PII_PATTERNS, type Flag } from "./safety";
import { extractJson, type ModeDef } from "./modes";

export const GENTLE =
  " Keep it gentle, silly and friendly for children aged 8 to 11: no weapons, no blood, no fighting, nothing scary, no romance, no real people, no brand characters.";

/** A repair that was made, in the child's words. */
export type Fix = string;

export const autofixOn = (): boolean => aikConfig.autofix;

export function autofixFlag(category: string, detail?: string): Flag {
  return detail ? { layer: "autofix", category, detail: detail.slice(0, 200) } : { layer: "autofix", category };
}

/** Can this set of screening flags be repaired, or must the order stop here? */
export function fixable(flags: Flag[]): boolean {
  if (!aikConfig.autofix) return false;
  return !flags.some(
    (f) => f.layer === "prompt_shield" || f.layer === "system" || f.category === "care_alert" || f.category === "content_safety_unavailable",
  );
}

/** Take private details out of a child's words. Deterministic: no model call. */
export function stripPII(text: string): { text: string; removed: string[] } {
  let out = text;
  const removed: string[] = [];
  for (const { re, category } of PII_PATTERNS) {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    if (!g.test(out)) continue;
    removed.push(category);
    const stand = PII_STAND_INS[category] ?? "";
    out = out.replace(g, stand);
  }
  out = out.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
  return { text: out, removed };
}

const PII_STAND_INS: Record<string, string> = {
  phone: "",
  email: "",
  address: "a street nearby",
  self_disclosure: "",
  school: "school",
  url: "",
  social_handle: "a friend",
  zip: "",
};

/** Private details removed from every field; a required field that ends up empty gets a stand-in so the order still validates. */
export function stripPIIFromValues(mode: Pick<ModeDef, "createFields">, values: Record<string, string>): { values: Record<string, string>; removed: string[]; touched: string[] } {
  const out: Record<string, string> = {};
  const removed = new Set<string>();
  const touched: string[] = [];
  for (const f of mode.createFields) {
    const v = values[f.key];
    if (!v) continue;
    const s = stripPII(v);
    if (s.removed.length) {
      touched.push(f.label);
      s.removed.forEach((r) => removed.add(r));
    }
    const kept = s.text || (f.required ? "a friend" : "");
    if (kept) out[f.key] = kept;
  }
  return { values: out, removed: [...removed], touched };
}

const REWRITE_SYSTEM = `You make children's project orders kid-friendly without losing the child's idea. The children are 8 to 11 years old and their order was stopped by a safety screen.
Rewrite ONLY the fields that need it, as little as possible:
- weapons or fighting → silly harmless things (a foam noodle, a tickle attack, a pillow)
- scary or gory → silly-spooky or just exciting
- real brands, franchises or characters → an original look-alike of the child's own
- real people → a made-up character
- anything grown-up → something playful
Keep names the child invented, keep the hero, keep the fun. Never add a lecture.
Reply with ONLY a JSON object, no markdown fences:
{"values": {<the same keys, every one of them, rewritten where needed>}, "changes": [<one short sentence per change, for the child, like "I swapped the sword for a giant foam noodle.">]}`;

/** Ask the fast model for a kid-safe version of the order. Returns null when the reply is unusable. */
export async function rewriteOrder(mode: Pick<ModeDef, "name" | "createFields">, values: Record<string, string>, flags: Flag[]): Promise<{ values: Record<string, string>; changes: Fix[] } | null> {
  const flagged = flags.map((f) => [f.category, f.detail].filter(Boolean).join(": ")).filter(Boolean);
  const user = `Project: ${mode.name}\nFIELDS (JSON): ${JSON.stringify(values)}\nFLAGGED FOR: ${JSON.stringify(flagged)}`;
  let raw: string;
  try {
    raw = await completeText({ system: REWRITE_SYSTEM, user, maxTokens: 600, temperature: 0.4, tier: "fast", mockKind: "rewrite" });
  } catch {
    return null;
  }
  const j = extractJson<{ values?: Record<string, unknown>; changes?: unknown[] }>(raw);
  if (!j || !j.values || typeof j.values !== "object") return null;
  const next: Record<string, string> = {};
  for (const f of mode.createFields) {
    // A field with fixed choices (a style, a language) is never rewritten: the choice itself is safe.
    if (f.choices) {
      if (values[f.key]) next[f.key] = values[f.key];
      continue;
    }
    const v = j.values[f.key] ?? values[f.key];
    if (v !== undefined && v !== null && String(v).trim()) next[f.key] = String(v).trim().slice(0, f.maxChars ?? aikConfig.staffFieldChars);
  }
  const changes = (Array.isArray(j.changes) ? j.changes : []).map((c) => String(c).trim()).filter(Boolean).slice(0, 5);
  return { values: next, changes: changes.length ? changes : ["I changed a few words to keep it kid-friendly."] };
}

/** The instruction added to the system prompt when a reply is generated again after a screening hit. */
export function softenRule(flags: Flag[]): string {
  const why = [...new Set(flags.map((f) => f.category).filter((c) => c && c !== "provider_filter"))].join(", ");
  return `\n\nIMPORTANT: your previous reply was flagged by the safety screen${why ? ` for: ${why}` : ""}. Make this version gentler, sillier and clearly for children aged 8 to 11: no weapons, no blood, no fighting, nothing scary, no romance, no real people, no brand characters, no grown-up topics. Keep the child's idea and the same output format.`;
}

/** What the child reads about the repairs, appended to the result note. */
export function fixNote(fixes: Fix[]): string {
  if (!fixes.length) return "";
  const list = [...new Set(fixes)].slice(0, 4);
  return ` I changed a few things to keep it kid-friendly: ${list.map((f) => f.replace(/\.$/, "")).join("; ")}.`;
}

/** In the mock, the token [[unsafe]] stands for a Content Safety hit; the rewrite just takes it out (see ai.ts mockText "rewrite"). */
export const MOCK_REWRITE_NOTE = "I swapped a few words to keep it kid-friendly.";
