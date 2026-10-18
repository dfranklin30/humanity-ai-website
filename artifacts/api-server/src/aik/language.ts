/**
 * Kids AI Studio — Language Passport.
 *
 * A child picks a language, a hero and a topic. They get a picture book that
 * starts in English and, page by page, weaves in words from the new language
 * ("story weave", also called the diglot weave: the reader already knows what
 * is happening, so a new word is understood from the story before it is
 * learned). Every woven word can be tapped to hear it said by a voice that
 * speaks that language, with an emoji and a sound-it-out guide. At the end the
 * same words become Word Catch, a short game, and finishing it earns the
 * language's passport stamp.
 *
 *     pick language + topic  →  write the woven story  →  check every word
 *        →  draw (same pipeline as Story Maker)  →  record each word  →  book
 *
 * Accuracy matters more here than anywhere else in the Studio: a child will
 * repeat these words to a grandparent. So every word goes through a second,
 * independent check before anything is drawn, and the whole book waits for a
 * facilitator like every other picture book.
 *
 * Page text marks a woven word as [[word|english]]. The book viewer turns
 * those into tappable words; the read-aloud says the word itself; the PDF
 * writes it in Latin letters.
 */
import { aikConfig, isElevenLabsConfigured, isAzureSpeechConfigured } from "./config";
import { completeText, speakWord, ContentFilteredError, type VoiceChoice } from "./ai";
import { COMMON_RULES, extractJson, type ModeDef } from "./modes";
import type { BookDraft, Book } from "./book";
import { putMedia, type MediaRef } from "./media";
import { screenOutputText, stripLinks, type Flag } from "./safety";
import { logger } from "../lib/logger";
import { LANGUAGES, type LangDef } from "./langdata";
export { LANGUAGES, LANGUAGE_LABELS, LANGUAGE_TOPICS, type LangDef } from "./langdata";

/* ------------------------------------------------------------------ *
 * The languages
 * ------------------------------------------------------------------ */

export function findLanguage(label: string | undefined | null): LangDef | null {
  if (!label) return null;
  const l = label.trim().toLowerCase();
  return LANGUAGES.find((x) => x.label.toLowerCase() === l || x.code === l) ?? null;
}

/* ------------------------------------------------------------------ *
 * What a Language Passport book adds to a Story Maker book
 * ------------------------------------------------------------------ */

export type LangWord = {
  /** The word as written in the language (native script). */
  word: string;
  /** What it means, in English. */
  english: string;
  /** A sound-it-out guide in English letters, e.g. "mahn-SAH-nah". */
  say: string;
  /** Pinyin / romaji / transliteration for non-Latin scripts. */
  roman?: string;
  /** One emoji that shows the meaning; the game uses it as the picture. */
  emoji: string;
  audio?: MediaRef;
};

export type LangBlock = {
  code: LangDef["code"];
  label: string;
  flag: string;
  hello: string;
  rtl: boolean;
  topic: string;
  words: LangWord[];
  /** One useful phrase to take home. */
  phrase: { text: string; english: string; say: string; roman?: string; audio?: MediaRef };
  /** True when every word passed the second check. */
  checked: boolean;
};

/** A Language Passport book: a Story Maker book plus its language. */
export type LangBook = Book & { lang: LangBlock };

const MARK = /\[\[([^|\]]{1,40})\|([^\]]{1,40})\]\]/g;
const HAS_MARK = /\[\[[^|\]]{1,40}\|[^\]]{1,40}\]\]/;

/** A page's text as it should be read aloud: the woven word itself, never the brackets. */
export function spokenText(text: string): string {
  return text.replace(MARK, (_m, w) => w);
}

/** A page's text in Latin letters only, for the PDF (its standard fonts have no CJK, Arabic or Devanagari). */
export function latinText(text: string, words: LangWord[]): string {
  return text.replace(MARK, (_m, w: string, en: string) => {
    const hit = words.find((x) => x.word === w);
    const shown = hit?.roman || w;
    return `${shown} (${en})`;
  });
}

