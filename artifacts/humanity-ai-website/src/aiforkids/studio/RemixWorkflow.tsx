/**
 * The Remix workflow, and the Library.
 *
 *   1. Create a hero      — what they look like, what they sound like (saved)
 *   2. Put them in a …    — storybook, movie, game, song, picture (each saved)
 *   3. Remix              — any saved piece into any other tool, or "Generate ideas"
 *   4. Save the project   — email it to the participant, cc the facilitator and the org
 *
 * Everything lives in a Hub project, so the work is never lost and is always
 * findable. The Library is the same files without the steps: every piece in
 * the workspace and the classes, with every file it has.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ApiError,
  hubCreateProject,
  hubFileArtifact,
  hubLibrary,
  hubRemixIdeas,
  hubRemixSuggest,
  hubRequest,
  hubSaveHero,
  hubSendProject,
  hubVoices,
  waitForRequest,
  type HubState,
  type Idea,
  type LibraryItem,
  type ModeId,
  type Project,
  type StudioRequest,
  type VoiceOption,
} from "./api";
import { ArtifactLoader, BigButton, Card, FilesList, ForgeSteps, HeroView, Notice, RequestStatus, Spinner, kindEmoji } from "./components";

/** How the Hub opens a tool from here: the tool, plus where it starts from. */
export type ToolStart = { remixFrom: number; sourceTitle: string; sourceKind: string; values: Record<string, string>; projectId: number | null; ai?: boolean };
export type OpenTool = (mode: ModeId, start?: ToolStart) => void;

/** The tools a piece can go into, in the order the sketch lists them. */
export const PUT_IN: { mode: ModeId; label: string; emoji: string }[] = [
  { mode: "story", label: "Storybook", emoji: "📚" },
  { mode: "language", label: "Language book", emoji: "🛂" },
  { mode: "video", label: "Movie", emoji: "🎬" },
  { mode: "game", label: "Game", emoji: "🎮" },
  { mode: "music", label: "Song", emoji: "🎵" },
  { mode: "prompt", label: "Picture", emoji: "🎨" },
  { mode: "quest", label: "Fact quest", emoji: "🧭" },
  { mode: "robot", label: "Robot", emoji: "🤖" },
];

const KIND_LABEL: Record<string, string> = { hero: "Hero", story: "Storybook", video: "Movie", game: "Game", audio: "Song", image: "Picture", quest: "Fact quest", robot: "Robot plan" };
const KIND_TOOL: Record<string, ModeId> = { story: "story", video: "video", game: "game", audio: "music", image: "prompt", quest: "quest", robot: "robot" };

const PROJECT_KEY = "aik.remix.project";
function readSaved(): number | null {
  try {
    const n = Number(localStorage.getItem(PROJECT_KEY));
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}
function writeSaved(id: number | null) {
  try {
    if (id) localStorage.setItem(PROJECT_KEY, String(id));
    else localStorage.removeItem(PROJECT_KEY);
  } catch {
    /* private mode */
  }
}

/* ------------------------------------------------------------------ *
 * "Remix into…" — one piece into another tool
 * ------------------------------------------------------------------ */

export function RemixInto({ item, tools, projectId, onOpenTool, label = "Remix into" }: { item: { id: number; title: string; kind: string }; tools: ModeId[]; projectId: number | null; onOpenTool: OpenTool; label?: string }) {
  const [busy, setBusy] = useState<ModeId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const own = KIND_TOOL[item.kind];
  const options = PUT_IN.filter((p) => tools.includes(p.mode) && p.mode !== own);
  if (!options.length) return null;
  async function go(mode: ModeId) {
    setBusy(mode);
    setError(null);
    try {
      const r = await hubRemixSuggest(item.id, mode);
      onOpenTool(mode, { remixFrom: item.id, sourceTitle: item.title, sourceKind: item.kind, values: r.values, projectId, ai: r.ai });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start the remix.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.mode}
            type="button"
            disabled={busy !== null}
            onClick={() => void go(o.mode)}
            className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800 ring-1 ring-violet-200 transition hover:bg-violet-100 hover:ring-violet-400 disabled:opacity-50"
          >
            {busy === o.mode ? "Getting it ready…" : `${o.emoji} ${o.label}`}
          </button>
        ))}
      </div>
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Generate ideas
 * ------------------------------------------------------------------ */

