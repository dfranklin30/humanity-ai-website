/**
 * Kids AI Studio — the child's side. /aiforkids/studio
 *
 * Flow: class code → pick yourself → PIN → workspace.
 * The workspace shows only the modes the facilitator has unlocked, a
 * Director's Order form (never a chat box), the result in a locked sandbox,
 * the child's portfolio, and the class Arcade.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../components/ui";
import {
  ApiError,
  childArcade,
  childLogin,
  childLogout,
  childLookupClass,
  childMe,
  childPublish,
  childRequest,
  childSpeak,
  childSubmit,
  getArtifact,
  getConfig,
  waitForRequest,
  type ArtifactMeta,
  type ChildMe,
  type ModeDef,
  type ModeId,
  type StudioConfig,
  type StudioRequest,
} from "./api";
import { ArtifactLoader, BigButton, Card, ChangeBox, ChatPanel, ModeForm, Notice, RequestStatus, Spinner, kindEmoji, type ChatMsg } from "./components";

type Stage = { step: "code" } | { step: "pick"; code: string; className: string; children: { id: number; nickname: string; avatar: string }[] } | { step: "pin"; code: string; child: { id: number; nickname: string; avatar: string } } | { step: "in" };

export default function StudioApp() {
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>({ step: "code" });

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(() => setConfigError("The Studio isn't open right now."));
    // Already signed in? Jump straight in.
    childMe()
      .then(() => setStage({ step: "in" }))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-100 via-sky-50 to-white text-slate-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎬</span>
          <div>
            <p className="text-xl font-extrabold tracking-tight text-violet-800">Kids AI Studio</p>
            <p className="text-xs font-semibold text-slate-500">Humanity + AI · You are the director</p>
          </div>
        </div>
        {stage.step === "in" && (
          <BigButton
            variant="ghost"
            onClick={async () => {
              await childLogout().catch(() => {});
              setStage({ step: "code" });
            }}
          >
            Sign out
          </BigButton>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-16">
        {configError && <Notice>{configError}</Notice>}
        {!config && !configError && <Spinner label="Opening the Studio…" />}
        {config && stage.step !== "in" && <SignIn config={config} stage={stage} setStage={setStage} />}
        {config && stage.step === "in" && <Workspace config={config} onSignedOut={() => setStage({ step: "code" })} />}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sign-in
 * ------------------------------------------------------------------ */

