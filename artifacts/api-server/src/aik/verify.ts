/**
 * Smoke-testing generated games before anyone sees them.
 *
 * Until now a generated game went straight to the child: if the model wrote
 * `ctx.fillRect` before defining `ctx`, the first anyone knew was a black
 * rectangle and a disappointed eight-year-old. This module runs the code
 * first and reports what broke, precisely enough for the model to fix it.
 *
 * WHY NOT A REAL BROWSER: Playwright would be more faithful, but it adds
 * ~400MB to an image on a scale-to-zero Container App, which buys cold starts
 * measured in tens of seconds for every child signing in. Instead the script
 * runs in node:vm against a deliberately small DOM and canvas stub. That
 * catches what actually goes wrong in practice — syntax errors, references to
 * things that don't exist, exceptions during setup, a missing game loop,
 * nothing ever drawn — while staying honest about what it cannot see:
 * gameplay feel, collision correctness, and anything that only appears
 * after real time passes.
 *
 * Everything here is read-only analysis. It never executes network code
 * (there is no network in the sandbox) and it always terminates.
 */
import vm from "node:vm";

export type VerifyIssue = {
  kind: "syntax" | "runtime" | "missing" | "quality";
  /** Phrased for the model to act on, not for a child to read. */
  detail: string;
};

export type VerifyReport = {
  ok: boolean;
  issues: VerifyIssue[];
  /** What the stub observed, useful in the critique step. */
  observed: {
    drawCalls: number;
    hasLoop: boolean;
    listeners: string[];
    canvasSize: [number, number] | null;
    scriptChars: number;
  };
};

const SCRIPT_RE = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

export function extractScripts(html: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = SCRIPT_RE.exec(html))) if (m[1]?.trim()) out.push(m[1]);
  return out;
}

/** A canvas context that records what a game tried to draw. */
function makeCanvasStub(state: { drawCalls: number }) {
  const noop = () => state.drawCalls++;
  const ctx: any = new Proxy(
    {
      canvas: null as any,
      fillStyle: "#000",
      strokeStyle: "#000",
      font: "10px sans-serif",
      lineWidth: 1,
      globalAlpha: 1,
      textAlign: "left",
      textBaseline: "alphabetic",
      measureText: () => ({ width: 10 }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      createPattern: () => ({}),
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: noop,
      drawImage: noop,
      save: () => {},
      restore: () => {},
    },
    {
      get(target: any, prop: string) {
        if (prop in target) return target[prop];
        // Any other 2D context method: count it as a draw and carry on.
        return noop;
      },
      set(target: any, prop: string, value: any) {
        target[prop] = value;
        return true;
      },
    },
  );
  return ctx;
}

/**
 * The smallest DOM that a single-file canvas game realistically touches.
 * Unknown elements and methods resolve to harmless stubs rather than throwing,
 * so the report reflects the game's own mistakes instead of gaps in the stub.
 */
function makeDom(state: { drawCalls: number; listeners: string[]; loopCalls: number; canvasSize: [number, number] | null }) {
  const makeEl = (tag: string): any => {
    const el: any = {
      tagName: String(tag).toUpperCase(),
      style: {},
      dataset: {},
      children: [] as any[],
      classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
      setAttribute: () => {},
      getAttribute: () => null,
      removeAttribute: () => {},
      appendChild: (c: any) => (el.children.push(c), c),
      removeChild: () => {},
      insertBefore: (c: any) => (el.children.push(c), c),
      addEventListener: (t: string) => state.listeners.push(`${String(tag).toLowerCase()}:${t}`),
      removeEventListener: () => {},
      focus: () => {},
      blur: () => {},
      click: () => {},
      remove: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 640, bottom: 400, width: 640, height: 400, x: 0, y: 0 }),
      querySelector: (sel: string) => makeEl(sel && sel.includes("canvas") ? "canvas" : "div"),
      querySelectorAll: () => [],
      innerHTML: "",
      textContent: "",
      value: "",
      width: 640,
      height: 400,
    };
    // Every element answers getContext. A game commonly reaches its canvas
    // through getElementById or querySelector, and the stub has no idea which
    // element that is — so being lenient here keeps the report about the
    // game's mistakes rather than the harness's ignorance.
    el.getContext = () => {
      const c = makeCanvasStub(state);
      c.canvas = el;
      return c;
    };
    Object.defineProperty(el, "width", {
      get: () => state.canvasSize?.[0] ?? 640,
      set: (v: number) => (state.canvasSize = [Number(v) || 640, state.canvasSize?.[1] ?? 400]),
      configurable: true,
    });
    Object.defineProperty(el, "height", {
      get: () => state.canvasSize?.[1] ?? 400,
      set: (v: number) => (state.canvasSize = [state.canvasSize?.[0] ?? 640, Number(v) || 400]),
      configurable: true,
    });
    return el;
  };

  const doc: any = {
    body: makeEl("body"),
    documentElement: makeEl("html"),
    head: makeEl("head"),
    createElement: (t: string) => makeEl(t),
    createTextNode: () => ({}),
    getElementById: () => makeEl("div"),
    querySelector: (s: string) => makeEl(s.includes("canvas") ? "canvas" : "div"),
    querySelectorAll: () => [],
    addEventListener: (t: string) => state.listeners.push(`document:${t}`),
    removeEventListener: () => {},
    readyState: "complete",
  };

  const win: any = {
    document: doc,
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    addEventListener: (t: string) => state.listeners.push(`window:${t}`),
    removeEventListener: () => {},
    // The loop runs a bounded number of frames, then stops. Long enough to
    // surface an exception inside the loop; short enough to always return.
    requestAnimationFrame: (fn: (t: number) => void) => {
      state.loopCalls++;
      if (state.loopCalls <= 30) queueTick(() => fn(state.loopCalls * 16.7));
      return state.loopCalls;
    },
    cancelAnimationFrame: () => {},
    setTimeout: (fn: () => void) => (queueTick(fn), 1),
    clearTimeout: () => {},
    setInterval: (fn: () => void) => (queueTick(fn), 1),
    clearInterval: () => {},
    performance: { now: () => state.loopCalls * 16.7 },
    Math,
    Date,
    JSON,
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
  };
  win.window = win;
  win.self = win;
  win.globalThis = win;

  const queue: (() => void)[] = [];
  function queueTick(fn: () => void) {
    if (queue.length < 200) queue.push(fn);
  }
  return { win, doc, queue };
}

