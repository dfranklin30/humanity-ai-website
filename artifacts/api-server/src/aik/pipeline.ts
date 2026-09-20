/**
 * Kids AI Studio — request pipeline.
 *
 * runRequest() takes a queued request through every layer:
 *   input screening → model call → output screening → artifact → done
 * and publishes each state change to the class's live feed so the facilitator
 * dashboard updates in real time. Nothing here trusts the model's output.
 */
import { EventEmitter } from "events";
import { logger } from "../lib/logger";
import { aikConfig, isMusicConfigured } from "./config";
import * as store from "./store";
import type { RequestRow, ArtifactRow, ClassRow } from "./store";
import { getMode, validateInput, systemPrompt, chatSystemPrompt, userPrompt, isRedirect, extractHtml, extractJson, gameSummary, gameTitle, type ModeDef } from "./modes";
import { completeText, generateImage, generateVideo, generateMusic, ContentFilteredError, type ChatTurn } from "./ai";
import { forgeGame, refineJson } from "./forge";
import { verifyMicrobitCode } from "./verify";
import { screenInput, screenOutputText, scanGameCode, hardenGameHtml, stripLinks, contentSafetyImage, KID_MESSAGES, type Flag } from "./safety";
import { isContentSafetyConfigured, isImageConfigured, isVideoConfigured } from "./config";

/* ------------------------------------------------------------------ *
 * Live feed
 * ------------------------------------------------------------------ */

export type FeedEvent =
  | { type: "request"; request: PublicRequest }
  | { type: "class"; klass: PublicClass }
  | { type: "approval"; artifact: Omit<ArtifactRow, "content"> }
  | { type: "ping" };

const bus = new EventEmitter();
bus.setMaxListeners(500);

export function publish(classId: number, ev: FeedEvent): void {
  bus.emit(`class:${classId}`, ev);
}
export function subscribe(classId: number, fn: (ev: FeedEvent) => void): () => void {
  const key = `class:${classId}`;
  bus.on(key, fn);
  return () => bus.off(key, fn);
}

/* ------------------------------------------------------------------ *
 * Public shapes (what the browser sees)
 * ------------------------------------------------------------------ */

export type PublicRequest = {
  id: number;
  classId: number;
  childId: number | null;
  mode: string;
  kind: string;
  input: any;
  status: string;
  message: string | null;
  flags: Flag[];
  resultArtifactId: number | null;
  quality: string;
  /** Step-by-step state of a studio build, empty on the fast path. */
  progress: any[];
  createdAt: string;
  completedAt: string | null;
};

export function toPublicRequest(r: RequestRow): PublicRequest {
  return {
    id: r.id,
    classId: r.class_id,
    childId: r.child_id,
    mode: r.mode,
    kind: r.kind,
    input: r.input,
    status: r.status,
    message: r.message,
    flags: Array.isArray(r.flags) ? r.flags : [],
    quality: r.quality ?? "fast",
    progress: Array.isArray(r.progress) ? r.progress : [],
    resultArtifactId: r.result_artifact_id,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  };
}

/** Child-facing view: flags are hidden (they are for the facilitator). */
export function toChildRequest(r: RequestRow) {
  const p = toPublicRequest(r);
  return { ...p, flags: undefined, flagged: p.flags.length > 0 };
}

export type PublicClass = {
  id: number;
  name: string;
  code: string;
  modes: string[];
  ticketLimit: number;
  paused: boolean;
  locked: boolean;
  soundEnabled: boolean;
  sessionStartedAt: string;
  createdAt: string;
};

export function toPublicClass(c: ClassRow): PublicClass {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    modes: store.parseModes(c.modes),
    ticketLimit: c.ticket_limit,
    paused: c.paused,
    locked: c.locked,
    soundEnabled: c.sound_enabled,
    sessionStartedAt: c.session_started_at,
    createdAt: c.created_at,
  };
}

/* ------------------------------------------------------------------ *
 * The pipeline
 * ------------------------------------------------------------------ */

