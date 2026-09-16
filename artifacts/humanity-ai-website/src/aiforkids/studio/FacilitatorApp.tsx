/**
 * Kids AI Studio — facilitator dashboard. /aiforkids/facilitator
 *
 * Sign in → pick a class → live view: roster and consent, mode unlocks,
 * ticket limit, pause-all, per-child mute, approval queue, live feed of
 * every Director's Order with its flags, Projector mode, export and delete.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../components/ui";
import {
  ApiError,
  fAddChild,
  fAddFacilitator,
  fApprove,
  fChangePassword,
  fClass,
  fClasses,
  fCreateClass,
  fDeleteChild,
  fDeleteClass,
  fExportUrl,
  fFeedUrl,
  fLogin,
  fLogout,
  fMe,
  fNewSession,
  fPatchChild,
  fPatchClass,
  fProjector,
  fRequest,
  fRotateCode,
  getConfig,
  waitForRequest,
  type ArtifactMeta,
  type ChildSummary,
  type ClassDetail,
  type Facilitator,
  type ModeId,
  type PublicClass,
  type StudioConfig,
  type StudioRequest,
} from "./api";
import { ArtifactLoader, BigButton, Card, ChangeBox, ModeForm, Notice, RequestStatus, Spinner, kindEmoji, summarizeInput } from "./components";

export default function FacilitatorApp() {
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [me, setMe] = useState<Facilitator | null | undefined>(undefined);
  const [classId, setClassId] = useState<number | null>(null);

  useEffect(() => {
    getConfig().then(setConfig).catch(() => setConfig(null));
    fMe()
      .then((r) => setMe(r.facilitator))
      .catch(() => setMe(null));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-violet-800">Kids AI Studio · Facilitator</p>
              <p className="text-xs text-slate-500">Humanity + AI</p>
            </div>
          </div>
          {me && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-600">{me.displayName} · {me.email}</span>
              {classId !== null && (
                <BigButton variant="ghost" onClick={() => setClassId(null)} className="!px-3 !py-1.5 !text-sm">
                  All classes
                </BigButton>
              )}
              <BigButton
                variant="ghost"
                className="!px-3 !py-1.5 !text-sm"
                onClick={async () => {
                  await fLogout().catch(() => {});
                  setMe(null);
                  setClassId(null);
                }}
              >
                Sign out
              </BigButton>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-6">
        {me === undefined && <Spinner label="Loading…" />}
        {me === null && <Login onDone={setMe} />}
        {me && !config && <Notice>The Studio API isn't enabled on this server (AIK_ENABLED).</Notice>}
        {me && config && classId === null && <Classes me={me} onOpen={setClassId} />}
        {me && config && classId !== null && <ClassDashboard config={config} me={me} classId={classId} onGone={() => setClassId(null)} />}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Login
 * ------------------------------------------------------------------ */

function Login({ onDone }: { onDone: (f: Facilitator) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-extrabold">Facilitator sign-in</h1>
      <p className="mt-1 text-sm text-slate-600">For Humanity + AI staff and trained facilitators only. Children sign in at /aiforkids/studio.</p>
      <form
        className="mt-5 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const r = await fLogin(email, password);
            onDone(r.facilitator);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Sign-in failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username" className={inputCls} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" className={inputCls} />
        {error && <Notice>{error}</Notice>}
        <BigButton type="submit" disabled={busy || !email || !password} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </BigButton>
      </form>
    </Card>
  );
}

const inputCls = "w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-base focus:border-violet-500 focus:outline-none";

/* ------------------------------------------------------------------ *
 * Class list + account
 * ------------------------------------------------------------------ */

