/**
 * Kids AI Studio — hero fidelity.
 *
 * A child who made a hero expects to see THAT hero in their movie. Video
 * models re-imagine a character from words every time they are asked, so a
 * three-shot film could star three slightly different heroes: a new hat, a
 * different colour, a missing tail. That is a hallucination in the plainest
 * sense, and children notice it at once.
 *
 * Two things guard against it:
 *   1. Every shot starts from a still that was drawn FROM the hero's portrait
 *      (movie.ts), so the video model animates a picture rather than guessing.
 *   2. This check: after filming, one frame from the middle of each shot is put
 *      side by side with the reference picture and a vision model is asked a
 *      narrow question: is this the same character, and what is different?
 *      Shots below the bar get one retake (movie.ts). Every score is stored on
 *      the movie and logged, so facilitators and staff can see how faithful the
 *      model actually is over time.
 *
 * The check is advisory and fails open: if the vision call errors, the shot is
 * marked "unchecked", never blocked. Safety screening is separate and fails closed.
 */
import sharp from "sharp";
import { completeText } from "./ai";
import { logger } from "../lib/logger";

export type ShotFidelity = {
  shot: number;
  /** 0-10; null when the check could not run. */
  score: number | null;
  same: boolean | null;
  differences: string;
  /** Which take this score belongs to (2 = after a retake). */
  take: number;
};

export type FidelityReport = {
  checked: boolean;
  /** What the shots were compared against. */
  reference: "hero portrait" | "first shot" | "none";
  threshold: number;
  shots: ShotFidelity[];
  /** Mean of the scored shots, one decimal; null when nothing was scored. */
  average: number | null;
  retakes: number;
};

const SYSTEM = `You check character consistency in children's animation.
You get ONE image split in two halves. LEFT: the reference picture of the main character. RIGHT: a frame from a video shot.
Decide whether the main character on the RIGHT is the same character as on the LEFT: same species or kind of creature, body shape, colours, clothing or markings, and signature details.
Ignore pose, camera angle, lighting, background and art-style smoothing. Do not judge quality.
If the main character is missing from the right half, that is a mismatch.
Reply with JSON only: {"same": true|false, "score": 0-10, "differences": "short phrase, or empty"}
score 10 = clearly identical character; 6 = same character with small drift; 3 = different character that shares a few traits; 0 = character missing or unrelated.`;

/** Puts the reference and the frame side by side on one canvas (one image per vision call). */
async function sideBySide(referencePng: Buffer, frameJpg: Buffer): Promise<string> {
  const H = 512;
  const left = await sharp(referencePng).resize({ height: H, width: H, fit: "contain", background: "#ffffff" }).png().toBuffer();
  const right = await sharp(frameJpg).resize({ height: H, width: Math.round((H * 16) / 9), fit: "contain", background: "#ffffff" }).png().toBuffer();
  const rightMeta = await sharp(right).metadata();
  const W = H + 16 + (rightMeta.width ?? H);
  const canvas = await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } })
    .composite([
      { input: left, left: 0, top: 0 },
      { input: right, left: H + 16, top: 0 },
    ])
    .jpeg({ quality: 82 })
    .toBuffer();
  return `data:image/jpeg;base64,${canvas.toString("base64")}`;
}

function parse(text: string): { same: boolean; score: number; differences: string } | null {
  const m = /\{[\s\S]*\}/.exec(text);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    const score = Math.max(0, Math.min(10, Math.round(Number(j.score))));
    if (!Number.isFinite(score)) return null;
    return { same: Boolean(j.same), score, differences: String(j.differences ?? "").slice(0, 160) };
  } catch {
    return null;
  }
}

/** Scores one frame against the reference. Never throws. */
export async function scoreFrame(opts: {
  referencePng: Buffer;
  frameJpg: Buffer;
  look?: string | null;
  shot: number;
  take: number;
  requestId: number;
}): Promise<ShotFidelity> {
  try {
    const photo = await sideBySide(opts.referencePng, opts.frameJpg);
    const hint = opts.look ? `\nThe character is described as: ${opts.look.slice(0, 400)}` : "";
    const reply = await completeText({
      system: SYSTEM,
      user: `Compare the main character in the two halves.${hint}`,
      photoDataUri: photo,
      maxTokens: 200,
      temperature: 0,
      mockKind: "fidelity",
    });
    const r = parse(reply);
    if (!r) return { shot: opts.shot, score: null, same: null, differences: "check gave no answer", take: opts.take };
    return { shot: opts.shot, take: opts.take, ...r };
  } catch (err) {
    logger.warn({ requestId: opts.requestId, shot: opts.shot, err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] fidelity check failed");
    return { shot: opts.shot, score: null, same: null, differences: "check could not run", take: opts.take };
  }
}

export function summarise(report: Omit<FidelityReport, "average">): FidelityReport {
  const scored = report.shots.map((s) => s.score).filter((s): s is number => s !== null);
  const average = scored.length ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10 : null;
  return { ...report, average };
}

/** The frame from the middle of a shot: the most representative single look. */
export function middleFrame(frames: Buffer[]): Buffer | null {
  return frames.length ? frames[Math.floor(frames.length / 2)] : null;
}