async function finish(req: RequestRow, patch: Parameters<typeof store.finishRequest>[1]): Promise<RequestRow> {
  const updated = (await store.finishRequest(req.id, patch)) ?? req;
  publish(req.class_id, { type: "request", request: toPublicRequest(updated) });
  return updated;
}

export async function runRequest(requestId: number): Promise<void> {
  const req = await store.getRequest(requestId);
  if (!req) return;
  const klass = await store.getClass(req.class_id);
  const mode = getMode(req.mode);
  if (!klass || !mode) {
    await finish(req, { status: "failed", message: KID_MESSAGES.failed, flags: [{ layer: "system", category: "bad_request" }] });
    return;
  }

  const flags: Flag[] = [];
  try {
    await store.markWorking(req.id);
    publish(req.class_id, { type: "request", request: toPublicRequest({ ...req, status: "working" }) });

    // 1. Validate shape
    const isStaff = klass.kind === "workspace";
    const input = validateInput(mode, req.kind, req.input, { staff: isStaff });
    if (!input.ok) {
      await finish(req, { status: "blocked", message: input.error, flags: [{ layer: "system", category: "invalid_input" }] });
      return;
    }

    // 2. Screen the child's words
    const screen = await screenInput(input.text);
    flags.push(...screen.flags);
    if (!screen.ok) {
      await finish(req, { status: "blocked", message: screen.kidMessage, flags });
      await store.audit(req.class_id, "system", null, "request_blocked", { requestId: req.id, flags: screen.flags });
      return;
    }

    // Guided chat turns have their own, shorter path.
    if (input.kind === "chat") {
      await runChatTurn(req, mode, input.message, flags);
      return;
    }

    // 3. Load current project for change requests
    let current: ArtifactRow | null = null;
    if (input.kind === "change") {
      if (!req.project_artifact_id) {
        await finish(req, { status: "failed", message: KID_MESSAGES.failed, flags: [...flags, { layer: "system", category: "missing_project" }] });
        return;
      }
      current = await store.getArtifact(req.project_artifact_id);
      if (!current || current.class_id !== req.class_id || (req.child_id !== null && current.child_id !== req.child_id)) {
        await finish(req, { status: "failed", message: KID_MESSAGES.failed, flags: [...flags, { layer: "system", category: "project_not_owned" }] });
        return;
      }
    }

    // 4. Model call (one retry with a tightened instruction on bad shape)
    const sys = systemPrompt(mode, { soundEnabled: klass.sound_enabled });
    const usr = userPrompt(mode, input, current ? projectStateForModel(current) : null);

    /* ---- Studio path: plan, build, run it, repair, critique, polish ----
     * Only for a "create" in the Hub. Children stay on the fast path, and a
     * change request stays fast so iteration remains quick for everyone.  */
    if (req.quality === "studio" && mode.id === "game" && input.kind === "create") {
      // Progress writes are serialized: they fire faster than Postgres
      // round-trips, and unordered writes would leave the last-written row
      // showing an early step forever.
      let writeChain: Promise<unknown> = Promise.resolve();
      const forged = await forgeGame({
        brief: input.text,
        soundEnabled: klass.sound_enabled,
        charBudget: aikConfig.studioGameChars,
        maxTokens: aikConfig.studioMaxTokens,
        onProgress: (steps) => {
          writeChain = writeChain.then(() => store.setProgress(req.id, steps)).catch(() => {});
          publish(req.class_id, { type: "request", request: toPublicRequest({ ...req, status: "working", progress: steps }) });
        },
      });
      await writeChain.catch(() => {});
      // The authoritative final state, whatever the streaming writes did.
      await store.setProgress(req.id, forged.steps).catch(() => {});
      const built = await buildArtifact(mode.id, forged.html, input, current, klass, flags);
      if (!built.ok) {
        await finish(req, { status: built.blocked ? "blocked" : "failed", message: built.message, flags: [...flags, ...built.flags] });
        return;
      }
      // Keep the planned title and pitch: they are better than anything
      // scraped back out of the markup.
      await complete(
        req,
        { ...built.artifact, title: forged.title || built.artifact.title, summary: forged.summary || built.artifact.summary },
        flags,
      );
      return;
    }

    let raw: string;
    try {
      raw = await completeText({ system: sys, user: usr, maxTokens: mode.maxTokens, temperature: mode.temperature, tier: mode.tier, mockKind: mode.id });
    } catch (err) {
      if (err instanceof ContentFilteredError) {
        await finish(req, { status: "blocked", message: KID_MESSAGES.unsafe, flags: [...flags, { layer: "content_safety", category: "provider_filter" }] });
        return;
      }
      throw err;
    }
    if (isRedirect(raw)) {
      await finish(req, { status: "blocked", message: "That's a grown-up question. Let's ask your facilitator!", flags: [...flags, { layer: "output", category: "redirect" }] });
      return;
    }

    // 5. Turn the reply into an artifact, screening on the way
    const built = await buildArtifact(mode.id, raw, input, current, klass, flags);
    if (!built.ok) {
      // one retry for shape problems only
      if (built.retryable) {
        const raw2 = await completeText({
          system: sys + "\n\nIMPORTANT: your previous reply had the wrong format. Follow OUTPUT FORMAT exactly.",
          user: usr,
          maxTokens: mode.maxTokens,
          temperature: Math.max(0, mode.temperature - 0.2),
          tier: mode.tier,
          mockKind: mode.id,
        });
        const built2 = await buildArtifact(mode.id, raw2, input, current, klass, flags);
        if (built2.ok) {
          await complete(req, built2.artifact, flags);
          return;
        }
        await finish(req, { status: built2.blocked ? "blocked" : "failed", message: built2.message, flags: [...flags, ...built2.flags] });
        return;
      }
      await finish(req, { status: built.blocked ? "blocked" : "failed", message: built.message, flags: [...flags, ...built.flags] });
      return;
    }
    /* ---- Studio path for the writing studios --------------------------
     * Story, Quest and Robotics produce JSON, not a program, so there is
     * nothing to execute. They get the half of the pipeline that applies: a
     * second opinion against the brief and one revision — and, for Robotics,
     * the micro:bit code parsed and repaired first, because a child is about
     * to type that into MakeCode and flash it onto real hardware.        */
    if (req.quality === "studio" && input.kind === "create" && REFINABLE.has(mode.id)) {
      let writeChain: Promise<unknown> = Promise.resolve();
      const refined = await refineJson({
        kind: mode.id,
        brief: input.text,
        current: built.artifact.content,
        schemaHint: SCHEMA_HINTS[mode.id] ?? "",
        focus: CRITIQUE_FOCUS[mode.id],
        maxTokens: mode.maxTokens,
        verify: mode.id === "robot" ? verifyRobotJson : undefined,
        onProgress: (steps) => {
          writeChain = writeChain.then(() => store.setProgress(req.id, steps)).catch(() => {});
          publish(req.class_id, { type: "request", request: toPublicRequest({ ...req, status: "working", progress: steps }) });
        },
      }).catch((err) => {
        logger.warn({ err, requestId: req.id }, "[aik] refine failed; shipping the first draft");
        return null;
      });
      await writeChain.catch(() => {});
      if (refined) {
        await store.setProgress(req.id, refined.steps).catch(() => {});
        if (refined.changed) {
          // Re-screen the revision: it is new model output like any other.
          const rebuilt = await buildArtifact(mode.id, refined.json, input, current, klass, flags);
          if (rebuilt.ok) {
            await complete(req, rebuilt.artifact, flags);
            return;
          }
          logger.warn({ requestId: req.id }, "[aik] refined version failed screening; shipping the first draft");
        }
      }
    }

    await complete(req, built.artifact, flags);
  } catch (err) {
    logger.error({ err, requestId }, "[aik] pipeline error");
    await finish(req, { status: "failed", message: KID_MESSAGES.unavailable, flags: [...flags, { layer: "system", category: "error", detail: String((err as any)?.message ?? err).slice(0, 200) }] });
  }
}

