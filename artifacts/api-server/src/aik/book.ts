/**
 * Kids AI Studio — Story Maker's finished product.
 *
 * Story Maker used to hand a child a comic script and a sentence describing
 * a cover they could draw. That is a plan for a book, and a plan is what you
 * give someone who has the afternoon and the crayons. Most children in a
 * forty-minute club session do not, and "the AI will make the rest later" is
 * a promise that was never kept.
 *
 * This file keeps it. A storybook is:
 *
 *     write the story  →  draw the cover  →  draw every page (same hero)
 *        →  record the narration  →  screen every picture  →  one book
 *
 * The result is a real picture book: a cover, six illustrated pages, each
 * read aloud, viewable as a flip-book in the Studio and downloadable as a PDF
 * for the fridge door. The hero is described once, in detail, and that
 * description — plus the cover as a reference image — is what keeps a shy
 * dragon the same shy dragon from page one to page six.
 *
 * Every page's text is screened like any other model output, every picture
 * goes through Content Safety, and the whole book waits for a facilitator
 * before a child sees it, because it contains generated pictures.
 */
import { aikConfig, isImageConfigured, isTtsConfigured, isContentSafetyConfigured } from "./config";
import { completeText, generateImage, speak, ContentFilteredError } from "./ai";
import { COMMON_RULES, extractJson, type ModeDef } from "./modes";
import { Steps, type ForgeStep } from "./forge";
import { putMedia, getMedia, type MediaRef } from "./media";
import { screenOutputText, contentSafetyImage, stripLinks, type Flag } from "./safety";
import { logger } from "../lib/logger";

export type BookPage = {
  n: number;
  /** What is read on this page: two to four short sentences. */
  text: string;
  /** What the picture shows, for the illustrator. Never shown to the child as the point of the page. */
  scene: string;
  image?: MediaRef;
  audio?: MediaRef;
};

export type Book = {
  format: "book";
  title: string;
  hero: { name: string; look: string };
  style: string;
  cover: { scene: string; image?: MediaRef };
  pages: BookPage[];
  /** A line for the last page. */
  theEnd: string;
  madeWith: { text: boolean; pictures: boolean; narration: boolean };
};

const STYLES = ["bright watercolor", "soft crayon", "cut-paper collage", "cheerful cartoon", "cozy gouache"];

export function bookSystemPrompt(pages: number): string {
  return `You write short illustrated picture books for children aged 8 to 11, who will read them on screen with a picture on every page.${COMMON_RULES}
OUTPUT FORMAT: reply with ONLY a JSON object, no markdown fences:
{"title": string, "hero": {"name": string, "look": string}, "style": string, "coverScene": string, "pages": [{"text": string, "scene": string} x${pages}], "theEnd": string}
- hero.look: ONE detailed visual description of the main character for an illustrator (35-50 words): body shape, colours, clothes or markings, face, one signature detail. This exact description is reused for every picture, so be specific and never contradict it later.
- style: one of ${STYLES.map((s) => `"${s}"`).join(", ")}.
- Exactly ${pages} pages. Each page.text is 2 to 4 short sentences (max 60 words) a 9-year-old reads easily. The story has a beginning, a problem, a try that goes wrong, a clever or kind solution, and a warm or funny ending.
- Each page.scene is one sentence for the illustrator: what the hero is doing, where, and the mood. Mention only things that are in that page's text. No words, signs or letters in any picture.
- coverScene: one sentence for the cover picture showing the hero in the main setting.
- theEnd: one short closing line (max 12 words).
- Keep every prop, place and character consistent from page to page.`;
}

/** The book without its media, which is what the model sees on a change request. */
export function bookTextOnly(content: string): string {
  try {
    const b = JSON.parse(content) as Book;
    return JSON.stringify({
      title: b.title,
      hero: b.hero,
      style: b.style,
      coverScene: b.cover?.scene,
      pages: (b.pages ?? []).map((p) => ({ text: p.text, scene: p.scene })),
      theEnd: b.theEnd,
    });
  } catch {
    return content;
  }
}

export type BookDraft = { title: string; hero: { name: string; look: string }; style: string; coverScene: string; pages: { text: string; scene: string }[]; theEnd: string };

/** Parse and tidy the model's reply. Null when the shape is wrong (the caller retries once). */
export function parseBookDraft(raw: string, fallbackTitle: string, wantPages: number): BookDraft | null {
  const j = extractJson<any>(raw);
  if (!j || !Array.isArray(j.pages) || j.pages.length < 3 || !j.hero?.look) return null;
  const pages = j.pages.slice(0, wantPages).map((p: any) => ({
    text: stripLinks(String(p?.text ?? "").slice(0, aikConfig.bookPageChars)),
    scene: stripLinks(String(p?.scene ?? "").slice(0, 240)),
  }));
  if (pages.some((p: any) => !p.text)) return null;
  const style = STYLES.includes(String(j.style)) ? String(j.style) : STYLES[0];
  return {
    title: stripLinks(String(j.title ?? fallbackTitle).slice(0, 60)),
    hero: { name: stripLinks(String(j.hero?.name ?? "the hero").slice(0, 40)), look: stripLinks(String(j.hero.look).slice(0, 400)) },
    style,
    coverScene: stripLinks(String(j.coverScene ?? pages[0].scene).slice(0, 240)),
    pages,
    theEnd: stripLinks(String(j.theEnd ?? "The End").slice(0, 80)),
  };
}