function SignIn({ config, stage, setStage }: { config: StudioConfig; stage: Stage; setStage: (s: Stage) => void }) {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (stage.step === "code") {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <p className="text-5xl">🔑</p>
        <h1 className="mt-2 text-3xl font-extrabold">Type your class code</h1>
        <p className="mt-1 text-slate-600">It's on the board. Six letters and numbers.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              const r = await childLookupClass(code);
              setStage({ step: "pick", code, className: r.className, children: r.children });
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Try again!");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
            autoFocus
            inputMode="text"
            autoComplete="off"
            className="w-full rounded-2xl border-4 border-violet-200 px-4 py-4 text-center font-mono text-4xl font-extrabold tracking-[0.4em] text-violet-900 focus:border-violet-500 focus:outline-none"
            placeholder="ABC123"
          />
          {error && <Notice>{error}</Notice>}
          <BigButton type="submit" disabled={code.length !== 6 || busy} className="w-full">
            {busy ? "Looking…" : "Next →"}
          </BigButton>
        </form>
        <p className="mt-6 text-xs text-slate-500">The Studio is for club members. A grown-up facilitator can see everything you make. Never type your real name or private stuff.</p>
      </Card>
    );
  }

  if (stage.step === "pick") {
    return (
      <Card className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-violet-600">{stage.className}</p>
          <h1 className="text-3xl font-extrabold">Who are you?</h1>
        </div>
        {stage.children.length === 0 && <Notice>No one is unlocked in this class yet. Ask your facilitator.</Notice>}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {stage.children.map((c) => (
            <button
              key={c.id}
              onClick={() => setStage({ step: "pin", code: stage.code, child: c })}
              className="flex flex-col items-center gap-1 rounded-3xl bg-white p-4 ring-2 ring-violet-100 transition hover:-translate-y-0.5 hover:ring-violet-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
            >
              <span className="text-5xl">{c.avatar}</span>
              <span className="text-lg font-bold text-slate-800">{c.nickname}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 text-center">
          <BigButton variant="ghost" onClick={() => setStage({ step: "code" })}>
            ← Different class
          </BigButton>
        </div>
      </Card>
    );
  }

  if (stage.step !== "pin") return null;
  return (
    <Card className="mx-auto max-w-md text-center">
      <p className="text-6xl">{stage.child.avatar}</p>
      <h1 className="mt-2 text-3xl font-extrabold">Hi, {stage.child.nickname}!</h1>
      <p className="mt-1 text-slate-600">Type your 4-digit PIN.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await childLogin(stage.code, stage.child.id, pin);
            setStage({ step: "in" });
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Try again!");
            setPin("");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          autoFocus
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="w-full rounded-2xl border-4 border-violet-200 px-4 py-4 text-center font-mono text-4xl font-extrabold tracking-[0.6em] text-violet-900 focus:border-violet-500 focus:outline-none"
          placeholder="••••"
        />
        {error && <Notice>{error}</Notice>}
        <BigButton type="submit" disabled={pin.length !== 4 || busy} className="w-full">
          {busy ? "Checking…" : "Let's go! 🚀"}
        </BigButton>
      </form>
      <div className="mt-4">
        <BigButton variant="ghost" onClick={() => setStage({ step: "code" })}>
          ← Not me
        </BigButton>
      </div>
      <p className="mt-6 text-xs text-slate-500">Avatars shown: {config.avatars.length}. Only your facilitator can change your PIN.</p>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Workspace
 * ------------------------------------------------------------------ */

type Tab = "make" | "portfolio" | "arcade";

function Workspace({ config, onSignedOut }: { config: StudioConfig; onSignedOut: () => void }) {
  const [me, setMe] = useState<ChildMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("make");
  const [modeId, setModeId] = useState<ModeId | null>(null); // null = Studio hall
  const [active, setActive] = useState<StudioRequest | null>(null); // the order being watched
  const [project, setProject] = useState<ArtifactMeta | null>(null); // the artifact being worked on
  const [busy, setBusy] = useState(false);
  const [chat, setChat] = useState<{ convoId: number | null; messages: ChatMsg[]; busy: boolean }>({ convoId: null, messages: [], busy: false });
  const [showChat, setShowChat] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const m = await childMe();
      setMe(m);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onSignedOut();
      else setError("Having trouble reaching the Studio. Try again in a moment.");
    }
  }, [onSignedOut]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 15_000); // picks up pause / unlock / limit changes
    return () => clearInterval(t);
  }, [refresh]);

  const modes = useMemo(() => config.modes.filter((m) => me?.class.modes.includes(m.id)), [config, me]);
  const mode: ModeDef | undefined = modes.find((m) => m.id === modeId);
  const ticketsLeft = me ? Math.max(0, me.class.ticketLimit - me.ticketsUsed) : 0;
  const chatsLeft = me ? Math.max(0, me.class.chatTurnLimit - me.chatTurnsUsed) : 0;

  // If the facilitator locks the current module mid-session, go back to the hall.
  useEffect(() => {
    if (modeId && me && !me.class.modes.includes(modeId)) openModule(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.class.modes.join(",")]);

  function openModule(id: ModeId | null) {
    setModeId(id);
    setProject(null);
    setActive(null);
    setChat({ convoId: null, messages: [], busy: false });
    const m = config.modes.find((x) => x.id === id);
    setShowChat(m?.interaction === "chat");
    // Reload an existing transcript for chat modules so the conversation continues.
    if (m && m.interaction !== "form" && me) {
      const convo = me.portfolio.find((a) => a.kind === "chat" && a.title === `${m.name} chat`);
      if (convo) {
        getArtifact(convo.id)
          .then((r) => {
            const t = JSON.parse(r.artifact.content) as { turns?: { role: "user" | "assistant"; text: string }[] };
            setChat({ convoId: convo.id, messages: (t.turns ?? []).map((x) => ({ role: x.role, text: x.text })), busy: false });
          })
          .catch(() => {});
      }
    }
  }

  async function submit(kind: "create" | "change", input: Record<string, string>, projectArtifactId?: number) {
    if (!mode) return;
    setBusy(true);
    setError(null);
    try {
      const { request } = await childSubmit({ mode: mode.id, kind, projectArtifactId, input });
      setActive(request);
      const settled = await waitForRequest(request.id, childRequest, setActive, 300_000);
      setActive(settled);
      await refresh();
      if (settled.status === "done" && settled.resultArtifactId) {
        const m = await childMe();
        setMe(m);
        const found = m.portfolio.find((a) => a.id === settled.resultArtifactId);
        if (found) setProject(found);
        else setProject({ id: settled.resultArtifactId, kind: mode.artifactKind, title: "Waiting for your facilitator", approved: false } as ArtifactMeta);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That didn't work. Try again!");
    } finally {
      setBusy(false);
    }
  }

  async function sendChat(text: string) {
    if (!mode) return;
    setChat((c) => ({ ...c, messages: [...c.messages, { role: "user", text }], busy: true }));
    try {
      const { request } = await childSubmit({ mode: mode.id, kind: "chat", projectArtifactId: chat.convoId ?? undefined, input: { message: text } });
      const settled = await waitForRequest(request.id, childRequest, undefined, 120_000);
      const reply = settled.status === "done" ? settled.message ?? "…" : settled.message ?? "Let's try that a different way.";
      setChat((c) => ({ convoId: settled.resultArtifactId ?? c.convoId, messages: [...c.messages, { role: settled.status === "done" ? "assistant" : "system", text: reply }], busy: false }));
      void refresh();
    } catch (err) {
      setChat((c) => ({ ...c, messages: [...c.messages, { role: "system", text: err instanceof ApiError ? err.message : "The helper is taking a break. Try again in a moment." }], busy: false }));
    }
  }

  if (!me) return error ? <Notice>{error}</Notice> : <Spinner label="Getting your Studio ready…" />;

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/80 px-5 py-3 ring-1 ring-violet-100">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{me.child.avatar}</span>
          <div>
            <p className="text-lg font-extrabold">{me.child.nickname}</p>
            <p className="text-xs font-semibold text-slate-500">{me.class.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TicketMeter used={me.ticketsUsed} limit={me.class.ticketLimit} />
          <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-sky-800 ring-1 ring-sky-200" title="Helper chats left today">
            💬 {chatsLeft} chats
          </span>
        </div>
        <nav className="flex gap-2">
          {(["make", "portfolio", "arcade"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx("rounded-full px-4 py-2 text-base font-bold transition", tab === t ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-800 hover:bg-violet-100")}
            >
              {t === "make" ? "🏛️ Studios" : t === "portfolio" ? "📁 My stuff" : "🕹️ Arcade"}
            </button>
          ))}
        </nav>
      </div>

      {me.class.paused && <Notice>⏸️ Your facilitator paused the Studio. Look up front!</Notice>}
      {me.class.locked && <Notice tone="info">🔒 Portfolios are locked for the Expo. You can still play everything!</Notice>}
      {me.child.muted && <Notice>Your facilitator paused your orders for now.</Notice>}
      {error && <Notice>{error}</Notice>}

      {tab === "make" && !mode && (
        <StudioHall modes={modes} onOpen={openModule} />
      )}

      {tab === "make" && mode && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <BigButton variant="ghost" onClick={() => openModule(null)}>
              ← All studios
            </BigButton>
            {mode.interaction === "both" && (
              <BigButton variant={showChat ? "primary" : "secondary"} onClick={() => setShowChat((v) => !v)}>
                💬 {showChat ? "Hide helper chat" : "Ask the helper"}
              </BigButton>
            )}
          </div>

          {mode.interaction === "chat" ? (
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <ChatPanel mode={mode} messages={chat.messages} onSend={sendChat} busy={chat.busy} turnsLeft={chatsLeft} maxChars={config.maxChatChars} avatar={me.child.avatar} />
              <div className="space-y-3">
                <Card tone="tint">
                  <p className="text-sm font-bold uppercase tracking-wide text-violet-600">{mode.emoji} {mode.name}</p>
                  <h2 className="text-2xl font-extrabold">{mode.tagline}</h2>
                  <p className="mt-2 text-slate-700">{mode.blurb}</p>
                </Card>
                <Card tone="warn" className="text-sm text-slate-700">
                  <p className="font-bold text-amber-800">How to get the most help</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    <li>Type the problem exactly as it's written.</li>
                    <li>Say what you tried, even if it went wrong.</li>
                    <li>The helper explains steps; you do the answer.</li>
                    <li>Still stuck? Ask your facilitator or a grown-up.</li>
                  </ul>
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
              <div className="space-y-4">
                <Card>
                  <p className="text-sm font-bold uppercase tracking-wide text-violet-600">{mode.emoji} {mode.name}</p>
                  <h2 className="text-2xl font-extrabold">{project ? `Working on: ${project.title}` : mode.tagline}</h2>
                  <div className="mt-4">
                    {project ? (
                      <div className="space-y-3">
                        <ChangeBox hint={mode.changeHint} maxChars={config.maxFieldChars} busy={busy} onSubmit={(change) => submit("change", { change }, project.id)} />
                        <BigButton
                          variant="ghost"
                          onClick={() => {
                            setProject(null);
                            setActive(null);
                          }}
                        >
                          ✨ Start something new instead
                        </BigButton>
                      </div>
                    ) : (
                      <ModeForm mode={mode} maxChars={config.maxFieldChars} busy={busy} onSubmit={(values) => submit("create", values)} />
                    )}
                  </div>
                  {ticketsLeft === 0 && <div className="mt-3"><Notice>You've used all your Director's Orders for today. Time to play and test!</Notice></div>}
                </Card>
                {showChat && mode.interaction === "both" && (
                  <ChatPanel mode={mode} messages={chat.messages} onSend={sendChat} busy={chat.busy} turnsLeft={chatsLeft} maxChars={config.maxChatChars} avatar={me.child.avatar} />
                )}
                {!showChat && (
                  <Card tone="tint" className="text-sm text-slate-700">
                    <p className="font-bold text-violet-800">Director's tips</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>Three details beat one: who or what, where, and the mood.</li>
                      <li>Ask for one change at a time so you can see what happened.</li>
                      <li>The helper is an AI. It can be wrong or silly. You're the boss.</li>
                    </ul>
                  </Card>
                )}
              </div>

              <div className="space-y-3">
                {active && <RequestStatus request={active} />}
                {project && project.approved !== false ? (
                  <Card>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xl font-extrabold">
                        {kindEmoji(project.kind)} {project.title} <span className="text-sm font-semibold text-slate-500">v{project.version ?? 1}</span>
                      </h3>
                      <div className="flex gap-2">
                        {config.ttsReady && ["story", "quest", "robot"].includes(project.kind) && <SpeakButton artifactId={project.id} />}
                        {!me.class.locked && (
                          <BigButton
                            variant="secondary"
                            onClick={async () => {
                              await childPublish(project.id, !project.published).catch(() => {});
                              await refresh();
                              setProject((p) => (p ? { ...p, published: !p.published } : p));
                            }}
                          >
                            {project.published ? "Remove from Arcade" : "🕹️ Put in the Arcade"}
                          </BigButton>
                        )}
                      </div>
                    </div>
                    <ArtifactLoader id={project.id} />
                  </Card>
                ) : project ? (
                  <Card tone="warn">{mode.artifactKind === "video" ? "🎬 Your clip" : "🖼️ Your picture"} is waiting for your facilitator to take a look. Check “My stuff” in a minute.</Card>
                ) : (
                  !active && (
                    <Card tone="tint" className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                      <p className="text-6xl">{mode.emoji}</p>
                      <p className="mt-2 text-xl font-extrabold text-violet-800">Your creation shows up here</p>
                      <p className="text-slate-600">Fill in the form and hit Make it!</p>
                    </Card>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "portfolio" && (
        <Portfolio
          items={me.portfolio.filter((a) => a.kind !== "chat")}
          onOpen={(a) => {
            const m = config.modes.find((x) => x.artifactKind === a.kind);
            if (m && me.class.modes.includes(m.id)) {
              openModule(m.id);
              setProject(a);
            }
            setTab("make");
          }}
        />
      )}

      {tab === "arcade" && <Arcade />}
    </div>
  );
}

function StudioHall({ modes, onOpen }: { modes: ModeDef[]; onOpen: (id: ModeId) => void }) {
  if (!modes.length) return <Card tone="tint">No studios are unlocked yet. Your facilitator will open one soon!</Card>;
  return (
    <div>
      <h2 className="mb-3 text-2xl font-extrabold text-violet-900">Pick a studio</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onOpen(m.id)}
            className="flex flex-col items-start rounded-3xl bg-white p-5 text-left ring-2 ring-violet-100 transition hover:-translate-y-1 hover:ring-violet-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
          >
            <span className="text-5xl">{m.emoji}</span>
            <span className="mt-2 text-xl font-extrabold text-slate-900">{m.name}</span>
            <span className="text-sm font-semibold text-violet-700">{m.tagline}</span>
            <span className="mt-2 text-sm text-slate-600">{m.blurb}</span>
            <span className="mt-3 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800">
              {m.interaction === "chat" ? "💬 Chat helper" : m.interaction === "both" ? "🎬 Orders + 💬 chat" : "🎬 Director's Orders"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SpeakButton({ artifactId }: { artifactId: number }) {
  const [busy, setBusy] = useState(false);
  return (
    <BigButton
      variant="secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const { audio, mime } = await childSpeak(artifactId);
          const a = new Audio(`data:${mime};base64,${audio}`);
          await a.play();
        } catch {
          /* ignore */
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "…" : "🔊 Read it to me"}
    </BigButton>
  );
}

function TicketMeter({ used, limit }: { used: number; limit: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 ring-1 ring-amber-200" title="Director's Orders left today">
      <span className="text-sm font-bold text-amber-800">Orders</span>
      {Array.from({ length: Math.max(limit, used) }).map((_, i) => (
        <span key={i} className={cx("text-lg", i < used ? "opacity-30" : "")}>
          🎟️
        </span>
      ))}
      {limit === 0 && <span className="text-sm text-amber-800">none today</span>}
    </div>
  );
}

function Portfolio({ items, onOpen }: { items: ArtifactMeta[]; onOpen: (a: ArtifactMeta) => void }) {
  if (!items.length) return <Card tone="tint">Nothing here yet. Make something!</Card>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => (
        <button key={a.id} onClick={() => onOpen(a)} className="rounded-3xl bg-white p-4 text-left ring-2 ring-violet-100 transition hover:-translate-y-0.5 hover:ring-violet-400">
          <p className="text-3xl">{kindEmoji(a.kind)}</p>
          <p className="mt-1 text-lg font-extrabold">{a.title}</p>
          <p className="text-sm text-slate-600">{a.summary ?? ""}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            v{a.version} · {a.published ? "In the Arcade" : "Just mine"}
          </p>
        </button>
      ))}
    </div>
  );
}

function Arcade() {
  const [items, setItems] = useState<ArtifactMeta[] | null>(null);
  const [open, setOpen] = useState<ArtifactMeta | null>(null);
  useEffect(() => {
    childArcade()
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  }, []);
  if (!items) return <Spinner label="Opening the Arcade…" />;
  if (open) {
    return (
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xl font-extrabold">
            {kindEmoji(open.kind)} {open.title} <span className="text-sm font-semibold text-slate-500">by {open.avatar} {open.nickname ?? "the facilitator"}</span>
          </h3>
          <BigButton variant="ghost" onClick={() => setOpen(null)}>
            ← Back
          </BigButton>
        </div>
        <ArtifactLoader id={open.id} />
      </Card>
    );
  }
  if (!items.length) return <Card tone="tint">The Arcade is empty. Be the first to put something in!</Card>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => (
        <button key={a.id} onClick={() => setOpen(a)} className="rounded-3xl bg-white p-4 text-left ring-2 ring-violet-100 transition hover:-translate-y-0.5 hover:ring-violet-400">
          <p className="text-3xl">{kindEmoji(a.kind)}</p>
          <p className="mt-1 text-lg font-extrabold">{a.title}</p>
          <p className="text-sm text-slate-600">
            by {a.avatar} {a.nickname ?? "the facilitator"}
          </p>
        </button>
      ))}
    </div>
  );
}
