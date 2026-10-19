/**
 * The Remix workflow, kid-sized — the magic of the Studio.
 *
 *   1. Make a hero      — a name, what they look like, how they are (saved)
 *   2. Put them in a …  — storybook, language book, movie, game, song, picture
 *   3. Remix            — anything you made (or found in the Arcade) into any other room
 *   4. Ideas            — "what could I make next from this?"
 *
 * Every step is one Director's Order, and the class gets enough orders to walk
 * the whole cycle. Nothing here calls a model directly: a hero is a request
 * the Studio runs like any other, and "put it in" / "ideas" only fill in a
 * room's form, which the child still presses the button on.
 */
import { useEffect, useMemo, useState } from "react";
import { cx } from "../components/ui";
import {
  ApiError,
  childRemixIdeas,
  childRemixInfo,
  childRemixSuggest,
  childRequest,
  childSaveHero,
  childVoices,
  waitForRequest,
  type ArtifactMeta,
  type ChildMe,
  type Idea,
  type ModeId,
  type StudioConfig,
  type StudioRequest,
  type VoiceOption,
} from "./api";
import { ArtifactLoader, BigButton, Card, Notice, RequestStatus, kindEmoji } from "./components";
import { RoomIcon, roomIdFor } from "./icons";

/** Where a room starts from when it is opened from here. */
export type KidStart = { remixFrom: number; sourceTitle: string; sourceKind: string; values: Record<string, string> };
export type OpenRoom = (mode: ModeId, start?: KidStart) => void;

const PUT_IN: { mode: ModeId; label: string }[] = [
  { mode: "story", label: "Storybook" },
  { mode: "language", label: "Language book" },
  { mode: "video", label: "Movie" },
  { mode: "game", label: "Game" },
  { mode: "music", label: "Song" },
  { mode: "prompt", label: "Picture" },
  { mode: "quest", label: "Fact quest" },
  { mode: "robot", label: "Robot" },
];

const KIND_TOOL: Record<string, ModeId> = { story: "story", video: "video", game: "game", audio: "music", image: "prompt", quest: "quest", robot: "robot" };

