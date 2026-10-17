/**
 * Kids AI Studio — Video Maker's finished product.
 *
 * The storyboard was always the lesson: three shots, each one sentence a
 * child can picture. A movie is:
 *
 *   storyboard → one shot per panel → every frame screened
 *     → painted title card → narration of the storyboard → one cut MP4
 *
 * Quality, matched to the storybooks. The picture books look like real
 * books because every picture is asked for in the same picture-book words,
 * with one detailed description of the hero, in one art style. Shots are now
 * asked for the same way: the same quality phrasing, the hero's full look in
 * every shot, and the hero's own art style when the movie was made from a
 * hero. The title card is no longer a flat gradient: it is a painted key-art
 * picture of the hero in the world (drawn from the hero's portrait when there
 * is one, and screened like every other picture), with the title on top.
 *
 * Shots are generated in parallel because each takes a minute or more and a
 * child is watching a progress bar. Every shot is pulled apart into frames
 * and each frame goes through Content Safety before any of it is stitched,
 * so a single bad frame stops the whole movie, not just the shot. The cut is
 * ffmpeg (see ffmpeg.ts); without it, the shots are delivered one by one and
 * the note says so.
 *
 * As with every picture in the Studio, the finished movie waits for a
 * facilitator before a child sees it.
 */
import sharp from "sharp";
import { aikConfig, isContentSafetyConfigured, isImageConfigured, isTtsConfigured, isVideoConfigured } from "./config";
import { generateVideo, speak, ContentFilteredError, usableVoice, type VoiceChoice } from "./ai";
import { Steps, type ForgeStep } from "./forge";
import { putMedia, type MediaRef } from "./media";
import { contentSafetyImage, type Flag } from "./safety";
import { drawScreened } from "./book";
import { ffmpegAvailable, withWorkDir, extractFrames, cutMovie, ensureAudioTrack } from "./ffmpeg";
import { logger } from "../lib/logger";

export type Shot = { shot: number; description: string; seconds: number; videoPrompt: string; clip?: MediaRef };

export type Movie = {
  format: "movie";
  title: string;
  style: string;
  shots: Shot[];
  /** The whole film, when ffmpeg could cut it. */
  movie?: MediaRef;
  narration?: MediaRef;
  /** The painted title-card picture (also the movie's poster). */
  poster?: MediaRef;
  madeWith: { shots: boolean; narration: boolean; cut: boolean };
};

const NO_TEXT = "No text, no words, no letters, no real people, no logos, no scary moments. Bright, kid-friendly.";

/** The same quality words the storybook pages are drawn with, for moving pictures. */
const FILM_QUALITY =
  "an animated children's picture book come to life: rich painterly detail, clean confident outlines, soft warm cinematic lighting, expressive friendly faces, consistent character design, beautiful composition";

export function shotPrompt(style: string, shot: { videoPrompt: string }, heroLook?: string | null): string {
  // A hero from the Remix workflow is described in every shot, so all three shots film the same character.
  const hero = heroLook ? ` The main character, exactly the same in every shot: ${heroLook}.` : "";
  return `${shot.videoPrompt}${hero} ${style} style, ${FILM_QUALITY}. Smooth gentle camera motion, one continuous shot. ${NO_TEXT}`;
}

function posterPrompt(style: string, title: string, firstShot: string, heroLook?: string | null): string {
  const hero = heroLook ? ` The main character: ${heroLook}. Exactly the same character as the reference picture.` : "";
  return `${style} children's picture-book illustration, the key art for a short animated film called "${title}".${hero} Scene: ${firstShot}. Wide composition with calm open space across the middle for a title, ${FILM_QUALITY}. No words, no letters, no signs, no real people, no logos. Kid-friendly, bright.`;
}

export type BuildMovieResult =
  | { ok: true; movie: Movie; steps: ForgeStep[]; flags: Flag[]; kidNote: string }
  | { ok: false; blocked: boolean; message: string; flags: Flag[]; steps: ForgeStep[] };

