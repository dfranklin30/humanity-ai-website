/**
 * Kids AI Studio — a storybook as a PDF.
 *
 * The flip-book on screen is where a child reads their book; the PDF is how
 * it leaves the Studio: printed for the fridge, emailed home by a
 * facilitator, stapled into a class anthology. Landscape pages, the picture
 * on the left and the words on the right in a big friendly size, the cover
 * first and "The End" last. Built on request from the stored media, so it
 * is always the approved version.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getMedia, sniffImageMime } from "./media";
import type { Book } from "./book";
import { latinText, type LangBook } from "./language";

const W = 792;
const H = 612;
const MARGIN = 40;

export async function renderBookPdf(input: Book): Promise<Uint8Array> {
  // A Language Passport book: woven words are written in Latin letters with their meaning,
  // and a word list closes the book. The standard PDF fonts cover Latin text only.
  const lang = (input as LangBook).lang ?? null;
  const book: Book = lang
    ? { ...input, title: latin(input.title) || "My Language Passport book", theEnd: /[A-Za-z0-9]/.test(latin(input.theEnd)) ? latin(input.theEnd) : "The End", pages: input.pages.map((p) => ({ ...p, text: latin(latinText(p.text, lang.words)), scene: latin(p.scene) })) }
    : { ...input, title: latin(input.title), theEnd: latin(input.theEnd), pages: input.pages.map((p) => ({ ...p, text: latin(p.text), scene: latin(p.scene) })) };
  const doc = await PDFDocument.create();
  doc.setTitle(book.title);
  doc.setAuthor("Kids AI Studio · Humanity + AI");
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const body = await doc.embedFont(StandardFonts.Helvetica);

  /* Cover ----------------------------------------------------------- */
  {
    const page = doc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.96, 0.94, 1) });
    const img = book.cover.image ? await embed(doc, book.cover.image) : null;
    if (img) {
      const side = H - MARGIN * 2 - 70;
      const dims = fit(img.width, img.height, side, side);
      page.drawImage(img.image, { x: (W - dims.w) / 2, y: MARGIN + 60, width: dims.w, height: dims.h });
    }
    drawCentered(page, book.title, bold, img ? 30 : 44, img ? MARGIN + 18 : H / 2, rgb(0.27, 0.16, 0.6));
  }

  /* Pages ----------------------------------------------------------- */
  for (const p of book.pages) {
    const page = doc.addPage([W, H]);
    const img = p.image ? await embed(doc, p.image) : null;
    const boxSide = H - MARGIN * 2;
    if (img) {
      const dims = fit(img.width, img.height, boxSide, boxSide);
      page.drawImage(img.image, { x: MARGIN, y: (H - dims.h) / 2, width: dims.w, height: dims.h });
    } else {
      page.drawRectangle({ x: MARGIN, y: MARGIN, width: boxSide, height: boxSide, color: rgb(0.95, 0.95, 0.97) });
      drawWrapped(page, p.scene, body, 13, MARGIN + 16, H - MARGIN - 30, boxSide - 32, rgb(0.45, 0.45, 0.5));
    }
    const textX = MARGIN + boxSide + 28;
    const textW = W - textX - MARGIN;
    drawWrapped(page, p.text, body, 20, textX, H - MARGIN - 40, textW, rgb(0.12, 0.12, 0.16), 1.45);
    page.drawText(String(p.n), { x: W - MARGIN - 10, y: MARGIN - 18, size: 11, font: body, color: rgb(0.5, 0.5, 0.55) });
  }

  /* My new words (Language Passport) --------------------------------- */
  if (lang) {
    const page = doc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.94, 0.98, 0.96) });
    drawCentered(page, latin(`My new ${lang.label} words`), bold, 28, H - MARGIN - 30, rgb(0.05, 0.4, 0.3));
    let y = H - MARGIN - 80;
    for (const w of lang.words) {
      const shown = latin(w.roman || w.word) || latin(w.say);
      page.drawText(shown, { x: MARGIN + 30, y, size: 18, font: bold, color: rgb(0.12, 0.12, 0.16) });
      page.drawText(latin(`${w.english}${w.say ? `   say: ${w.say}` : ""}`), { x: MARGIN + 290, y, size: 15, font: body, color: rgb(0.3, 0.3, 0.35) });
      y -= 34;
      if (y < MARGIN + 60) break;
    }
    const ph = latin(`${lang.phrase.roman || lang.phrase.text} = ${lang.phrase.english}`);
    if (y > MARGIN + 30) drawCentered(page, ph, body, 14, Math.max(MARGIN + 20, y - 10), rgb(0.05, 0.4, 0.3));
  }

  /* The End --------------------------------------------------------- */
  {
    const page = doc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.96, 0.94, 1) });
    drawCentered(page, book.theEnd || "The End", bold, 40, H / 2 + 10, rgb(0.27, 0.16, 0.6));
    drawCentered(page, `Written by the director with ${book.madeWith.pictures ? "pictures and " : ""}help from the Kids AI Studio.`, body, 13, H / 2 - 30, rgb(0.4, 0.4, 0.45));
  }

  return doc.save();
}

async function embed(doc: PDFDocument, ref: string) {
  const m = await getMedia(ref).catch(() => null);
  if (!m) return null;
  try {
    const mime = sniffImageMime(m.bytes, m.mime);
    const image = mime === "image/jpeg" ? await doc.embedJpg(m.bytes) : await doc.embedPng(m.bytes);
    return { image, width: image.width, height: image.height };
  } catch {
    return null;
  }
}

function fit(w: number, h: number, maxW: number, maxH: number) {
  const r = Math.min(maxW / w, maxH / h);
  return { w: w * r, h: h * r };
}

function drawCentered(page: PDFPage, text: string, font: PDFFont, size: number, y: number, color: ReturnType<typeof rgb>) {
  const lines = wrap(text, font, size, W - MARGIN * 2);
  let yy = y + ((lines.length - 1) * size * 1.2) / 2;
  for (const line of lines) {
    const w = font.widthOfTextAtSize(line, size);
    page.drawText(line, { x: (W - w) / 2, y: yy, size, font, color });
    yy -= size * 1.2;
  }
}

function drawWrapped(page: PDFPage, text: string, font: PDFFont, size: number, x: number, top: number, width: number, color: ReturnType<typeof rgb>, leading = 1.3) {
  let y = top;
  for (const line of wrap(text, font, size, width)) {
    page.drawText(line, { x, y, size, font, color });
    y -= size * leading;
  }
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) <= width || !line) line = candidate;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Text the standard (WinAnsi) PDF fonts can draw: accents kept where possible, anything else dropped. */
const WIN_ANSI_EXTRA = new Set([..."‘’“”–—…•€™‚„†‡ˆ‰Š‹ŒŽ˜šœžŸ"]);
function latin(text: string): string {
  let out = "";
  for (const ch of (text ?? "").normalize("NFC")) {
    if (ch.charCodeAt(0) <= 0xff || WIN_ANSI_EXTRA.has(ch)) {
      out += ch;
      continue;
    }
    const base = ch.normalize("NFD").replace(/\p{M}/gu, "");
    if (base && [...base].every((c) => c.charCodeAt(0) <= 0xff)) out += base;
  }
  return out.replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, "").replace(/\s{2,}/g, " ").trim();
}
