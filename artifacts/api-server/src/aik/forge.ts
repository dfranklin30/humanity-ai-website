/**
 * The studio pipeline — what runs when quality matters more than speed.
 *
 * The fast path is one model call: brief in, artifact out. It is right for a
 * child with two tickets and twenty-five minutes, and it is why the Hub felt
 * thin for an adult making something real.
 *
 * This is the other path:
 *
 *     plan → build → verify → repair (×N) → critique → polish → verify
 *
 * Two of those steps are the ones that matter. **Verify** actually runs the
 * generated game (see verify.ts) and reports precisely what broke, so a repair
 * is a targeted fix rather than a re-roll. **Critique** asks the model to find
 * the gap between the brief and what it built, and the polish pass closes it.
 * Everything else exists to make those two possible.
 *
 * Cost and latency: five to seven calls instead of one, so roughly 30–90
 * seconds and proportionally more tokens. That trade is deliberate and it is
 * why children keep the fast path.
 *
 * Progress is reported step by step so a person watching sees the work
 * happening rather than a spinner.
 */
import { completeText } from "./ai";
import { COMMON_RULES } from "./modes";
import { issuesForModel, verifyGameHtml, type VerifyReport } from "./verify";
import { logger } from "./../lib/logger";

export type StepState = "running" | "done" | "skipped" | "failed";

export type ForgeStep = {
  key: string;
  /** Shown to the person waiting. */
  label: string;
  state: StepState;
  detail?: string;
  ms?: number;
};

export type ForgeProgress = (steps: ForgeStep[]) => void;

export type ForgeResult = {
  html: string;
  title: string;
  summary: string;
  /** The design the model committed to before writing any code. */
  plan: GamePlan | null;
  steps: ForgeStep[];
  /** What verification still reported at the end, if anything. */
  remaining: string[];
};

export type GamePlan = {
  title: string;
  pitch: string;
  mechanic: string;
  controls: string;
  entities: { name: string; role: string; look: string }[];
  win: string;
  lose: string;
  difficulty: string;
  art: string;
  juice: string[];
};

const MAX_REPAIRS = 3;

/* ------------------------------------------------------------------ *
 * Step bookkeeping
 * ------------------------------------------------------------------ */

class Steps {
  private steps: ForgeStep[] = [];
  private started = new Map<string, number>();
  constructor(private onProgress?: ForgeProgress) {}

  begin(key: string, label: string): void {
    this.steps.push({ key, label, state: "running" });
    this.started.set(key, Date.now());
    this.emit();
  }
  end(key: string, state: StepState, detail?: string): void {
    const s = this.steps.find((x) => x.key === key && x.state === "running");
    if (s) {
      s.state = state;
      s.detail = detail;
      s.ms = Date.now() - (this.started.get(key) ?? Date.now());
    }
    this.emit();
  }
  all(): ForgeStep[] {
    return this.steps.map((s) => ({ ...s }));
  }
  private emit(): void {
    try {
      this.onProgress?.(this.all());
    } catch {
      /* progress reporting must never break a build */
    }
  }
}

/* ------------------------------------------------------------------ *
 * Parsing helpers — models wrap things in fences no matter what you ask
 * ------------------------------------------------------------------ */

function stripFences(text: string): string {
  const fenced = /```(?:html|json|javascript)?\s*([\s\S]*?)```/i.exec(text);
  return (fenced ? fenced[1] : text).trim();
}

function parseJson<T>(text: string): T | null {
  const raw = stripFences(text);
  const start = raw.search(/[[{]/);
  if (start === -1) return null;
  // Walk back from the end for the matching close, which survives trailing prose.
  for (let end = raw.length; end > start; end--) {
    const slice = raw.slice(start, end);
    if (!/[\]}]$/.test(slice.trim())) continue;
    try {
      return JSON.parse(slice) as T;
    } catch {
      /* keep shrinking */
    }
  }
  return null;
}

function extractDocument(text: string): string | null {
  const body = stripFences(text);
  const i = body.search(/<!DOCTYPE html>|<html[\s>]/i);
  if (i === -1) return null;
  const end = body.toLowerCase().lastIndexOf("</html>");
  return end === -1 ? body.slice(i) : body.slice(i, end + 7);
}

/* ------------------------------------------------------------------ *
 * The game forge
 * ------------------------------------------------------------------ */