async function complete(req: RequestRow, artifactInput: NewArtifact, flags: Flag[]): Promise<void> {
  // In a staff workspace the facilitator is the approver, so there is no one
  // to hold media for. Screening still ran; only the human gate is skipped.
  const klass = await store.getClass(req.class_id);
  const approved = artifactInput.approved || klass?.kind === "workspace";
  const artifact = await store.createArtifact({
    classId: req.class_id,
    childId: req.child_id,
    kind: artifactInput.kind,
    title: artifactInput.title,
    content: artifactInput.content,
    mime: artifactInput.mime,
    summary: artifactInput.summary,
    approved,
    parentArtifactId: req.project_artifact_id,
  });
  await finish(req, { status: "done", message: artifactInput.kidNote ?? null, flags, resultArtifactId: artifact.id });
  if (!artifact.approved) {
    const { content, ...meta } = artifact;
    publish(req.class_id, { type: "approval", artifact: meta });
  }
}

/** Studios whose JSON output gets the critique-and-polish pass. */
const REFINABLE = new Set(["story", "quest", "robot", "music"]);

/** Enough of the shape for the model to return the same object, corrected. */
const SCHEMA_HINTS: Record<string, string> = {
  story: '{"title": string, "panels": [{"narration": string, "dialogue": string} x6], "coverPrompt": string}',
  quest: '{"title": string, "items": [{"text": string, "checkMe": boolean, "sourceHint": string}], "nextIdea": string}',
  robot: '{"name": string, "job": string, "parts": [string], "steps": [string], "code": string, "safetyNote": string}',
  music: '{"title": string, "lyrics": string, "musicPrompt": string, "tip": string}',
};

