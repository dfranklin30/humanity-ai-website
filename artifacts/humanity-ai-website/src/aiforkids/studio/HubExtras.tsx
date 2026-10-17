/**
 * Hub extras — three things that make the Hub easy to run.
 *
 *   HubMap       the overview: every menu on one map, grouped by what it is
 *                for (Make · Keep · Teach · Guard), with live counts, what
 *                needs attention, and a button straight into each one.
 *   MenuAssist   the same "AI input → answer" screen on every menu. Type what
 *                you want; the answer is written for the menu you are on.
 *                Screened both ways, recorded in the audit trail, and advice
 *                only: it never changes anything by itself.
 *   LoungeFinder pick a topic and an age, optionally describe what you want,
 *                and get safe video links: each YouTube video is checked to be
 *                real and from a trusted kids' channel, every word is
 *                screened, and nothing reaches children until you press Add.
 */
import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  fLounge,
  fLoungeAdd,
  fLoungeSuggest,
  fLoungeTopics,
  hubAssist,
  hubReview,
  type HubState,
  type LoungeSuggestion,
} from "./api";
import { BigButton, Card, Notice, Spinner } from "./components";

/* ------------------------------------------------------------------ *
 * The map
 * ------------------------------------------------------------------ */

export type MenuId = "map" | "remix" | "library" | "claude" | "tools" | "projects" | "program" | "classes" | "review" | "lounge" | "people";

type Node = { id: MenuId; emoji: string; name: string; what: string; admin?: boolean };

const LANES: { title: string; blurb: string; tint: string; ring: string; nodes: Node[] }[] = [
  {
    title: "Make",
    blurb: "Create with AI",
    tint: "bg-violet-50",
    ring: "ring-violet-200",
    nodes: [
      { id: "remix", emoji: "🔁", name: "Remix workflow", what: "Hero → storybook, movie, game or song → remix → email it home" },
      { id: "tools", emoji: "🧰", name: "Tools", what: "Every studio as a no-code form" },
      { id: "claude", emoji: "🤖", name: "Claude", what: "Direct console for staff writing and planning" },
    ],
  },
  {
    title: "Keep",
    blurb: "Find and organise",
    tint: "bg-sky-50",
    ring: "ring-sky-200",
    nodes: [
      { id: "library", emoji: "📚", name: "Library", what: "Everything made, open, download or remix" },
      { id: "projects", emoji: "📁", name: "Projects", what: "Named folders for the work" },
    ],
  },
  {
    title: "Teach",
    blurb: "Run the club",
    tint: "bg-emerald-50",
    ring: "ring-emerald-200",
    nodes: [
      { id: "program", emoji: "🗓️", name: "8-week program", what: "Week modules and run-sheets" },
      { id: "classes", emoji: "👋", name: "Classes", what: "Live classes and the class dashboard" },
      { id: "lounge", emoji: "📺", name: "Lounge", what: "Safe videos and the class's own work" },
    ],
  },
  {
    title: "Guard",
    blurb: "Approve and oversee",
    tint: "bg-amber-50",
    ring: "ring-amber-200",
    nodes: [
      { id: "review", emoji: "🛡️", name: "Review", what: "Approve children's media; the audit trail" },
      { id: "people", emoji: "🔑", name: "People", what: "Accounts and roles", admin: true },
    ],
  },
];