/* ------------------------------------------------------------------ *
 * Writing
 * ------------------------------------------------------------------ */

const STYLES = ["bright watercolor", "soft crayon", "cut-paper collage", "cheerful cartoon", "cozy gouache"];

export function languageSystemPrompt(pages: number, lang: LangDef, topic: string): string {
  return `You write short illustrated picture books that teach children aged 8 to 11 their first words in ${lang.label}.${COMMON_RULES}
THE METHOD: a "story weave". The story is told in simple English. ${lang.label} words are woven in gradually:
- Page 1 introduces 1 or 2 words. Each following page brings back earlier words AND adds 1 or 2 new ones, so by the last page the reader meets 8 to 12 words, many of them several times.
- Every woven word must be understandable from the sentence around it, so a child guesses its meaning before being told.
- All words are about the topic "${topic}" or the story's everyday world, and are words a beginner really uses.
- Mark EVERY woven word in page text exactly like [[word|english]], e.g. "Pim bought a red [[manzana|apple]]." The part before | is the ${lang.label} word exactly as it appears in "words"; after | is its English meaning. Never put anything else in double square brackets.
- ${lang.note}
- Be respectful of the people and places where ${lang.label} is spoken: no stereotypes, costumes or accents played for laughs. The story can happen anywhere.
- Never translate or include names of real people, brands or places that are not needed.

OUTPUT FORMAT: reply with ONLY a JSON object, no markdown fences:
{"title": string, "hero": {"name": string, "look": string}, "style": string, "coverScene": string,
 "pages": [{"text": string, "scene": string} x${pages}], "theEnd": string,
 "words": [{"word": string, "english": string, "say": string${lang.romanize ? `, "roman": string` : ""}, "emoji": string}],
 "phrase": {"text": string, "english": string, "say": string${lang.romanize ? `, "roman": string` : ""}}}
- title: in English, may include one woven word in plain text (no brackets).
- hero.look: ONE detailed visual description of the main character for an illustrator (35-50 words), reused for every picture.
- style: one of ${STYLES.map((s) => `"${s}"`).join(", ")}.
- Exactly ${pages} pages. Each page.text is 2 to 4 short sentences (max 60 words) in easy English with its woven words. The story has a beginning, a problem, a try that goes wrong, a clever or kind solution, and a warm or funny ending.
- Each page.scene: one sentence for the illustrator. No words, signs or letters in any picture.
- words: every distinct woven word, in the order it first appears, 8 to 12 entries. "say" is a sound-it-out guide in English letters with the stressed part in capitals (e.g. "mahn-SAH-nah").${lang.romanize ? ` "roman" is ${lang.romanize}.` : ""} "emoji" is ONE emoji that shows the meaning.
- phrase: one short, useful, friendly phrase in ${lang.label} the child can say to someone (a greeting, please/thank you, or a question about the topic), with its English meaning and sound-it-out guide.
- theEnd: one short closing line in English (max 12 words). It may use one woven word.`;
}

export function languageUserPrompt(values: Record<string, string>, lang: LangDef, topic: string): string {
  const lines = [
    `Language: ${lang.label}`,
    `Topic: ${topic}`,
    `Hero: ${values.hero ?? "a curious young explorer"}`,
    values.place ? `Place: ${values.place}` : "",
    values.detail ? `One surprising detail: ${values.detail}` : "",
  ].filter(Boolean);
  return `The director's order for a new Language Passport book:\n${lines.join("\n")}\n\nWrite it now.`;
}

