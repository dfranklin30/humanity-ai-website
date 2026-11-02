/**
 * Picture-motion clips: a still becomes a short, gently moving MP4 that the
 * cut stage can use like any filmed shot. Skipped where ffmpeg is absent.
 * Run with:  pnpm --filter @workspace/api-server test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { animateStill, extractFrames, ffmpegAvailable, withWorkDir } from "./ffmpeg";

test("a keyframe becomes a playable clip of the asked length", { skip: !(await ffmpegAvailable()) && "ffmpeg not installed" }, async () => {
  const { default: sharp } = await import("sharp");
  const png = await sharp({ create: { width: 640, height: 360, channels: 3, background: { r: 60, g: 120, b: 200 } } }).png().toBuffer();
  await withWorkDir(async (dir) => {
    const clip = await animateStill(dir, png, 4, "640x360", "test");
    assert.equal(clip.subarray(4, 8).toString("ascii"), "ftyp", "looks like an MP4");
    const file = path.join(dir, "check.mp4");
    await writeFile(file, clip);
    const frames = await extractFrames(dir, file, 1);
    assert.ok(frames.length >= 3 && frames.length <= 5, `expected about 4 frames at 1 fps, got ${frames.length}`);
  });
});