export async function buildMovie(opts: {
  requestId: number;
  title: string;
  style: string;
  shots: { description: string; seconds: number; videoPrompt: string }[];
  onProgress?: (steps: ForgeStep[]) => void;
  /** Remix workflow: keep a hero looking the same in every shot. */
  heroLook?: string | null;
  /** Remix workflow: the hero's own art style, so the movie matches their book. */
  heroStyle?: string | null;
  /** Remix workflow: the hero's portrait, the reference for the painted title card. */
  heroPortraitPng?: string | null;
  /** Remix workflow: the hero's voice narrates. */
  voice?: VoiceChoice | null;
}): Promise<BuildMovieResult> {
  const steps = new Steps(opts.onProgress);
  const flags: Flag[] = [];
  const { requestId } = opts;
  const style = (opts.heroStyle && opts.heroStyle.trim()) || opts.style || "cheerful cartoon";
  const movie: Movie = {
    format: "movie",
    title: opts.title,
    style,
    shots: opts.shots.slice(0, aikConfig.videoShots).map((s, i) => ({ shot: i + 1, description: s.description, seconds: aikConfig.videoShotSeconds, videoPrompt: s.videoPrompt })),
    madeWith: { shots: isVideoConfigured(), narration: isTtsConfigured(), cut: false },
  };
  if (!isVideoConfigured()) {
    return { ok: true, movie, steps: steps.all(), flags, kidNote: "Here's your storyboard! Video clips aren't switched on for this class yet." };
  }
  if (!isContentSafetyConfigured() && aikConfig.contentSafety.required) {
    return { ok: false, blocked: true, message: "Movies are switched off until screening is set up. Ask your facilitator.", flags: [{ layer: "system", category: "content_safety_not_configured" }], steps: steps.all() };
  }
  const canCut = await ffmpegAvailable();

  return withWorkDir(async (dir) => {
    /* 1. Shots, in parallel; the poster is painted while they film ---- */
    const posterJob: Promise<string | null> = isImageConfigured()
      ? // Its own flag list: a refused poster just means the plain title card, never a blocked movie.
        drawScreened(posterPrompt(style, movie.title, movie.shots[0]?.description ?? movie.title, opts.heroLook), opts.heroPortraitPng ?? undefined, [])
          .then((d) => (d.blocked ? null : d.png))
          .catch(() => null)
      : Promise.resolve(null);

    steps.begin("shots", `Filming ${movie.shots.length} shot${movie.shots.length === 1 ? "" : "s"}`);
    let clips: (Buffer | null)[];
    try {
      clips = await Promise.all(
        movie.shots.map(async (s) => {
          // A shot that times out or hits a transient provider error gets one more take;
          // a shot the provider refuses on content grounds does not.
          for (let take = 1; take <= 2; take++) {
            try {
              const m = await generateVideo(shotPrompt(movie.style, s, opts.heroLook), { seconds: s.seconds, size: aikConfig.videoSize });
              return Buffer.from(m.base64, "base64");
            } catch (err) {
              if (err instanceof ContentFilteredError) throw err;
              logger.warn({ requestId, shot: s.shot, take, err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] shot failed");
            }
          }
          return null;
        }),
      );
    } catch (err) {
      if (!(err instanceof ContentFilteredError)) throw err;
      flags.push({ layer: "content_safety", category: "provider_filter" });
      steps.end("shots", "failed", "a shot was refused");
      return { ok: false, blocked: true, message: "One of the shots wasn't right for the club. Try a different idea!", flags, steps: steps.all() };
    }
    const got = clips.filter(Boolean).length;
    steps.end("shots", got === movie.shots.length ? "done" : "failed", `${got} of ${movie.shots.length}`);
    if (!got) {
      return { ok: true, movie, steps: steps.all(), flags, kidNote: "Here's your storyboard! The clips didn't come out this time; try once more later." };
    }

    /* 2. Screen every frame ----------------------------------------- */
    if (isContentSafetyConfigured()) {
      steps.begin("screen", "Checking every frame");
      let frames = 0;
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        if (!clip) continue;
        let jpgs: Buffer[] = [];
        if (canCut) {
          const { writeFile } = await import("node:fs/promises");
          const path = await import("node:path");
          const f = path.join(dir, `raw-${i + 1}.mp4`);
          await writeFile(f, clip);
          jpgs = await extractFrames(dir, f, 1).catch(() => []);
        }
        if (!jpgs.length) {
          // Cannot pull frames apart: fail closed on this shot rather than ship unseen.
          logger.warn({ requestId, shot: i + 1 }, "[aik] could not extract frames; dropping the shot");
          clips[i] = null;
          continue;
        }
        for (const jpg of jpgs) {
          frames++;
          const hits = await contentSafetyImage(jpg.toString("base64"));
          if (hits.length) {
            flags.push(...hits);
            steps.end("screen", "failed", `shot ${i + 1}`);
            return { ok: false, blocked: true, message: "One of the shots wasn't right for the club. Try a different idea!", flags, steps: steps.all() };
          }
        }
      }
      steps.end("screen", "done", `${frames} frames`);
    }

    /* 3. Store the shots ---------------------------------------------- */
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      if (clip) movie.shots[i].clip = await putMedia(requestId, `shot${i + 1}.mp4`, clip, "video/mp4");
    }

    /* 3b. The poster --------------------------------------------------- */
    let posterPng: string | null = null;
    if (isImageConfigured()) {
      steps.begin("poster", "Painting the title card");
      posterPng = await posterJob;
      if (posterPng) {
        movie.poster = await putMedia(requestId, "poster.png", Buffer.from(posterPng, "base64"), "image/png");
        steps.end("poster", "done");
      } else {
        steps.end("poster", "skipped", "using the plain title card");
      }
    }

    /* 4. Narration ---------------------------------------------------- */
    let narration: Buffer | null = null;
    if (isTtsConfigured() || usableVoice(opts.voice)) {
      steps.begin("narration", opts.voice?.name ? `Recording the narration (${opts.voice.name})` : "Recording the narration");
      try {
        const text = [movie.title, ...movie.shots.filter((s) => s.clip).map((s) => s.description)].join(". ");
        const a = await speak(text, opts.voice);
        narration = Buffer.from(a.base64, "base64");
        movie.narration = await putMedia(requestId, "narration.mp3", narration, a.mime);
        steps.end("narration", "done");
      } catch (err) {
        logger.warn({ requestId, err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] narration failed");
        steps.end("narration", "failed", "the movie will play without a voice");
      }
    }

    /* 5. The cut ------------------------------------------------------ */
    if (canCut) {
      steps.begin("cut", "Cutting the movie together");
      try {
        const [w, h] = aikConfig.videoSize.split("x").map(Number);
        const titleCard = await renderTitleCard(movie.title, w, h, posterPng);
        const normalised: Buffer[] = [];
        for (let i = 0; i < clips.length; i++) {
          const c = clips[i];
          if (c) normalised.push(await ensureAudioTrack(dir, c, `shot-${i + 1}`));
        }
        const bytes = await cutMovie(dir, { titleCard, titleSeconds: 3, shots: normalised, narration: narration ?? undefined, size: aikConfig.videoSize });
        movie.movie = await putMedia(requestId, "movie.mp4", bytes, "video/mp4");
        movie.madeWith.cut = true;
        steps.end("cut", "done", `${(bytes.length / 1_048_576).toFixed(1)} MB`);
      } catch (err) {
        logger.error({ requestId, err: String((err as Error)?.message ?? err).slice(0, 400) }, "[aik] cut failed; delivering the shots");
        steps.end("cut", "failed", "the shots are ready to watch one by one");
      }
    } else {
      steps.begin("cut", "Cutting the movie together");
      steps.end("cut", "skipped", "no cutting room on this server; the shots play one by one");
    }

    const kidNote = movie.movie
      ? `Your movie is ready! Your facilitator will watch it first, then it's showtime.`
      : `Your shots are ready! Your facilitator will watch them first.`;
    return { ok: true, movie, steps: steps.all(), flags, kidNote };
  });
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c] as string);
}