/**
 * What the critique pass should look hardest at, per tool.
 *
 * The generic "does this deliver the brief" review is good at surface quality
 * and bad at two specific failures we have actually seen. A story can contain
 * a plain contradiction — a prop in a jar in one panel and on the moon in the
 * next — and sail through, which matters far more once panels are illustrated:
 * a drawn contradiction is obvious to a five-year-old, and by then seven
 * images have been paid for. And a song's sound description tends to come back
 * vague ("a happy tune"), which is the one field a music model actually reads.
 */
const CRITIQUE_FOCUS: Record<string, string> = {
  story:
    "Continuity. Every prop, place and character introduced in one panel must stay consistent in every later panel that refers to it. " +
    "Anything a character uses must have been established earlier or be plausibly present in the setting. " +
    "Flag contradictions in where something is, who has it, or what it can do. Flag objects that appear from nowhere.",
  music:
    "The musicPrompt field, which is what a music model performs. It must name a genre, a tempo in words or BPM, the instruments, " +
    "and how the feeling moves from the verse to the chorus. Reject anything vague like 'a happy song'. " +
    "The lyrics must keep the child's own chant line exactly as they wrote it, and must be singable out loud at that tempo.",
  quest: "Whether a child could actually carry out each step alone, and whether the checkable claims are genuinely checkable.",
};

/** Parse the robot artifact and run its micro:bit code through the checker. */
function verifyRobotJson(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    const report = verifyMicrobitCode(String(parsed?.code ?? ""));
    return report.ok ? [] : report.issues.map((i) => i.detail);
  } catch {
    return ["The robot plan is not valid JSON."];
  }
}

function projectStateForModel(a: ArtifactRow): string {
  // Images: the model edits the prompt text stored in summary, not the pixels.
  if (a.kind === "image") return JSON.stringify({ prompt: a.summary ?? "" });
  if (a.kind === "video") {
    try {
      const j = JSON.parse(a.summary ?? "{}");
      return JSON.stringify(j);
    } catch {
      return JSON.stringify({ videoPrompt: a.summary ?? "" });
    }
  }
  return a.content;
}

/* ------------------------------------------------------------------ *
 * Guided chat. Transcript lives in one "chat" artifact per module per child.
 * Each turn: screen child's message → model (fast tier) → screen reply → append.
 * ------------------------------------------------------------------ */

type Transcript = { mode: string; turns: { role: "user" | "assistant"; text: string; at: string }[] };