function Classes({ me, onOpen }: { me: Facilitator; onOpen: (id: number) => void }) {
  const [classes, setClasses] = useState<PublicClass[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => fClasses().then((r) => setClasses(r.classes)).catch((e) => setError(e.message)), []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold">Your classes</h1>
        {error && <Notice>{error}</Notice>}
        {!classes && <Spinner />}
        {classes && classes.length === 0 && <Card tone="tint">No classes yet. Create one on the right.</Card>}
        <div className="grid gap-3 sm:grid-cols-2">
          {classes?.map((c) => (
            <button key={c.id} onClick={() => onOpen(c.id)} className="rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200 transition hover:ring-violet-400">
              <p className="text-lg font-extrabold">{c.name}</p>
              <p className="font-mono text-2xl font-bold tracking-widest text-violet-700">{c.code}</p>
              <p className="mt-1 text-xs text-slate-500">
                Modes: {c.modes.length ? c.modes.join(", ") : "none"} · {c.paused ? "Paused" : "Live"} · {c.locked ? "Locked" : "Open"}
              </p>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Card>
          <h2 className="text-lg font-extrabold">New class</h2>
          <form
            className="mt-3 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name.trim()) return;
              try {
                await fCreateClass(name.trim());
                setName("");
                await load();
              } catch (err) {
                setError(err instanceof ApiError ? err.message : "Could not create class.");
              }
            }}
          >
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tuesday Club, Fall 2026" className={inputCls} />
            <BigButton type="submit" className="!px-4 !py-2 !text-base">
              Create
            </BigButton>
          </form>
        </Card>
        <Account me={me} />
      </div>
    </div>
  );
}

function Account({ me }: { me: Facilitator }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [nf, setNf] = useState({ email: "", displayName: "", password: "", isAdmin: false });
  return (
    <Card>
      <h2 className="text-lg font-extrabold">Account</h2>
      {msg && <div className="mt-2"><Notice tone="info">{msg}</Notice></div>}
      <form
        className="mt-3 space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await fChangePassword(pw.current, pw.next);
            setMsg("Password changed.");
            setPw({ current: "", next: "" });
          } catch (err) {
            setMsg(err instanceof ApiError ? err.message : "Could not change password.");
          }
        }}
      >
        <p className="text-sm font-bold text-slate-700">Change password</p>
        <input type="password" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={inputCls} autoComplete="current-password" />
        <input type="password" placeholder="New password (12+ characters)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={inputCls} autoComplete="new-password" />
        <BigButton type="submit" variant="secondary" className="!px-4 !py-2 !text-base" disabled={!pw.current || pw.next.length < 12}>
          Update
        </BigButton>
      </form>
      {me.isAdmin && (
        <form
          className="mt-5 space-y-2 border-t border-slate-200 pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await fAddFacilitator(nf);
              setMsg(`Facilitator ${nf.email} added.`);
              setNf({ email: "", displayName: "", password: "", isAdmin: false });
            } catch (err) {
              setMsg(err instanceof ApiError ? err.message : "Could not add facilitator.");
            }
          }}
        >
          <p className="text-sm font-bold text-slate-700">Add a facilitator (admin)</p>
          <input type="email" placeholder="Email" value={nf.email} onChange={(e) => setNf({ ...nf, email: e.target.value })} className={inputCls} />
          <input placeholder="Display name" value={nf.displayName} onChange={(e) => setNf({ ...nf, displayName: e.target.value })} className={inputCls} />
          <input type="password" placeholder="Temporary password (12+)" value={nf.password} onChange={(e) => setNf({ ...nf, password: e.target.value })} className={inputCls} autoComplete="new-password" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={nf.isAdmin} onChange={(e) => setNf({ ...nf, isAdmin: e.target.checked })} /> Admin
          </label>
          <BigButton type="submit" variant="secondary" className="!px-4 !py-2 !text-base" disabled={!nf.email || !nf.displayName || nf.password.length < 12}>
            Add
          </BigButton>
        </form>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Class dashboard
 * ------------------------------------------------------------------ */

const MODE_LABELS: Record<ModeId, string> = {
  game: "🎮 Game Maker",
  story: "📚 Story Maker",
  prompt: "🎨 Prompt Craft",
  quest: "🧭 Quest Helper",
  video: "🎬 Video Maker",
  robot: "🤖 Robotics Lab",
  homework: "📝 Homework Help",
};