function IdeasPanel({ item, projectId, onOpenTool }: { item: LibraryItem; projectId: number | null; onOpenTool: OpenTool }) {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    setBusy(true);
    setError(null);
    try {
      const r = await hubRemixIdeas(item.id);
      setIdeas(r.ideas);
      if (!r.ideas.length) setError("No ideas came back this time. Try again.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't come up with ideas right now.");
    } finally {
      setBusy(false);
    }
  }
  const emoji = (m: ModeId) => PUT_IN.find((p) => p.mode === m)?.emoji ?? "✨";
  return (
    <div className="space-y-2 rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-amber-900">💡 Ideas from “{item.title}”</p>
        <BigButton variant="ghost" className="!px-3 !py-1 !text-xs" disabled={busy} onClick={() => void load()}>
          {busy ? "Thinking…" : ideas ? "More ideas" : "Generate ideas"}
        </BigButton>
      </div>
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
      {ideas && ideas.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {ideas.map((idea, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onOpenTool(idea.tool, { remixFrom: item.id, sourceTitle: item.title, sourceKind: item.kind, values: idea.values, projectId, ai: true })}
              className="rounded-2xl bg-white p-3 text-left ring-1 ring-amber-200 transition hover:-translate-y-0.5 hover:ring-amber-400"
            >
              <p className="text-sm font-extrabold">
                {emoji(idea.tool)} {idea.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{idea.pitch}</p>
              <p className="mt-1 text-xs font-bold text-violet-700">Open it →</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Step 1: the hero
 * ------------------------------------------------------------------ */

function HeroBuilder({ projectId, existing, onSaved, onCancel }: { projectId: number | null; existing: LibraryItem | null; onSaved: (heroId: number) => void; onCancel: () => void }) {
  const h = existing?.hero ?? null;
  const [name, setName] = useState(h?.name ?? "");
  const [look, setLook] = useState(h?.look ?? "");
  const [personality, setPersonality] = useState(h?.personality ?? "");
  const [style, setStyle] = useState(h?.style ?? "");
  const [voiceKey, setVoiceKey] = useState(h?.voice ? `${h.voice.provider}:${h.voice.id}` : "");
  const [catalog, setCatalog] = useState<{ voices: VoiceOption[]; elevenlabs: boolean; azure: boolean; styles: string[] } | null>(null);
  const [request, setRequest] = useState<StudioRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hubVoices()
      .then((c) => {
        setCatalog(c);
        setStyle((s) => s || c.styles[0] || "cheerful cartoon");
      })
      .catch(() => setCatalog({ voices: [], elevenlabs: false, azure: false, styles: ["cheerful cartoon"] }));
  }, []);

  const groups = useMemo(() => {
    const v = catalog?.voices ?? [];
    return [
      { label: "ElevenLabs voices", items: v.filter((x) => x.provider === "elevenlabs") },
      { label: "Azure voices", items: v.filter((x) => x.provider === "azure") },
    ].filter((g) => g.items.length);
  }, [catalog]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const [provider, ...rest] = voiceKey.split(":");
      const voice = voiceKey ? { provider, id: rest.join(":") } : null;
      const { request: started } = await hubSaveHero({ name, look, personality, style, voice, projectId, heroId: existing?.id });
      setRequest(started);
      const done = await waitForRequest(started.id, hubRequest, setRequest, 180_000);
      setRequest(done);
      if (done.status === "done" && done.resultArtifactId) onSaved(done.resultArtifactId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saving the hero didn't work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-extrabold">{existing ? `Change ${existing.title}` : "🦸 Create a hero"}</h3>
      <p className="mb-3 text-sm text-slate-600">A hero is saved once and goes into everything you make next: same name, same look, same voice.</p>
      {error && <Notice>{error}</Notice>}
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-bold">Name *</span>
          <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Pim the shy dragon" className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-violet-500 focus:outline-none" />
        </label>
        <label className="block">
          <span className="text-sm font-bold">What they look like *</span>
          <textarea value={look} maxLength={400} rows={3} onChange={(e) => setLook(e.target.value)} placeholder="a small round dragon with mint-green scales, a lemon-yellow belly, tiny wings, big curious eyes and a striped scarf" className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-violet-500 focus:outline-none" />
          <span className="text-xs text-slate-500">Shape, colours, clothes and one special detail. This exact description is used for every picture and shot.</span>
        </label>
        <label className="block">
          <span className="text-sm font-bold">Personality</span>
          <input value={personality} maxLength={240} onChange={(e) => setPersonality(e.target.value)} placeholder="shy at first, brave when a friend needs help, loves riddles" className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-violet-500 focus:outline-none" />
        </label>
        <div>
          <span className="text-sm font-bold">Art style</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(catalog?.styles ?? []).map((s) => (
              <button key={s} type="button" onClick={() => setStyle(s)} className={s === style ? "rounded-full bg-violet-700 px-3 py-1 text-xs font-bold text-white" : "rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:ring-violet-300"}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="text-sm font-bold">What they sound like</span>
          {!catalog ? (
            <Spinner label="Loading voices…" />
          ) : (
            <select value={voiceKey} onChange={(e) => setVoiceKey(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 focus:border-violet-500 focus:outline-none">
              <option value="">The house voice</option>
              {groups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map((v) => (
                    <option key={`${v.provider}:${v.id}`} value={`${v.provider}:${v.id}`}>
                      {v.name} — {v.description}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
          {catalog && !catalog.elevenlabs && <span className="text-xs text-amber-700">ElevenLabs voices appear here once the ElevenLabs key in Key Vault is fixed. Azure voices work now.</span>}
          <span className="block text-xs text-slate-500">Saving records a short hello in this voice so you can hear it. Change the voice and save again to try another; the portrait is kept.</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <BigButton disabled={busy || !name.trim() || look.trim().length < 8} onClick={() => void save()}>
            {busy ? "Saving…" : existing ? "Save changes" : "Save hero"}
          </BigButton>
          <BigButton variant="ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </BigButton>
        </div>
        {request && <RequestStatus request={request} showReason />}
        {request?.progress && request.progress.length > 0 && <ForgeSteps steps={request.progress} />}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Step 4: save the project and send it
 * ------------------------------------------------------------------ */

function SendProject({ project, me, count, onChanged }: { project: Project; me: string; count: number; onChanged: () => void }) {
  const [name, setName] = useState(project.participant_name ?? "");
  const [email, setEmail] = useState(project.participant_email ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "good" | "warn"; text: string } | null>(null);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function go(send: boolean) {
    setBusy(true);
    setResult(null);
    try {
      const r = await hubSendProject(project.id, { participantName: name.trim() || undefined, participantEmail: email.trim(), note: note.trim() || undefined, send });
      if (!send) setResult({ tone: "good", text: "Project saved." });
      else if (r.sent) setResult({ tone: "good", text: `Sent to ${r.to}, copying ${(r.cc ?? []).join(", ")}. ${r.attached ?? 0} file${r.attached === 1 ? "" : "s"} attached.` });
      else setResult({ tone: "warn", text: `Saved, but not sent: ${r.reason ?? "the email didn't go through."}` });
      onChanged();
    } catch (err) {
      setResult({ tone: "warn", text: err instanceof ApiError ? err.message : "That didn't go through." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-extrabold">4 · Save the project and send it</h3>
      <p className="mb-3 text-sm text-slate-600">
        Everything in <b>{project.name}</b> ({count} piece{count === 1 ? "" : "s"}) is emailed to the registered participant. Storybooks go as PDFs, songs and voices as MP3s, movies as MP4s, games as HTML, and the words of every piece as text.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold">Participant's name</span>
          <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Maya" className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-violet-500 focus:outline-none" />
        </label>
        <label className="block">
          <span className="text-sm font-bold">Participant's email (or their parent's) *</span>
          <input value={email} type="email" maxLength={200} onChange={(e) => setEmail(e.target.value)} placeholder="family@example.com" className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-violet-500 focus:outline-none" />
        </label>
      </div>
      <label className="mt-3 block">
        <span className="text-sm font-bold">A note to include</span>
        <textarea value={note} maxLength={1000} rows={2} onChange={(e) => setNote(e.target.value)} placeholder="Maya made a whole world around Pim this week!" className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-violet-500 focus:outline-none" />
      </label>
      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
        <p>
          <b>To:</b> {email.trim() || "the participant"}
        </p>
        <p>
          <b>Cc:</b> {me} (you) · info@humanityplusai.org
        </p>
        {project.sent_at && <p className="mt-1 text-xs text-slate-500">Last sent {new Date(project.sent_at).toLocaleString()}</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <BigButton disabled={busy || !validEmail || count === 0} onClick={() => void go(true)}>
          {busy ? "Sending…" : "💾 Save project & email it"}
        </BigButton>
        <BigButton variant="secondary" disabled={busy || !validEmail} onClick={() => void go(false)}>
          Save without sending
        </BigButton>
      </div>
      {count === 0 && <p className="mt-2 text-xs text-slate-500">Make something first: a hero, then put them in a story, movie or game.</p>}
      {result && (
        <div className="mt-3">
          <Notice tone={result.tone === "good" ? "good" : "warn"}>{result.text}</Notice>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * A piece, with its files and its way onward
 * ------------------------------------------------------------------ */

function PieceCard({ item, tools, projectId, onOpenTool, filing }: { item: LibraryItem; tools: ModeId[]; projectId: number | null; onOpenTool: OpenTool; filing?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [ideas, setIdeas] = useState(false);
  return (
    <div className="space-y-3 rounded-3xl bg-white p-4 ring-2 ring-violet-100">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-violet-600">
            {kindEmoji(item.kind)} {KIND_LABEL[item.kind] ?? item.kind}
            {item.version > 1 && <span className="text-slate-400"> · v{item.version}</span>}
          </p>
          <p className="truncate text-lg font-extrabold">{item.title}</p>
          <p className="text-xs text-slate-500">
            {item.maker} · {item.className} · {new Date(item.createdAt).toLocaleDateString()}
            {item.projectName && <> · 📁 {item.projectName}</>}
          </p>
          {item.remixTitle && <p className="mt-0.5 text-xs font-semibold text-violet-700">🔁 remixed from {item.remixTitle}</p>}
        </div>
        {item.approved ? (
          <BigButton variant="ghost" className="!shrink-0 !px-3 !py-1 !text-xs" onClick={() => setOpen((v) => !v)}>
            {open ? "Close" : "Open"}
          </BigButton>
        ) : (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">Waiting for review</span>
        )}
      </div>
      {item.hero && !open && <HeroView artifactId={item.id} hero={item.hero} compact />}
      {open && <ArtifactLoader id={item.id} />}
      {item.approved && <FilesList files={item.files} />}
      {item.approved && <RemixInto item={item} tools={tools} projectId={projectId} onOpenTool={onOpenTool} label={item.kind === "hero" ? `Put ${item.title} in a…` : "Remix into"} />}
      {item.approved && (
        <div>
          {ideas ? (
            <IdeasPanel item={item} projectId={projectId} onOpenTool={onOpenTool} />
          ) : (
            <button type="button" onClick={() => setIdeas(true)} className="text-xs font-bold text-amber-700 underline underline-offset-2">
              💡 Generate ideas from this
            </button>
          )}
        </div>
      )}
      {filing}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The Remix tab
 * ------------------------------------------------------------------ */

export function RemixTab({ state, onOpenTool, onChanged }: { state: HubState; onOpenTool: OpenTool; onChanged: () => void }) {
  const tools = useMemo(() => state.tools.map((t) => t.id), [state.tools]);
  const [projectId, setProjectId] = useState<number | null>(() => {
    const saved = readSaved();
    return saved && state.projects.some((p) => p.id === saved) ? saved : null;
  });
  const project = state.projects.find((p) => p.id === projectId) ?? null;
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [heroEdit, setHeroEdit] = useState<LibraryItem | "new" | null>(null);
  const [heroId, setHeroId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return setItems(null);
    try {
      const r = await hubLibrary(projectId);
      setItems(r.items);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't open the project.");
    }
  }, [projectId]);
  useEffect(() => {
    void load();
  }, [load]);

  const heroes = (items ?? []).filter((i) => i.kind === "hero");
  const pieces = (items ?? []).filter((i) => i.kind !== "hero");
  const hero = heroes.find((h) => h.id === heroId) ?? heroes[0] ?? null;

  async function create() {
    const name = newName.trim();
    if (!name) return;
    try {
      const { project: p } = await hubCreateProject({ name, summary: "Remix workflow project", kind: "org" });
      writeSaved(p.id);
      setProjectId(p.id);
      setNewName("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the project.");
    }
  }

  const step = (n: number, label: string, done: boolean) => (
    <div className={done ? "flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200" : "flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200"}>
      <span>{done ? "✓" : n}</span>
      {label}
    </div>
  );

  return (
    <div className="space-y-5">
      <Card tone="tint">
        <h2 className="text-2xl font-extrabold">🔁 Remix workflow</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-700">
          Make a hero once, then keep using them: put them in a storybook, a movie, a game or a song, remix anything into anything else, and send the whole project home. Every piece is saved in the project, with its files ready to download.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {step(1, "Create a hero: look + voice", heroes.length > 0)}
          {step(2, "Put them in a storybook, movie, game…", pieces.length > 0)}
          {step(3, "Remix and generate ideas", pieces.some((p) => p.remixOf && p.remixOf !== hero?.id))}
          {step(4, "Save the project and email it", Boolean(project?.sent_at))}
        </div>
      </Card>

      {error && <Notice>{error}</Notice>}

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block w-full min-w-0 sm:w-auto sm:min-w-[220px] sm:flex-1">
            <span className="text-sm font-bold">Project</span>
            <select
              value={projectId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value) || null;
                writeSaved(id);
                setProjectId(id);
                setHeroId(null);
                setHeroEdit(null);
              }}
              className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 focus:border-violet-500 focus:outline-none"
            >
              <option value="">Choose a project…</option>
              {state.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.artifacts ? `(${p.artifacts})` : ""}
                </option>
              ))}
            </select>
          </label>
          <form
            className="flex w-full min-w-0 gap-2 sm:w-auto sm:min-w-[260px] sm:flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <input value={newName} maxLength={80} onChange={(e) => setNewName(e.target.value)} placeholder="New project, e.g. Maya's Dragon World" className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 focus:border-violet-500 focus:outline-none" />
            <BigButton type="submit" className="!shrink-0 !px-4" disabled={!newName.trim()}>
              ＋ New
            </BigButton>
          </form>
        </div>
      </Card>

      {!project && <Card tone="tint">Choose a project or start a new one. Everything you make in the Remix workflow is saved into it.</Card>}

      {project && items === null && <Spinner label="Opening the project…" />}

      {project && items && (
        <>
          {/* Step 1 */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-extrabold">1 · Heroes</h3>
              {heroEdit === null && (
                <BigButton variant="secondary" onClick={() => setHeroEdit("new")}>
                  🦸 Create a hero
                </BigButton>
              )}
            </div>
            {heroEdit !== null && (
              <HeroBuilder
                key={heroEdit === "new" ? "new" : heroEdit.id}
                projectId={project.id}
                existing={heroEdit === "new" ? null : heroEdit}
                onCancel={() => setHeroEdit(null)}
                onSaved={(id) => {
                  setHeroEdit(null);
                  setHeroId(id);
                  void load();
                  onChanged();
                }}
              />
            )}
            {heroes.length === 0 && heroEdit === null && <Card tone="tint">No hero yet. Create one: what they look like and what they sound like.</Card>}
            <div className="grid gap-3 md:grid-cols-2">
              {heroes.map((h) => (
                <div key={h.id} className={h.id === hero?.id ? "rounded-3xl ring-4 ring-violet-300" : "rounded-3xl"}>
                  <div className="space-y-3 rounded-3xl bg-white p-4 ring-2 ring-violet-100">
                    {h.hero && <HeroView artifactId={h.id} hero={h.hero} />}
                    <FilesList files={h.files} dense />
                    <div className="flex flex-wrap gap-2">
                      {h.id !== hero?.id && (
                        <BigButton variant="secondary" className="!px-3 !py-1 !text-xs" onClick={() => setHeroId(h.id)}>
                          Use this hero
                        </BigButton>
                      )}
                      <BigButton variant="ghost" className="!px-3 !py-1 !text-xs" onClick={() => setHeroEdit(h)}>
                        Change look or voice
                      </BigButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Step 2 */}
          {hero && (
            <section className="space-y-3">
              <h3 className="text-lg font-extrabold">2 · Put {hero.title} in a…</h3>
              <Card>
                <RemixInto item={hero} tools={tools} projectId={project.id} onOpenTool={onOpenTool} label={`${hero.title}'s name, look and voice carry into each one`} />
                <div className="mt-3">
                  <IdeasPanel item={hero} projectId={project.id} onOpenTool={onOpenTool} />
                </div>
              </Card>
            </section>
          )}

          {/* Step 3 */}
          <section className="space-y-3">
            <h3 className="text-lg font-extrabold">3 · Everything in {project.name}: remix it</h3>
            {pieces.length === 0 ? (
              <Card tone="tint">Nothing here yet. Put your hero in a storybook, movie or game and it shows up here with its files.</Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {pieces.map((p) => (
                  <PieceCard key={p.id} item={p} tools={tools} projectId={project.id} onOpenTool={onOpenTool} />
                ))}
              </div>
            )}
          </section>

          {/* Step 4 */}
          <SendProject key={project.id} project={project} me={state.facilitator.email} count={(items ?? []).filter((i) => i.approved).length} onChanged={onChanged} />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The Library: every file, findable
 * ------------------------------------------------------------------ */

export function LibraryTab({ state, onOpenTool }: { state: HubState; onOpenTool: OpenTool }) {
  const tools = useMemo(() => state.tools.map((t) => t.id), [state.tools]);
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<string>("all");
  const [where, setWhere] = useState<string>("all");
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    hubLibrary()
      .then((r) => {
        setItems(r.items);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't open the Library."));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const places = useMemo(() => Array.from(new Set((items ?? []).map((i) => i.className))), [items]);
  const kinds = useMemo(() => Array.from(new Set((items ?? []).map((i) => i.kind))), [items]);
  const shown = (items ?? []).filter(
    (i) =>
      (kind === "all" || i.kind === kind) &&
      (where === "all" || i.className === where) &&
      (!q.trim() || `${i.title} ${i.summary ?? ""} ${i.maker} ${i.projectName ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <Card tone="tint">
        <h2 className="text-2xl font-extrabold">📚 Library</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-700">
          Every piece made in your workspace and your classes, newest first, with every file it has: picture-book PDFs, each page's picture and read-aloud, movies and their shots, songs, game files, hero portraits and voices, and the words of everything as text. Files are stored privately and open only for you.
        </p>
      </Card>
      {error && <Notice>{error}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, makers, projects…" className="min-w-[220px] flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">Every kind</option>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {kindEmoji(k as LibraryItem["kind"])} {KIND_LABEL[k] ?? k}
            </option>
          ))}
        </select>
        <select value={where} onChange={(e) => setWhere(e.target.value)} className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">Workspace and every class</option>
          {places.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      {!items && !error && <Spinner label="Opening the Library…" />}
      {items && shown.length === 0 && <Card tone="tint">{items.length ? "Nothing matches that filter." : "Nothing made yet. Open a tool or the Remix workflow and make something!"}</Card>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((i) => (
          <PieceCard
            key={i.id}
            item={i}
            tools={tools}
            projectId={i.projectId}
            onOpenTool={onOpenTool}
            filing={i.classId === state.workspaceId && state.projects.length > 0 ? <FileInto item={i} projects={state.projects} onDone={load} /> : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function FileInto({ item, projects, onDone }: { item: LibraryItem; projects: Project[]; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="flex items-center gap-2 text-xs text-slate-600">
      <span className="font-bold">Project:</span>
      <select
        value={item.projectId ?? ""}
        disabled={busy}
        onChange={async (e) => {
          setBusy(true);
          try {
            await hubFileArtifact(item.id, Number(e.target.value) || null);
            onDone();
          } finally {
            setBusy(false);
          }
        }}
        className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1"
      >
        <option value="">Not in a project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
