/**
 * The Hub — /aiforkids/hub
 *
 * One signed-in place where Humanity + AI does its AI work. No code required:
 * every tool is a form, every result is a card, and everything files itself
 * under a project.
 *
 * It runs on the same screened pipeline as the children's Studio. A staff
 * workspace is a class row with no children, so Azure AI Content Safety,
 * prompt shields, output screening, the game code scan and the audit log all
 * apply to adult work exactly as they do to a child's. The only differences
 * are the limits: no ticket meter, every tool unlocked, media approved on
 * arrival because the adult here is the approver.
 *
 * Four things live here:
 *   Tools    — the multimodal studios, each a no-code form
 *   Projects — everything made, grouped and named
 *   Program  — the eight week modules of "Make It With AI", with run-sheets
 *   Classes  — the live children's classes, and the way into the dashboard
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ApiError,
  adminAccounts,
  adminSetRole,
  authForgot,
  authReset,
  authSignup,
  authVerify,
  fLogin,
  fLogout,
  fMe,
  getArtifact,
  hubCreateProject,
  hubDeleteProject,
  hubFileArtifact,
  hubLoad,
  hubPatchProject,
  hubProject,
  hubRequest,
  hubSubmit,
  getConfig,
  googleStartUrl,
  waitForRequest,
  type Artifact,
  type ArtifactMeta,
  type Facilitator,
  type HubState,
  type ModeDef,
  type ModeId,
  type Project,
  type Role,
  type StudioConfig,
  type StudioRequest,
} from "./api";
import { ArtifactView, BigButton, Card, ChangeBox, ForgeSteps, ModeForm, Notice, RequestStatus, Spinner, kindEmoji } from "./components";
import { BASE } from "../content/program";
import { WEEK_MODULES, SESSION_RHYTHM, type WeekModule } from "../content/weeks";

const STAFF_FIELD_CHARS = 1200;
const STAFF_CHAT_CHARS = 4000;

type Tab = "tools" | "projects" | "program" | "classes" | "people";

export default function HubApp() {
  const [location] = useLocation();
  const [me, setMe] = useState<Facilitator | null | undefined>(undefined);

  useEffect(() => {
    fMe()
      .then((r) => setMe(r.facilitator))
      .catch(() => setMe(null));
  }, []);

  // /aiforkids/week/3 and /aiforkids/hub/week/3 both open a week module.
  const weekMatch = /\/week\/(\d+)/.exec(location);
  const week = weekMatch ? WEEK_MODULES.find((w) => w.n === Number(weekMatch[1])) : undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <Link href={`${BASE}/hub`} className="flex items-center gap-3">
            <span className="text-2xl">🛠️</span>
            <span>
              <span className="block text-lg font-extrabold tracking-tight text-violet-800">Humanity + AI Hub</span>
              <span className="block text-xs text-slate-500">Guarded AI workspace</span>
            </span>
          </Link>
          {me && (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-slate-600 sm:inline">{me.displayName} · {me.email}</span>
              <BigButton variant="ghost" href={`${BASE}/facilitator`} className="!px-3 !py-1.5 !text-sm">
                Class dashboard
              </BigButton>
              <BigButton
                variant="ghost"
                className="!px-3 !py-1.5 !text-sm"
                onClick={async () => {
                  await fLogout().catch(() => {});
                  setMe(null);
                }}
              >
                Sign out
              </BigButton>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        {me === undefined && <Spinner label="Loading the Hub…" />}
        {me === null && <HubLogin onDone={setMe} />}
        {me && week && <WeekView week={week} />}
        {me && !week && <HubShell />}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sign-in
 * ------------------------------------------------------------------ */

type AuthMode = "signin" | "signup" | "forgot" | "reset" | "sent" | "verifying";

/**
 * One card for every way in: sign in, create an account, forget a password,
 * choose a new one, and Google.
 *
 * Verification and reset links land on this page as ?verify= / ?reset=, so
 * there is no second page to keep in step.
 */