/** Errors thrown inside the game, not by the harness. */
function describeError(err: unknown): string {
  const e = err as any;
  const msg = String(e?.message ?? e);
  const line = typeof e?.stack === "string" ? e.stack.split("\n")[1]?.trim() : "";
  return line && !line.includes("verify.ts") ? `${msg} (${line})` : msg;
}

export function verifyGameHtml(html: string): VerifyReport {
  const issues: VerifyIssue[] = [];
  const state = { drawCalls: 0, listeners: [] as string[], loopCalls: 0, canvasSize: null as [number, number] | null };
  const scripts = extractScripts(html);
  const scriptChars = scripts.reduce((n, s) => n + s.length, 0);

  if (!/<canvas/i.test(html) && !/document\.createElement\(['"]canvas/i.test(html)) {
    issues.push({ kind: "missing", detail: "There is no <canvas> element. The game needs one to draw on." });
  }
  if (scripts.length === 0) {
    issues.push({ kind: "missing", detail: "There is no <script>. The game has no code." });
    return { ok: false, issues, observed: { drawCalls: 0, hasLoop: false, listeners: [], canvasSize: null, scriptChars: 0 } };
  }

  const { win, doc, queue } = makeDom(state);
  const sandbox: any = win;
  sandbox.document = doc;

  for (const src of scripts) {
    // 1. Does it parse at all?
    try {
      new vm.Script(src, { filename: "game.js" });
    } catch (err) {
      issues.push({ kind: "syntax", detail: `The JavaScript does not parse: ${describeError(err)}` });
      return { ok: false, issues, observed: { drawCalls: 0, hasLoop: false, listeners: [], canvasSize: null, scriptChars } };
    }
    // 2. Does it survive being set up?
    try {
      vm.createContext(sandbox);
      new vm.Script(src, { filename: "game.js" }).runInContext(sandbox, { timeout: 2000 });
    } catch (err) {
      issues.push({ kind: "runtime", detail: `The game threw while starting: ${describeError(err)}` });
    }
  }

  // 3. Does it survive a few frames?
  let ticks = 0;
  while (queue.length && ticks < 200) {
    const fn = queue.shift()!;
    ticks++;
    try {
      fn();
    } catch (err) {
      issues.push({ kind: "runtime", detail: `The game threw while running: ${describeError(err)}` });
      break;
    }
  }

  // 4. Did it behave like a game?
  const hasLoop = state.loopCalls > 0;
  if (!hasLoop) issues.push({ kind: "missing", detail: "Nothing animates: requestAnimationFrame, setInterval and setTimeout were never called." });
  if (state.drawCalls === 0) issues.push({ kind: "missing", detail: "Nothing was ever drawn to the canvas." });
  const hasInput = state.listeners.some((l) => /key|pointer|mouse|touch|click/.test(l));
  if (!hasInput) issues.push({ kind: "missing", detail: "No keyboard, pointer, mouse or touch listener was registered, so the player cannot control anything." });

  return {
    ok: issues.length === 0,
    issues,
    observed: { drawCalls: state.drawCalls, hasLoop, listeners: [...new Set(state.listeners)], canvasSize: state.canvasSize, scriptChars },
  };
}

/** One compact line per issue, for feeding back to the model. */
export function issuesForModel(report: VerifyReport): string {
  return report.issues.map((i, n) => `${n + 1}. [${i.kind}] ${i.detail}`).join("\n");
}
