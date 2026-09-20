/**
 * Kids AI Studio — model providers, one adapter per capability.
 *
 *   text   : Anthropic (Claude) · Azure OpenAI · any OpenAI-compatible endpoint (open-source models)
 *   image  : Azure OpenAI image model · fal.ai (FLUX and other open-source models)
 *   video  : fal.ai (open-source text-to-video, short clips)
 *   music  : ElevenLabs Music · fal.ai (Stable Audio)
 *   tts    : ElevenLabs
 *
 * Every call goes through here so that model, temperature and token limits are
 * fixed per module and can never be influenced by request input. Media
 * providers return bytes; the pipeline screens them and holds them for
 * facilitator approval before a child sees anything.
 */
import { AzureOpenAI } from "openai";
import { aikConfig, isImageConfigured, isMusicConfigured, isTextConfigured, isTtsConfigured, isVideoConfigured, textProviderConfigured, type TextProviderId } from "./config";
import { logger } from "../lib/logger";

export class ContentFilteredError extends Error {
  constructor(provider: string) {
    super(`Blocked by ${provider} content filter`);
    this.name = "ContentFilteredError";
  }
}

/* ------------------------------------------------------------------ *
 * Text
 * ------------------------------------------------------------------ */

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type TextCallOptions = {
  system: string;
  /** Either a single user prompt or a short conversation. */
  user?: string;
  turns?: ChatTurn[];
  maxTokens: number;
  temperature: number;
  /** "default" = the main text provider; "oss" = the open-source provider; "fast" = cheapest Claude model. */
  tier?: "default" | "oss" | "fast";
  /** Used by the mock to return a plausible canned result. */
  mockKind?: string;
  /**
   * A photo the person is asking about, as a data URI.
   *
   * It rides along with the newest user turn and is never stored: the picture
   * of a child's worksheet -- which may also contain their name, their
   * handwriting, their kitchen table -- exists for the length of one request
   * and then only the words survive.
   */
  photoDataUri?: string;
};

function messagesOf(opts: TextCallOptions): ChatTurn[] {
  if (opts.turns && opts.turns.length) return opts.turns;
  return [{ role: "user", content: opts.user ?? "" }];
}

export async function completeText(opts: TextCallOptions): Promise<string> {
  if (aikConfig.mockAI) return mockText(opts);
  const provider: TextProviderId = opts.tier === "oss" ? aikConfig.providers.ossText : aikConfig.providers.text;
  if (!textProviderConfigured(provider)) throw new Error(`Text provider "${provider}" not configured`);
  if (provider === "anthropic") return completeAnthropic(opts);
  if (provider === "oss") return completeOpenAICompatible(opts, aikConfig.oss.baseUrl, aikConfig.oss.apiKey, aikConfig.oss.model, "oss");
  return completeAzureOpenAI(opts);
}

async function completeAnthropic(opts: TextCallOptions): Promise<string> {
  const started = Date.now();
  const model = opts.tier === "fast" ? aikConfig.anthropic.fastModel : aikConfig.anthropic.model;
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": aikConfig.anthropic.apiKey, "anthropic-version": aikConfig.anthropic.apiVersion },
    body: JSON.stringify({ model, max_tokens: opts.maxTokens, temperature: opts.temperature, system: opts.system, messages: messagesOf(opts) }),
  }, 90_000);
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  const data: any = await res.json();
  const text = (data.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
  logger.info({ ms: Date.now() - started, usage: data.usage, stop: data.stop_reason, model: data.model }, "[aik] text (anthropic)");
  if (data.stop_reason === "refusal") throw new ContentFilteredError("Claude");
  return text;
}