function HubLogin({ onDone }: { onDone: (f: Facilitator) => void }) {
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  // A link from an email, or an error bounced back from Google.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const verify = q.get("verify");
    const reset = q.get("reset");
    const err = q.get("error");
    if (err) setError(err);
    if (reset) {
      setToken(reset);
      setMode("reset");
      clean();
    } else if (verify) {
      setMode("verifying");
      authVerify(verify)
        .then((r) => onDone(r.facilitator))
        .catch((e) => {
          setError(e instanceof ApiError ? e.message : "That link didn't work.");
          setMode("signin");
        })
        .finally(clean);
    }
    function clean() {
      window.history.replaceState({}, "", `${BASE}/hub`);
    }
  }, [onDone]);

  const heading =
    mode === "signup" ? "Create your account"
    : mode === "forgot" ? "Reset your password"
    : mode === "reset" ? "Choose a new password"
    : mode === "sent" ? "Check your email"
    : mode === "verifying" ? "Confirming your email…"
    : "Sign in to the Hub";

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "verifying") {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-extrabold">{heading}</h1>
        <div className="mt-6"><Spinner /></div>
      </Card>
    );
  }

  if (mode === "sent") {
    return (
      <Card className="mx-auto max-w-md">
        <p className="text-5xl">📬</p>
        <h1 className="mt-2 text-2xl font-extrabold">{heading}</h1>
        <p className="mt-2 text-slate-700">{note}</p>
        <p className="mt-4 text-sm text-slate-500">
          Nothing after a few minutes? Check spam, and make sure the address is right — for your safety we don't say whether an
          address has an account here.
        </p>
        <BigButton variant="ghost" className="mt-6 w-full" onClick={() => { setMode("signin"); setNote(null); }}>
          ← Back to sign in
        </BigButton>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-extrabold">{heading}</h1>
      {mode === "signin" && (
        <p className="mt-1 text-sm text-slate-600">
          Children have their own door at{" "}
          <Link href={`${BASE}/studio`} className="font-semibold text-violet-700 underline">/aiforkids/studio</Link>.
        </p>
      )}
      {mode === "signup" && (
        <p className="mt-1 text-sm text-slate-600">
          You'll get your own private workspace and the AI tools. Working with a class of children needs separate approval from a
          Humanity + AI admin.
        </p>
      )}
      {mode === "forgot" && <p className="mt-1 text-sm text-slate-600">We'll email you a link that works once, for an hour.</p>}

      {config?.googleReady && (mode === "signin" || mode === "signup") && (
        <>
          <a
            href={googleStartUrl}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-base font-bold text-slate-700 transition hover:border-violet-300 hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
              <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
            </svg>
            Continue with Google
          </a>
          <div className="my-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          void run(async () => {
            if (mode === "signin") {
              const r = await fLogin(email, password);
              onDone(r.facilitator);
            } else if (mode === "signup") {
              await authSignup({ email, password, displayName });
              setNote(`If that address can take mail, a confirmation link is on its way to ${email}. Click it and you're in.`);
              setMode("sent");
            } else if (mode === "forgot") {
              await authForgot(email);
              setNote(`If an account exists for ${email}, a reset link is on its way.`);
              setMode("sent");
            } else if (mode === "reset") {
              const r = await authReset(token, password);
              onDone(r.facilitator);
            }
          });
        }}
      >
        {mode === "signup" && (
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" autoComplete="name" className={inputCls} maxLength={80} />
        )}
        {mode !== "reset" && (
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username" className={inputCls} />
        )}
        {mode !== "forgot" && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signin" ? "Password" : "New password — at least 10 characters"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className={inputCls}
          />
        )}
        {error && <Notice>{error}</Notice>}
        <BigButton
          type="submit"
          disabled={
            busy ||
            (mode === "signin" && (!email || !password)) ||
            (mode === "signup" && (!email || password.length < 10 || displayName.trim().length < 2)) ||
            (mode === "forgot" && !email) ||
            (mode === "reset" && password.length < 10)
          }
          className="w-full"
        >
          {busy ? "Working…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "forgot" ? "Email me a link" : "Set new password"}
        </BigButton>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm">
        {mode === "signin" && (
          <>
            <button onClick={() => { setMode("forgot"); setError(null); }} className="font-semibold text-violet-700 hover:underline">
              Forgot your password?
            </button>
            {config?.signupsOpen !== false && (
              <button onClick={() => { setMode("signup"); setError(null); }} className="font-semibold text-violet-700 hover:underline">
                Create an account
              </button>
            )}
          </>
        )}
        {mode !== "signin" && (
          <button onClick={() => { setMode("signin"); setError(null); }} className="font-semibold text-violet-700 hover:underline">
            ← Back to sign in
          </button>
        )}
      </div>
    </Card>
  );
}

const inputCls = "w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-base focus:border-violet-500 focus:outline-none";