const STUDIO_RULES = `
You are building for a real audience, not a demo. Craft matters:
- The game must be genuinely fun for about two minutes: a clear goal, a rising challenge, and a reason to try again.
- Motion should feel good. Use easing or acceleration rather than teleporting by fixed pixels.
- Give feedback for every event: a flash, a particle, a score pop, a shake. Silence after an action feels broken.
- Draw real shapes and characters with canvas paths and gradients. Emoji are a fallback, not the plan.
- Readable HUD: score, lives, and a clear title screen and game-over screen with a Play Again button.`;

function planPrompt(soundEnabled: boolean): string {
  return `You design small browser games. Before any code is written, you commit to a design.${COMMON_RULES}
${STUDIO_RULES}
${soundEnabled ? "Simple sounds via AudioContext are available." : "There is no sound available: design for a silent game."}

Reply with ONLY a JSON object, no prose and no fences:
{
  "title": string,
  "pitch": string,                     // one sentence a child would repeat to a friend
  "mechanic": string,                  // the single core verb, and what makes it interesting
  "controls": string,                  // keyboard AND pointer, stated concretely
  "entities": [{"name": string, "role": string, "look": string}],   // 3 to 6
  "win": string,
  "lose": string,
  "difficulty": string,                // how it ramps over ~2 minutes
  "art": string,                       // palette and drawing approach, concretely
  "juice": [string]                    // 3 to 5 specific feedback effects
}`;
}

function buildPrompt(soundEnabled: boolean, charBudget: number): string {
  return `You write complete single-file browser games.${COMMON_RULES}
${STUDIO_RULES}

OUTPUT FORMAT:
- Reply with ONE complete HTML document and nothing else. No markdown fences, no commentary.
- Start with <!DOCTYPE html>. All CSS in one <style>, all JavaScript in one inline <script>. No external files, libraries or imports.
- Absolutely no network: no fetch, XMLHttpRequest, WebSocket, <a>, <form>, <iframe>, or URLs anywhere. No localStorage or cookies. No alert/prompt/confirm. No window.parent or window.top. ${soundEnabled ? "Simple AudioContext sounds are allowed." : "No sound at all: no <audio>, no AudioContext."}
- Keep the document under ${charBudget.toLocaleString()} characters. Canvas at most 900x560.
- Controls must work with BOTH arrow keys and pointer/touch.
- Include a title screen, a playable round, and a game-over screen with a Play Again button.
- Put a one-line HTML comment at the top of <body>: <!-- SUMMARY: one short sentence describing the game for a child -->

CORRECTNESS, because this is tested automatically before anyone plays it:
- Define every variable before it is used. No reference to anything undeclared.
- Guard array and object access. Never call a method on something that may be null.
- Register at least one keyboard or pointer listener, and drive animation with requestAnimationFrame.
- The code must run cleanly from the first frame with no exceptions.`;
}

async function planGame(brief: string, soundEnabled: boolean): Promise<GamePlan | null> {
  const raw = await completeText({
    system: planPrompt(soundEnabled),
    user: `Design a game from this brief:\n${brief}`,
    maxTokens: 1400,
    temperature: 0.85,
    tier: "default",
    mockKind: "plan",
  });
  return parseJson<GamePlan>(raw);
}

function planForModel(plan: GamePlan): string {
  return [
    `TITLE: ${plan.title}`,
    `PITCH: ${plan.pitch}`,
    `CORE MECHANIC: ${plan.mechanic}`,
    `CONTROLS: ${plan.controls}`,
    `ENTITIES: ${(plan.entities ?? []).map((e) => `${e.name} (${e.role}; looks like ${e.look})`).join("; ")}`,
    `WIN: ${plan.win}`,
    `LOSE: ${plan.lose}`,
    `DIFFICULTY: ${plan.difficulty}`,
    `ART: ${plan.art}`,
    `FEEDBACK EFFECTS: ${(plan.juice ?? []).join("; ")}`,
  ].join("\n");
}

/**
 * Build a game to the standard the Hub promises.
 *
 * Every step degrades rather than fails: if planning returns nothing usable we
 * build from the brief; if the critique is unparseable we ship what verified.
 * The caller always gets a playable document or an exception, never a
 * half-finished one.
 */