export function KidsRemixTab({
  me,
  config,
  ticketsLeft,
  onOpenRoom,
  onRefresh,
}: {
  me: ChildMe;
  config: StudioConfig;
  ticketsLeft: number;
  onOpenRoom: OpenRoom;
  onRefresh: () => Promise<void>;
}) {
  const [info, setInfo] = useState<{ styles: string[]; tools: ModeId[] } | null>(null);
  useEffect(() => {
    childRemixInfo().then(setInfo).catch(() => setInfo({ styles: ["cheerful cartoon"], tools: PUT_IN.map((p) => p.mode) }));
  }, []);
  const pieces = useMemo(() => me.portfolio.filter((a) => a.kind !== "chat" && a.approved), [me.portfolio]);
  const heroes = pieces.filter((a) => a.kind === "hero");
  const others = pieces.filter((a) => a.kind !== "hero");
  const rooms = useMemo(() => {
    const open = new Set(me.class.modes);
    const allowed = new Set(info?.tools ?? PUT_IN.map((p) => p.mode));
    return PUT_IN.filter((p) => open.has(p.mode) && allowed.has(p.mode) && config.modes.some((m) => m.id === p.mode));
  }, [me.class.modes, info, config.modes]);

  const [makingHero, setMakingHero] = useState(heroes.length === 0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<{ source: ArtifactMeta; list: Idea[] } | null>(null);

  async function putIn(a: ArtifactMeta, mode: ModeId) {
    setBusyId(`${a.id}:${mode}`);
    setError(null);
    try {
      const r = await childRemixSuggest(a.id, mode);
      onOpenRoom(mode, { remixFrom: a.id, sourceTitle: a.title, sourceKind: a.kind, values: r.values });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That didn't work. Try again!");
    } finally {
      setBusyId(null);
    }
  }

  async function getIdeas(a: ArtifactMeta) {
    setBusyId(`${a.id}:ideas`);
    setError(null);
    try {
      const r = await childRemixIdeas(a.id);
      setIdeas({ source: a, list: r.ideas });
      if (!r.ideas.length) setError("No ideas came out this time. Try again, or pick a room yourself!");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The idea machine is taking a break. Try again in a moment!");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card tone="tint">
        <h2 className="text-3xl font-black text-slate-900">🔁 Remix</h2>
        <p className="mt-1 text-base font-semibold text-slate-700">This is the magic: make a hero, put them in a story, turn the story into a movie, the movie into a game, the game into a song… Every piece you make can become the start of the next one.</p>
        <ol className="mt-3 grid gap-2 text-sm font-bold text-slate-800 sm:grid-cols-4">
          <li className="rounded-2xl bg-white px-3 py-2 ring-1 ring-violet-100">1️⃣ Make a hero</li>
          <li className="rounded-2xl bg-white px-3 py-2 ring-1 ring-violet-100">2️⃣ Put them in a room</li>
          <li className="rounded-2xl bg-white px-3 py-2 ring-1 ring-violet-100">3️⃣ Remix any piece into another</li>
          <li className="rounded-2xl bg-white px-3 py-2 ring-1 ring-violet-100">💡 Ask for ideas</li>
        </ol>
        <p className="mt-3 text-xs font-semibold text-slate-500">Each hero, piece or remix is one Director's Order. You have {ticketsLeft} left today.</p>
      </Card>

      {error && <Notice>{error}</Notice>}
      {me.class.locked && <Notice tone="info">🔒 Your portfolio is locked for the Expo, so no new remixes today — but everything you made is ready to show!</Notice>}

      {/* 1. Heroes */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-2xl font-extrabold">🦸 Your heroes</h3>
          {!makingHero && !me.class.locked && (
            <BigButton variant="secondary" onClick={() => setMakingHero(true)} disabled={ticketsLeft === 0}>
              ✨ Make a new hero
            </BigButton>
          )}
        </div>
        {heroes.length === 0 && !makingHero && <p className="mt-2 text-slate-600">No heroes yet. A hero is a character you invent — then you can put them in anything.</p>}
        {makingHero && !me.class.locked && (
          <div className="mt-4">
            <HeroMaker
              styles={info?.styles ?? ["cheerful cartoon"]}
              ttsReady={config.ttsReady}
              disabled={ticketsLeft === 0}
              onDone={async () => {
                await onRefresh();
                setMakingHero(false);
              }}
              onCancel={heroes.length ? () => setMakingHero(false) : undefined}
            />
          </div>
        )}
        {heroes.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {heroes.map((h) => (
              <div key={h.id} className="rounded-3xl bg-violet-50 p-4 ring-2 ring-violet-100">
                <ArtifactLoader id={h.id} compact />
                <PutIn rooms={rooms} skip={null} busyId={busyId} a={h} onPut={putIn} onIdeas={getIdeas} disabled={me.class.locked || ticketsLeft === 0} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Ideas */}
      {ideas && (
        <Card tone="good">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-2xl font-extrabold">💡 Ideas from “{ideas.source.title}”</h3>
            <BigButton variant="ghost" onClick={() => setIdeas(null)}>
              Close
            </BigButton>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {ideas.list.map((idea, i) => (
              <div key={i} className="flex flex-col rounded-3xl bg-white p-4 ring-2 ring-emerald-100">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-700">
                  <RoomIcon id={roomIdFor(idea.tool)} size={18} tile={false} /> {config.modes.find((m) => m.id === idea.tool)?.name ?? idea.tool}
                </p>
                <p className="mt-1 text-lg font-extrabold">{idea.title}</p>
                <p className="text-sm text-slate-700">{idea.pitch}</p>
                <div className="mt-3">
                  <BigButton
                    variant="secondary"
                    disabled={me.class.locked || ticketsLeft === 0 || !me.class.modes.includes(idea.tool)}
                    onClick={() => onOpenRoom(idea.tool, { remixFrom: ideas.source.id, sourceTitle: ideas.source.title, sourceKind: ideas.source.kind, values: idea.values })}
                  >
                    Make it →
                  </BigButton>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 2 + 3. Everything else */}
      <Card>
        <h3 className="text-2xl font-extrabold">🎒 Everything you made</h3>
        <p className="text-sm text-slate-600">Tap a room to carry a piece into it — the form fills itself in and you can change anything before you press Make it.</p>
        {others.length === 0 ? (
          <p className="mt-3 text-slate-600">Nothing yet. Put a hero in a room, or go make something in Rooms!</p>
        ) : (
          <div className="mt-4 space-y-3">
            {others.map((a) => (
              <div key={a.id} className="rounded-3xl bg-white p-4 ring-2 ring-slate-100">
                <p className="text-lg font-extrabold">
                  {kindEmoji(a.kind)} {a.title} <span className="text-sm font-semibold text-slate-500">v{a.version}</span>
                </p>
                {a.summary && <p className="text-sm text-slate-600">{a.summary}</p>}
                <PutIn rooms={rooms} skip={KIND_TOOL[a.kind] ?? null} busyId={busyId} a={a} onPut={putIn} onIdeas={getIdeas} disabled={me.class.locked || ticketsLeft === 0} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PutIn({
  rooms,
  skip,
  a,
  busyId,
  onPut,
  onIdeas,
  disabled,
}: {
  rooms: { mode: ModeId; label: string }[];
  skip: ModeId | null;
  a: ArtifactMeta;
  busyId: string | null;
  onPut: (a: ArtifactMeta, mode: ModeId) => void;
  onIdeas: (a: ArtifactMeta) => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold text-slate-600">{a.kind === "hero" ? "Put them in a…" : "Remix into a…"}</span>
      {rooms
        .filter((r) => r.mode !== skip)
        .map((r) => {
          const id = `${a.id}:${r.mode}`;
          return (
            <button
              key={r.mode}
              type="button"
              disabled={disabled || busyId !== null}
              onClick={() => onPut(a, r.mode)}
              className={cx(
                "flex items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-3 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 transition hover:ring-violet-400 disabled:opacity-50",
                busyId === id && "ring-violet-500",
              )}
            >
              <RoomIcon id={roomIdFor(r.mode)} size={18} />
              {busyId === id ? "Filling in…" : r.label}
            </button>
          );
        })}
      <button
        type="button"
        disabled={disabled || busyId !== null}
        onClick={() => onIdeas(a)}
        className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-800 ring-1 ring-emerald-200 transition hover:ring-emerald-400 disabled:opacity-50"
      >
        {busyId === `${a.id}:ideas` ? "Thinking…" : "💡 Ideas"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Hero maker
 * ------------------------------------------------------------------ */

function HeroMaker({ styles, ttsReady, disabled, onDone, onCancel }: { styles: string[]; ttsReady: boolean; disabled: boolean; onDone: () => Promise<void>; onCancel?: () => void }) {
  const [name, setName] = useState("");
  const [look, setLook] = useState("");
  const [personality, setPersonality] = useState("");
  const [style, setStyle] = useState(styles[0] ?? "cheerful cartoon");
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voice, setVoice] = useState<VoiceOption | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<StudioRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (ttsReady) childVoices().then((r) => setVoices(r.voices.slice(0, 8))).catch(() => {});
  }, [ttsReady]);
  useEffect(() => {
    if (!styles.includes(style)) setStyle(styles[0] ?? "cheerful cartoon");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles.join(",")]);

  const ready = name.trim().length >= 1 && look.trim().length >= 8 && !busy && !disabled;
  const input = "w-full rounded-2xl border-2 border-violet-200 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus:border-violet-500 focus:outline-none";

  return (
    <form
      className="space-y-3 rounded-3xl bg-violet-50 p-4 ring-2 ring-violet-100"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!ready) return;
        setBusy(true);
        setError(null);
        try {
          const { request } = await childSaveHero({ name: name.trim(), look: look.trim(), personality: personality.trim(), style, voice: voice ? { provider: voice.provider, id: voice.id } : null });
          setActive(request);
          const settled = await waitForRequest(request.id, childRequest, setActive, 240_000);
          setActive(settled);
          if (settled.status === "done") {
            await onDone();
            setName("");
            setLook("");
            setPersonality("");
            setActive(null);
          } else {
            setError(settled.message ?? "That didn't work. Try describing your hero a different way.");
          }
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "That didn't work. Try again!");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-lg font-extrabold text-violet-900">✨ Make a hero</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} className={input} placeholder="Pip, Captain Zoom, Mo…" autoComplete="off" />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">How they are</span>
          <input value={personality} onChange={(e) => setPersonality(e.target.value.slice(0, 160))} className={input} placeholder="brave and a bit silly, loves snacks" autoComplete="off" />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-bold text-slate-700">What they look like</span>
        <textarea value={look} onChange={(e) => setLook(e.target.value.slice(0, 160))} rows={2} className={input} placeholder="a small green dragon with a yellow scarf, big round glasses and tiny wings" />
        <span className="text-xs font-semibold text-slate-500">Shape, colours, clothes, one special detail. {look.length}/160</span>
      </label>
      <div>
        <span className="text-sm font-bold text-slate-700">Art style</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {styles.map((s) => (
            <button key={s} type="button" onClick={() => setStyle(s)} className={cx("rounded-full px-3 py-1 text-sm font-bold ring-2 transition", style === s ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-700 ring-slate-200 hover:ring-violet-300")}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {voices.length > 0 && (
        <div>
          <span className="text-sm font-bold text-slate-700">Voice (optional)</span>
          <div className="mt-1 flex flex-wrap gap-2">
            <button type="button" onClick={() => setVoice(null)} className={cx("rounded-full px-3 py-1 text-sm font-bold ring-2", !voice ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-700 ring-slate-200")}>
              Studio voice
            </button>
            {voices.map((v) => (
              <button key={`${v.provider}:${v.id}`} type="button" onClick={() => setVoice(v)} className={cx("rounded-full px-3 py-1 text-sm font-bold ring-2", voice?.id === v.id ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-700 ring-slate-200")}>
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <Notice>{error}</Notice>}
      {active && <RequestStatus request={active} />}
      <div className="flex flex-wrap gap-2">
        <BigButton type="submit" disabled={!ready}>
          {busy ? "Drawing your hero…" : "Make my hero! 🦸"}
        </BigButton>
        {onCancel && (
          <BigButton variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </BigButton>
        )}
      </div>
      {disabled && <p className="text-xs font-semibold text-slate-500">You've used all your Director's Orders for today.</p>}
    </form>
  );
}