/* ------------------------------------------------------------------ *
 * The Hub itself
 * ------------------------------------------------------------------ */

function HubShell() {
  const [state, setState] = useState<HubState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("tools");
  const [tool, setTool] = useState<ModeId | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);

  const load = useCallback(
    () =>
      hubLoad()
        .then(setState)
        .catch((e) => setError(e instanceof ApiError ? e.message : "Could not open the Hub.")),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <Notice>{error}</Notice>;
  if (!state) return <Spinner label="Opening your workspace…" />;

  const activeTool = tool ? state.tools.find((t) => t.id === tool) ?? null : null;
  if (activeTool) return <ToolRunner state={state} mode={activeTool} onBack={() => { setTool(null); void load(); }} />;
  if (projectId !== null) return <ProjectView id={projectId} projects={state.projects} onBack={() => { setProjectId(null); void load(); }} />;

  return (
    <div className="space-y-6">
      <Welcome state={state} />
      <nav className="flex flex-wrap gap-2">
        {(
          [
            ["tools", `🧰 Tools · ${state.tools.length}`],
            ["projects", `📁 Projects · ${state.projects.length}`],
            ["program", "🗓️ 8-week program"],
            ["classes", `👋 Classes · ${state.classes.length}`],
            ...(state.facilitator.isAdmin ? ([["people", "🔑 People"]] as [Tab, string][]) : []),
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={
              tab === id
                ? "rounded-full bg-violet-700 px-4 py-2 text-sm font-bold text-white"
                : "rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:ring-violet-300"
            }
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "tools" && <ToolsTab state={state} onOpen={setTool} />}
      {tab === "projects" && <ProjectsTab state={state} onOpen={setProjectId} onChanged={load} />}
      {tab === "program" && <ProgramTab />}
      {tab === "classes" && <ClassesTab state={state} />}
      {tab === "people" && <PeopleTab me={state.facilitator} />}
    </div>
  );
}

function Welcome({ state }: { state: HubState }) {
  const c = state.capabilities;
  const chips: { label: string; ready: boolean; detail: string }[] = [
    { label: "Text & code", ready: c.text.ready, detail: c.text.provider },
    { label: "Open-source text", ready: c.ossText.ready, detail: c.ossText.provider },
    { label: "Images", ready: c.image.ready, detail: c.image.provider },
    { label: "Video", ready: c.video.ready, detail: c.video.provider },
    { label: "Music", ready: c.music.ready, detail: c.music.provider },
    { label: "Read aloud", ready: c.tts.ready, detail: c.tts.provider },
  ];
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Welcome back, {state.facilitator.displayName}.</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Everything here runs through the same safety pipeline the children use — screening on the way in, screening on the way
            out, and an audit line for every request. Nothing you make is visible to a class unless you put it there.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((ch) => (
            <span
              key={ch.label}
              title={ch.ready ? `Provider: ${ch.detail}` : "Not switched on yet"}
              className={
                ch.ready
                  ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200"
                  : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200"
              }
            >
              {ch.ready ? "●" : "○"} {ch.label}
            </span>
          ))}
          <span
            className={
              state.capabilities.screening.configured
                ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200"
                : "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200"
            }
          >
            🛡️ Screening {state.capabilities.screening.configured ? "on" : "off"}
            {state.capabilities.screening.required ? " · fail closed" : ""}
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Tools
 * ------------------------------------------------------------------ */

const TOOL_ICON: Record<ModeId, string> = {
  game: "🎮",
  story: "📚",
  prompt: "🎨",
  quest: "🧭",
  video: "🎬",
  robot: "🤖",
  homework: "📝",
};

/**
 * The tool blurbs in modes.ts are written for eight-year-olds, which is right
 * in the Studio and wrong here. These are the same tools described to an adult.
 */
const STAFF_BLURB: Record<ModeId, string> = {
  game: "A complete single-file browser game from a short brief. Playable here in a locked sandbox, then changed one instruction at a time. Good for demo games and Week 1 backups.",
  story: "A six-panel comic script or short illustrated story, with a cover description you can hand to an image model. Good for samples, family handouts and Week 2 exemplars.",
  prompt: "Prompt engineering as a form: who or what, where, mood. Shows the assembled prompt, and renders it when an image model is switched on. Good for posters and the Prompt Detective set.",
  quest: "A fact list, quiz or outline on a topic, with every claim flagged for checking. Good for Explorer supports and anything you will verify before it reaches a child.",
  video: "A three-shot storyboard, and a short clip when a video model is switched on. Good for promo pieces and Week 3 examples.",
  robot: "A parts list, build steps, micro:bit starter code and a safety note. Good for Robotics Lab planning and the Inventor Quest path.",
  homework: "Socratic tutoring: it asks questions and works step by step rather than handing over an answer. Good for testing what children will actually get back.",
};

function toolReady(state: HubState, id: ModeId): boolean {
  const c = state.capabilities;
  if (id === "prompt") return c.text.ready;
  if (id === "video") return c.text.ready;
  return c.text.ready;
}

function toolNote(state: HubState, id: ModeId): string | null {
  const c = state.capabilities;
  if (id === "prompt" && !c.image.ready) return "Writes and assembles the prompt. Turn on an image model to see the picture.";
  if (id === "video" && !c.video.ready) return "Writes the storyboard. Turn on a video model to render the clip.";
  return null;
}

function ToolsTab({ state, onOpen }: { state: HubState; onOpen: (id: ModeId) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.tools.map((t) => {
          const ready = toolReady(state, t.id);
          const note = toolNote(state, t.id);
          return (
            <button
              key={t.id}
              disabled={!ready}
              onClick={() => onOpen(t.id)}
              className="flex h-full flex-col rounded-2xl bg-white p-5 text-left ring-1 ring-slate-200 transition enabled:hover:-translate-y-0.5 enabled:hover:ring-violet-400 disabled:opacity-50"
            >
              <span className="text-3xl">{TOOL_ICON[t.id]}</span>
              <span className="mt-2 text-lg font-extrabold">{t.name}</span>
              <span className="mt-1 flex-1 text-sm text-slate-600">{STAFF_BLURB[t.id] ?? t.blurb}</span>
              {note && <span className="mt-3 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">{note}</span>}
              <span className="mt-3 text-xs font-bold uppercase tracking-wide text-violet-700">
                {t.interaction === "chat" ? "Conversation" : t.interaction === "both" ? "Form + conversation" : "Form"}
              </span>
            </button>
          );
        })}
      </div>
      <Card tone="tint">
        <p className="text-sm text-slate-700">
          <strong>No code required.</strong> Each tool is a short form. Fill it in, press the button, and the result arrives as a
          card you can play, read, change or file under a project. To change something, open it and describe the change in a
          sentence — you never edit the output by hand.
        </p>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Running a tool
 * ------------------------------------------------------------------ */

type ChatTurn = { role: "user" | "assistant"; text: string };

function ToolRunner({ state, mode, onBack }: { state: HubState; mode: ModeDef; onBack: () => void }) {
  const [request, setRequest] = useState<StudioRequest | null>(null);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [chatText, setChatText] = useState("");
  const [projectId, setProjectId] = useState<number | "">(state.projects[0]?.id ?? "");
  const [filed, setFiled] = useState(false);

  const run = useCallback(
    async (kind: "create" | "change" | "chat", input: Record<string, string>) => {
      setBusy(true);
      setError(null);
      try {
        const { request: started } = await hubSubmit({
          mode: mode.id,
          kind,
          projectArtifactId: kind !== "create" && artifact ? artifact.id : undefined,
          input,
        });
        setRequest(started);
        const done = await waitForRequest(started.id, hubRequest, setRequest, 300_000);
        setRequest(done);
        if (done.status === "done" && done.resultArtifactId) {
          const { artifact: a } = await getArtifact(done.resultArtifactId);
          setArtifact(a);
          setFiled(false);
          if (kind === "chat" && a.kind === "chat") {
            try {
              const parsed = JSON.parse(a.content);
              setTurns(parsed.turns ?? []);
            } catch {
              /* leave the transcript as it is */
            }
          }
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "That didn't go through.");
      } finally {
        setBusy(false);
      }
    },
    [mode.id, artifact],
  );

  const canChat = mode.interaction !== "form";
  const canForm = mode.interaction !== "chat";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <BigButton variant="ghost" onClick={onBack} className="!px-3 !py-1.5 !text-sm">
            ← All tools
          </BigButton>
          <h1 className="mt-2 text-2xl font-extrabold">
            {TOOL_ICON[mode.id]} {mode.name}
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">{STAFF_BLURB[mode.id] ?? mode.blurb}</p>
        </div>
      </div>

      {error && <Notice>{error}</Notice>}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          {canForm && !artifact && (
            <Card>
              <h2 className="mb-3 text-lg font-extrabold">Make something</h2>
              <ModeForm mode={mode} maxChars={STAFF_FIELD_CHARS} busy={busy} onSubmit={(v) => void run("create", v)} submitLabel="Run it" />
            </Card>
          )}

          {artifact && canForm && (
            <Card>
              <h2 className="mb-2 text-lg font-extrabold">Change it</h2>
              <p className="mb-3 text-sm text-slate-600">Describe one change in a sentence. The rest stays as it is.</p>
              <ChangeBox hint="e.g. make the enemies slower and add a score counter" maxChars={STAFF_FIELD_CHARS} busy={busy} onSubmit={(change) => void run("change", { change })} />
              <div className="mt-4 border-t border-slate-100 pt-4">
                <BigButton
                  variant="ghost"
                  className="!px-3 !py-1.5 !text-sm"
                  onClick={() => {
                    setArtifact(null);
                    setRequest(null);
                    setTurns([]);
                  }}
                >
                  Start something new
                </BigButton>
              </div>
            </Card>
          )}

          {canChat && (
            <Card>
              <h2 className="mb-3 text-lg font-extrabold">{canForm ? "Ask the helper" : "Conversation"}</h2>
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {turns.length === 0 && <p className="text-sm text-slate-500">{mode.chatGreeting ?? "Ask a question to start."}</p>}
                {turns.map((t, i) => (
                  <div key={i} className={t.role === "user" ? "text-right" : ""}>
                    <span
                      className={
                        t.role === "user"
                          ? "inline-block max-w-[85%] rounded-2xl bg-violet-700 px-3 py-2 text-left text-sm text-white"
                          : "inline-block max-w-[85%] rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-800"
                      }
                    >
                      {t.text}
                    </span>
                  </div>
                ))}
                {busy && <Spinner label="Thinking…" />}
              </div>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = chatText.trim();
                  if (t.length < 2 || busy) return;
                  setTurns((prev) => [...prev, { role: "user", text: t }]);
                  setChatText("");
                  void run("chat", { message: t });
                }}
              >
                <input
                  value={chatText}
                  maxLength={STAFF_CHAT_CHARS}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder={mode.chatPlaceholder ?? "Ask a question…"}
                  disabled={busy}
                  className="flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-base focus:border-violet-500 focus:outline-none disabled:opacity-60"
                />
                <BigButton type="submit" disabled={chatText.trim().length < 2 || busy}>
                  Send
                </BigButton>
              </form>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {request && <RequestStatus request={request} />}
          {request?.progress && request.progress.length > 0 && (
            <Card>
              <h2 className="mb-1 text-lg font-extrabold">
                {request.status === "done" ? "How it was built" : "Building it"}
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                Designed, written, then actually run and repaired before you see it.
              </p>
              <ForgeSteps steps={request.progress} />
            </Card>
          )}
          {!request && !artifact && (
            <Card tone="tint">
              <p className="text-sm text-slate-700">Results appear here. Everything you make is private to your workspace until you file it under a project or hand it to a class.</p>
            </Card>
          )}
          {artifact && artifact.kind !== "chat" && (
            <Card>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold">
                  {kindEmoji(artifact.kind)} {artifact.title}
                </h2>
                <span className="text-xs font-semibold text-slate-500">v{artifact.version}</span>
              </div>
              <ArtifactView artifact={artifact} />
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <label className="text-sm font-semibold text-slate-700">File under</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
                >
                  <option value="">No project</option>
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <BigButton
                  className="!px-3 !py-1.5 !text-sm"
                  disabled={projectId === "" || filed}
                  onClick={async () => {
                    if (projectId === "") return;
                    await hubFileArtifact(artifact.id, projectId).catch(() => {});
                    setFiled(true);
                  }}
                >
                  {filed ? "Filed ✓" : "File it"}
                </BigButton>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Projects
 * ------------------------------------------------------------------ */

function ProjectsTab({ state, onOpen, onChanged }: { state: HubState; onOpen: (id: number) => void; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const g: Record<string, Project[]> = { program: [], org: [], class: [] };
    for (const p of state.projects) (g[p.kind] ?? g.org).push(p);
    return g;
  }, [state.projects]);

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-5">
        {state.projects.length === 0 && (
          <Card tone="tint">
            <p className="text-sm text-slate-700">
              No projects yet. A project is just a named folder for work — “Fall cohort at Lakewood”, “Grant application”,
              “ROSIE explainer”. Make one on the right, then file anything you create under it.
            </p>
          </Card>
        )}
        {(["program", "org", "class"] as const).map((kind) =>
          grouped[kind].length ? (
            <div key={kind}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                {kind === "program" ? "Program" : kind === "class" ? "Classes" : "Organization"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {grouped[kind].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpen(p.id)}
                    className="rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200 transition hover:ring-violet-400"
                  >
                    <p className="text-lg font-extrabold">{p.name}</p>
                    {p.summary && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.summary}</p>}
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {p.artifacts ?? 0} {p.artifacts === 1 ? "piece" : "pieces"}
                      {p.week ? ` · Week ${p.week}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null,
        )}
      </div>

      <Card>
        <h2 className="text-lg font-extrabold">New project</h2>
        <form
          className="mt-3 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            try {
              await hubCreateProject({ name: name.trim(), summary: summary.trim() });
              setName("");
              setSummary("");
              setError(null);
              onChanged();
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Could not create that project.");
            }
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" className={inputCls} maxLength={80} />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What is it for? (optional)"
            rows={3}
            maxLength={400}
            className={inputCls}
          />
          {error && <Notice>{error}</Notice>}
          <BigButton type="submit" disabled={!name.trim()} className="w-full">
            Create project
          </BigButton>
        </form>
      </Card>
    </div>
  );
}

function ProjectView({ id, projects, onBack }: { id: number; projects: Project[]; onBack: () => void }) {
  const [data, setData] = useState<{ project: Project; artifacts: ArtifactMeta[] } | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fallback = projects.find((p) => p.id === id);

  useEffect(() => {
    hubProject(id)
      .then((r) => {
        setData(r);
        if (r.artifacts.length) setOpen(r.artifacts[0].id);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not open that project."));
  }, [id]);

  useEffect(() => {
    if (open === null) {
      setArtifact(null);
      return;
    }
    getArtifact(open)
      .then((r) => setArtifact(r.artifact))
      .catch(() => setArtifact(null));
  }, [open]);

  return (
    <div className="space-y-5">
      <BigButton variant="ghost" onClick={onBack} className="!px-3 !py-1.5 !text-sm">
        ← All projects
      </BigButton>
      {error && <Notice>{error}</Notice>}
      <div>
        <h1 className="text-2xl font-extrabold">{data?.project.name ?? fallback?.name ?? "Project"}</h1>
        {(data?.project.summary || fallback?.summary) && <p className="mt-1 text-slate-600">{data?.project.summary ?? fallback?.summary}</p>}
      </div>
      {!data && !error && <Spinner />}
      {data && data.artifacts.length === 0 && (
        <Card tone="tint">
          <p className="text-sm text-slate-700">Nothing filed here yet. Make something in Tools and choose this project when you file it.</p>
        </Card>
      )}
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-2">
          {data?.artifacts.map((a) => (
            <button
              key={a.id}
              onClick={() => setOpen(a.id)}
              className={
                open === a.id
                  ? "w-full rounded-xl bg-violet-700 px-3 py-2 text-left text-sm font-bold text-white"
                  : "w-full rounded-xl bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:ring-violet-300"
              }
            >
              {kindEmoji(a.kind)} {a.title}
            </button>
          ))}
        </div>
        <div>
          {artifact ? (
            <Card>
              <h2 className="mb-3 text-lg font-extrabold">
                {kindEmoji(artifact.kind)} {artifact.title}
              </h2>
              <ArtifactView artifact={artifact} />
            </Card>
          ) : (
            data && data.artifacts.length > 0 && <Card tone="tint"><p className="text-sm text-slate-600">Pick a piece on the left to open it.</p></Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The eight-week program
 * ------------------------------------------------------------------ */

function ProgramTab() {
  return (
    <div className="space-y-4">
      <Card tone="tint">
        <h2 className="text-lg font-extrabold">Make It With AI · eight weeks, grades 3–5</h2>
        <p className="mt-1 text-sm text-slate-700">
          Each module is the full run-sheet for one 60-minute session: what to prepare, the minute-by-minute agenda, what to
          watch for, and the exact Studio modes to unlock. These pages are for facilitators only.
        </p>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {WEEK_MODULES.map((w) => (
          <Link
            key={w.n}
            href={`${BASE}/hub/week/${w.n}`}
            className="flex h-full flex-col rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-violet-400"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-violet-600">Week {w.n}</span>
            <span className="mt-1 text-lg font-extrabold">{w.title}</span>
            <span className="mt-1 flex-1 text-sm text-slate-600">{w.hook}</span>
            <span className="mt-3 flex flex-wrap gap-1">
              {w.studioModes.length === 0 ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">No AI this week</span>
              ) : (
                w.studioModes.map((m) => (
                  <span key={m} className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800">
                    {TOOL_ICON[m]}
                  </span>
                ))
              )}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function WeekView({ week }: { week: WeekModule }) {
  const prev = WEEK_MODULES.find((w) => w.n === week.n - 1);
  const next = WEEK_MODULES.find((w) => w.n === week.n + 1);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BigButton variant="ghost" href={`${BASE}/hub`} className="!px-3 !py-1.5 !text-sm">
          ← Hub
        </BigButton>
        <div className="flex gap-2">
          {prev && (
            <BigButton variant="ghost" href={`${BASE}/hub/week/${prev.n}`} className="!px-3 !py-1.5 !text-sm">
              ← Week {prev.n}
            </BigButton>
          )}
          {next && (
            <BigButton variant="ghost" href={`${BASE}/hub/week/${next.n}`} className="!px-3 !py-1.5 !text-sm">
              Week {next.n} →
            </BigButton>
          )}
        </div>
      </div>

      <Card>
        <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Week {week.n} · {week.hook}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{week.title}</h1>
        <p className="mt-2 max-w-3xl text-slate-700">{week.summary}</p>
        <p className="mt-4 rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-900">
          Big question: {week.bigQuestion}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-slate-700">Unlock in the Studio:</span>
          {week.studioModes.length === 0 ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Nothing — lock all modes for the Expo</span>
          ) : (
            week.studioModes.map((m) => (
              <span key={m} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-900">
                {TOOL_ICON[m]} {m}
              </span>
            ))
          )}
          {week.ticketLimit !== null && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
              Ticket limit {week.ticketLimit}
            </span>
          )}
          <BigButton href={`${BASE}/facilitator`} className="!px-3 !py-1.5 !text-sm">
            Set it on the dashboard →
          </BigButton>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <Card>
            <h2 className="text-lg font-extrabold">The hour</h2>
            <ol className="mt-3 space-y-3">
              {week.agenda.map((b, i) => (
                <li key={i} className="grid gap-1 border-l-4 border-violet-200 pl-4 sm:grid-cols-[7rem_1fr] sm:gap-3">
                  <span className="text-sm font-bold text-violet-800">
                    {b.time}
                    <span className="block text-xs font-semibold text-slate-500">{b.block}</span>
                  </span>
                  <span className="text-sm text-slate-700">{b.detail}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <h2 className="text-lg font-extrabold">Prompt starter</h2>
            <p className="mt-1 text-sm text-slate-600">For the Spark demo. Type it on the projector, filling the brackets with the room's answers.</p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-sm text-slate-100">{week.promptStarter}</pre>
          </Card>

          <Card>
            <h2 className="text-lg font-extrabold">Coaching notes</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {week.facilitatorNotes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">Differentiation</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {week.differentiation.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-5">
          <Card tone="good">
            <h2 className="text-lg font-extrabold">AI Truth</h2>
            <p className="mt-2 text-slate-800">{week.aiTruth}</p>
          </Card>
          <Card>
            <h2 className="text-lg font-extrabold">Before the session</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {week.prep.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-slate-400">☐</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">Materials</h3>
            <p className="mt-2 text-sm text-slate-700">{week.tools}</p>
          </Card>
          <Card tone="warn">
            <h2 className="text-lg font-extrabold">Watch out for</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-800">
              {week.watchOuts.map((w2, i) => (
                <li key={i}>{w2}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="text-lg font-extrabold">Kids will</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {week.kidsWill.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
            <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">After the session</h3>
            <p className="mt-2 text-sm text-slate-700">{week.takeHome}</p>
          </Card>
        </div>
      </div>

      <Card tone="tint">
        <h2 className="text-lg font-extrabold">The rhythm, every week</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-5">
          {SESSION_RHYTHM.map((r) => (
            <li key={r.block} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <p className="text-xs font-bold text-violet-700">{r.time}</p>
              <p className="text-sm font-extrabold">{r.block}</p>
              <p className="mt-1 text-xs text-slate-600">{r.detail}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * People (admins only)
 * ------------------------------------------------------------------ */

const ROLE_BLURB: Record<Role, string> = {
  member: "Own workspace and tools. No access to any class or child.",
  facilitator: "Can create classes, add children and record consent.",
  admin: "Everything, plus managing people.",
};

function PeopleTab({ me }: { me: Facilitator }) {
  const [accounts, setAccounts] = useState<Facilitator[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(
    () => adminAccounts().then((r) => setAccounts(r.accounts)).catch((e) => setError(e instanceof ApiError ? e.message : "Could not load accounts.")),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  async function change(id: number, role: Role) {
    setBusyId(id);
    setError(null);
    try {
      await adminSetRole(id, role);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not change that role.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card tone="tint">
        <h2 className="text-lg font-extrabold">Who can do what</h2>
        <p className="mt-2 text-sm text-slate-700">
          Anyone may sign up, and a new account is a <strong>member</strong>: its own workspace and the AI tools, and nothing
          else. Granting <strong>facilitator</strong> gives access to children's records — nicknames, work and consent. Grant it
          only to people you have trained and cleared.
        </p>
      </Card>
      {error && <Notice>{error}</Notice>}
      {!accounts && <Spinner />}
      <div className="space-y-2">
        {accounts?.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold">
                {a.displayName}
                {a.id === me.id && <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800">you</span>}
              </p>
              <p className="truncate text-sm text-slate-600">{a.email}</p>
              <p className="mt-1 text-xs text-slate-500">
                {a.emailVerified ? "✓ email confirmed" : "○ email not confirmed"}
                {a.usesGoogle ? " · Google" : ""}
                {!a.hasPassword ? " · no password set" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden max-w-xs text-xs text-slate-500 sm:block">{ROLE_BLURB[a.role]}</span>
              <select
                value={a.role}
                disabled={busyId === a.id || a.id === me.id}
                onChange={(e) => void change(a.id, e.target.value as Role)}
                className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-semibold focus:border-violet-500 focus:outline-none disabled:opacity-50"
              >
                <option value="member">Member</option>
                <option value="facilitator">Facilitator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Classes
 * ------------------------------------------------------------------ */

function ClassesTab({ state }: { state: HubState }) {
  if (!state.facilitator.canRunClasses) {
    return (
      <div className="space-y-4">
        <Card tone="tint">
          <h2 className="text-lg font-extrabold">Classes need facilitator access</h2>
          <p className="mt-2 text-sm text-slate-700">
            Your account has the full Hub — every tool, your own workspace, your own projects. What it doesn't have is any child's
            record, and that's deliberate: nobody reaches a child's nickname, work or consent form just by signing up.
          </p>
          <p className="mt-2 text-sm text-slate-700">
            When you're trained and cleared to run a club, a Humanity + AI admin grants facilitator access and this tab fills in.
          </p>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {state.classes.length === 0 && (
        <Card tone="tint">
          <p className="text-sm text-slate-700">
            No classes yet. Create one on the{" "}
            <Link href={`${BASE}/facilitator`} className="font-semibold text-violet-700 underline">
              class dashboard
            </Link>
            , add each child's nickname and PIN, record consent, and give the class its code.
          </p>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {state.classes.map((c) => (
          <div key={c.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-lg font-extrabold">{c.name}</p>
            <p className="font-mono text-2xl font-bold tracking-widest text-violet-700">{c.code}</p>
            <p className="mt-1 text-xs text-slate-500">
              {c.modes.length ? c.modes.join(", ") : "no modules unlocked"} · {c.paused ? "paused" : "live"} · {c.locked ? "locked" : "open"}
            </p>
            <BigButton href={`${BASE}/facilitator`} className="mt-3 !px-3 !py-1.5 !text-sm">
              Open dashboard →
            </BigButton>
          </div>
        ))}
      </div>
      <Card>
        <h2 className="text-lg font-extrabold">The two doors</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-violet-50 p-4">
            <p className="font-extrabold">Children</p>
            <p className="mt-1 text-sm text-slate-700">Class code, nickname, PIN. Only the modules you unlocked. Ticket limits, image approval, no chat unless you allow it.</p>
            <p className="mt-2 font-mono text-sm text-violet-800">/aiforkids/studio</p>
          </div>
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="font-extrabold">Staff</p>
            <p className="mt-1 text-sm text-slate-700">This Hub and the class dashboard. Same screening, adult-sized limits, every tool unlocked.</p>
            <p className="mt-2 font-mono text-sm text-slate-700">/aiforkids/hub</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