export function HubMap({ state, onGo }: { state: HubState; onGo: (id: MenuId) => void }) {
  const [pending, setPending] = useState<number | null>(null);
  const [lounge, setLounge] = useState<number | null>(null);

  useEffect(() => {
    hubReview()
      .then((r) => setPending(r.pending.length))
      .catch(() => setPending(null));
    fLounge()
      .then((r) => setLounge(r.items.length))
      .catch(() => setLounge(null));
  }, []);

  const c = state.capabilities;
  const off = [
    !c.text.ready && "Text",
    !c.image.ready && "Images",
    !c.video.ready && "Video",
    !c.music.ready && "Music",
    !c.tts.ready && "Read aloud",
  ].filter(Boolean) as string[];

  const stat: Partial<Record<MenuId, string>> = {
    tools: `${state.tools.length} tools`,
    projects: `${state.projects.length} project${state.projects.length === 1 ? "" : "s"}`,
    classes: `${state.classes.length} class${state.classes.length === 1 ? "" : "es"}`,
    review: pending === null ? "…" : pending === 0 ? "Nothing waiting" : `${pending} waiting`,
    lounge: lounge === null ? "…" : `${lounge} picked video${lounge === 1 ? "" : "s"}`,
    program: "8 weeks",
  };
  const attention: Partial<Record<MenuId, boolean>> = {
    review: Boolean(pending && pending > 0),
    lounge: lounge === 0,
  };

  const todo: { text: string; go: MenuId }[] = [];
  if (pending && pending > 0) todo.push({ text: `${pending} piece${pending === 1 ? " is" : "s are"} waiting for your approval`, go: "review" });
  if (!state.capabilities.screening.configured) todo.push({ text: "Screening is off: children's media stays switched off until it's on", go: "review" });
  if (lounge === 0) todo.push({ text: "The Lounge has no picked videos yet: use Find videos with AI", go: "lounge" });
  if (state.projects.length === 0) todo.push({ text: "No projects yet: make one so work files itself", go: "projects" });
  if (state.classes.length === 0) todo.push({ text: "No classes yet: create one from the class dashboard", go: "classes" });

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold">🗺️ Hub map</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Every menu in one place. Work flows left to right: make it, keep it, teach with it, and guard it. Press any card to go
              there. Every menu has an <strong>Ask AI</strong> box at the top for help on that menu.
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>
              Screening:{" "}
              <strong className={state.capabilities.screening.configured ? "text-emerald-700" : "text-amber-700"}>
                {state.capabilities.screening.configured ? "on" : "off"}
                {state.capabilities.screening.required ? " · fail closed" : ""}
              </strong>
            </p>
            <p className="mt-0.5">{off.length ? `Not switched on: ${off.join(", ")}` : "All AI capabilities on"}</p>
          </div>
        </div>
      </Card>

      {todo.length > 0 && (
        <Card tone="tint">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Needs attention</h3>
          <ul className="mt-2 space-y-1.5">
            {todo.map((t) => (
              <li key={t.text} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-slate-800">• {t.text}</span>
                <button onClick={() => onGo(t.go)} className="font-semibold text-violet-700 underline underline-offset-2">
                  Go there →
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {LANES.map((lane, li) => (
          <div key={lane.title} className={`relative rounded-3xl ${lane.tint} p-4 ring-1 ${lane.ring}`}>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                {li + 1}. {lane.title}
              </h3>
              <span className="text-xs font-semibold text-slate-500">{lane.blurb}</span>
            </div>
            <div className="space-y-2">
              {lane.nodes
                .filter((n) => !n.admin || state.facilitator.isAdmin)
                .map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onGo(n.id)}
                    className="w-full rounded-2xl bg-white p-3 text-left ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-violet-400"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold">
                        {n.emoji} {n.name}
                      </span>
                      {attention[n.id] && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" title="Needs attention" />}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">{n.what}</p>
                    {stat[n.id] && <p className="mt-1 text-xs font-bold text-violet-700">{stat[n.id]}</p>}
                  </button>
                ))}
            </div>
            {li < LANES.length - 1 && (
              <span aria-hidden className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-xl text-slate-400 xl:block">
                ➜
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * AI input → answer, on every menu
 * ------------------------------------------------------------------ */

const MENU_NAMES: Record<MenuId, string> = {
  map: "the Hub",
  remix: "Remix workflow",
  library: "Library",
  claude: "Claude",
  tools: "Tools",
  projects: "Projects",
  program: "8-week program",
  classes: "Classes",
  review: "Review",
  lounge: "Lounge",
  people: "People",
};

const STARTERS: Record<MenuId, string[]> = {
  map: ["Where do I start on a club day?", "What needs my attention first?"],
  remix: ["Write a hero description for a shy robot inventor", "How do I put my hero in a game?"],
  library: ["How do I find last week's storybooks?", "How do I send a piece home?"],
  claude: ["Draft a parent note about this week's session", "Plan a 40-minute session on prompts"],
  tools: ["Which tool should I use for a Week 3 example?", "Write a Game Maker brief about recycling"],
  projects: ["How should I organise a fall cohort?", "What happens to pieces if I delete a project?"],
  program: ["Summarise Week 2 for a new volunteer", "Give me a backup activity for Week 4"],
  classes: ["How do I unlock a studio for my class?", "How do I add a child with consent?"],
  review: ["What should I check before approving a movie?", "How do I read the audit trail?"],
  lounge: ["Suggest topics for a rainy-day Lounge", "What makes a video OK for the Lounge?"],
  people: ["How do I let a volunteer run classes?", "What can an admin do that others can't?"],
};

export function MenuAssist({ menu }: { menu: MenuId }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<{ q: string; a: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // A new menu is a new conversation.
  useEffect(() => {
    setAnswer(null);
    setError(null);
    setText("");
  }, [menu]);

  const ask = useCallback(
    async (q: string) => {
      const prompt = q.trim();
      if (prompt.length < 2 || busy) return;
      setBusy(true);
      setError(null);
      setCopied(false);
      try {
        const r = await hubAssist(menu, prompt);
        setAnswer({ q: prompt, a: r.reply });
        setText("");
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "The helper didn't answer. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [menu, busy],
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-left text-sm ring-1 ring-violet-200 transition hover:ring-violet-400"
      >
        <span className="font-bold text-violet-800">✨ Ask AI about {MENU_NAMES[menu]}</span>
        <span className="text-xs text-slate-500">Type a question, get an answer for this menu</span>
      </button>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-extrabold text-violet-800">✨ Ask AI about {MENU_NAMES[menu]}</h2>
        <button onClick={() => setOpen(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
          Hide
        </button>
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Your input</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(text);
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1200}
              rows={3}
              placeholder="What do you want to do or know here?"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <BigButton type="submit" disabled={busy || text.trim().length < 2} className="!px-3 !py-1.5 !text-sm">
                {busy ? "Thinking…" : "Ask"}
              </BigButton>
              {STARTERS[menu].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => void ask(s)}
                  className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-200 hover:ring-violet-400 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </form>
          <p className="mt-2 text-xs text-slate-500">Screened both ways and recorded in the audit trail. The helper only advises; it never changes anything.</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">The answer</p>
          {busy && <Spinner label="Thinking…" />}
          {error && <Notice>{error}</Notice>}
          {!busy && !error && !answer && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 ring-1 ring-slate-200">Answers appear here.</div>
          )}
          {!busy && answer && (
            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="text-xs font-semibold text-slate-500">You asked: {answer.q}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{answer.a}</p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(answer.a).then(
                    () => setCopied(true),
                    () => setCopied(false),
                  );
                }}
                className="mt-2 text-xs font-semibold text-violet-700 underline underline-offset-2"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Lounge: find safe videos with AI
 * ------------------------------------------------------------------ */

export function LoungeFinder({ classes, onAdded }: { classes: { id: number; name: string }[]; onAdded: () => void }) {
  const [opts, setOpts] = useState<{ topics: string[]; ages: string[]; channels: string[] } | null>(null);
  const [topic, setTopic] = useState("");
  const [ages, setAges] = useState("8-10");
  const [prompt, setPrompt] = useState("");
  const [classId, setClassId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ items: LoungeSuggestion[]; dropped: number } | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fLoungeTopics()
      .then((o) => {
        setOpts(o);
        setTopic(o.topics[0] ?? "");
      })
      .catch(() => setOpts(null));
  }, []);

  async function find() {
    setBusy(true);
    setError(null);
    setResult(null);
    setAdded({});
    try {
      setResult(await fLoungeSuggest({ topic, ages, prompt: prompt.trim() }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't look for videos. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function add(items: LoungeSuggestion[]) {
    setAdding(true);
    setError(null);
    try {
      for (const it of items) {
        if (added[it.url]) continue;
        await fLoungeAdd({ title: it.title, url: it.url, source: it.source, note: it.note || `${topic} · ages ${ages}`, classId: classId ? Number(classId) : null });
        setAdded((a) => ({ ...a, [it.url]: true }));
      }
      onAdded();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't add that to the Lounge.");
    } finally {
      setAdding(false);
    }
  }

  if (!opts) return null;
  const videos = result?.items.filter((i) => i.kind === "video") ?? [];
  const searches = result?.items.filter((i) => i.kind === "search") ?? [];
  const sel = "rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none";

  return (
    <Card>
      <h2 className="text-lg font-extrabold">✨ Find videos with AI</h2>
      <p className="mt-1 text-sm text-slate-600">
        Choose a topic and age, add a few words if you like, and the AI suggests videos from trusted kids' channels. Each one is
        checked to be a real video from one of those channels, and every word is screened. Nothing reaches children until you press Add.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Your input</p>
          <div className="flex flex-wrap gap-2">
            <label className="flex flex-col text-xs font-semibold text-slate-600">
              Topic
              <select value={topic} onChange={(e) => setTopic(e.target.value)} className={`mt-1 ${sel}`}>
                {opts.topics.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs font-semibold text-slate-600">
              Ages
              <select value={ages} onChange={(e) => setAges(e.target.value)} className={`mt-1 ${sel}`}>
                {opts.ages.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs font-semibold text-slate-600">
              Add to
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className={`mt-1 ${sel}`}>
                <option value="">Every class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            Describe what you want (optional)
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={300}
              placeholder="e.g. how volcanoes erupt, short and calm"
              className={`mt-1 w-full ${sel}`}
            />
          </label>
          <BigButton disabled={busy || !topic} onClick={() => void find()} className="!px-4 !py-2 !text-sm">
            {busy ? "Looking and checking…" : "Find safe videos"}
          </BigButton>
          <p className="text-xs text-slate-500">Trusted channels: {opts.channels.join(", ")}.</p>
        </div>

        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">What came back</p>
          {busy && <Spinner label="Finding videos and checking every one…" />}
          {error && <Notice>{error}</Notice>}
          {!busy && !result && !error && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 ring-1 ring-slate-200">Checked suggestions appear here.</div>
          )}
          {!busy && result && (
            <div className="space-y-3">
              {videos.length > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800">
                    {videos.length} checked video{videos.length === 1 ? "" : "s"}
                    {result.dropped ? <span className="font-normal text-slate-500"> · {result.dropped} dropped by the checks</span> : null}
                  </p>
                  <BigButton
                    className="!px-3 !py-1 !text-xs"
                    disabled={adding || videos.every((v) => added[v.url])}
                    onClick={() => void add(videos)}
                  >
                    {adding ? "Adding…" : "Add all videos"}
                  </BigButton>
                </div>
              )}
              {videos.length === 0 && (
                <p className="text-sm text-slate-600">
                  No single videos passed every check this time{result.dropped ? ` (${result.dropped} dropped)` : ""}. The channel
                  searches below are always safe to add.
                </p>
              )}
              <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                {[...videos, ...searches].map((v) => (
                  <div key={v.url} className="flex gap-3 rounded-2xl bg-white p-2 ring-1 ring-slate-200">
                    <div className="aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {v.youtubeId ? (
                        <img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">🔎</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold leading-tight">{v.title}</p>
                      <p className="text-xs text-slate-500">
                        {v.source} · <span className="text-emerald-700">{v.verified}</span>
                      </p>
                      {v.note && <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{v.note}</p>}
                      <div className="mt-1 flex gap-3 text-xs font-semibold">
                        <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-violet-700 underline underline-offset-2">
                          Preview
                        </a>
                        {added[v.url] ? (
                          <span className="text-emerald-700">Added ✓</span>
                        ) : (
                          <button disabled={adding} onClick={() => void add([v])} className="text-violet-700 underline underline-offset-2 disabled:opacity-50">
                            Add to the Lounge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
