import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { cx } from "../components/ui";
import { WovenText, LanguageExtras } from "./LanguagePassport";
import { getArtifact, mediaSrc, downloadUrl, bookPdfUrl, type Artifact, type ArtifactMeta, type Book, type Movie, type FieldDef, type ModeDef, type StudioRequest, type FileLink, type Hero } from "./api";

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
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  /** Render as an in-app link with the same styling. */
  href?: string;
}) {
  const styles = {
    primary: "bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-200",
    secondary: "bg-white text-violet-800 ring-2 ring-violet-200 hover:bg-violet-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  } as const;
  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-lg font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50",
    styles[variant],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
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
      // The frame has to fit the card it lives in. A 900x560 canvas inside a
      // ~570px column clipped the right-hand side and pushed "Play Again" below
      // the fold, so a finished game looked broken before anyone pressed a key.
      className={cx("block w-full max-w-full rounded-2xl bg-slate-900 ring-4 ring-violet-200", tall ? "h-[min(520px,70vh)]" : "h-[min(440px,60vh)]")}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Artifact viewers
 * ------------------------------------------------------------------ */

export function ArtifactView({ artifact, compact, showFidelity }: { artifact: Artifact; compact?: boolean; /** Staff only: the hero-consistency check for movies. */ showFidelity?: boolean }) {
  if (artifact.kind === "hero") {
    let hero: Hero | null = null;
    try {
      hero = JSON.parse(artifact.content);
    } catch {
      /* ignore */
    }
    return hero ? <HeroView artifactId={artifact.id} hero={hero} compact={compact} /> : null;
  }
  if (artifact.kind === "game")
    return (
      <div className="space-y-3">
        <GameFrame html={artifact.content} title={artifact.title} tall={!compact} />
        {!compact && (
          <a href={downloadUrl(artifact.id)} className="inline-block rounded-2xl bg-white px-4 py-2 text-base font-bold text-violet-800 ring-2 ring-violet-200 hover:bg-violet-50">
            ⬇️ Download the game (plays in any browser)
          </a>
        )}
      </div>
    );

  if (artifact.kind === "story") {
    let data: any = {};
    try {
      data = JSON.parse(artifact.content);
    } catch {
      /* ignore */
    }
    if (data?.format === "book") return <BookView artifactId={artifact.id} book={data as Book} compact={compact} />;
    // Books from before the pictures: a six-panel comic script to draw yourself.
    const panels: { narration: string; dialogue: string }[] = data.panels ?? [];
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {panels.map((p, i) => (
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
    let data: { title?: string; items?: { text: string; sourceHint: string; answer?: string }[]; nextIdea?: string } = {};
    try {
      data = JSON.parse(artifact.content);
    } catch {
      /* ignore */
    }
    return <QuestView data={data} title={artifact.title} compact={compact} />;
  }

  if (artifact.kind === "video") {
    let movie: Partial<Movie> = {};
    try {
      movie = JSON.parse(artifact.mime === "application/json" ? artifact.content : artifact.summary ?? "{}");
    } catch {
      /* ignore */
    }
    const film = mediaSrc(artifact.id, movie.movie);
    // Before the cutting room, a clip lived in content as base64.
    const legacyClip = artifact.mime.startsWith("video/") ? mediaSrc(artifact.id, artifact.content, artifact.mime) : undefined;
    const shots = movie.shots ?? [];
    const anyClip = shots.some((sh) => sh.clip);
    return (
      <div className="space-y-3">
        {film || legacyClip ? (
          <video controls playsInline className="mx-auto w-full max-h-[480px] rounded-2xl bg-black ring-4 ring-violet-200" src={film ?? legacyClip} />
        ) : anyClip ? (
          <Notice tone="info">The shots are ready to watch one by one. Press play on each.</Notice>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-3">
          {shots.map((sh) => {
            const clip = film ? undefined : mediaSrc(artifact.id, sh.clip);
            return (
              <div key={sh.shot} className="rounded-2xl bg-white p-3 ring-2 ring-slate-200">
                {clip && <video controls playsInline preload="metadata" className="mb-2 w-full rounded-xl bg-black" src={clip} />}
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Shot {sh.shot} · {sh.seconds}s</p>
                <p className="mt-1 text-sm text-slate-800">{sh.description}</p>
              </div>
            );
          })}
        </div>
        {(film || legacyClip || anyClip) && !compact && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a href={downloadUrl(artifact.id)} className="rounded-2xl bg-white px-4 py-2 text-base font-bold text-violet-800 ring-2 ring-violet-200 hover:bg-violet-50">
              ⬇️ Download the movie
            </a>
            {movie.style && <span className="text-xs text-slate-500">Look: {movie.style}</span>}
          </div>
        )}
        {showFidelity && movie.fidelity && <FidelityPanel report={movie.fidelity} />}
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

  if (artifact.kind === "audio") {
    let song: { title?: string; lyrics?: string; musicPrompt?: string } = {};
    try {
      song = JSON.parse(artifact.summary ?? "{}");
    } catch {
      /* fall through to whatever we have */
    }
    const audioSrc = artifact.mime.startsWith("audio/") ? mediaSrc(artifact.id, artifact.content, artifact.mime) : undefined;
    return (
      <div className="space-y-4">
        {audioSrc ? (
          <div className="space-y-2">
            <audio controls preload="none" className="w-full" src={audioSrc}>
              Your browser can't play this song.
            </audio>
            {!compact && (
              <a href={downloadUrl(artifact.id)} className="inline-block rounded-2xl bg-white px-4 py-2 text-base font-bold text-violet-800 ring-2 ring-violet-200 hover:bg-violet-50">
                ⬇️ Download the song
              </a>
            )}
          </div>
        ) : (
          // Why this says so little: the server already knows WHY there is no
          // audio -- no provider, or a generation that failed -- and says so in
          // the piece's own note above. Repeating a guess here is how one state
          // ended up telling three different stories at once.
          <Notice tone="info">The words are yours — sing them or clap them!</Notice>
        )}
        <div className="rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">The words</p>
          <p className="mt-2 whitespace-pre-line text-lg leading-relaxed text-slate-800">{song.lyrics ?? "—"}</p>
        </div>
        {song.musicPrompt && (
          <details className="rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
            <summary className="cursor-pointer font-semibold text-slate-700">How we asked for the sound</summary>
            <p className="mt-2 text-slate-600">{song.musicPrompt}</p>
          </details>
        )}
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
  const imageSrc = artifact.mime.startsWith("image/") ? mediaSrc(artifact.id, artifact.content, artifact.mime) : undefined;
  if (imageSrc) {
    return (
      <div className="space-y-2">
        <img src={imageSrc} alt={artifact.title} className="mx-auto max-h-[480px] rounded-2xl ring-4 ring-violet-200" />
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

/* ------------------------------------------------------------------ *
 * The flip-book
 *
 * A picture book is read one page at a time, so that is how it is shown:
 * the cover, then each page with its picture and its words and a button
 * that reads it aloud. Arrow keys turn pages for a child at a keyboard, big
 * buttons for a child at a touchscreen, and the PDF link is for taking it
 * home.
 * ------------------------------------------------------------------ */

export function BookView({ artifactId, book, compact }: { artifactId: number; book: Book; compact?: boolean }) {
  const [index, setIndex] = useState(0); // 0 = cover, 1..n = pages, n+1 = the end
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const last = book.pages.length + 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(last, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last]);

  // Turning the page stops the voice; a page read over the wrong picture is confusing.
  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
  }, [index]);

  const page = index >= 1 && index <= book.pages.length ? book.pages[index - 1] : null;
  const image = index === 0 ? mediaSrc(artifactId, book.cover.image) : page ? mediaSrc(artifactId, page.image) : undefined;
  const audio = page ? mediaSrc(artifactId, page.audio) : undefined;

  const readAloud = () => {
    if (!audio) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    const a = new Audio(audio);
    audioRef.current = a;
    a.onended = () => setPlaying(false);
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const frame = cx("mx-auto w-full overflow-hidden rounded-2xl bg-white ring-4 ring-violet-200", compact ? "max-w-md" : "max-w-3xl");
  return (
    <div className="space-y-3">
      <div className={frame}>
        <div className={cx("grid", compact ? "" : "sm:grid-cols-2")}>
          <div className="relative aspect-square bg-violet-50">
            {image ? (
              <img src={image} alt={index === 0 ? book.cover.scene : page?.scene ?? ""} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-violet-700">
                {index === 0 ? book.cover.scene : index > book.pages.length ? "✨" : page?.scene}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center gap-3 p-5 sm:p-7">
            {index === 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">{book.lang ? `${book.lang.flag} A Language Passport book · ${book.lang.label}` : "A picture book"}</p>
                <h3 className="text-2xl font-black text-slate-900 sm:text-3xl">{book.title}</h3>
                <p className="text-sm text-slate-600">Starring {book.hero.name}. {book.pages.length} pages.</p>
              </>
            )}
            {page && (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Page {page.n} of {book.pages.length}</p>
                {book.lang ? (
                  <WovenText text={page.text} lang={book.lang} artifactId={artifactId} className="text-lg leading-loose text-slate-800 sm:text-xl" />
                ) : (
                  <p className="text-lg leading-relaxed text-slate-800 sm:text-xl">{page.text}</p>
                )}
                {audio && (
                  <button type="button" onClick={readAloud} className="mt-1 inline-flex w-fit items-center gap-2 rounded-2xl bg-violet-100 px-4 py-2 text-base font-bold text-violet-900 hover:bg-violet-200">
                    {playing ? "⏸ Stop" : "🔊 Read it to me"}
                  </button>
                )}
              </>
            )}
            {index > book.pages.length && (
              <>
                <h3 className="text-3xl font-black text-violet-800">{book.theEnd || "The End"}</h3>
                <p className="text-sm text-slate-600">Written by the director{book.madeWith.pictures ? ", with pictures" : ""}{book.madeWith.narration ? " and a voice" : ""} from the Studio.</p>
                {book.lang && <p className="text-base font-bold text-emerald-800">You met {book.lang.words.length} {book.lang.label} words! Play Word Catch below to earn your stamp.</p>}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="rounded-2xl bg-white px-4 py-2 text-base font-bold text-violet-800 ring-2 ring-violet-200 hover:bg-violet-50 disabled:opacity-40">
          ← Back
        </button>
        <span className="text-sm font-semibold text-slate-600">{index === 0 ? "Cover" : index > book.pages.length ? "The End" : `Page ${index}`}</span>
        <button type="button" onClick={() => setIndex((i) => Math.min(last, i + 1))} disabled={index === last} className="rounded-2xl bg-violet-600 px-4 py-2 text-base font-bold text-white shadow-md shadow-violet-200 hover:bg-violet-700 disabled:opacity-40">
          Next →
        </button>
        {!compact && (
          <a href={bookPdfUrl(artifactId)} target="_blank" rel="noreferrer" className="rounded-2xl bg-white px-4 py-2 text-base font-bold text-violet-800 ring-2 ring-violet-200 hover:bg-violet-50">
            📖 Open as PDF
          </a>
        )}
      </div>
      {book.lang && !compact && <LanguageExtras lang={book.lang} artifactId={artifactId} />}
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
  return { game: "🎮", story: "📚", image: "🎨", quest: "🧭", video: "🎬", robot: "🤖", chat: "💬", audio: "🎵", hero: "🦸" }[kind] ?? "✨";
}

/* ------------------------------------------------------------------ *
 * Guided chat
 * ------------------------------------------------------------------ */

export type ChatMsg = { role: "user" | "assistant" | "system"; text: string };

/**
 * The little bit of markdown a helper actually emits: **bold**, *italic* and
 * `code`. Models write it whether or not you ask them to, and a child reading
 * "the answer is **7/8**" sees the asterisks and wonders what they mean.
 *
 * Deliberately not a markdown library and deliberately not dangerouslySetInnerHTML:
 * this builds React nodes from a split, so nothing in a model's reply can ever
 * become markup.
 */
function formatInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*\n]+\*\*|(?<!\*)\*[^*\n]+\*(?!\*)|`[^`\n]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={k++} className="rounded bg-slate-100 px-1 text-[0.95em]">{tok.slice(1, -1)}</code>);
    else out.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Transcript({ turns, avatar }: { turns: { role: string; text: string }[]; avatar?: string }) {
  return (
    <div className="space-y-2">
      {turns.map((t, i) => (
        <div key={i} className={cx("flex", t.role === "user" ? "justify-end" : "justify-start")}>
          <div className={cx("max-w-[85%] whitespace-pre-line break-words rounded-2xl px-4 py-2 text-base leading-relaxed", t.role === "user" ? "bg-violet-600 text-white" : t.role === "system" ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "bg-white text-slate-900 ring-2 ring-violet-100")}>
            {t.role === "assistant" && <span className="mr-1">🤖</span>}
            {t.role === "user" && avatar && <span className="mr-1">{avatar}</span>}
            {formatInline(t.text)}
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
  onSendPhoto,
  avatar,
  placeholder,
}: {
  mode: ModeDef;
  messages: ChatMsg[];
  onSend: (text: string) => void;
  busy?: boolean;
  turnsLeft: number;
  maxChars: number;
  /** When present, a camera button appears and photos can be asked about. */
  onSendPhoto?: (text: string, dataUri: string) => void;
  avatar?: string;
  /** Overrides the mode's placeholder (the Study Desk changes it per tool). */
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ dataUri: string; name: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
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
        {messages.length === 0 && (mode.starters ?? []).some((s) => s.message) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(mode.starters ?? [])
              .filter((s) => s.message)
              .map((s) => (
                <button
                  key={s.label}
                  type="button"
                  disabled={busy || turnsLeft <= 0}
                  onClick={() => onSend(s.message!)}
                  className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-violet-800 ring-1 ring-violet-200 transition hover:ring-violet-400 disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
          </div>
        )}
        {busy && <div className="mt-2"><Spinner label="Thinking…" /></div>}
        <div ref={endRef} />
      </div>
      {photo && (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-violet-200">
          <span>📎</span>
          <span className="min-w-0 flex-1 truncate text-slate-700">{photo.name}</span>
          <span className="hidden text-xs text-slate-500 sm:inline">Looked at once, never saved</span>
          <button type="button" onClick={() => setPhoto(null)} className="font-semibold text-violet-700 underline underline-offset-2">
            Remove
          </button>
        </div>
      )}
      {photoError && <p className="mt-2 text-sm font-semibold text-rose-700">{photoError}</p>}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          if (busy || turnsLeft <= 0) return;
          if (photo && onSendPhoto) {
            onSendPhoto(t.length >= 2 ? t : "Can you help me with this?", photo.dataUri);
            setText("");
            setPhoto(null);
            return;
          }
          if (t.length < 2) return;
          onSend(t);
          setText("");
        }}
      >
        {onSendPhoto && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setPhotoError(null);
                // 4MB keeps a phone photo comfortably inside the request limit.
                if (file.size > 4_000_000) return setPhotoError("That photo is a bit big — try taking it again a little further away.");
                const reader = new FileReader();
                reader.onload = () => setPhoto({ dataUri: String(reader.result), name: file.name });
                reader.onerror = () => setPhotoError("That photo didn't open. Try another one.");
                reader.readAsDataURL(file);
              }}
            />
            <button
              type="button"
              disabled={busy || turnsLeft <= 0}
              onClick={() => fileRef.current?.click()}
              title="Take or choose a photo of what you're stuck on"
              className="shrink-0 rounded-xl bg-white px-3 py-2 text-lg ring-2 ring-violet-200 transition hover:ring-violet-400 disabled:opacity-50"
            >
              📷
            </button>
          </>
        )}
        <input
          value={text}
          maxLength={maxChars}
          onChange={(e) => setText(e.target.value)}
          placeholder={turnsLeft > 0 ? placeholder ?? mode.chatPlaceholder ?? "Ask a question…" : "No chats left today"}
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
  initialValues,
}: {
  mode: ModeDef;
  maxChars: number;
  onSubmit: (values: Record<string, string>) => void;
  busy?: boolean;
  submitLabel?: string;
  /** Remix workflow: start from values carried over from another piece. */
  initialValues?: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...(initialValues ?? {}) }));
  const missing = useMemo(() => mode.createFields.filter((f) => f.required && !(values[f.key] ?? "").trim()), [mode, values]);
  const starters = (mode.starters ?? []).filter((s) => s.values);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (missing.length || busy) return;
        onSubmit(values);
      }}
    >
      {starters.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Not sure where to start? Pick one and change it.
          </p>
          <div className="flex flex-wrap gap-2">
            {starters.map((s) => (
              <button
                key={s.label}
                type="button"
                disabled={busy}
                onClick={() => setValues({ ...(s.values ?? {}) })}
                className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-800 ring-1 ring-violet-200 transition hover:bg-violet-100 hover:ring-violet-400 disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            These fill the boxes so you can see what a good order looks like. Change anything you want before you press the button —
            the best ones are the ones you change.
          </p>
        </div>
      )}
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

/**
 * A quest is a list to check, and a quiz is a list with the answers kept
 * separate: hidden for a student sheet, shown for the answer key. Both views
 * print cleanly (the print button opens a plain page with just the list).
 */
function QuestView({ data, title, compact }: { data: { title?: string; items?: { text: string; sourceHint: string; answer?: string }[]; nextIdea?: string }; title: string; compact?: boolean }) {
  const items = data.items ?? [];
  const isQuiz = items.some((it) => it.answer);
  const [showAnswers, setShowAnswers] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  function printSheet(withAnswers: boolean) {
    const esc = (t: string) => String(t ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string);
    const rows = items
      .map((it, i) => `<li><p class="q">${esc(it.text)}</p>${withAnswers ? `<p class="a">Answer: ${esc(it.answer ?? "")}</p>` : isQuiz ? `<p class="line">&nbsp;</p>` : ""}<p class="s">Check me: ${esc(it.sourceHint)}</p></li>`)
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(data.title ?? title)}</title><style>body{font-family:system-ui,sans-serif;max-width:720px;margin:32px auto;padding:0 20px;color:#111}h1{font-size:22px}ol{padding-left:24px}li{margin:14px 0}.q{font-size:16px;font-weight:600;margin:0}.a{margin:4px 0 0;color:#166534;font-weight:600}.s{margin:4px 0 0;font-size:12px;color:#92400e}.line{border-bottom:1px solid #999;height:22px;margin:6px 0 0}.name{font-size:14px;margin-bottom:20px}</style></head><body><h1>${esc(data.title ?? title)}${withAnswers ? " (answer key)" : ""}</h1>${withAnswers ? "" : '<p class="name">Name: ____________________________</p>'}<ol>${rows}</ol></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }
  return (
    <div className="space-y-3">
      <Notice tone="info">These are first-draft ideas from the AI. Your job: check each one in a book or a kid-safe site, then mark it ✅ on paper.</Notice>
      {isQuiz && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowAnswers((v) => !v)} className="rounded-full bg-violet-100 px-3 py-1.5 text-sm font-bold text-violet-800 ring-1 ring-violet-200 hover:bg-violet-200">
            {showAnswers ? "🙈 Hide the answers" : "👀 Show the answers"}
          </button>
          {!compact && (
            <>
              <button type="button" onClick={() => printSheet(false)} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
                🖨️ Print student sheet
              </button>
              <button type="button" onClick={() => printSheet(true)} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
                🖨️ Print answer key
              </button>
            </>
          )}
        </div>
      )}
      <ol className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="rounded-2xl bg-white p-4 ring-2 ring-slate-200">
            <p className="text-base font-semibold text-slate-900">
              <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800">{i + 1}</span>
              {it.text}
            </p>
            {it.answer &&
              (showAnswers || revealed[i] ? (
                <p className="mt-1 text-sm font-semibold text-green-800">Answer: {it.answer}</p>
              ) : (
                <button type="button" onClick={() => setRevealed((r) => ({ ...r, [i]: true }))} className="mt-1 text-sm font-bold text-violet-700 underline decoration-dotted">
                  Reveal the answer
                </button>
              ))}
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

export function ChangeBox({ hint, maxChars, onSubmit, busy, quick }: { hint: string; maxChars: number; onSubmit: (change: string) => void; busy?: boolean; quick?: { label: string; change: string }[] }) {
  const [change, setChange] = useState("");
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap"
      onSubmit={(e) => {
        e.preventDefault();
        if (change.trim().length < 3 || busy) return;
        onSubmit(change.trim());
        setChange("");
      }}
    >
      {quick && quick.length > 0 && (
        <div className="flex w-full flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              disabled={busy}
              onClick={() => onSubmit(q.change)}
              className="rounded-full bg-violet-100 px-3 py-1.5 text-sm font-bold text-violet-800 ring-1 ring-violet-200 hover:bg-violet-200 disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
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

/**
 * The studio pipeline, while it runs.
 *
 * A build takes 30-90 seconds, and a spinner for that long reads as broken.
 * Showing the actual steps — designing, writing, testing, fixing — makes the
 * wait legible, and makes it obvious that the thing was tested rather than
 * merely generated.
 */
export function ForgeSteps({ steps }: { steps: NonNullable<StudioRequest["progress"]> }) {
  if (!steps?.length) return null;
  const icon = (state: string) =>
    state === "done" ? "\u2713" : state === "failed" ? "\u2717" : state === "skipped" ? "\u2013" : "\u25CF";
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={`${s.key}-${i}`} className="flex items-start gap-3 text-sm">
          <span
            className={cx(
              "mt-0.5 font-bold",
              s.state === "done" ? "text-emerald-600" : s.state === "failed" ? "text-rose-600" : s.state === "skipped" ? "text-slate-400" : "animate-pulse text-violet-600",
            )}
          >
            {icon(s.state)}
          </span>
          <span className="flex-1">
            <span className={cx("font-semibold", s.state === "running" ? "text-violet-800" : "text-slate-800")}>{s.label}</span>
            {s.detail && <span className="text-slate-500"> — {s.detail}</span>}
          </span>
          {typeof s.ms === "number" && s.state !== "running" && (
            <span className="shrink-0 text-xs text-slate-400">{(s.ms / 1000).toFixed(1)}s</span>
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * @param showReason Facilitators see WHY a screen fired; children do not.
 *
 * Without this an adult reviewing a block reads the child-facing line -- "your
 * facilitator can help you think of another idea" -- and they ARE the
 * facilitator. A screen that fires on a legitimate topic is indistinguishable
 * from one that fires on something genuinely wrong, so the person responsible
 * for judging it cannot judge it.
 */
export function RequestStatus({ request, showReason }: { request: StudioRequest; showReason?: boolean }) {
  if (request.status === "queued" || request.status === "working") return <Spinner label={request.status === "queued" ? "In line…" : "The helper is working on it…"} />;

  const reason =
    showReason && request.flags?.length ? (
      <p className="mt-2 text-xs text-slate-600">
        <span className="font-semibold">Why: </span>
        {request.flags
          .map((f) => [f.layer, f.category, f.detail].filter(Boolean).join(" · "))
          .join("  |  ")}
      </p>
    ) : null;

  if (request.status === "blocked")
    return (
      <Notice>
        {request.message ?? "Let's try that a different way."}
        {reason}
      </Notice>
    );
  if (request.status === "failed")
    return (
      <Notice>
        {request.message ?? "That one didn't work. Try again!"}
        {reason}
      </Notice>
    );
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


/* ------------------------------------------------------------------ *
 * Remix workflow pieces
 * ------------------------------------------------------------------ */

/** A hero: what they look like and what they sound like. */
export function HeroView({ artifactId, hero, compact }: { artifactId: number; hero: Hero; compact?: boolean }) {
  const portrait = mediaSrc(artifactId, hero.portrait);
  const sample = mediaSrc(artifactId, hero.sample);
  return (
    <div className={compact ? "flex gap-3" : "grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]"}>
      {portrait ? (
        <img src={portrait} alt={`${hero.name}`} className={compact ? "h-20 w-20 rounded-2xl object-cover ring-2 ring-violet-100" : "w-full rounded-3xl object-cover ring-2 ring-violet-100"} />
      ) : (
        <div className={compact ? "flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-50 text-3xl" : "flex aspect-square w-full items-center justify-center rounded-3xl bg-violet-50 text-6xl"}>🦸</div>
      )}
      <div className="min-w-0 space-y-2">
        <p className="text-xl font-extrabold">{hero.name}</p>
        {!compact && (
          <>
            <p className="text-sm text-slate-700">
              <span className="font-bold">Looks like:</span> {hero.look}
            </p>
            {hero.personality && (
              <p className="text-sm text-slate-700">
                <span className="font-bold">Personality:</span> {hero.personality}
              </p>
            )}
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{hero.style}</p>
          </>
        )}
        <p className="text-sm text-slate-700">
          <span className="font-bold">Voice:</span> {hero.voice?.name ?? "the house voice"}
          {hero.voice?.provider === "elevenlabs" && <span className="text-xs text-slate-500"> · ElevenLabs</span>}
          {hero.voice?.provider === "azure" && <span className="text-xs text-slate-500"> · Azure</span>}
        </p>
        {sample && <audio controls src={sample} className="w-full max-w-sm" preload="none" />}
      </div>
    </div>
  );
}

const FILE_ICON: Record<FileLink["type"], string> = { pdf: "📕", image: "🖼️", audio: "🔊", video: "🎞️", html: "🕹️", text: "📝", json: "🗂️" };

/** Every file of a piece, each one a link that opens or downloads it. */
export function FilesList({ files, title = "Files", dense }: { files: FileLink[]; title?: string; dense?: boolean }) {
  if (!files.length) return null;
  const main = files.filter((f) => !/^(Page \d+|Shot \d+)/.test(f.label));
  const parts = files.filter((f) => /^(Page \d+|Shot \d+)/.test(f.label));
  const link = (f: FileLink) => (
    <a
      key={f.url + f.label}
      href={f.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-800 ring-1 ring-violet-200 hover:bg-violet-50"
    >
      <span>{FILE_ICON[f.type]}</span>
      {f.label}
    </a>
  );
  return (
    <div className={dense ? "space-y-1" : "space-y-2"}>
      {!dense && <p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>}
      <div className="flex flex-wrap gap-1.5">{main.map(link)}</div>
      {parts.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-slate-500">{parts.length} more: every page and shot on its own</summary>
          <div className="mt-1.5 flex flex-wrap gap-1.5">{parts.map(link)}</div>
        </details>
      )}
    </div>
  );
}

/** Staff view of the hero-consistency check: one line per shot, with what drifted. */
function FidelityPanel({ report }: { report: NonNullable<Movie["fidelity"]> }) {
  if (!report.checked) {
    return <p className="text-xs text-slate-500">Hero consistency: the check could not run for this movie.</p>;
  }
  const tone = (n: number | null) => (n === null ? "text-slate-500" : n >= report.threshold ? "text-emerald-700" : "text-amber-700");
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
      <p className="font-bold">
        Hero consistency: <span className={tone(report.average)}>{report.average ?? "–"}/10</span>
        <span className="ml-2 text-xs font-normal text-slate-500">
          compared with the {report.reference}
          {report.retakes ? ` · ${report.retakes} shot${report.retakes === 1 ? "" : "s"} re-filmed` : ""}
        </span>
      </p>
      <ul className="mt-1 space-y-0.5">
        {report.shots.map((sh) => (
          <li key={sh.shot} className="text-xs">
            Shot {sh.shot}: <span className={`font-semibold ${tone(sh.score)}`}>{sh.score ?? "not checked"}{sh.score !== null ? "/10" : ""}</span>
            {sh.differences ? <span className="text-slate-600"> · {sh.differences}</span> : null}
            {sh.take > 1 ? <span className="text-slate-500"> (retake)</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