/** Works for Azure AI Foundry MaaS, Groq, Together, Fireworks, OpenRouter, vLLM, Ollama… */
async function completeOpenAICompatible(opts: TextCallOptions, baseUrl: string, apiKey: string, model: string, label: string): Promise<string> {
  const started = Date.now();
  const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}`, "api-key": apiKey },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: opts.system }, ...messagesOf(opts)],
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    }),
  }, 90_000);
  if (!res.ok) throw new Error(`${label} ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  const data: any = await res.json();
  const choice = data.choices?.[0];
  logger.info({ ms: Date.now() - started, usage: data.usage, finish: choice?.finish_reason, model: data.model }, `[aik] text (${label})`);
  if (choice?.finish_reason === "content_filter") throw new ContentFilteredError(label);
  return choice?.message?.content ?? "";
}

let azureClient: AzureOpenAI | null = null;
function azure(): AzureOpenAI {
  if (!azureClient) {
    const a = aikConfig.azureOpenAI;
    azureClient = new AzureOpenAI({ endpoint: a.endpoint, apiKey: a.apiKey, apiVersion: a.apiVersion });
  }
  return azureClient;
}

async function completeAzureOpenAI(opts: TextCallOptions): Promise<string> {
  const started = Date.now();
  const turns = messagesOf(opts);
  // The photo attaches to the newest user turn, which is the one it belongs to.
  const withPhoto: any[] = opts.photoDataUri
    ? turns.map((t, i) =>
        i === turns.length - 1 && t.role === "user"
          ? { role: "user", content: [{ type: "text", text: t.content }, { type: "image_url", image_url: { url: opts.photoDataUri, detail: "high" } }] }
          : t,
      )
    : turns;
  const res = await azure().chat.completions.create({
    model: aikConfig.azureOpenAI.textDeployment,
    messages: [{ role: "system", content: opts.system }, ...withPhoto] as any,
    max_completion_tokens: opts.maxTokens,
    temperature: opts.temperature,
  });
  const choice = res.choices?.[0];
  logger.info({ ms: Date.now() - started, usage: res.usage, finish: choice?.finish_reason }, "[aik] text (azure)");
  if (choice?.finish_reason === "content_filter") throw new ContentFilteredError("Azure OpenAI");
  return choice?.message?.content ?? "";
}

/* ------------------------------------------------------------------ *
 * Media
 * ------------------------------------------------------------------ */

export type MediaResult = { base64: string; mime: string; provider: string; model: string };

export async function generateImage(prompt: string): Promise<MediaResult> {
  if (aikConfig.mockAI) return { base64: MOCK_PNG, mime: "image/png", provider: "mock", model: "mock" };
  if (!isImageConfigured()) throw new Error("Image provider not configured");
  if (aikConfig.providers.image === "fal") {
    const data = await falRun(aikConfig.fal.imageModel, { prompt, image_size: "square_hd", num_images: 1, enable_safety_checker: true });
    const url = data?.images?.[0]?.url;
    if (!url) throw new Error("fal: no image returned");
    return { ...(await download(url)), provider: "fal", model: aikConfig.fal.imageModel };
  }
  if (aikConfig.providers.image === "oss") return generateImageOpenAICompatible(prompt);
  const res = await azure().images.generate({ model: aikConfig.azureOpenAI.imageDeployment, prompt, n: 1, size: "1024x1024" });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("Azure: no image returned");
  return { base64: b64, mime: "image/png", provider: "azure", model: aikConfig.azureOpenAI.imageDeployment };
}

/**
 * Open-source image models served over the OpenAI-compatible images API.
 * Covers Azure AI Foundry (FLUX.1 and friends) and any self-hosted equivalent.
 * Accepts either a base64 payload or a URL in the response, since hosts differ.
 */
