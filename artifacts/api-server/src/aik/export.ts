/**
 * Export: one file to keep for any piece a studio made, and ZIP bundles of
 * many pieces (a child's portfolio, a whole class, the Hub workspace).
 *
 *   game   → the HTML game (plays in any browser)
 *   story  → the picture book as a PDF (words only, as text, if it is not a book)
 *   quest  → a printable sheet (questions, then the answer key)
 *   robot  → a printable build sheet (parts, steps, safety note, the code)
 *   image  → the picture (or the prompt as text when no picture was made)
 *   audio  → the song (or the lyrics as text when no audio was made)
 *   video  → the movie (or the storyboard as a printable sheet)
 *   chat   → the conversation as text
 *   hero   → the hero's portrait (or the description as text)
 *
 * The ZIP is written here, store-only (no compression): media is already
 * compressed, and it keeps the dependency list unchanged.
 */
import { crc32 } from "node:zlib";
import type { ArtifactRow } from "./store";
import { getMedia } from "./media";
import { renderBookPdf } from "./bookpdf";
import { representation } from "./remix";
import { logger } from "../lib/logger";

export type ExportFile = { name: string; mime: string; bytes: Buffer };

export function safeFileName(title: string, fallback = "my-project"): string {
  return title.replace(/[^a-z0-9 _-]/gi, "").trim().replace(/\s+/g, " ").slice(0, 60) || fallback;
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** A self-contained, printable page in the Studio's own look. */
function sheet(title: string, body: string, subtitle?: string): Buffer {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>
  body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;max-width:760px;margin:32px auto;padding:0 20px;color:#1e1b4b;line-height:1.5}
  h1{font-size:28px;margin:0 0 4px;color:#4c1d95} .sub{color:#6b7280;margin:0 0 20px}
  h2{font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#7c3aed;margin:24px 0 8px}
  ol,ul{padding-left:22px} li{margin:8px 0} .q{font-weight:600} .a{color:#065f46;margin:2px 0 0 14px} .line{border-bottom:1px dashed #cbd5e1;height:22px;margin:6px 0 0 14px}
  pre{background:#0f172a;color:#e2e8f0;padding:14px;border-radius:12px;white-space:pre-wrap;font-size:12px;line-height:1.5}
  .note{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:10px 14px} .card{border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;margin:8px 0}
  footer{margin-top:32px;color:#9ca3af;font-size:12px} .break{page-break-before:always} @media print{body{margin:0}}
</style></head><body>
<h1>${esc(title)}</h1>${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ""}
${body}
<footer>Made in the Kids AI Studio · Humanity + AI · humanityplusai.org/aiforkids</footer>
</body></html>`;
  return Buffer.from(html, "utf8");
}

function parse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function firstMediaRef(content: string): string | null {
  const m = /"(aik:\/\/[^"]+|data:(?:image|audio|video)\/[^"]+)"/.exec(content);
  return m ? m[1] : null;
}

async function mediaFile(ref: string, baseName: string, fallbackExt: string): Promise<ExportFile | null> {
  const m = await getMedia(ref).catch(() => null);
  if (!m) return null;
  const ext = m.mime.includes("mpeg") ? "mp3" : m.mime.includes("mp4") ? "mp4" : m.mime.includes("jpeg") ? "jpg" : m.mime.includes("png") ? "png" : m.mime.includes("webp") ? "webp" : fallbackExt;
  return { name: `${baseName}.${ext}`, mime: m.mime, bytes: m.bytes };
}

function textFile(a: Pick<ArtifactRow, "kind" | "title" | "content" | "summary">, baseName: string): ExportFile {
  return { name: `${baseName}.txt`, mime: "text/plain; charset=utf-8", bytes: Buffer.from(representation(a, 50_000), "utf8") };
}

/** One file to keep for this piece. Never throws: a piece with nothing to attach exports its words. */
export async function exportArtifact(a: ArtifactRow): Promise<ExportFile> {
  const base = safeFileName(a.title);
  try {
    switch (a.kind) {
      case "game":
        return { name: `${base}.html`, mime: "text/html; charset=utf-8", bytes: Buffer.from(a.content, "utf8") };

      case "story": {
        const book = parse<any>(a.content);
        if (book?.format === "book" && Array.isArray(book.pages)) {
          const pdf = await renderBookPdf(book);
          return { name: `${base}.pdf`, mime: "application/pdf", bytes: Buffer.from(pdf) };
        }
        return textFile(a, base);
      }

      case "quest": {
        const q = parse<{ title?: string; items?: { text?: string; sourceHint?: string; answer?: string }[]; nextIdea?: string }>(a.content) ?? {};
        const items = q.items ?? [];
        const isQuiz = items.some((it) => it.answer);
        const list = (withAnswers: boolean) =>
          `<ol>${items
            .map(
              (it) =>
                `<li><p class="q">${esc(it.text)}</p>${
                  withAnswers ? `<p class="a">Answer: ${esc(it.answer ?? "")}</p>` : isQuiz ? `<p class="line">&nbsp;</p>` : ""
                }${it.sourceHint ? `<p class="a" style="color:#6b7280">Check: ${esc(it.sourceHint)}</p>` : ""}</li>`,
            )
            .join("")}</ol>`;
        const body =
          `<h2>${isQuiz ? "Questions" : "Things to check"}</h2>${list(false)}` +
          (q.nextIdea ? `<p class="note">Next idea: ${esc(q.nextIdea)}</p>` : "") +
          (isQuiz ? `<div class="break"></div><h1>${esc(q.title ?? a.title)} — answer key</h1>${list(true)}` : "");
        return { name: `${base} - sheet.html`, mime: "text/html; charset=utf-8", bytes: sheet(q.title ?? a.title, body, "Quest Helper · student sheet") };
      }

      case "robot": {
        const r = parse<{ name?: string; job?: string; parts?: string[]; steps?: string[]; code?: string; safetyNote?: string }>(a.content) ?? {};
        const body =
          `<p>${esc(r.job ?? "")}</p>` +
          (r.safetyNote ? `<p class="note">🦺 ${esc(r.safetyNote)}</p>` : "") +
          `<h2>Parts</h2><ul>${(r.parts ?? []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` +
          `<h2>Build steps</h2><ol>${(r.steps ?? []).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` +
          `<h2>micro:bit starter code (paste into MakeCode → JavaScript)</h2><pre>${esc(r.code ?? "")}</pre>`;
        return { name: `${base} - build sheet.html`, mime: "text/html; charset=utf-8", bytes: sheet(r.name ?? a.title, body, "Robotics Lab · build sheet") };
      }

      case "image": {
        const ref = a.content && (a.content.startsWith("aik://") || a.content.startsWith("data:")) ? a.content : null;
        return (ref ? await mediaFile(ref, base, "png") : null) ?? textFile(a, base);
      }

      case "audio": {
        const ref = a.content && (a.content.startsWith("aik://") || a.content.startsWith("data:")) ? a.content : null;
        return (ref ? await mediaFile(ref, base, "mp3") : null) ?? textFile(a, base);
      }

      case "video": {
        const v = parse<{ movie?: string; shots?: { shot?: number; description?: string; clip?: string }[]; title?: string; style?: string }>(a.content);
        const ref = v?.movie || v?.shots?.find((s) => s.clip)?.clip || (a.mime.startsWith("video/") ? a.content : null);
        if (ref) {
          const f = await mediaFile(ref, base, "mp4");
          if (f) return f;
        }
        const shots = v?.shots ?? [];
        const body = `<h2>Storyboard${v?.style ? ` · ${esc(v.style)}` : ""}</h2>` + shots.map((s, i) => `<div class="card"><strong>Shot ${s.shot ?? i + 1}</strong><br>${esc(s.description ?? "")}</div>`).join("");
        return { name: `${base} - storyboard.html`, mime: "text/html; charset=utf-8", bytes: sheet(v?.title ?? a.title, body, "Video Maker · storyboard") };
      }

      case "hero": {
        const ref = firstMediaRef(a.content);
        return (ref ? await mediaFile(ref, base, "png") : null) ?? textFile(a, base);
      }

      case "chat":
      default:
        return textFile(a, base);
    }
  } catch (err) {
    logger.warn({ artifactId: a.id, kind: a.kind, err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] export fell back to text");
    return textFile(a, base);
  }
}

/* ---------------- ZIP (store only) ---------------- */

function dosDateTime(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

/** Build a ZIP archive in memory, entries stored uncompressed, names in UTF-8. */
export function zipStore(entries: { name: string; bytes: Buffer; mtime?: Date }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name.replace(/\\/g, "/").replace(/^\/+/, ""), "utf8");
    const crc = crc32(e.bytes) >>> 0;
    const { time, date } = dosDateTime(e.mtime ?? new Date());
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(0, 8); // store
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(e.bytes.length, 18);
    local.writeUInt32LE(e.bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // made by
    central.writeUInt16LE(20, 6); // needed
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(e.bytes.length, 20);
    central.writeUInt32LE(e.bytes.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    locals.push(local, e.bytes);
    centrals.push(central);
    offset += local.length + e.bytes.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, ...centrals, eocd]);
}

/** Every piece as a file, inside folders, plus an index. Duplicate names get a number. */
export async function exportBundle(artifacts: ArtifactRow[], folderOf: (a: ArtifactRow) => string = () => ""): Promise<Buffer> {
  const seen = new Map<string, number>();
  const entries: { name: string; bytes: Buffer; mtime?: Date }[] = [];
  const index: string[] = [];
  for (const a of artifacts) {
    const f = await exportArtifact(a);
    const folder = folderOf(a).replace(/[^a-z0-9 _-]/gi, "").trim();
    let name = `${folder ? `${folder}/` : ""}${f.name}`;
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    if (n > 1) name = name.replace(/(\.[a-z0-9]+)$/i, ` (${n})$1`);
    entries.push({ name, bytes: f.bytes, mtime: new Date(a.created_at) });
    index.push(`${name}\t${a.kind}\tv${a.version}\t${a.created_at}`);
  }
  entries.unshift({ name: "index.txt", bytes: Buffer.from(["file\tkind\tversion\tmade", ...index].join("\n") + "\n", "utf8") });
  return zipStore(entries);
}