function ClassDashboard({ config, me, classId, onGone }: { config: StudioConfig; me: Facilitator; classId: number; onGone: () => void }) {
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const feedRef = useRef<EventSource | null>(null);

  const load = useCallback(async () => {
    try {
      setDetail(await fClass(classId));
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) onGone();
      else setError(err instanceof Error ? err.message : "Could not load class.");
    }
  }, [classId, onGone]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live feed over SSE; fall back to periodic reload.
  useEffect(() => {
    const es = new EventSource(fFeedUrl(classId));
    feedRef.current = es;
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "request") {
          setDetail((d) => {
            if (!d) return d;
            const r: StudioRequest = data.request;
            const idx = d.requests.findIndex((x) => x.id === r.id);
            const requests = idx >= 0 ? d.requests.map((x) => (x.id === r.id ? r : x)) : [...d.requests, r];
            return { ...d, requests };
          });
          if (data.request.status === "done" || data.request.status === "blocked") void load(); // refresh ticket counts/approvals
        } else if (data.type === "class") {
          setDetail((d) => (d ? { ...d, class: data.klass } : d));
        } else if (data.type === "approval") {
          void load();
        }
      } catch {
        /* ignore */
      }
    };
    const t = setInterval(() => void load(), 30_000);
    return () => {
      es.close();
      clearInterval(t);
    };
  }, [classId, load]);

  async function patch(p: Parameters<typeof fPatchClass>[1]) {
    try {
      const r = await fPatchClass(classId, p);
      setDetail((d) => (d ? { ...d, class: r.class } : d));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed.");
    }
  }

  if (!detail) return error ? <Notice>{error}</Notice> : <Spinner label="Loading class…" />;
  const k = detail.class;
  const childName = (id: number | null) => (id === null ? "Projector" : detail.children.find((c) => c.id === id)?.nickname ?? `#${id}`);
  const childAvatar = (id: number | null) => (id === null ? "📽️" : detail.children.find((c) => c.id === id)?.avatar ?? "");

  return (
    <div className="space-y-5">
      {error && <Notice>{error}</Notice>}
      {!config.aiReady && <Notice>No text model is configured on this server; child requests will fail until AIK_ANTHROPIC_API_KEY (or another text provider) is set.</Notice>}
      {!config.screeningReady && <Notice>Content Safety is required but not configured; every request will be refused (fail closed) until AIK_CONTENT_SAFETY_* are set.</Notice>}
      <CapabilityStrip config={config} />

      {/* Header + controls */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold">{k.name}</h1>
              <p className="mt-1 text-sm text-slate-600">Class code (put it on the board)</p>
              <p className="font-mono text-5xl font-extrabold tracking-[0.3em] text-violet-700">{k.code}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <SmallBtn onClick={async () => { const r = await fRotateCode(classId); setDetail((d) => d && { ...d, class: r.class }); }}>Rotate code</SmallBtn>
                <SmallBtn onClick={async () => { const r = await fNewSession(classId); setDetail((d) => d && { ...d, class: r.class }); await load(); }} title="Resets every child's Director's Order count">
                  Start new session (reset tickets)
                </SmallBtn>
                <a href={fExportUrl(classId)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                  Export class data
                </a>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={cx("rounded-full px-3 py-1 text-xs font-bold", live ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")}>{live ? "● Live feed connected" : "○ Reconnecting…"}</span>
              <BigButton variant={k.paused ? "primary" : "danger"} onClick={() => patch({ paused: !k.paused })}>
                {k.paused ? "▶ Resume Studio" : "⏸ Pause all"}
              </BigButton>
            </div>
          </div>
        </Card>

        <Card className="min-w-[280px]">
          <p className="text-sm font-bold text-slate-700">Unlocked modes</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.keys(MODE_LABELS) as ModeId[]).map((m) => {
              const on = k.modes.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => patch({ modes: on ? k.modes.filter((x) => x !== m) : [...k.modes, m] })}
                  className={cx("rounded-xl px-3 py-2 text-left text-sm font-bold ring-2 transition", on ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-600 ring-slate-200 hover:ring-violet-300")}
                >
                  {MODE_LABELS[m]}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">Orders per child per session</span>
            <div className="flex items-center gap-1">
              <SmallBtn onClick={() => patch({ ticketLimit: Math.max(0, k.ticketLimit - 1) })}>−</SmallBtn>
              <span className="w-8 text-center text-lg font-extrabold">{k.ticketLimit}</span>
              <SmallBtn onClick={() => patch({ ticketLimit: Math.min(20, k.ticketLimit + 1) })}>+</SmallBtn>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">Helper chats per child per session</span>
            <div className="flex items-center gap-1">
              <SmallBtn onClick={() => patch({ chatTurnLimit: Math.max(0, k.chatTurnLimit - 5) })}>−</SmallBtn>
              <span className="w-8 text-center text-lg font-extrabold">{k.chatTurnLimit}</span>
              <SmallBtn onClick={() => patch({ chatTurnLimit: Math.min(60, k.chatTurnLimit + 5) })}>+</SmallBtn>
            </div>
          </div>
          <label className="mt-2 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">Game sound allowed</span>
            <input type="checkbox" checked={k.soundEnabled} onChange={(e) => patch({ soundEnabled: e.target.checked })} />
          </label>
          <label className="mt-2 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">Lock portfolios (Expo)</span>
            <input type="checkbox" checked={k.locked} onChange={(e) => patch({ locked: e.target.checked })} />
          </label>
        </Card>
      </div>

      {/* Approvals */}
      {detail.approvals.length > 0 && (
        <Card tone="warn">
          <h2 className="text-lg font-extrabold">🖼️🎬 Waiting for your approval ({detail.approvals.length})</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {detail.approvals.map((a) => (
              <ApprovalCard key={a.id} artifact={a} who={`${childAvatar(a.childId)} ${childName(a.childId)}`} onDone={load} />
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Live feed */}
        <Card>
          <h2 className="text-lg font-extrabold">Live feed</h2>
          <p className="text-xs text-slate-500">Every Director's Order and result. Red badges show exactly which safety layer spoke up.</p>
          <ul className="mt-3 max-h-[640px] space-y-2 overflow-y-auto pr-1">
            {[...detail.requests].reverse().map((r) => (
              <FeedItem key={r.id} r={r} who={`${childAvatar(r.childId)} ${childName(r.childId)}`} modes={config.modes} onPreview={setPreview} previewing={preview === r.resultArtifactId} />
            ))}
            {detail.requests.length === 0 && <li className="text-sm text-slate-500">Nothing yet. Orders appear here the moment a child submits one.</li>}
          </ul>
        </Card>

        <div className="space-y-5">
          {preview !== null && (
            <Card>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-extrabold">Preview</h2>
                <SmallBtn onClick={() => setPreview(null)}>Close</SmallBtn>
              </div>
              <ArtifactLoader id={preview} compact />
            </Card>
          )}
          <Roster detail={detail} config={config} onChange={load} />
          <Projector config={config} classId={classId} klass={k} onPreview={setPreview} />
          <DangerZone klass={k} classId={classId} onDeleted={onGone} />
        </div>
      </div>
      <p className="text-xs text-slate-500">Signed in as {me.email}. Everything on this page is logged in the class audit trail.</p>
    </div>
  );
}

function SmallBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void | Promise<void>; title?: string }) {
  return (
    <button type="button" title={title} onClick={() => void onClick()} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">
      {children}
    </button>
  );
}

function FeedItem({ r, who, modes, onPreview, previewing }: { r: StudioRequest; who: string; modes: StudioConfig["modes"]; onPreview: (id: number | null) => void; previewing: boolean }) {
  const tone = r.status === "blocked" ? "border-rose-300 bg-rose-50" : r.status === "failed" ? "border-amber-300 bg-amber-50" : r.status === "done" ? "border-emerald-200 bg-white" : "border-violet-200 bg-violet-50";
  return (
    <li className={cx("rounded-xl border p-3", tone)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold">
          {who} <span className="font-semibold text-slate-500">· {modes.find((m) => m.id === r.mode)?.name ?? r.mode} · {r.kind}</span>
        </p>
        <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <p className="mt-1 text-sm text-slate-800">{summarizeInput(r, modes)}</p>
      {r.kind === "chat" && r.status === "done" && r.message && <p className="mt-1 rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-900">🤖 {r.message}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={cx("rounded-full px-2 py-0.5 text-xs font-bold", r.status === "done" ? "bg-emerald-100 text-emerald-800" : r.status === "blocked" ? "bg-rose-100 text-rose-800" : r.status === "failed" ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-800")}>{r.status}</span>
        {(r.flags ?? []).map((f, i) => (
          <span key={i} className={cx("rounded-full px-2 py-0.5 text-xs font-bold text-white", f.layer === "system" ? "bg-amber-500" : "bg-rose-600")} title={f.detail ?? ""}>
            {f.layer}: {f.category}
            {f.severity !== undefined ? ` (${f.severity})` : ""}
          </span>
        ))}
        {r.message && <span className="text-xs text-slate-600">“{r.message}”</span>}
        {r.resultArtifactId && (
          <button onClick={() => onPreview(previewing ? null : r.resultArtifactId)} className="ml-auto text-xs font-bold text-violet-700 hover:underline">
            {previewing ? "Hide" : "Preview result"}
          </button>
        )}
      </div>
    </li>
  );
}

function ApprovalCard({ artifact, who, onDone }: { artifact: ArtifactMeta; who: string; onDone: () => void }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-amber-200">
      <p className="text-sm font-extrabold">
        {kindEmoji(artifact.kind)} {artifact.title} <span className="font-semibold text-slate-500">· {who}</span>
      </p>
      <p className="text-xs text-slate-600">Prompt: {artifact.summary}</p>
      <div className="mt-2">
        <ArtifactLoader id={artifact.id} compact />
      </div>
      <div className="mt-2 flex gap-2">
        <BigButton className="!px-4 !py-2 !text-base" onClick={() => fApprove(artifact.id, true).then(onDone)}>
          ✓ Show to child
        </BigButton>
        <BigButton variant="danger" className="!px-4 !py-2 !text-base" onClick={() => fApprove(artifact.id, false).then(onDone)}>
          ✕ Reject
        </BigButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Roster
 * ------------------------------------------------------------------ */

function Roster({ detail, config, onChange }: { detail: ClassDetail; config: StudioConfig; onChange: () => void }) {
  const [form, setForm] = useState({ nickname: "", avatar: config.avatars[0] ?? "🦊", pin: "", consentRecorded: false });
  const [error, setError] = useState<string | null>(null);
  const classId = detail.class.id;
  const used = useMemo(() => new Set(detail.children.map((c) => c.avatar)), [detail.children]);

  async function act(fn: () => Promise<unknown>) {
    try {
      await fn();
      onChange();
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That didn't work.");
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-extrabold">Roster ({detail.children.length})</h2>
      <p className="text-xs text-slate-500">Nicknames only, never real names. A child can sign in only after you record their consent form.</p>
      {error && <div className="mt-2"><Notice>{error}</Notice></div>}
      <ul className="mt-3 divide-y divide-slate-100">
        {detail.children.map((c) => (
          <RosterRow key={c.id} c={c} limit={detail.class.ticketLimit} onAct={act} classId={classId} />
        ))}
      </ul>
      <form
        className="mt-4 space-y-2 border-t border-slate-200 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          void act(async () => {
            await fAddChild(classId, form);
            setForm({ nickname: "", avatar: config.avatars.find((a) => !used.has(a) && a !== form.avatar) ?? config.avatars[0], pin: "", consentRecorded: false });
          });
        }}
      >
        <p className="text-sm font-bold text-slate-700">Add a child</p>
        <div className="flex flex-wrap gap-1">
          {config.avatars.map((a) => (
            <button type="button" key={a} onClick={() => setForm({ ...form, avatar: a })} className={cx("rounded-lg px-1.5 py-0.5 text-2xl ring-2", form.avatar === a ? "ring-violet-600" : used.has(a) ? "opacity-30 ring-transparent" : "ring-transparent hover:ring-violet-200")}>
              {a}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="Nickname (e.g. RocketFox)" className={inputCls} maxLength={20} />
          <input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="PIN" inputMode="numeric" className={cx(inputCls, "w-24 text-center font-mono")} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.consentRecorded} onChange={(e) => setForm({ ...form, consentRecorded: e.target.checked })} />
          I have the signed parent/guardian consent form for this child
        </label>
        <BigButton type="submit" variant="secondary" className="!px-4 !py-2 !text-base" disabled={form.nickname.trim().length < 2 || form.pin.length !== 4}>
          Add to class
        </BigButton>
      </form>
    </Card>
  );
}

function RosterRow({ c, limit, classId, onAct }: { c: ChildSummary; limit: number; classId: number; onAct: (fn: () => Promise<unknown>) => Promise<void> }) {
  const [pin, setPin] = useState("");
  return (
    <li className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-2xl">{c.avatar}</span>
      <span className="font-extrabold">{c.nickname}</span>
      <span className="text-xs text-slate-500">
        {c.ticketsUsed}/{limit} orders · {c.chatTurnsUsed} chats
      </span>
      <span className={cx("rounded-full px-2 py-0.5 text-xs font-bold", c.consentRecorded ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>{c.consentRecorded ? "Consent ✓" : "No consent — locked"}</span>
      {c.pinLocked && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">PIN locked</span>}
      {c.muted && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">Muted</span>}
      <span className="ml-auto flex flex-wrap items-center gap-1">
        <SmallBtn onClick={() => onAct(() => fPatchChild(classId, c.id, { consentRecorded: !c.consentRecorded }))}>{c.consentRecorded ? "Remove consent" : "Record consent"}</SmallBtn>
        <SmallBtn onClick={() => onAct(() => fPatchChild(classId, c.id, { muted: !c.muted }))}>{c.muted ? "Unmute" : "Mute"}</SmallBtn>
        {c.pinLocked && <SmallBtn onClick={() => onAct(() => fPatchChild(classId, c.id, { unlock: true }))}>Unlock</SmallBtn>}
        <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="New PIN" inputMode="numeric" className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center font-mono text-sm" />
        <SmallBtn
          onClick={() =>
            onAct(async () => {
              if (pin.length === 4) await fPatchChild(classId, c.id, { pin });
              setPin("");
            })
          }
        >
          Set
        </SmallBtn>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Remove ${c.nickname} and all their work from this class? This cannot be undone.`)) void onAct(() => fDeleteChild(classId, c.id));
          }}
          className="rounded-lg px-2 py-1 text-sm font-semibold text-rose-700 hover:bg-rose-50"
        >
          Remove
        </button>
      </span>
    </li>
  );
}

/* ------------------------------------------------------------------ *
 * Projector mode
 * ------------------------------------------------------------------ */

function Projector({ config, classId, klass, onPreview }: { config: StudioConfig; classId: number; klass: PublicClass; onPreview: (id: number) => void }) {
  const [modeId, setModeId] = useState<ModeId>("game");
  const [active, setActive] = useState<StudioRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastArtifact, setLastArtifact] = useState<number | null>(null);
  const mode = config.modes.find((m) => m.id === modeId)!;

  async function run(kind: "create" | "change", input: Record<string, string>) {
    setBusy(true);
    try {
      const { request } = await fProjector(classId, { mode: modeId, kind, projectArtifactId: kind === "change" && lastArtifact ? lastArtifact : undefined, input });
      setActive(request);
      const settled = await waitForRequest(request.id, fRequest, setActive);
      setActive(settled);
      if (settled.resultArtifactId) {
        setLastArtifact(settled.resultArtifactId);
        onPreview(settled.resultArtifactId);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card tone="tint">
      <h2 className="text-lg font-extrabold">📽️ Projector mode</h2>
      <p className="text-xs text-slate-600">Run any mode from the front of the room, no child account. Results open in the preview above. Sound: {klass.soundEnabled ? "on" : "off"}.</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {config.modes.filter((m) => m.interaction !== "chat").map((m) => (
          <button key={m.id} onClick={() => { setModeId(m.id); setLastArtifact(null); setActive(null); }} className={cx("rounded-lg px-3 py-1 text-sm font-bold ring-2", modeId === m.id ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-violet-800 ring-violet-200")}>
            {m.emoji} {m.name}
          </button>
        ))}
      </div>
      <div className="mt-3">
        {lastArtifact ? (
          <div className="space-y-2">
            <ChangeBox hint={mode.changeHint} maxChars={config.maxFieldChars} busy={busy} onSubmit={(change) => run("change", { change })} />
            <SmallBtn onClick={() => { setLastArtifact(null); setActive(null); }}>Start a new one</SmallBtn>
          </div>
        ) : (
          <ModeForm mode={mode} maxChars={config.maxFieldChars} busy={busy} onSubmit={(v) => run("create", v)} submitLabel="Make it on the big screen" />
        )}
      </div>
      {active && <div className="mt-3"><RequestStatus request={active} /></div>}
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Delete class
 * ------------------------------------------------------------------ */

function DangerZone({ klass, classId, onDeleted }: { klass: PublicClass; classId: number; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Card className="ring-rose-200">
      <h2 className="text-lg font-extrabold text-rose-800">Delete this class</h2>
      <p className="text-xs text-slate-600">Permanently removes every child, request, artifact and audit entry for this class. Export first if you need a record. Type the class name to confirm.</p>
      {error && <div className="mt-2"><Notice>{error}</Notice></div>}
      <div className="mt-2 flex gap-2">
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={klass.name} className={inputCls} />
        <BigButton
          variant="danger"
          className="!px-4 !py-2 !text-base"
          disabled={confirm.trim() !== klass.name}
          onClick={async () => {
            try {
              await fDeleteClass(classId, confirm);
              onDeleted();
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Delete failed.");
            }
          }}
        >
          Delete forever
        </BigButton>
      </div>
    </Card>
  );
}

function CapabilityStrip({ config }: { config: StudioConfig }) {
  const caps = config.capabilities;
  const items: { label: string; cap: { provider: string; ready: boolean } }[] = [
    { label: "Text & code", cap: caps.text },
    { label: "Open-source text", cap: caps.ossText },
    { label: "Images", cap: caps.image },
    { label: "Video", cap: caps.video },
    { label: "Music", cap: caps.music },
    { label: "Read-aloud", cap: caps.tts },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-bold text-slate-600">Models:</span>
      {items.map((i) => (
        <span key={i.label} className={cx("rounded-full px-2 py-0.5 font-semibold ring-1", i.cap.ready ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200")} title={i.cap.provider}>
          {i.label}: {i.cap.ready ? i.cap.provider : "off"}
        </span>
      ))}
      <span className={cx("rounded-full px-2 py-0.5 font-semibold ring-1", caps.screening.configured ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : caps.screening.required ? "bg-rose-50 text-rose-800 ring-rose-200" : "bg-amber-50 text-amber-800 ring-amber-200")}>
        Screening: {caps.screening.configured ? "on" : caps.screening.required ? "MISSING (fail closed)" : "off (dev)"}
      </span>
      {caps.mock && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900 ring-1 ring-amber-300">MOCK AI</span>}
    </div>
  );
}