/** The book without its media, for a change request. */
export function languageTextOnly(book: LangBook): string {
  return JSON.stringify({
    title: book.title,
    hero: book.hero,
    style: book.style,
    coverScene: book.cover?.scene,
    pages: book.pages.map((p) => ({ text: p.text, scene: p.scene })),
    theEnd: book.theEnd,
    words: book.lang.words.map(({ audio: _a, ...w }) => w),
    phrase: { text: book.lang.phrase.text, english: book.lang.phrase.english, say: book.lang.phrase.say, ...(book.lang.phrase.roman ? { roman: book.lang.phrase.roman } : {}) },
  });
}

export type LangDraft = { book: BookDraft; words: LangWord[]; phrase: LangBlock["phrase"] };

const clip = (v: unknown, n: number) => stripLinks(String(v ?? "").trim()).slice(0, n);
const EMOJI_RE = /\p{Extended_Pictographic}/u;

export function parseLanguageDraft(raw: string, fallbackTitle: string, wantPages: number, lang: LangDef): LangDraft | null {
  const j = extractJson<any>(raw);
  if (!j || !Array.isArray(j.pages) || j.pages.length < 3 || !j.hero?.look || !Array.isArray(j.words)) return null;

  const words: LangWord[] = [];
  for (const w of j.words.slice(0, 14)) {
    const word = clip(w?.word, 40).replace(/[[\]|]/g, "");
    const english = clip(w?.english, 40).replace(/[[\]|]/g, "");
    if (!word || !english || words.some((x) => x.word === word)) continue;
    const emoji = String(w?.emoji ?? "").trim();
    words.push({
      word,
      english,
      say: clip(w?.say, 60),
      ...(lang.romanize && w?.roman ? { roman: clip(w.roman, 60) } : {}),
      emoji: EMOJI_RE.test(emoji) ? [...emoji].slice(0, 2).join("") : "⭐",
    });
  }
  if (words.length < 4) return null;

  const known = new Set(words.map((w) => w.word));
  const pages = j.pages.slice(0, wantPages).map((p: any) => {
    // A marker for a word that isn't in the word list becomes plain English: never teach an unchecked word.
    const text = clip(p?.text, aikConfig.bookPageChars + 200).replace(MARK, (m: string, w: string, en: string) => (known.has(w.trim()) ? `[[${w.trim()}|${en.trim()}]]` : en));
    return { text, scene: clip(p?.scene, 240) };
  });
  if (pages.some((p: any) => !p.text)) return null;
  if (!pages.some((p: any) => HAS_MARK.test(p.text))) return null;

  const ph = j.phrase ?? {};
  const phrase: LangBlock["phrase"] = {
    text: clip(ph.text, 80) || lang.hello,
    english: clip(ph.english, 80) || "Hello!",
    say: clip(ph.say, 80),
    ...(lang.romanize && ph.roman ? { roman: clip(ph.roman, 80) } : {}),
  };

  return {
    book: {
      title: clip(j.title, 60) || fallbackTitle,
      hero: { name: clip(j.hero?.name, 40) || "the hero", look: clip(j.hero.look, 400) },
      style: STYLES.includes(String(j.style)) ? String(j.style) : STYLES[0],
      coverScene: clip(j.coverScene, 240) || pages[0].scene,
      pages,
      theEnd: clip(j.theEnd, 80) || "The End",
    },
    words,
    phrase,
  };
}

/* ------------------------------------------------------------------ *
 * The second check
 * ------------------------------------------------------------------ */

/**
 * An independent reviewer reads every word and the phrase. Wrong words are
 * corrected (in the list and on every page); a word the reviewer cannot vouch
 * for is unwoven back into English. The child only ever meets checked words.
 */