export function bookText(d: BookDraft): string {
  return [d.title, d.hero.name, d.hero.look, d.coverScene, ...d.pages.flatMap((p) => [p.text, p.scene]), d.theEnd].join("\n");
}

const NO_TEXT = "No words, no letters, no signs, no real people, no logos. Kid-friendly, bright, friendly faces.";

function coverPrompt(d: BookDraft): string {
  return `${d.style} children's picture-book cover illustration. The main character: ${d.hero.look}. Scene: ${d.coverScene}. Square composition, the character large and centred. ${NO_TEXT}`;
}

function pagePrompt(d: BookDraft, page: { scene: string }): string {
  return `${d.style} children's picture-book illustration, same character and same art style as the reference. The character: ${d.hero.look}. This page: ${page.scene}. ${NO_TEXT}`;
}

export type BuildBookResult =
  | { ok: true; book: Book; steps: ForgeStep[]; flags: Flag[]; kidNote: string }
  | { ok: false; blocked: boolean; message: string; flags: Flag[]; steps: ForgeStep[] };

/**
 * Turn a screened draft into a finished book. `previous` is the book a change
 * request started from: pages whose text and scene did not change keep their
 * picture and their narration, so "make the ending funnier" costs one or two
 * pictures rather than seven.
 */
export async function buildBook(opts: {
  requestId: number;
  draft: BookDraft;
  previous: Book | null;
  onProgress?: (steps: ForgeStep[]) => void;
}): Promise<BuildBookResult> {
  const steps = new Steps(opts.onProgress);
  const { draft, previous, requestId } = opts;
  const flags: Flag[] = [];
  const pictures = isImageConfigured();
  const narration = isTtsConfigured();
  const mustScreenImages = isContentSafetyConfigured();
  if (!mustScreenImages && aikConfig.contentSafety.required && pictures) {
    return { ok: false, blocked: true, message: "Pictures are switched off until screening is set up. Ask your facilitator.", flags: [{ layer: "system", category: "content_safety_not_configured" }], steps: steps.all() };
  }

  const book: Book = {
    format: "book",
    title: draft.title,
    hero: draft.hero,
    style: draft.style,
    cover: { scene: draft.coverScene },
    pages: draft.pages.map((p, i) => ({ n: i + 1, text: p.text, scene: p.scene })),
    theEnd: draft.theEnd,
    madeWith: { text: true, pictures, narration },
  };

  const sameHero = previous && previous.hero?.look === draft.hero.look && previous.style === draft.style;

  /* Cover ---------------------------------------------------------- */
  let coverPng: string | null = null;
  if (pictures) {
    if (sameHero && previous?.cover?.image && previous.cover.scene === draft.coverScene) {
      book.cover.image = previous.cover.image;
      steps.begin("cover", "Keeping the cover");
      steps.end("cover", "done", "unchanged");
      const m = await getMedia(previous.cover.image).catch(() => null);
      coverPng = m?.mime.startsWith("image/") ? m.bytes.toString("base64") : null;
    } else {
      steps.begin("cover", "Drawing the cover");
      const made = await drawScreened(coverPrompt(draft), undefined, flags);
      if (made.blocked) return { ok: false, blocked: true, message: made.message, flags, steps: steps.all() };
      if (made.png) {
        coverPng = made.png;
        book.cover.image = await putMedia(requestId, "cover.png", Buffer.from(made.png, "base64"), "image/png");
        steps.end("cover", "done");
      } else {
        steps.end("cover", "failed", made.message);
      }
    }
  }

  /* Pages ---------------------------------------------------------- */
  if (pictures) {
    const todo = book.pages.map((p, i) => {
      const prev = previous?.pages?.[i];
      if (sameHero && prev?.image && prev.scene === p.scene) {
        p.image = prev.image;
        return null;
      }
      return p;
    });
    const drawing = todo.filter((p): p is BookPage => Boolean(p));
    if (drawing.length) {
      steps.begin("pages", `Drawing ${drawing.length === book.pages.length ? "every page" : `${drawing.length} page${drawing.length === 1 ? "" : "s"}`}`);
      let blocked: string | null = null;
      // Two at a time: fast enough for a waiting child, gentle on the image quota.
      for (let i = 0; i < drawing.length && !blocked; i += 2) {
        const batch = drawing.slice(i, i + 2);
        await Promise.all(
          batch.map(async (p) => {
            const made = await drawScreened(pagePrompt(draft, p), coverPng ?? undefined, flags);
            if (made.blocked) {
              blocked = made.message;
              return;
            }
            if (made.png) p.image = await putMedia(requestId, `p${p.n}.png`, Buffer.from(made.png, "base64"), "image/png");
            else logger.warn({ requestId, page: p.n, reason: made.message }, "[aik] page picture failed; the words stay");
          }),
        );
      }
      if (blocked) return { ok: false, blocked: true, message: blocked, flags, steps: steps.all() };
      const drawn = drawing.filter((p) => p.image).length;
      steps.end("pages", drawn === drawing.length ? "done" : drawn ? "failed" : "failed", `${drawn} of ${drawing.length} pictures`);
    } else {
      steps.begin("pages", "Keeping the pictures");
      steps.end("pages", "done", "nothing changed in the scenes");
    }
  }

  /* Narration ------------------------------------------------------ */
  if (narration) {
    const todo = book.pages.filter((p, i) => {
      const prev = previous?.pages?.[i];
      if (prev?.audio && prev.text === p.text) {
        p.audio = prev.audio;
        return false;
      }
      return true;
    });
    steps.begin("narration", todo.length ? "Recording the read-aloud" : "Keeping the read-aloud");
    let recorded = 0;
    for (let i = 0; i < todo.length; i += 3) {
      await Promise.all(
        todo.slice(i, i + 3).map(async (p) => {
          try {
            const a = await speak(p.text);
            p.audio = await putMedia(requestId, `p${p.n}.mp3`, Buffer.from(a.base64, "base64"), a.mime);
            recorded++;
          } catch (err) {
            logger.warn({ requestId, page: p.n, err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] narration failed for a page");
          }
        }),
      );
    }
    steps.end("narration", todo.length === 0 || recorded === todo.length ? "done" : "failed", todo.length ? `${recorded} of ${todo.length} pages` : "unchanged");
  }

  const pageCount = book.pages.length;
  const picCount = book.pages.filter((p) => p.image).length + (book.cover.image ? 1 : 0);
  const kidNote = !pictures
    ? `Your ${pageCount}-page story is ready to read! Pictures aren't switched on for this class yet.`
    : picCount === 0
      ? `Your ${pageCount}-page story is ready to read! The pictures didn't come out this time — try once more later.`
      : `Your ${pageCount}-page picture book is ready. Your facilitator will look at the pictures, then it's yours to read${narration ? " and listen to" : ""}.`;

  return { ok: true, book, steps: steps.all(), flags, kidNote };
}

type Drawn = { png: string | null; blocked: boolean; message: string };

/** One picture, generated and screened. A screening hit blocks the whole book; a generation failure just loses that picture. */
async function drawScreened(prompt: string, referencePng: string | undefined, flags: Flag[]): Promise<Drawn> {
  try {
    const img = await generateImage(prompt, { reference: referencePng });
    if (isContentSafetyConfigured()) {
      const hits = await contentSafetyImage(img.base64);
      if (hits.length) {
        flags.push(...hits);
        return { png: null, blocked: true, message: "One of the pictures wasn't right for the club. Try a different idea!" };
      }
    }
    return { png: img.base64, blocked: false, message: "" };
  } catch (err) {
    if (err instanceof ContentFilteredError) {
      flags.push({ layer: "content_safety", category: "provider_filter" });
      return { png: null, blocked: true, message: "One of the pictures wasn't right for the club. Try a different idea!" };
    }
    return { png: null, blocked: false, message: String((err as Error)?.message ?? err).slice(0, 120) };
  }
}

/** Everything a read-aloud of the whole book should say, in order. */
export function bookNarrationText(book: Book): string {
  return [book.title, ...book.pages.map((p) => p.text), book.theEnd].join(". ");
}

/** Writes the story draft, retrying once on a malformed reply. */
export async function writeBookDraft(opts: { mode: ModeDef; user: string; fallbackTitle: string; previous?: string | null }): Promise<{ draft: BookDraft } | { error: "redirect" | "shape" | "filtered"; flags?: Flag[] }> {
  const pages = aikConfig.bookPages;
  const system = bookSystemPrompt(pages);
  const call = (extra: string, temp: number) =>
    completeText({ system: system + extra, user: opts.user, maxTokens: opts.mode.maxTokens, temperature: temp, tier: opts.mode.tier, mockKind: "book" });
  let raw: string;
  try {
    raw = await call("", opts.mode.temperature);
  } catch (err) {
    if (err instanceof ContentFilteredError) return { error: "filtered" };
    throw err;
  }
  if (/^\s*REDIRECT\b/i.test(raw.trim())) return { error: "redirect" };
  let draft = parseBookDraft(raw, opts.fallbackTitle, pages);
  if (!draft) {
    try {
      raw = await call("\n\nIMPORTANT: your previous reply had the wrong format. Follow OUTPUT FORMAT exactly.", Math.max(0, opts.mode.temperature - 0.2));
    } catch (err) {
      if (err instanceof ContentFilteredError) return { error: "filtered" };
      throw err;
    }
    draft = parseBookDraft(raw, opts.fallbackTitle, pages);
  }
  if (!draft) return { error: "shape" };
  const out = await screenOutputText(bookText(draft));
  if (!out.ok) return { error: "filtered", flags: out.flags };
  return { draft };
}