async function runChatTurn(req: RequestRow, mode: ModeDef, message: string, flags: Flag[]): Promise<void> {
  // Find or create the transcript artifact.
  let convo: ArtifactRow | null = req.project_artifact_id ? await store.getArtifact(req.project_artifact_id) : null;
  if (convo && (convo.kind !== "chat" || convo.class_id !== req.class_id || (req.child_id !== null && convo.child_id !== req.child_id))) convo = null;
  if (!convo) convo = await store.findChatArtifact(req.class_id, req.child_id, `${mode.name} chat`);
  let transcript: Transcript = { mode: mode.id, turns: [] };
  if (convo) {
    try {
      transcript = JSON.parse(convo.content);
    } catch {
      transcript = { mode: mode.id, turns: [] };
    }
  }

  const history: ChatTurn[] = transcript.turns.slice(-aikConfig.chatHistoryTurns).map((t) => ({ role: t.role, content: t.text }));
  const turns: ChatTurn[] = [...history, { role: "user", content: message }];
  // The API requires alternation starting with a user turn; drop a leading assistant greeting if present.
  while (turns.length && turns[0].role !== "user") turns.shift();

  let reply: string;
  try {
    reply = await completeText({ system: chatSystemPrompt(mode), turns, maxTokens: mode.id === "homework" ? mode.maxTokens : 350, temperature: 0.5, tier: mode.tier === "oss" ? "oss" : "fast", mockKind: "chat" });
  } catch (err) {
    if (err instanceof ContentFilteredError) {
      await finish(req, { status: "blocked", message: KID_MESSAGES.unsafe, flags: [...flags, { layer: "content_safety", category: "provider_filter" }] });
      return;
    }
    throw err;
  }
  if (isRedirect(reply)) {
    await finish(req, { status: "blocked", message: "That's a grown-up question. Let's ask your facilitator!", flags: [...flags, { layer: "output", category: "redirect" }] });
    return;
  }
  const out = await screenOutputText(reply);
  if (!out.ok) {
    await finish(req, { status: "blocked", message: out.kidMessage, flags: [...flags, ...out.flags] });
    return;
  }
  const clean = stripLinks(reply).trim().slice(0, 1200);
  const now = new Date().toISOString();
  transcript.turns.push({ role: "user", text: message, at: now }, { role: "assistant", text: clean, at: now });
  const content = JSON.stringify(transcript);
  const summary = clean.slice(0, 120);
  if (convo) {
    await store.updateArtifactContent(convo.id, content, summary);
  } else {
    convo = await store.createArtifact({ classId: req.class_id, childId: req.child_id, kind: "chat", title: `${mode.name} chat`, content, mime: "application/json", summary, approved: true, parentArtifactId: null });
  }
  await finish(req, { status: "done", message: clean, flags, resultArtifactId: convo.id });
}

type NewArtifact = {
  kind: store.ArtifactKind;
  title: string;
  content: string;
  mime: string;
  summary: string | null;
  approved: boolean;
  kidNote?: string;
};

type BuildResult =
  | { ok: true; artifact: NewArtifact }
  | { ok: false; retryable: boolean; blocked: boolean; message: string; flags: Flag[] };