export async function checkWords(draft: LangDraft, lang: LangDef): Promise<{ draft: LangDraft; checked: boolean; fixes: number }> {
  const system = `You are a careful ${lang.label} teacher checking vocabulary written for children aged 8 to 11. Be strict: spelling, accents, script, ${lang.romanize ? `${lang.romanize}, ` : ""}meaning and the sound-it-out guide must all be right for a beginner.
Reply with ONLY JSON, no fences: {"words": [{"word": string, "ok": boolean, "fix": {"word": string, "english": string, "say": string${lang.romanize ? `, "roman": string` : ""}} | null}], "phrase": {"ok": boolean, "fix": {"text": string, "english": string, "say": string${lang.romanize ? `, "roman": string` : ""}} | null}}
- One entry per word, in the same order, "word" copied exactly as given.
- ok=true when it is correct as written. ok=false with a fix when you are sure of the right version. ok=false with fix=null when it should not be taught to a child at all.`;
  const user = JSON.stringify({ language: lang.label, words: draft.words.map(({ audio: _a, emoji: _e, ...w }) => w), phrase: draft.phrase });
  let raw: string;
  try {
    raw = await completeText({ system, user, maxTokens: 1500, temperature: 0, tier: "default", mockKind: "langcheck" });
  } catch (err) {
    logger.warn({ err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] language word check failed; words stay unchecked");
    return { draft, checked: false, fixes: 0 };
  }
  const j = extractJson<any>(raw);
  if (!j || !Array.isArray(j.words)) return { draft, checked: false, fixes: 0 };

  let fixes = 0;
  const words: LangWord[] = [];
  let pages = draft.book.pages.map((p) => ({ ...p }));
  const replaceMarker = (from: string, to: { word: string; english: string } | null) => {
    pages = pages.map((p) => ({
      ...p,
      text: p.text.replace(MARK, (m, w: string, en: string) => (w === from ? (to ? `[[${to.word}|${to.english}]]` : en) : m)),
    }));
  };
  draft.words.forEach((w, i) => {
    const v = j.words.find((x: any) => x?.word === w.word) ?? j.words[i];
    if (!v || v.ok === true) return void words.push(w);
    fixes++;
    if (v.fix && v.fix.word && v.fix.english) {
      const fixed: LangWord = {
        word: clip(v.fix.word, 40).replace(/[[\]|]/g, ""),
        english: clip(v.fix.english, 40).replace(/[[\]|]/g, ""),
        say: clip(v.fix.say, 60) || w.say,
        ...(lang.romanize ? { roman: clip(v.fix.roman, 60) || w.roman } : {}),
        emoji: w.emoji,
      };
      if (!fixed.word || words.some((x) => x.word === fixed.word)) return void replaceMarker(w.word, null);
      words.push(fixed);
      replaceMarker(w.word, fixed);
    } else {
      replaceMarker(w.word, null);
    }
  });
  let phrase = draft.phrase;
  if (j.phrase && j.phrase.ok === false) {
    fixes++;
    phrase = j.phrase.fix?.text
      ? { text: clip(j.phrase.fix.text, 80), english: clip(j.phrase.fix.english, 80) || phrase.english, say: clip(j.phrase.fix.say, 80) || phrase.say, ...(lang.romanize ? { roman: clip(j.phrase.fix.roman, 80) || phrase.roman } : {}) }
      : { text: lang.hello, english: "Hello!", say: "" };
  }
  if (words.length < 4) return { draft, checked: false, fixes };
  return { draft: { book: { ...draft.book, pages }, words, phrase }, checked: true, fixes };
}

/* ------------------------------------------------------------------ *
 * Draft: write, retry once on shape, check, screen
 * ------------------------------------------------------------------ */

export async function writeLanguageDraft(opts: {
  mode: ModeDef;
  user: string;
  fallbackTitle: string;
  lang: LangDef;
  topic: string;
}): Promise<{ draft: LangDraft; checked: boolean; fixes: number } | { error: "redirect" | "shape" | "filtered"; flags?: Flag[] }> {
  const pages = aikConfig.bookPages;
  const system = languageSystemPrompt(pages, opts.lang, opts.topic);
  const call = (extra: string, temp: number) =>
    completeText({ system: system + extra, user: opts.user, maxTokens: opts.mode.maxTokens, temperature: temp, tier: opts.mode.tier, mockKind: "language" });
  let raw: string;
  try {
    raw = await call("", opts.mode.temperature);
  } catch (err) {
    if (err instanceof ContentFilteredError) return { error: "filtered" };
    throw err;
  }
  if (/^\s*REDIRECT\b/i.test(raw.trim())) return { error: "redirect" };
  let draft = parseLanguageDraft(raw, opts.fallbackTitle, pages, opts.lang);
  if (!draft) {
    try {
      raw = await call("\n\nIMPORTANT: your previous reply had the wrong format. Follow OUTPUT FORMAT exactly, including [[word|english]] markers and the words list.", Math.max(0, opts.mode.temperature - 0.2));
    } catch (err) {
      if (err instanceof ContentFilteredError) return { error: "filtered" };
      throw err;
    }
    draft = parseLanguageDraft(raw, opts.fallbackTitle, pages, opts.lang);
  }
  if (!draft) return { error: "shape" };

  const checked = await checkWords(draft, opts.lang);
  const d = checked.draft;
  // Screen everything a child will see: the English, the woven words and their meanings.
  const all = [
    d.book.title, d.book.hero.name, d.book.hero.look, d.book.coverScene,
    ...d.book.pages.flatMap((p) => [spokenText(p.text), p.text.replace(MARK, (_m, _w, en) => en), p.scene]),
    d.book.theEnd,
    ...d.words.flatMap((w) => [w.word, w.english, w.say, w.roman ?? ""]),
    d.phrase.text, d.phrase.english,
  ].join("\n");
  const out = await screenOutputText(all);
  if (!out.ok) return { error: "filtered", flags: out.flags };
  return { draft: d, checked: checked.checked, fixes: checked.fixes };
}

/* ------------------------------------------------------------------ *
 * Recording every word
 * ------------------------------------------------------------------ */

/** Can single words be said in the language right now? */
export function canSayWords(): boolean {
  return aikConfig.mockAI || isElevenLabsConfigured() || isAzureSpeechConfigured();
}

/**
 * Records each word and the phrase in a voice that speaks the language.
 * `previous` keeps recordings for words that did not change.
 */
export async function recordWords(requestId: number, lang: LangDef, block: LangBlock, previous: LangBlock | null, voice?: VoiceChoice | null): Promise<{ recorded: number; total: number }> {
  if (!canSayWords()) return { recorded: 0, total: 0 };
  const sameLang = previous?.code === block.code;
  const todo: { key: string; text: string; set: (m: MediaRef) => void }[] = [];
  block.words.forEach((w, i) => {
    const prev = sameLang ? previous?.words.find((x) => x.word === w.word && x.audio) : null;
    if (prev?.audio) w.audio = prev.audio;
    else todo.push({ key: `w${i + 1}`, text: w.word, set: (m) => (w.audio = m) });
  });
  if (sameLang && previous?.phrase.text === block.phrase.text && previous.phrase.audio) block.phrase.audio = previous.phrase.audio;
  else todo.push({ key: "phrase", text: block.phrase.text, set: (m) => (block.phrase.audio = m) });

  let recorded = 0;
  for (let i = 0; i < todo.length; i += 4) {
    await Promise.all(
      todo.slice(i, i + 4).map(async (t) => {
        try {
          const a = await speakWord(t.text, lang, voice);
          t.set(await putMedia(requestId, `${t.key}.mp3`, Buffer.from(a.base64, "base64"), a.mime));
          recorded++;
        } catch (err) {
          logger.warn({ requestId, word: t.key, lang: lang.code, err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] word recording failed");
        }
      }),
    );
  }
  return { recorded, total: todo.length };
}

/** The language block that goes into the stored book. */
export function langBlock(lang: LangDef, topic: string, draft: LangDraft, checked: boolean): LangBlock {
  return { code: lang.code, label: lang.label, flag: lang.flag, hello: lang.hello, rtl: lang.rtl, topic, words: draft.words, phrase: draft.phrase, checked };
}
