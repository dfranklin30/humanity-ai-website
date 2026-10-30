/**
 * Kids AI Studio — the cutting room.
 *
 * A finished movie is not one Sora clip. It is a title card, three shots in
 * the order the child planned them, and a narration track reading their
 * storyboard — stitched into one file they can play, download and show to
 * the class. That assembly is ffmpeg's job; this file is the thin, careful
 * wrapper around it.
 *
 * Everything runs in a private temp directory that is removed afterwards,
 * whether the cut succeeded or not. ffmpeg is optional at runtime: when it is
 * missing the pipeline degrades to "here are your shots" rather than failing,
 * and `ffmpegAvailable()` tells the config endpoint so nobody is surprised.
 */
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { aikConfig } from "./config";
import { logger } from "../lib/logger";

let available: Promise<boolean> | null = null;

export function ffmpegAvailable(): Promise<boolean> {
  if (!available) {
    available = run(["-version"], 10_000)
      .then(() => true)
      .catch(() => false);
  }
  return available;
}

function run(args: string[], timeoutMs: number, cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(aikConfig.ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], { cwd, stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString().slice(0, 2000)));
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("ffmpeg timed out"));
    }, timeoutMs);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.trim().slice(-600)}`));
    });
  });
}

export async function withWorkDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), "aik-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * One frame per second from a clip, as JPEGs, so each can be screened. A
 * four-second shot yields four frames; nothing a child will see goes
 * unchecked just because it moves.
 */
export async function extractFrames(dir: string, clipFile: string, fps = 1): Promise<Buffer[]> {
  const stem = path.basename(clipFile, path.extname(clipFile));
  const pattern = path.join(dir, `${stem}-frame-%03d.jpg`);
  await run(["-i", clipFile, "-vf", `fps=${fps},scale=512:-2`, "-q:v", "4", pattern], 60_000, dir);
  // Only this clip's frames: the work dir holds every shot's frames, and the
  // hero-fidelity check needs the middle frame of THIS shot, not of all of them.
  const files = (await readdir(dir)).filter((f) => f.startsWith(`${stem}-frame-`) && f.endsWith(".jpg")).sort();
  return Promise.all(files.map((f) => readFile(path.join(dir, f))));
}

export type CutOptions = {
  /** PNG for the opening title card. */
  titleCard: Buffer;
  titleSeconds: number;
  /** MP4 shots in order. */
  shots: Buffer[];
  /** Optional narration (mp3/wav) laid under the whole movie. */
  narration?: Buffer;
  /** Output size, e.g. 1280x720. */
  size: string;
};

/**
 * Title card + shots + narration → one H.264 MP4 with AAC audio that plays in
 * every browser and projector the club will meet.
 */
export async function cutMovie(dir: string, opts: CutOptions): Promise<Buffer> {
  const [w, h] = opts.size.split("x").map(Number);
  const title = path.join(dir, "title.png");
  await writeFile(title, opts.titleCard);
  const shotFiles: string[] = [];
  for (let i = 0; i < opts.shots.length; i++) {
    const f = path.join(dir, `shot-${i + 1}.mp4`);
    await writeFile(f, opts.shots[i]);
    shotFiles.push(f);
  }
  const narration = opts.narration ? path.join(dir, "narration.mp3") : null;
  if (narration) await writeFile(narration, opts.narration!);

  // Inputs: 0 = title card (looped still), 1..n = shots, last = narration.
  const args: string[] = ["-loop", "1", "-t", String(opts.titleSeconds), "-framerate", "24", "-i", title];
  for (const f of shotFiles) args.push("-i", f);
  if (narration) args.push("-i", narration);

  // Every video input is normalised to the same size, rate and pixel format
  // before concat, and each gets a silent audio bed so concat never sees a
  // stream count mismatch. Shot audio is kept low so the narration leads.
  const filters: string[] = [];
  const videoLabels: string[] = [];
  const total = 1 + shotFiles.length;
  for (let i = 0; i < total; i++) {
    filters.push(`[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,format=yuv420p[v${i}]`);
    if (i === 0) filters.push(`anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${opts.titleSeconds}[a0]`);
    else filters.push(`[${i}:a]aresample=48000,volume=0.35[a${i}]`);
    videoLabels.push(`[v${i}][a${i}]`);
  }
  filters.push(`${videoLabels.join("")}concat=n=${total}:v=1:a=1[vcat][acat]`);
  let audioOut = "[acat]";
  if (narration) {
    filters.push(`[${total}:a]aresample=48000,adelay=${Math.round(opts.titleSeconds * 1000 * 0.6)}|${Math.round(opts.titleSeconds * 1000 * 0.6)}[nar]`);
    filters.push(`[acat][nar]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[amix]`);
    audioOut = "[amix]";
  }
  const out = path.join(dir, "movie.mp4");
  args.push(
    "-filter_complex", filters.join(";"),
    "-map", "[vcat]", "-map", audioOut,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-profile:v", "main", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", out,
  );
  const started = Date.now();
  await run(args, 240_000, dir);
  const bytes = await readFile(out);
  logger.info({ ms: Date.now() - started, shots: shotFiles.length, bytes: bytes.length }, "[aik] movie cut");
  return bytes;
}

/**
 * Make sure a shot has an audio stream, because concat insists every input
 * has the same streams. Sora clips usually carry sound; a silent one gets a
 * silent track rather than breaking the cut.
 */
export async function ensureAudioTrack(dir: string, clip: Buffer, name: string): Promise<Buffer> {
  const input = path.join(dir, `${name}-in.mp4`);
  const output = path.join(dir, `${name}-norm.mp4`);
  await writeFile(input, clip);
  try {
    // Has audio: keep it as-is.
    await run(["-i", input, "-c", "copy", "-map", "0:v:0", "-map", "0:a:0", output], 60_000, dir);
  } catch {
    await run(
      ["-i", input, "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000", "-c:v", "copy", "-c:a", "aac", "-map", "0:v:0", "-map", "1:a:0", "-shortest", output],
      60_000,
      dir,
    );
  }
  return readFile(output);
}