async function buildArtifact(
  modeId: store.ModeId,
  raw: string,
  input: ReturnType<typeof validateInput> & { ok: true },
  current: ArtifactRow | null,
  klass: ClassRow,
  flags: Flag[],
): Promise<BuildResult> {
  const fallbackTitle = input.kind === "create" ? (input.values.title || input.values.hero || input.values.what || input.values.topic || "My project") : current?.title || "My project";

  if (modeId === "game") {
    const html = extractHtml(raw);
    if (!html) return { ok: false, retryable: true, blocked: false, message: KID_MESSAGES.failed, flags: [{ layer: "system", category: "no_html" }] };
    const codeFlags = scanGameCode(html, klass.sound_enabled);
    if (codeFlags.length) {
      // Sound and dialogs are shape problems the model can fix; network/escape attempts are not retried.
      const retryable = codeFlags.every((f) => f.category === "sound" || f.category === "code:dialogs" || f.category === "too_large");
      return { ok: false, retryable, blocked: false, message: KID_MESSAGES.failed, flags: codeFlags };
    }
    const visible = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
    const out = await screenOutputText(visible.slice(0, 5000));
    if (!out.ok) return { ok: false, retryable: false, blocked: true, message: out.kidMessage, flags: out.flags };
    return {
      ok: true,
      artifact: { kind: "game", title: gameTitle(html, fallbackTitle), content: hardenGameHtml(html), mime: "text/html", summary: gameSummary(html), approved: true },
    };
  }

  if (modeId === "story") {
    const j = extractJson<{ title?: string; panels?: { narration?: string; dialogue?: string }[]; coverPrompt?: string }>(raw);
    if (!j || !Array.isArray(j.panels) || j.panels.length < 4) return { ok: false, retryable: true, blocked: false, message: KID_MESSAGES.failed, flags: [{ layer: "system", category: "bad_json" }] };
    const panels = j.panels.slice(0, 6).map((p) => ({ narration: stripLinks(String(p.narration ?? "").slice(0, 200)), dialogue: stripLinks(String(p.dialogue ?? "").slice(0, 120)) }));
    const text = panels.map((p) => `${p.narration} ${p.dialogue}`).join("\n");
    const out = await screenOutputText(text);
    if (!out.ok) return { ok: false, retryable: false, blocked: true, message: out.kidMessage, flags: out.flags };
    const content = JSON.stringify({ title: String(j.title ?? fallbackTitle).slice(0, 60), panels, coverPrompt: String(j.coverPrompt ?? "").slice(0, 300) });
    return { ok: true, artifact: { kind: "story", title: String(j.title ?? fallbackTitle).slice(0, 60), content, mime: "application/json", summary: panels[0]?.narration ?? null, approved: true } };
  }

  if (modeId === "quest") {
    const j = extractJson<{ title?: string; items?: { text?: string; sourceHint?: string }[]; nextIdea?: string }>(raw);
    if (!j || !Array.isArray(j.items) || j.items.length < 3) return { ok: false, retryable: true, blocked: false, message: KID_MESSAGES.failed, flags: [{ layer: "system", category: "bad_json" }] };
    const items = j.items.slice(0, 8).map((i) => ({ text: stripLinks(String(i.text ?? "").slice(0, 240)), checkMe: true, checked: false, sourceHint: stripLinks(String(i.sourceHint ?? "").slice(0, 120)) }));
    const out = await screenOutputText(items.map((i) => i.text).join("\n"));
    if (!out.ok) return { ok: false, retryable: false, blocked: true, message: out.kidMessage, flags: out.flags };
    const title = String(j.title ?? fallbackTitle).slice(0, 60);
    const content = JSON.stringify({ title, items, nextIdea: stripLinks(String(j.nextIdea ?? "").slice(0, 200)) });
    return { ok: true, artifact: { kind: "quest", title, content, mime: "application/json", summary: `${items.length} items to check`, approved: true } };
  }

  if (modeId === "robot") {
    const j = extractJson<{ name?: string; job?: string; parts?: string[]; steps?: string[]; code?: string; safetyNote?: string }>(raw);
    if (!j || !Array.isArray(j.parts) || !Array.isArray(j.steps) || !j.code) return { ok: false, retryable: true, blocked: false, message: KID_MESSAGES.failed, flags: [{ layer: "system", category: "bad_json" }] };
    const code = String(j.code).slice(0, 4000);
    const codeFlags = scanGameCode(code, true).filter((f) => f.category.startsWith("network") || f.category.startsWith("escape") || f.category === "code:url");
    if (codeFlags.length) return { ok: false, retryable: false, blocked: false, message: KID_MESSAGES.failed, flags: codeFlags };
    const text = [j.name, j.job, ...(j.parts ?? []), ...(j.steps ?? []), j.safetyNote].join("\n");
    const out = await screenOutputText(text);
    if (!out.ok) return { ok: false, retryable: false, blocked: true, message: out.kidMessage, flags: out.flags };
    const title = String(j.name ?? fallbackTitle).slice(0, 40);
    const content = JSON.stringify({
      name: title,
      job: stripLinks(String(j.job ?? "").slice(0, 200)),
      parts: (j.parts ?? []).slice(0, 8).map((x) => stripLinks(String(x).slice(0, 80))),
      steps: (j.steps ?? []).slice(0, 8).map((x) => stripLinks(String(x).slice(0, 200))),
      code,
      safetyNote: stripLinks(String(j.safetyNote ?? "Batteries only. Ask a grown-up before using tools.").slice(0, 240)),
    });
    return { ok: true, artifact: { kind: "robot", title, content, mime: "application/json", summary: stripLinks(String(j.job ?? "").slice(0, 120)), approved: true } };
  }

  /* ---- Music Maker -------------------------------------------------
   * The child writes the words; the model turns them into a singable song
   * and a description a music model can perform. Both the lyrics and the
   * sound description are screened before anything is generated, and the
   * finished audio always waits for a facilitator to listen first.      */
  if (modeId === "music") {
    const j = extractJson<{ title?: string; lyrics?: string; musicPrompt?: string; tip?: string }>(raw);
    if (!j || !j.lyrics || !j.musicPrompt) {
      return { ok: false, retryable: true, blocked: false, message: KID_MESSAGES.failed, flags: [{ layer: "system", category: "bad_json" }] };
    }
    const title = stripLinks(String(j.title ?? fallbackTitle).slice(0, 60));
    const lyrics = stripLinks(String(j.lyrics).slice(0, 1200));
    const musicPrompt = stripLinks(String(j.musicPrompt).slice(0, 300));
    const tip = stripLinks(String(j.tip ?? "").slice(0, 160));

    const out = await screenOutputText([title, lyrics, musicPrompt].join("\n"));
    if (!out.ok) return { ok: false, retryable: false, blocked: true, message: out.kidMessage, flags: out.flags };

    // The words are the artifact; the audio is an extra when a model exists.
    const sheet = JSON.stringify({ title, lyrics, musicPrompt });
    if (!isMusicConfigured()) {
      return {
        ok: true,
        artifact: { kind: "audio", title, content: "", mime: "text/plain", summary: sheet, approved: true,
          kidNote: tip || "Here are your words! Your facilitator can sing or play them while music is switched off." },
      };
    }
    try {
      const media = await generateMusic(musicPrompt, 45);
      return {
        ok: true,
        artifact: { kind: "audio", title, content: media.base64, mime: media.mime, summary: sheet, approved: false,
          kidNote: tip || "Your song is ready. Your facilitator will listen, then play it for everyone." },
      };
    } catch (err) {
      if (err instanceof ContentFilteredError) return { ok: false, retryable: false, blocked: true, message: KID_MESSAGES.unsafe, flags: [{ layer: "content_safety", category: "provider_filter" }] };
      logger.error({ err }, "[aik] music generation failed");
      // The lyrics survive even when the audio does not.
      return {
        ok: true,
        artifact: { kind: "audio", title, content: "", mime: "text/plain", summary: sheet, approved: true,
          kidNote: "Here are your words! The music didn't come out this time \u2014 try once more later." },
      };
    }
  }

  if (modeId === "video") {
    const j = extractJson<{ title?: string; shots?: { shot?: number; description?: string; seconds?: number }[]; videoPrompt?: string }>(raw);
    if (!j || !Array.isArray(j.shots) || !j.videoPrompt) return { ok: false, retryable: true, blocked: false, message: KID_MESSAGES.failed, flags: [{ layer: "system", category: "bad_json" }] };
    const shots = j.shots.slice(0, 4).map((x, i) => ({ shot: i + 1, description: stripLinks(String(x.description ?? "").slice(0, 200)), seconds: Number(x.seconds) || 2 }));
    const videoPrompt = stripLinks(String(j.videoPrompt).slice(0, 400));
    const out = await screenOutputText([...shots.map((x) => x.description), videoPrompt].join("\n"));
    if (!out.ok) return { ok: false, retryable: false, blocked: true, message: out.kidMessage, flags: out.flags };
    const title = String(j.title ?? fallbackTitle).slice(0, 60);
    const storyboard = JSON.stringify({ title, shots, videoPrompt });
    if (!isVideoConfigured()) {
      // No video provider yet: the storyboard itself is the artifact (still a great lesson).
      return { ok: true, artifact: { kind: "video", title, content: "", mime: "text/plain", summary: storyboard, approved: true, kidNote: "Here's your storyboard! Video clips aren't switched on for this class yet." } };
    }
    try {
      const media = await generateVideo(videoPrompt);
      // Videos always wait for the facilitator.
      return { ok: true, artifact: { kind: "video", title, content: media.base64, mime: media.mime, summary: storyboard, approved: false, kidNote: "Your storyboard is ready. The clip is waiting for your facilitator." } };
    } catch (err) {
      if (err instanceof ContentFilteredError) return { ok: false, retryable: false, blocked: true, message: KID_MESSAGES.unsafe, flags: [{ layer: "content_safety", category: "provider_filter" }] };
      logger.error({ err }, "[aik] video generation failed");
      return { ok: true, artifact: { kind: "video", title, content: "", mime: "text/plain", summary: storyboard, approved: true, kidNote: "Here's your storyboard! The clip didn't come out this time; try once more later." } };
    }
  }

  // prompt (image)
  const j = extractJson<{ prompt?: string; tip?: string }>(raw);
  if (!j || !j.prompt) return { ok: false, retryable: true, blocked: false, message: KID_MESSAGES.failed, flags: [{ layer: "system", category: "bad_json" }] };
  const promptText = stripLinks(String(j.prompt).slice(0, 400));
  const out = await screenOutputText(promptText);
  if (!out.ok) return { ok: false, retryable: false, blocked: true, message: out.kidMessage, flags: out.flags };
  const tip = stripLinks(String(j.tip ?? "").slice(0, 160));

  if (!isImageConfigured()) {
    // No image provider: the child still gets the assembled prompt (the teaching moment).
    return { ok: true, artifact: { kind: "image", title: fallbackTitle, content: "", mime: "text/plain", summary: promptText, approved: true, kidNote: tip } };
  }
  try {
    const media = await generateImage(promptText);
    if (isContentSafetyConfigured()) {
      const imgFlags = await contentSafetyImage(media.base64);
      if (imgFlags.length) return { ok: false, retryable: false, blocked: true, message: KID_MESSAGES.unsafe, flags: imgFlags };
    } else if (aikConfig.contentSafety.required) {
      return { ok: false, retryable: false, blocked: true, message: KID_MESSAGES.unavailable, flags: [{ layer: "system", category: "content_safety_not_configured" }] };
    }
    // Images always wait for the facilitator (approved: false).
    return { ok: true, artifact: { kind: "image", title: fallbackTitle, content: media.base64, mime: media.mime, summary: promptText, approved: false, kidNote: tip } };
  } catch (err) {
    if (err instanceof ContentFilteredError) return { ok: false, retryable: false, blocked: true, message: KID_MESSAGES.unsafe, flags: [{ layer: "content_safety", category: "provider_filter" }] };
    // Log the provider's own words: an image failure is nearly always a wrong
    // endpoint or an unexpected response shape, and "it failed" tells nobody which.
    logger.error({ err: String((err as Error)?.message ?? err).slice(0, 500) }, "[aik] image generation failed");
    // The words survive the picture. Prompt Craft teaches children to write a
    // description; the description IS the lesson, and losing it because a model
    // was unreachable turns a bad minute into a lost activity. Video and Music
    // already behave this way; image was the odd one out.
    return {
      ok: true,
      artifact: {
        kind: "image",
        title: fallbackTitle,
        content: "",
        mime: "text/plain",
        summary: promptText,
        approved: true,
        kidNote: tip || "Here's your picture description! The drawing didn't come out this time \u2014 your facilitator can draw it, or try again later.",
      },
    };
  }
}