async function generateImageOpenAICompatible(prompt: string): Promise<MediaResult> {
  const { imageBaseUrl, imageApiKey, imageModel } = aikConfig.oss;
  const res = await fetchWithTimeout(
    `${imageBaseUrl}/images/generations`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${imageApiKey}`,
        "api-key": imageApiKey,
      },
      body: JSON.stringify({ model: imageModel, prompt, n: 1, size: "1024x1024" }),
    },
    aikConfig.mediaTimeoutMs,
  );
  if (!res.ok) throw new Error(`OSS image ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data: any = await res.json();
  const item = data?.data?.[0];
  const b64 = item?.b64_json;
  if (b64) return { base64: b64, mime: "image/png", provider: "oss", model: imageModel };
  if (item?.url) return { ...(await download(item.url)), provider: "oss", model: imageModel };
  throw new Error("OSS image: no image returned");
}

export async function generateVideo(prompt: string): Promise<MediaResult> {
  if (aikConfig.mockAI) return { base64: MOCK_MP4, mime: "video/mp4", provider: "mock", model: "mock" };
  if (!isVideoConfigured()) throw new Error("Video provider not configured");
  if (aikConfig.providers.video === "oss") return generateVideoJobApi(prompt);
  const data = await falRun(aikConfig.fal.videoModel, { prompt, negative_prompt: "scary, violent, blood, weapons, text, watermark, realistic people", aspect_ratio: "16:9" });
  const url = data?.video?.url ?? data?.videos?.[0]?.url;
  if (!url) throw new Error("fal: no video returned");
  return { ...(await download(url)), provider: "fal", model: aikConfig.fal.videoModel };
}

/**
 * Video over a job API (Azure AI Foundry / Sora, and anything with the same shape).
 *
 * Unlike images, which come back from one call, video is a job: you submit,
 * you poll, and only then is there a file. That is the whole reason Video Maker
 * could not simply reuse the image path.
 *
 * The polling is bounded in both directions -- a wall-clock budget and a cap on
 * attempts -- because a child is watching a progress bar, and a job that never
 * finishes must become an honest "it didn't come out this time" rather than a
 * request that hangs until the container is reclaimed.
 */
async function generateVideoJobApi(prompt: string): Promise<MediaResult> {
  const { videoBaseUrl, videoApiKey, videoModel } = aikConfig.oss;
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${videoApiKey}`,
    "api-key": videoApiKey,
  };

  const start = await fetchWithTimeout(
    `${videoBaseUrl}/videos`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: videoModel,
        prompt,
        seconds: "4",
        size: "720x1280",
      }),
    },
    60_000,
  );
  if (!start.ok) throw new Error(`Video submit ${start.status}: ${(await start.text().catch(() => "")).slice(0, 300)}`);
  const job: any = await start.json();
  const jobId = job?.id;
  if (!jobId) throw new Error("Video job: no id returned");

  const deadline = Date.now() + aikConfig.mediaTimeoutMs;
  let attempts = 0;
  let status = String(job?.status ?? "queued");
  while (Date.now() < deadline && attempts < 120) {
    if (status === "completed" || status === "succeeded") break;
    if (status === "failed" || status === "cancelled") {
      const reason = String(job?.error?.message ?? status);
      // A provider refusing on content grounds is a screening result, not an outage.
      if (/content|policy|safety|moderat/i.test(reason)) throw new ContentFilteredError(reason);
      throw new Error(`Video job ${status}: ${reason.slice(0, 200)}`);
    }
    attempts++;
    await new Promise((r) => setTimeout(r, 4000));
    const poll = await fetchWithTimeout(`${videoBaseUrl}/videos/${jobId}`, { headers }, 30_000);
    if (!poll.ok) throw new Error(`Video poll ${poll.status}`);
    const cur: any = await poll.json();
    status = String(cur?.status ?? status);
    if (cur?.error) Object.assign(job, { error: cur.error });
  }
  if (status !== "completed" && status !== "succeeded") throw new Error(`Video job did not finish (last status: ${status})`);

  const file = await fetchWithTimeout(`${videoBaseUrl}/videos/${jobId}/content`, { headers }, 120_000);
  if (!file.ok) throw new Error(`Video download ${file.status}`);
  return {
    base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
    mime: file.headers.get("content-type") || "video/mp4",
    provider: "oss",
    model: videoModel,
  };
}

export async function generateMusic(prompt: string, seconds = 30): Promise<MediaResult> {
  if (aikConfig.mockAI) return { base64: MOCK_MP3, mime: "audio/mpeg", provider: "mock", model: "mock" };
  if (!isMusicConfigured()) throw new Error("Music provider not configured");
  if (aikConfig.providers.music === "fal") {
    const data = await falRun(aikConfig.fal.musicModel, { prompt, seconds_total: seconds });
    const url = data?.audio_file?.url ?? data?.audio?.url;
    if (!url) throw new Error("fal: no audio returned");
    return { ...(await download(url)), provider: "fal", model: aikConfig.fal.musicModel };
  }
  const res = await fetchWithTimeout("https://api.elevenlabs.io/v1/music", {
    method: "POST",
    headers: { "content-type": "application/json", "xi-api-key": aikConfig.elevenlabs.apiKey },
    body: JSON.stringify({ prompt, music_length_ms: seconds * 1000 }),
  }, aikConfig.mediaTimeoutMs);
  if (!res.ok) throw new Error(`ElevenLabs music ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return { base64: Buffer.from(await res.arrayBuffer()).toString("base64"), mime: res.headers.get("content-type") || "audio/mpeg", provider: "elevenlabs", model: "eleven-music" };
}

export async function speak(text: string): Promise<MediaResult> {
  if (aikConfig.mockAI) return { base64: MOCK_MP3, mime: "audio/mpeg", provider: "mock", model: "mock" };
  if (!isTtsConfigured()) throw new Error("TTS provider not configured");
  if (aikConfig.providers.tts === "azure") return speakAzure(text);
  const res = await fetchWithTimeout(`https://api.elevenlabs.io/v1/text-to-speech/${aikConfig.elevenlabs.voiceId}`, {
    method: "POST",
    headers: { "content-type": "application/json", "xi-api-key": aikConfig.elevenlabs.apiKey, accept: "audio/mpeg" },
    body: JSON.stringify({ text: text.slice(0, 2500), model_id: "eleven_multilingual_v2" }),
  }, 60_000);
  if (!res.ok) throw new Error(`ElevenLabs tts ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return { base64: Buffer.from(await res.arrayBuffer()).toString("base64"), mime: "audio/mpeg", provider: "elevenlabs", model: "eleven_multilingual_v2" };
}

/**
 * Azure AI Speech text-to-speech. Runs on the same multi-service AIServices
 * resource that already serves Content Safety, so "Read it to me" needs no new
 * vendor and no new bill. One-way only: the Studio never records a child.
 */
async function speakAzure(text: string): Promise<MediaResult> {
  const { key, region, voice } = aikConfig.azureSpeech;
  const safe = text.slice(0, 2500).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string);
  const ssml = `<speak version="1.0" xml:lang="en-US"><voice name="${voice}"><prosody rate="-8%">${safe}</prosody></voice></speak>`;
  const res = await fetchWithTimeout(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "content-type": "application/ssml+xml",
        "x-microsoft-outputformat": "audio-24khz-48kbitrate-mono-mp3",
        "ocp-apim-subscription-key": key,
        "user-agent": "humanityplusai-kids-studio",
      },
      body: ssml,
    },
    60_000,
  );
  if (!res.ok) throw new Error(`Azure Speech ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return { base64: Buffer.from(await res.arrayBuffer()).toString("base64"), mime: "audio/mpeg", provider: "azure", model: voice };
}

/* ------------------------------------------------------------------ *
 * fal.ai queue client (REST, no SDK)
 * ------------------------------------------------------------------ */

async function falRun(model: string, input: any): Promise<any> {
  const headers = { authorization: `Key ${aikConfig.fal.key}`, "content-type": "application/json" };
  const started = Date.now();
  const submit = await fetchWithTimeout(`https://queue.fal.run/${model}`, { method: "POST", headers, body: JSON.stringify(input) }, 30_000);
  if (!submit.ok) throw new Error(`fal submit ${submit.status}: ${(await submit.text().catch(() => "")).slice(0, 200)}`);
  const job: any = await submit.json();
  const statusUrl: string = job.status_url ?? `https://queue.fal.run/${model}/requests/${job.request_id}/status`;
  const resultUrl: string = job.response_url ?? `https://queue.fal.run/${model}/requests/${job.request_id}`;
  let delay = 1500;
  while (Date.now() - started < aikConfig.mediaTimeoutMs) {
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.4, 6000);
    const st = await fetchWithTimeout(statusUrl, { headers }, 20_000);
    if (!st.ok) throw new Error(`fal status ${st.status}`);
    const s: any = await st.json();
    if (s.status === "COMPLETED") {
      const r = await fetchWithTimeout(resultUrl, { headers }, 30_000);
      if (!r.ok) throw new Error(`fal result ${r.status}`);
      logger.info({ ms: Date.now() - started, model }, "[aik] fal job complete");
      return await r.json();
    }
    if (s.status === "FAILED" || s.status === "CANCELLED") throw new Error(`fal job ${s.status}`);
  }
  throw new Error("fal job timed out");
}

async function download(url: string): Promise<{ base64: string; mime: string }> {
  const res = await fetchWithTimeout(url, {}, 60_000);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 25 * 1024 * 1024) throw new Error("media too large");
  return { base64: buf.toString("base64"), mime: res.headers.get("content-type") || "application/octet-stream" };
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/* ------------------------------------------------------------------ *
 * Mock responses for local testing without any provider keys.
 * ------------------------------------------------------------------ */

/**
 * Test scaffolding: with AIK_MOCK_BROKEN_GAME=true the first generated game
 * is deliberately broken, so the forge's verify-and-repair loop can be
 * exercised without waiting for a real model to make a real mistake.
 * Mocking is already refused in production, so this cannot leak there.
 */
let mockBrokenGamesServed = 0;
let mockBrokenRobotsServed = 0;
const MOCK_BROKEN_GAME = `<!DOCTYPE html><html><head><title>Star Catcher</title></head><body>
<!-- SUMMARY: Catch the stars and dodge the clouds. -->
<canvas id="c" width="640" height="400"></canvas>
<script>
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let stars = null;
document.addEventListener('keydown', function (e) { player.x += 10; });
function loop() { ctx.fillRect(0, 0, 640, 400); stars.forEach(function (s) { s.y += 2; }); requestAnimationFrame(loop); }
loop();
<\/script></body></html>`;

function realRobotMock(): string {
      return JSON.stringify({
        name: "Snack Scout",
        job: "Finds a dropped snack and beeps when it gets close.",
        parts: ["micro:bit", "battery pack", "2 wheels + motors", "cardboard body", "ultrasonic distance sensor"],
        steps: ["Build a cardboard box body and tape the micro:bit on top.", "Attach the wheels and motors to the bottom.", "Point the distance sensor forward.", "Load the code and press A to start."],
        code: "// First: in MakeCode click Extensions and add \\\"sonar\\\".\ninput.onButtonPressed(Button.A, function () {\n  basic.showIcon(IconNames.Happy)\n  basic.forever(function () {\n    if (sonar.ping(DigitalPin.P1, DigitalPin.P2, PingUnit.Centimeters) < 10) {\n      music.playTone(Note.C5, music.beat(BeatFraction.Half))\n    }\n  })\n})",
        safetyNote: "Batteries only. No plugging into the wall. Ask a grown-up before using scissors.",
      });
}

function mockText(opts: TextCallOptions): string {
  switch (opts.mockKind) {
    case "game":
      if (process.env.AIK_MOCK_BROKEN_GAME === "true" && mockBrokenGamesServed === 0) {
        mockBrokenGamesServed++;
        return MOCK_BROKEN_GAME;
      }
      return MOCK_GAME;
    // The studio pipeline's own steps, so the mock exercises plan → build →
    // verify → critique → polish rather than skipping straight past them.
    case "robot":
      if (process.env.AIK_MOCK_BROKEN_ROBOT === "true" && mockBrokenRobotsServed === 0) {
        mockBrokenRobotsServed++;
        return JSON.stringify({
          name: "Snack Scout",
          job: "Drives forward and stops when it sees something close.",
          parts: ["micro:bit", "battery pack", "2 motors", "wheels", "ultrasonic sensor", "cardboard", "tape"],
          steps: ["Tape the battery pack underneath.", "Attach the two motors and wheels.", "Mount the sensor facing forward.", "Clip the micro:bit on top."],
          // Deliberately wrong: `robot` is not a micro:bit API, and radio is banned.
          code: "radio.setGroup(1)\nbasic.forever(function () {\n    robot.driveForward(60)\n    basic.pause(200)\n})",
          safetyNote: "Batteries only. Ask a grown-up before cutting cardboard.",
        });
      }
      return realRobotMock();
    case "music":
      return JSON.stringify({
        title: "Make It With AI",
        lyrics: "We bring our big ideas and we type them really clear,\nThe robot helps us build it and the whole room gives a cheer.\n\nMake it with AI! Make it with AI!\nWe are the directors and we're reaching for the sky!",
        musicPrompt: "Upbeat pop for kids, bright piano and claps, 120 bpm, big sing-along chorus, clear kid-friendly vocals",
        tip: "Your chant line is short and easy to shout \u2014 that's exactly what makes a chorus stick.",
      });
    case "plan":
      return JSON.stringify({
        title: "Star Catcher",
        pitch: "Catch falling stars before they hit the ground, and dodge the grumpy clouds.",
        mechanic: "Move left and right to catch; one life lost per cloud touched.",
        controls: "Arrow keys, and pointer or touch to follow the finger.",
        entities: [
          { name: "Catcher", role: "the player", look: "a smiling basket with stubby legs" },
          { name: "Star", role: "collectible", look: "a five-point star with a soft glow" },
          { name: "Cloud", role: "hazard", look: "a grey puffy cloud with a frown" },
        ],
        win: "Reach 30 stars for a victory screen.",
        lose: "Three clouds touched ends the run.",
        difficulty: "Stars fall faster and clouds appear more often every 10 points.",
        art: "Night sky gradient, warm yellow stars, cool grey clouds, big readable HUD.",
        juice: ["Star pops and fades when caught", "Screen shake on a cloud hit", "Score number scales up briefly"],
      });
    case "critique":
      return JSON.stringify(["Add a brief invulnerability flash after a hit so a single cloud cannot cost two lives."]);
    case "story":
      return JSON.stringify({
        title: "The Very Brave Pancake",
        panels: [
          { narration: "Once upon a time, a pancake named Flip lived in a cozy kitchen.", dialogue: "Today I explore!" },
          { narration: "Flip rolled out the door and into a garden full of giant sunflowers.", dialogue: "Whoa, tall!" },
          { narration: "A tiny snail was stuck upside down on a leaf.", dialogue: "Help, please!" },
          { narration: "Flip gently flipped the snail right side up.", dialogue: "Flipping is my superpower!" },
          { narration: "The snail led Flip to a puddle that sparkled like syrup.", dialogue: "Sweet!" },
          { narration: "Flip rolled home, a little muddier and a lot braver.", dialogue: "Best day ever." },
        ],
        coverPrompt: "A smiling cartoon pancake rolling through a sunny garden of giant sunflowers, bright colors, friendly, no people",
      });
    case "quest":
      return JSON.stringify({
        title: "Amazing Octopus Facts",
        items: [
          { text: "Octopuses have three hearts.", checkMe: true, sourceHint: "Try National Geographic Kids or an ocean animals book." },
          { text: "An octopus can squeeze through any hole bigger than its beak.", checkMe: true, sourceHint: "Try Britannica Kids." },
          { text: "Octopuses can change color to hide.", checkMe: true, sourceHint: "Try a library book about sea creatures." },
        ],
        nextIdea: "Turn your three checked facts into a quiz with a silly wrong answer for each one.",
      });
    case "video":
      return JSON.stringify({
        title: "Robot Gardener on the Moon",
        shots: [
          { shot: 1, description: "Wide shot: a round friendly robot waters glowing moon-flowers under a starry sky.", seconds: 2 },
          { shot: 2, description: "Close-up: a flower opens and sparkles float up.", seconds: 2 },
          { shot: 3, description: "The robot does a happy wiggle as Earth rises behind it.", seconds: 1 },
        ],
        videoPrompt: "A friendly round robot waters glowing flowers on the moon, starry sky, Earth rising, cartoon style, bright colors, no text",
      });
    case "chat":
      return "Great question! Let's figure it out together. What do you already know about it? Tell me one thing, and we'll build from there.";
    case "prompt":
    default:
      return JSON.stringify({ prompt: "A friendly robot watering flowers on the moon, cartoon style, bright cheerful colors, no text, no real people, kid-friendly", tip: "You used three details. Great directing!" });
  }
}

const MOCK_GAME = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Catch the Stars</title>
<style>body{margin:0;background:#0b1035;font-family:sans-serif;color:#fff;display:flex;flex-direction:column;align-items:center}canvas{background:#141a4a;border-radius:12px;margin-top:8px;touch-action:none}#hud{font-size:20px;margin-top:8px}</style></head>
<body><!-- SUMMARY: Catch falling stars and dodge stinky socks with a speedy cat. --><div id="hud">Score: <span id="s">0</span> &nbsp; Lives: <span id="l">3</span></div><canvas id="c" width="480" height="360"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');let px=220,score=0,lives=3,items=[],t=0,over=false;
const keys={};addEventListener('keydown',e=>keys[e.key]=true);addEventListener('keyup',e=>keys[e.key]=false);
c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();px=Math.max(0,Math.min(440,e.clientX-r.left-20))});
function spawn(){items.push({x:Math.random()*450,y:-20,good:Math.random()<0.7,v:1.5+Math.random()*2})}
function loop(){if(over)return;t++;if(t%40===0)spawn();if(keys.ArrowLeft)px-=5;if(keys.ArrowRight)px+=5;px=Math.max(0,Math.min(440,px));
x.clearRect(0,0,480,360);x.font='28px sans-serif';x.fillText('🐱',px,350);
items.forEach(i=>{i.y+=i.v;x.fillText(i.good?'⭐':'🧦',i.x,i.y);if(i.y>320&&i.y<360&&Math.abs(i.x-px)<30){i.hit=true;if(i.good)score++;else lives--;}});
items=items.filter(i=>!i.hit&&i.y<380);document.getElementById('s').textContent=score;document.getElementById('l').textContent=lives;
if(lives<=0){over=true;x.fillStyle='#fff';x.font='32px sans-serif';x.fillText('Game over! Score '+score,90,180);return}
requestAnimationFrame(loop)}loop();
</script></body></html>`;

// 1x1 transparent PNG
const MOCK_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
// Tiny silent MP3 frame and an (intentionally empty) MP4 placeholder for the mock path only.
const MOCK_MP3 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTRUoAWgBgkOAGbZHBgG1OF6zM82DWbZaUmMBptgQhGjsyYqc9ae9XFz280948NMBWInluyEeTvX+/oMTYyQAAAAA//tQxAADBOAhCmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTRUoAWgBgkOAGbZHBgG1OF6zM82DWbZaUmMBptgQhGjsyYqc9ae9XFz280948NMBWInluyEeTvX+/oMTYyQAAAAA=";
const MOCK_MP4 = "";
