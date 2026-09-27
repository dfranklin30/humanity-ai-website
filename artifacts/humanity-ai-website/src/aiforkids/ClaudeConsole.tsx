import { useEffect, useRef, useState } from "react";

/**
 * artifacts/humanity-ai-website/src/aiforkids/ClaudeConsole.tsx  (v2)
 *
 * Model picker fed by /api/aik/console/models — the server decides what this
 * person may use, so the list is never larger than their clearance. A budget
 * meter sits next to it, because the person choosing Opus should see what it costs.
 */

type Turn = { role: "user" | "assistant"; content: string };
type Model = { id: string; label: string; blurb: string; tier: "frontier" | "balanced" | "fast"; maxTokens: number; note?: string };
type Budget = { usedToday: number; dailyCeiling: number; orgUsedThisMonth: number; orgCeiling: number };
type ClassRow = { id: string; name: string; helperEnabled: boolean };

const STARTERS = [
  "Plan Week 5 for a class that is ahead of schedule",
  "A child's game keeps failing. Walk me through what to check.",
  "Draft the family note for the Creator Expo",
  "How do I explain 'AI can be wrong' to a 3rd grader?",
];

export default function ClaudeConsole() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState<string>("");
  const [budget, setBudget] = useState<Budget | null>(null);
  const [meta, setMeta] = useState<{ model?: string; degraded?: boolean; droppedTurns?: number } | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [showCascade, setShowCascade] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/aik/console/models", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setModels(d.models ?? []);
        setModel(d.defaultModel ?? d.models?.[0]?.id ?? "");
        setBudget(d.budget ?? null);
      })
      .catch(() => {});
    fetch("/api/aik/console/settings", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setClasses(d.classes ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [turns]);

  const current = models.find((m) => m.id === model);
  const nearCeiling = budget ? budget.usedToday > budget.dailyCeiling * 0.8 : false;

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: clean }];
    setTurns([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setNotice(null);
    setMeta(null);

    abort.current = new AbortController();
    try {
      const res = await fetch("/api/aik/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ turns: next, model }),
        signal: abort.current.signal,
      });

      if (!res.ok || !res.body) {
        setNotice("The console could not reach the model. Try again in a moment.");
        setTurns(next);
        return;
      }
      if (res.headers.get("content-type")?.includes("application/json")) {
        const d = await res.json();
        setNotice(d.message ?? "Let's try that a different way.");
        setTurns(next);
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const frames = buf.split("\n\n");
        buf = frames.pop() ?? "";
        for (const frame of frames) {
          const ev = frame.match(/^event: (.+)$/m)?.[1];
          const dataLine = frame.match(/^data: (.+)$/m)?.[1];
          if (!ev || !dataLine) continue;
          const data = JSON.parse(dataLine);
          if (ev === "meta") {
            setMeta(data);
            if (data.degraded) setNotice(`Switched to ${data.model} — ${data.reason}.`);
          } else if (ev === "delta") {
            setTurns((t) => {
              const copy = [...t];
              copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + data.text };
              return copy;
            });
          } else if (ev === "done") {
            setBudget((b) => (b ? { ...b, usedToday: b.usedToday + (data.cost ?? 0) } : b));
          } else if (ev === "blocked" || ev === "redirect" || ev === "error") {
            setNotice(data.message);
            setTurns(next);
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setNotice("Something went wrong. Try again.");
      setTurns(next);
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  async function cascade(helperEnabled: boolean, scope: "all" | string[]) {
    const res = await fetch("/api/aik/console/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ helperEnabled, scope }),
    });
    if (!res.ok) return setNotice("Only an admin can change every class at once.");
    setClasses((cs) =>
      cs.map((c) => (scope === "all" || (Array.isArray(scope) && scope.includes(c.id)) ? { ...c, helperEnabled } : c)),
    );
  }

  return (
    <section className="aik-console">
      <header className="aik-console__head">
        <div>
          <h2>Claude</h2>
          <p>
            Your workspace assistant. Everything here runs the same screened pipeline the children use — screening in,
            screening out, an audit line for every turn.
          </p>
        </div>
        <button className="aik-btn aik-btn--ghost" onClick={() => setShowCascade((v) => !v)}>
          Classes ({classes.filter((c) => c.helperEnabled).length}/{classes.length})
        </button>
      </header>

      <div className="aik-console__controls">
        <label htmlFor="aik-model">Model</label>
        <select id="aik-model" value={model} onChange={(e) => setModel(e.target.value)} disabled={busy}>
          {(["frontier", "balanced", "fast"] as const).map((tier) => {
            const group = models.filter((m) => m.tier === tier);
            if (!group.length) return null;
            const label = tier === "frontier" ? "Deepest" : tier === "balanced" ? "Balanced" : "Fast";
            return (
              <optgroup key={tier} label={label}>
                {group.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>

        {budget && (
          <span className={`aik-budget ${nearCeiling ? "aik-budget--warn" : ""}`}>
            ${budget.usedToday.toFixed(2)} of ${budget.dailyCeiling.toFixed(2)} today
            {nearCeiling && " — the deepest models switch off near the ceiling"}
          </span>
        )}
      </div>

      {current && (
        <p className="aik-model-blurb">
          {current.blurb}
          {current.note && <em> {current.note}</em>}
        </p>
      )}

      {showCascade && (
        <div className="aik-cascade">
          <h3>Ask-the-helper, per class</h3>
          <p>
            This turns on the <strong>bounded</strong> helper inside a child&rsquo;s piece — it can only talk about the
            thing they are making, it runs on the fast model, and it redirects anything else to you. Children never get
            a model picker and never get an open chat.
          </p>
          <div className="aik-cascade__rows">
            {classes.length === 0 && <p className="aik-empty">No classes yet.</p>}
            {classes.map((c) => (
              <label key={c.id} className="aik-cascade__row">
                <input type="checkbox" checked={c.helperEnabled} onChange={(e) => cascade(e.target.checked, [c.id])} />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
          <div className="aik-cascade__all">
            <button className="aik-btn aik-btn--ghost" onClick={() => cascade(true, "all")}>
              Turn on for every class
            </button>
            <button className="aik-btn aik-btn--ghost" onClick={() => cascade(false, "all")}>
              Turn off everywhere
            </button>
          </div>
        </div>
      )}

      <div className="aik-console__thread" ref={scroller} aria-live="polite">
        {turns.length === 0 && (
          <div className="aik-starters">
            <p>Try one of these, or just ask.</p>
            {STARTERS.map((s) => (
              <button key={s} className="aik-chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`aik-bub aik-bub--${t.role}`}>
            {t.content || (busy && i === turns.length - 1 ? <span className="aik-spinner" aria-label="Thinking" /> : null)}
          </div>
        ))}
        {meta?.droppedTurns ? (
          <p className="aik-fineprint">
            The earliest {meta.droppedTurns} turn{meta.droppedTurns > 1 ? "s were" : " was"} dropped to keep this
            conversation affordable. Start a new one to reset.
          </p>
        ) : null}
      </div>

      {notice && <p className="aik-notice">{notice}</p>}

      <form
        className="aik-console__composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label className="sr-only" htmlFor="aik-console-input">
          Ask Claude
        </label>
        <textarea
          id="aik-console-input"
          value={input}
          rows={2}
          maxLength={8000}
          placeholder="Ask about a session, a child's project, the curriculum…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        {busy ? (
          <button type="button" className="aik-btn aik-btn--ghost" onClick={() => abort.current?.abort()}>
            Stop
          </button>
        ) : (
          <button type="submit" className="aik-btn" disabled={!input.trim()}>
            Ask
          </button>
        )}
      </form>
      <p className="aik-fineprint">
        Claude is an AI and can be wrong. Read anything before it reaches a child or a family.
      </p>
    </section>
  );
}
