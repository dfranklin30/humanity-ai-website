import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "../components/ui";
import { getArtifact, type Artifact, type ArtifactMeta, type FieldDef, type ModeDef, type StudioRequest } from "./api";

/* ------------------------------------------------------------------ *
 * Primitives sized for small hands and projectors
 * ------------------------------------------------------------------ */

export function BigButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const styles = {
    primary: "bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-200",
    secondary: "bg-white text-violet-800 ring-2 ring-violet-200 hover:bg-violet-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-lg font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ children, className, tone = "white" }: { children: ReactNode; className?: string; tone?: "white" | "tint" | "warn" | "good" }) {
  const tones = { white: "bg-white", tint: "bg-violet-50", warn: "bg-amber-50", good: "bg-emerald-50" } as const;
  return <div className={cx("rounded-3xl p-5 shadow-sm ring-1 ring-slate-200", tones[tone], className)}>{children}</div>;
}

export function Notice({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "good" | "info" }) {
  const tones = {
    warn: "bg-amber-50 text-amber-900 ring-amber-200",
    good: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    info: "bg-sky-50 text-sky-900 ring-sky-200",
  } as const;
  return <div className={cx("rounded-2xl px-4 py-3 text-base font-semibold ring-1", tones[tone])}>{children}</div>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-violet-700">
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      {label && <span className="text-lg font-semibold">{label}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sandboxed game frame
 *
 * sandbox="allow-scripts" WITHOUT allow-same-origin gives the game an opaque
 * origin: no cookies, no storage, no access to this page. The server also
 * injects a CSP that blocks all network. Never add allow-same-origin,
 * allow-popups, allow-top-navigation or allow-forms here.
 * ------------------------------------------------------------------ */

export function GameFrame({ html, title, tall }: { html: string; title: string; tall?: boolean }) {
  return (
    <iframe
      title={title}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      srcDoc={html}
      className={cx("w-full rounded-2xl bg-slate-900 ring-4 ring-violet-200", tall ? "h-[520px]" : "h-[440px]")}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Artifact viewers
 * ------------------------------------------------------------------ */

export function ArtifactView({ artifact, compact }: { artifact: Artifact; compact?: boolean }) {
  if (artifact.kind === "game") return <GameFrame html={artifact.content} title={artifact.title} tall={!compact} />;

  if (artifact.kind === "story") {
    let data: { title?: string; panels?: { narration: string; dialogue: string }[]; coverPrompt?: string } = {};
    try {
      data = JSON.parse(artifact.content);
    } catch {
      /* ignore */
    }
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {(data.panels ?? []).map((p, i) => (
          <div key={i} className="rounded-2xl bg-white p-4 ring-2 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Panel {i + 1}</p>
            <p className="mt-1 text-base text-slate-800">{p.narration}</p>
            <p className="mt-2 inline-block rounded-2xl bg-violet-100 px-3 py-1 text-base font-semibold text-violet-900">“{p.dialogue}”</p>
          </div>
        ))}
        {data.coverPrompt && (
          <div className="rounded-2xl bg-amber-50 p-4 ring-2 ring-amber-200 sm:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Cover picture idea</p>
            <p className="mt-1 text-base text-amber-900">{data.coverPrompt}</p>
          </div>
        )}
      </div>
    );
  }

  if (artifact.kind === "quest") {
    let data: { title?: string; items?: { text: string; sourceHint: string }[]; nextIdea?: string } = {};
    try {
      data = JSON.parse(artifact.content);
    } catch {
      /* ignore */
    }
    return (
      <div className="space-y-3">
        <Notice tone="info">These are first-draft ideas from the AI. Your job: check each one in a book or a kid-safe site, then mark it ✅ on paper.</Notice>
        <ol className="space-y-2">
          {(data.items ?? []).map((it, i) => (
            <li key={i} className="rounded-2xl bg-white p-4 ring-2 ring-slate-200">
              <p className="text-base font-semibold text-slate-900">
                <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800">{i + 1}</span>
                {it.text}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-bold text-amber-700">Check me:</span> {it.sourceHint}
              </p>
            </li>
          ))}
        </ol>
        {data.nextIdea && <p className="text-base font-semibold text-violet-800">Next idea: {data.nextIdea}</p>}
      </div>
    );
  }

  if (artifact.kind === "video") {
    let board: { title?: string; shots?: { shot: number; description: string; seconds: number }[]; videoPrompt?: string } = {};
    try {
      board = JSON.parse(artifact.summary ?? "{}");
    } catch {
      /* ignore */
    }
    return (
      <div className="space-y-3">
        {artifact.content && artifact.mime.startsWith("video/") && (
          <video controls playsInline className="mx-auto max-h-[420px] rounded-2xl ring-4 ring-violet-200" src={`data:${artifact.mime};base64,${artifact.content}`} />
        )}
        <div className="grid gap-2 sm:grid-cols-3">
          {(board.shots ?? []).map((sh) => (
            <div key={sh.shot} className="rounded-2xl bg-white p-3 ring-2 ring-slate-200">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Shot {sh.shot} · {sh.seconds}s</p>
              <p className="mt-1 text-sm text-slate-800">{sh.description}</p>
            </div>
          ))}
        </div>
        {board.videoPrompt && <p className="text-center text-xs text-slate-500">Clip prompt: {board.videoPrompt}</p>}
      </div>
    );
  }

  if (artifact.kind === "robot") {
    let r: { name?: string; job?: string; parts?: string[]; steps?: string[]; code?: string; safetyNote?: string } = {};
    try {
      r = JSON.parse(artifact.content);
    } catch {
      /* ignore */
    }
    return (
      <div className="space-y-3">
        <p className="text-lg font-semibold text-slate-800">🤖 {r.job}</p>
        <Notice tone="warn">🦺 {r.safetyNote}</Notice>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 ring-2 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Parts</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-slate-800">{(r.parts ?? []).map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-2 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Build steps</p>
            <ol className="mt-1 list-decimal pl-5 text-sm text-slate-800">{(r.steps ?? []).map((x, i) => <li key={i}>{x}</li>)}</ol>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-900 p-4 text-slate-100 ring-2 ring-slate-700">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-300">micro:bit starter code (paste into MakeCode → JavaScript)</p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed">{r.code}</pre>
        </div>
      </div>
    );
  }

  if (artifact.kind === "chat") {
    let t: { turns?: { role: string; text: string }[] } = {};
    try {
      t = JSON.parse(artifact.content);
    } catch {
      /* ignore */
    }
    return <Transcript turns={t.turns ?? []} />;
  }

  // image
  if (artifact.mime.startsWith("image/") && artifact.content) {
    return (
      <div className="space-y-2">
        <img src={`data:${artifact.mime};base64,${artifact.content}`} alt={artifact.title} className="mx-auto max-h-[480px] rounded-2xl ring-4 ring-violet-200" />
        {artifact.summary && <p className="text-center text-sm text-slate-600">Prompt: {artifact.summary}</p>}
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-white p-5 ring-2 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Your picture description</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{artifact.summary}</p>
      <p className="mt-3 text-sm text-slate-600">Pictures aren't switched on for this class yet, so your facilitator will draw this one on the big screen.</p>
    </div>
  );
}

/** Loads an artifact by id and renders it. */
export function ArtifactLoader({ id, compact }: { id: number; compact?: boolean }) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setArtifact(null);
    setError(null);
    getArtifact(id)
      .then((r) => alive && setArtifact(r.artifact))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [id]);
  if (error) return <Notice>{error}</Notice>;
  if (!artifact) return <Spinner label="Loading…" />;
  return <ArtifactView artifact={artifact} compact={compact} />;
}

export function kindEmoji(kind: ArtifactMeta["kind"]): string {
  return { game: "🎮", story: "📚", image: "🎨", quest: "🧭", video: "🎬", robot: "🤖", chat: "💬", audio: "🔊" }[kind] ?? "✨";
}

/* ------------------------------------------------------------------ *
 * Guided chat
 * ------------------------------------------------------------------ */

export type ChatMsg = { role: "user" | "assistant" | "system"; text: string };

export function Transcript({ turns, avatar }: { turns: { role: string; text: string }[]; avatar?: string }) {
  return (
    <div className="space-y-2">
      {turns.map((t, i) => (
        <div key={i} className={cx("flex", t.role === "user" ? "justify-end" : "justify-start")}>
          <div className={cx("max-w-[85%] rounded-2xl px-4 py-2 text-base leading-relaxed", t.role === "user" ? "bg-violet-600 text-white" : t.role === "system" ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "bg-white text-slate-900 ring-2 ring-violet-100")}>
            {t.role === "assistant" && <span className="mr-1">🤖</span>}
            {t.role === "user" && avatar && <span className="mr-1">{avatar}</span>}
            {t.text}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatPanel({
  mode,
  messages,
  onSend,
  busy,
  turnsLeft,
  maxChars,
  avatar,
}: {
  mode: ModeDef;
  messages: ChatMsg[];
  onSend: (text: string) => void;
  busy?: boolean;
  turnsLeft: number;
  maxChars: number;
  avatar?: string;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, busy]);
  const all: ChatMsg[] = [{ role: "assistant", text: mode.chatGreeting ?? `Hi! I'm the ${mode.name} helper.` }, ...messages];
  return (
    <div className="flex h-[520px] flex-col rounded-3xl bg-violet-50 p-4 ring-1 ring-violet-100">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>💬 Ask the {mode.name} helper · it's an AI and can be wrong · your facilitator can see this</span>
        <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-violet-200">{turnsLeft} chats left today</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        <Transcript turns={all} avatar={avatar} />
        {busy && <div className="mt-2"><Spinner label="Thinking…" /></div>}
        <div ref={endRef} />
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          if (t.length < 2 || busy || turnsLeft <= 0) return;
          onSend(t);
          setText("");
        }}
      >
        <input
          value={text}
          maxLength={maxChars}
          onChange={(e) => setText(e.target.value)}
          placeholder={turnsLeft > 0 ? mode.chatPlaceholder ?? "Ask a question…" : "No chats left today"}
          disabled={busy || turnsLeft <= 0}
          autoComplete="off"
          className="flex-1 rounded-2xl border-2 border-violet-200 bg-white px-4 py-3 text-lg text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none disabled:opacity-60"
        />
        <BigButton type="submit" disabled={text.trim().length < 2 || busy || turnsLeft <= 0}>
          Send
        </BigButton>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Mode form (create) and change box
 * ------------------------------------------------------------------ */

export function ModeForm({
  mode,
  maxChars,
  onSubmit,
  busy,
  submitLabel = "Make it!",
}: {
  mode: ModeDef;
  maxChars: number;
  onSubmit: (values: Record<string, string>) => void;
  busy?: boolean;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const missing = useMemo(() => mode.createFields.filter((f) => f.required && !(values[f.key] ?? "").trim()), [mode, values]);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (missing.length || busy) return;
        onSubmit(values);
      }}
    >
      {mode.createFields.map((f) => (
        <Field key={f.key} def={f} value={values[f.key] ?? ""} maxChars={f.maxChars ?? maxChars} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
      ))}
      <div className="flex items-center gap-3">
        <BigButton type="submit" disabled={Boolean(missing.length) || busy}>
          {busy ? "Working…" : `${mode.emoji} ${submitLabel}`}
        </BigButton>
        {missing.length > 0 && <span className="text-sm font-semibold text-slate-500">Fill in the starred boxes first.</span>}
      </div>
    </form>
  );
}

function Field({ def, value, maxChars, onChange }: { def: FieldDef; value: string; maxChars: number; onChange: (v: string) => void }) {
  const id = `f-${def.key}`;
  return (
    <div>
      <label htmlFor={id} className="block text-base font-bold text-slate-800">
        {def.label} {def.required && <span className="text-rose-500">*</span>}
      </label>
      {def.choices ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {def.choices.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => onChange(c)}
              className={cx(
                "rounded-full px-4 py-2 text-base font-semibold ring-2 transition",
                value === c ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-violet-800 ring-violet-200 hover:bg-violet-50",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <input
          id={id}
          value={value}
          maxLength={maxChars}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.hint}
          autoComplete="off"
          className="mt-1 w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-lg text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
        />
      )}
    </div>
  );
}

export function ChangeBox({ hint, maxChars, onSubmit, busy }: { hint: string; maxChars: number; onSubmit: (change: string) => void; busy?: boolean }) {
  const [change, setChange] = useState("");
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (change.trim().length < 3 || busy) return;
        onSubmit(change.trim());
        setChange("");
      }}
    >
      <div className="flex-1">
        <label htmlFor="change" className="block text-base font-bold text-slate-800">
          Director's Order: make one change
        </label>
        <input
          id="change"
          value={change}
          maxLength={maxChars}
          onChange={(e) => setChange(e.target.value)}
          placeholder={hint}
          autoComplete="off"
          className="mt-1 w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-lg text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
        />
      </div>
      <BigButton type="submit" disabled={change.trim().length < 3 || busy}>
        {busy ? "Working…" : "🎬 Change it"}
      </BigButton>
    </form>
  );
}

/* ------------------------------------------------------------------ *
 * Request status line
 * ------------------------------------------------------------------ */

export function RequestStatus({ request }: { request: StudioRequest }) {
  if (request.status === "queued" || request.status === "working") return <Spinner label={request.status === "queued" ? "In line…" : "The helper is working on it…"} />;
  if (request.status === "blocked") return <Notice>{request.message ?? "Let's try that a different way."}</Notice>;
  if (request.status === "failed") return <Notice>{request.message ?? "That one didn't work. Try again!"}</Notice>;
  return <Notice tone="good">Done! {request.message ?? ""}</Notice>;
}

export function summarizeInput(req: StudioRequest, modes: ModeDef[]): string {
  const mode = modes.find((m) => m.id === req.mode);
  if (req.kind === "change") return `Change: ${req.input.change ?? ""}`;
  if (req.kind === "chat") return `💬 ${req.input.message ?? ""}`;
  if (!mode) return JSON.stringify(req.input);
  return mode.createFields
    .filter((f) => req.input[f.key])
    .map((f) => `${f.label} ${req.input[f.key]}`)
    .join(" · ");
}