export async function forgeGame(opts: {
  brief: string;
  soundEnabled: boolean;
  charBudget: number;
  maxTokens: number;
  onProgress?: ForgeProgress;
}): Promise<ForgeResult> {
  const steps = new Steps(opts.onProgress);
  const { brief, soundEnabled, charBudget, maxTokens } = opts;

  /* 1. Plan ------------------------------------------------------- */
  steps.begin("plan", "Designing the game");
  let plan: GamePlan | null = null;
  try {
    plan = await planGame(brief, soundEnabled);
    steps.end("plan", plan ? "done" : "skipped", plan?.title ?? "building straight from the brief");
  } catch (err) {
    logger.warn({ err }, "[forge] plan failed");
    steps.end("plan", "skipped", "building straight from the brief");
  }

  /* 2. Build ------------------------------------------------------ */
  steps.begin("build", "Writing the code");
  const buildUser = plan
    ? `Build exactly this design.\n\n${planForModel(plan)}\n\nThe child's original brief, for tone:\n${brief}`
    : `Build a game from this brief:\n${brief}`;
  let raw = await completeText({
    system: buildPrompt(soundEnabled, charBudget),
    user: buildUser,
    maxTokens,
    temperature: 0.55,
    tier: "default",
    mockKind: "game",
  });
  let html = extractDocument(raw);
  if (!html) {
    steps.end("build", "failed", "no HTML document came back");
    throw new Error("forge: model returned no HTML document");
  }
  steps.end("build", "done", `${html.length.toLocaleString()} characters`);

  /* 3-4. Verify and repair ---------------------------------------- */
  let report: VerifyReport = verifyGameHtml(html);
  let repairs = 0;
  steps.begin("verify", "Testing it");
  steps.end("verify", report.ok ? "done" : "failed", report.ok ? "runs clean" : `${report.issues.length} problem${report.issues.length === 1 ? "" : "s"} found`);

  while (!report.ok && repairs < MAX_REPAIRS) {
    repairs++;
    steps.begin(`repair${repairs}`, `Fixing what broke${repairs > 1 ? ` (attempt ${repairs})` : ""}`);
    try {
      const fixed = await completeText({
        system: buildPrompt(soundEnabled, charBudget),
        user: `This game was run automatically and these problems were found:\n\n${issuesForModel(report)}\n\nFix every one of them. Change nothing else. Reply with the complete corrected HTML document and nothing else.\n\nCURRENT GAME:\n${html}`,
        maxTokens,
        temperature: 0.3,
        tier: "default",
        mockKind: "game",
      });
      const next = extractDocument(fixed);
      if (!next) {
        steps.end(`repair${repairs}`, "failed", "no document came back");
        break;
      }
      const nextReport = verifyGameHtml(next);
      // Only accept a repair that genuinely improves matters.
      if (nextReport.issues.length <= report.issues.length) {
        html = next;
        report = nextReport;
        steps.end(`repair${repairs}`, report.ok ? "done" : "done", report.ok ? "all clear" : `${report.issues.length} left`);
      } else {
        steps.end(`repair${repairs}`, "skipped", "the fix made it worse; keeping the previous version");
        break;
      }
    } catch (err) {
      logger.warn({ err }, "[forge] repair failed");
      steps.end(`repair${repairs}`, "failed", "repair call failed");
      break;
    }
  }

  /* 5-6. Critique and polish -------------------------------------- */
  if (report.ok) {
    steps.begin("critique", "Looking for what's missing");
    let notes: string[] = [];
    try {
      const critique = await completeText({
        system: `You review children's browser games against the design they were built from. You are specific and you do not flatter.${COMMON_RULES}
Reply with ONLY a JSON array of at most 4 strings. Each string is one concrete, implementable improvement — name the thing and what to do to it. If the game already delivers the design, reply with [].
Do not suggest anything needing network, sound${soundEnabled ? " beyond AudioContext" : " at all"}, external assets or libraries.`,
        user: `THE DESIGN:\n${plan ? planForModel(plan) : brief}\n\nWHAT THE AUTOMATED TEST SAW: ${report.observed.drawCalls} draw calls, loop ${report.observed.hasLoop ? "running" : "absent"}, listeners: ${report.observed.listeners.join(", ") || "none"}.\n\nTHE GAME:\n${html}`,
        maxTokens: 700,
        temperature: 0.5,
        tier: "default",
        mockKind: "critique",
      });
      notes = (parseJson<string[]>(critique) ?? []).filter((n) => typeof n === "string" && n.trim()).slice(0, 4);
      steps.end("critique", "done", notes.length ? `${notes.length} improvement${notes.length === 1 ? "" : "s"}` : "nothing worth changing");
    } catch (err) {
      logger.warn({ err }, "[forge] critique failed");
      steps.end("critique", "skipped");
    }

    if (notes.length) {
      steps.begin("polish", "Polishing");
      try {
        const polished = await completeText({
          system: buildPrompt(soundEnabled, charBudget),
          user: `Apply these improvements to the game. Keep everything else working exactly as it does now. Reply with the complete HTML document and nothing else.\n\nIMPROVEMENTS:\n${notes.map((n, i) => `${i + 1}. ${n}`).join("\n")}\n\nCURRENT GAME:\n${html}`,
          maxTokens,
          temperature: 0.4,
          tier: "default",
          mockKind: "game",
        });
        const next = extractDocument(polished);
        const nextReport = next ? verifyGameHtml(next) : null;
        // Polish is optional: never ship a polished version that broke.
        if (next && nextReport?.ok) {
          html = next;
          report = nextReport;
          steps.end("polish", "done", `${notes.length} applied`);
        } else {
          steps.end("polish", "skipped", "the polished version didn't run cleanly; keeping the working one");
        }
      } catch (err) {
        logger.warn({ err }, "[forge] polish failed");
        steps.end("polish", "skipped");
      }
    }
  }

  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  const summaryMatch = /<!--\s*SUMMARY:\s*([^>]*?)-->/i.exec(html);
  return {
    html,
    title: (plan?.title || titleMatch?.[1] || "My game").trim().slice(0, 60),
    summary: (summaryMatch?.[1] || plan?.pitch || "").trim().slice(0, 200),
    plan,
    steps: steps.all(),
    remaining: report.issues.map((i) => i.detail),
  };
}