/**
 * The title card. With a painted poster: the poster fills the frame, a soft
 * dark band runs across the lower third, and the title sits on it. Without
 * one: the old bright gradient, so a movie never waits on a picture.
 */
async function renderTitleCard(title: string, w: number, h: number, posterPng?: string | null): Promise<Buffer> {
  const safe = escapeXml(title);
  const size = Math.max(40, Math.min(96, Math.round((w * 1.6) / Math.max(10, title.length))));
  if (posterPng) {
    try {
      const base = await sharp(Buffer.from(posterPng, "base64")).resize(w, h, { fit: "cover" }).png().toBuffer();
      const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#fade)"/>
  <text x="50%" y="${h * 0.78}" text-anchor="middle" dominant-baseline="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="${size}" fill="#ffffff" stroke="#000000" stroke-opacity="0.35" stroke-width="2">${safe}</text>
  <text x="50%" y="${h * 0.9}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(size * 0.38)}" fill="#ffffff" opacity="0.9">A Kids AI Studio movie</text>
</svg>`;
      return await sharp(base).composite([{ input: Buffer.from(overlay), top: 0, left: 0 }]).png().toBuffer();
    } catch (err) {
      logger.warn({ err: String((err as Error)?.message ?? err).slice(0, 200) }, "[aik] painted title card failed; using the plain one");
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b3df5"/><stop offset="1" stop-color="#ff7a59"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${w * 0.15}" cy="${h * 0.2}" r="${h * 0.12}" fill="#ffd166" opacity="0.9"/>
  <circle cx="${w * 0.85}" cy="${h * 0.8}" r="${h * 0.16}" fill="#ffffff" opacity="0.15"/>
  <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${size}" fill="#ffffff">${safe}</text>
  <text x="50%" y="${h * 0.86}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(size * 0.4)}" fill="#ffffff" opacity="0.85">A Kids AI Studio movie</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