/* ------------------------------------------------------------------ *
 * Critique-and-polish for the writing studios
 *
 * Story, Quest and Robotics produce JSON rather than a program, so there is
 * nothing to execute. They get the half of the pipeline that still applies:
 * a second opinion against the brief, and one revision.
 * ------------------------------------------------------------------ */

export async function refineJson(opts: {
  kind: string;
  brief: string;
  current: string;
  schemaHint: string;
  maxTokens: number;
  onProgress?: ForgeProgress;
}): Promise<{ json: string; steps: ForgeStep[]; changed: boolean }> {
  const steps = new Steps(opts.onProgress);
  steps.begin("critique", "Looking for what's missing");
  let notes: string[] = [];
  try {
    const critique = await completeText({
      system: `You review ${opts.kind} work for children against the brief it came from. Be specific; do not flatter.${COMMON_RULES}
Reply with ONLY a JSON array of at most 3 strings, each one concrete improvement. Reply [] if it already delivers the brief.`,
      user: `BRIEF:\n${opts.brief}\n\nCURRENT WORK:\n${opts.current}`,
      maxTokens: 500,
      temperature: 0.5,
      tier: "default",
      mockKind: "critique",
    });
    notes = (parseJson<string[]>(critique) ?? []).filter((n) => typeof n === "string" && n.trim()).slice(0, 3);
    steps.end("critique", "done", notes.length ? `${notes.length} improvement${notes.length === 1 ? "" : "s"}` : "nothing worth changing");
  } catch {
    steps.end("critique", "skipped");
    return { json: opts.current, steps: steps.all(), changed: false };
  }

  if (!notes.length) return { json: opts.current, steps: steps.all(), changed: false };

  steps.begin("polish", "Polishing");
  try {
    const revised = await completeText({
      system: `You revise ${opts.kind} work for children.${COMMON_RULES}\nReply with ONLY the corrected JSON object in exactly this shape, no fences and no prose:\n${opts.schemaHint}`,
      user: `Apply these improvements and keep everything else as it is.\n\n${notes.map((n, i) => `${i + 1}. ${n}`).join("\n")}\n\nCURRENT:\n${opts.current}`,
      maxTokens: opts.maxTokens,
      temperature: 0.6,
      tier: "default",
      mockKind: opts.kind,
    });
    const parsed = parseJson<any>(revised);
    if (!parsed) {
      steps.end("polish", "skipped", "the revision didn't parse; keeping the original");
      return { json: opts.current, steps: steps.all(), changed: false };
    }
    steps.end("polish", "done", `${notes.length} applied`);
    return { json: JSON.stringify(parsed), steps: steps.all(), changed: true };
  } catch {
    steps.end("polish", "skipped");
    return { json: opts.current, steps: steps.all(), changed: false };
  }
}
