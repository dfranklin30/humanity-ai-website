/**
 * Language Passport — the reading side.
 *
 * A Language Passport book is a Story Maker book whose page text weaves in
 * words from another language, marked [[word|english]]. Here those become:
 *
 *   WovenText   — the page, with every woven word a button: tap to hear it,
 *                 and to see its picture, meaning and how to say it
 *   WordShelf   — every word and the take-home phrase, as cards
 *   WordCatch   — a short game on the same words, alternating "see it, pick
 *                 the word" with "hear it, pick the picture"
 *   PassportStamps — the stamps earned by finishing Word Catch
 *
 * Nothing here calls a model: the words were written, checked, screened and
 * recorded when the book was made, and a facilitator approved the book.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../components/ui";
import { mediaSrc, type LangBlock, type LangWord } from "./api";

const MARK = /\[\[([^|\]]{1,40})\|([^\]]{1,40})\]\]/g;

/* ------------------------------------------------------------------ *
 * Sound
 * ------------------------------------------------------------------ */

let current: HTMLAudioElement | null = null;
function play(src: string | undefined) {
  if (!src) return;
  current?.pause();
  const a = new Audio(src);
  current = a;
  a.play().catch(() => {});
}

/* ------------------------------------------------------------------ *
 * The page text, with tappable words
 * ------------------------------------------------------------------ */

export function WovenText({ text, lang, artifactId, className }: { text: string; lang: LangBlock; artifactId: number; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => setOpen(null), [text]);
  const parts = useMemo(() => {
    const out: ({ t: "text"; v: string } | { t: "word"; w: string; en: string; i: number })[] = [];
    let last = 0;
    let i = 0;
    for (const m of text.matchAll(MARK)) {
      if (m.index! > last) out.push({ t: "text", v: text.slice(last, m.index) });
      out.push({ t: "word", w: m[1], en: m[2], i: i++ });
      last = m.index! + m[0].length;
    }
    if (last < text.length) out.push({ t: "text", v: text.slice(last) });
    return out;
  }, [text]);
  const info = open ? lang.words.find((w) => w.word === open) : null;

  return (
    <div className="space-y-3">
      <p className={className}>
        {parts.map((p, k) =>
          p.t === "text" ? (
            <span key={k}>{p.v}</span>
          ) : (
            <WordButton
              key={k}
              word={lang.words.find((w) => w.word === p.w) ?? { word: p.w, english: p.en, say: "", emoji: "⭐" }}
              active={open === p.w}
              onTap={(w) => {
                setOpen(w.word);
                play(mediaSrc(artifactId, w.audio));
              }}
            />
          ),
        )}
      </p>
      {info && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-2 ring-emerald-200" role="status">
          <span className="text-4xl" aria-hidden="true">{info.emoji}</span>
          <div className="min-w-0">
            <p className="text-lg font-black text-emerald-900">
              <span dir="auto">{info.word}</span>
              {info.roman && <span className="ml-2 text-base font-semibold text-emerald-700">{info.roman}</span>}
              <span className="ml-2 text-base font-semibold text-slate-600">= {info.english}</span>
            </p>
            {info.say && <p className="text-sm text-slate-600">Say it: <strong>{info.say}</strong></p>}
          </div>
          {info.audio && (
            <button type="button" onClick={() => play(mediaSrc(artifactId, info.audio))} className="ml-auto rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-100">
              🔊 Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function WordButton({ word, active, onTap }: { word: LangWord; active: boolean; onTap: (w: LangWord) => void }) {
  return (
    <button
      type="button"
      onClick={() => onTap(word)}
      title={`${word.english} — tap to hear it`}
      className={cx(
        "mx-0.5 inline-flex flex-col items-center rounded-lg px-1.5 align-baseline leading-tight transition",
        active ? "bg-emerald-200 text-emerald-950" : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
      )}
    >
      <span dir="auto" className="font-black underline decoration-emerald-400 decoration-2 underline-offset-4">{word.word}</span>
      {word.roman && <span className="text-[0.6em] font-semibold text-emerald-700">{word.roman}</span>}
    </button>
  );
}

/** The read-aloud and search text: the woven word itself, no brackets. */
export function plainWoven(text: string): string {
  return text.replace(MARK, (_m, w) => w);
}

/* ------------------------------------------------------------------ *
 * Every word, as cards
 * ------------------------------------------------------------------ */

export function WordShelf({ lang, artifactId }: { lang: LangBlock; artifactId: number }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lang.words.map((w) => (
          <button
            key={w.word}
            type="button"
            onClick={() => play(mediaSrc(artifactId, w.audio))}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 text-left ring-2 ring-emerald-100 transition hover:ring-emerald-300"
          >
            <span className="text-3xl" aria-hidden="true">{w.emoji}</span>
            <span className="min-w-0">
              <span dir="auto" className="block text-lg font-black text-emerald-900">{w.word}</span>
              {w.roman && <span className="block text-xs font-semibold text-emerald-700">{w.roman}</span>}
              <span className="block text-sm text-slate-600">{w.english}{w.say ? ` · ${w.say}` : ""}</span>
            </span>
            {w.audio && <span className="ml-auto text-lg" aria-label="Hear it">🔊</span>}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => play(mediaSrc(artifactId, lang.phrase.audio))}
        className="flex w-full items-center gap-3 rounded-2xl bg-emerald-600 p-4 text-left text-white shadow-md shadow-emerald-200 hover:bg-emerald-700"
      >
        <span className="text-3xl" aria-hidden="true">💬</span>
        <span className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-wide text-emerald-100">Say it to someone today</span>
          <span dir="auto" className="block text-xl font-black">{lang.phrase.text}</span>
          {lang.phrase.roman && <span className="block text-sm font-semibold text-emerald-100">{lang.phrase.roman}</span>}
          <span className="block text-sm text-emerald-50">{lang.phrase.english}{lang.phrase.say ? ` · ${lang.phrase.say}` : ""}</span>
        </span>
        {lang.phrase.audio && <span className="ml-auto text-xl">🔊</span>}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Word Catch
 * ------------------------------------------------------------------ */

type Round = { kind: "see" | "hear"; answer: LangWord; choices: LangWord[] };

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeRounds(words: LangWord[], hasAudio: boolean): Round[] {
  const order = shuffle(words);
  const n = Math.min(10, Math.max(6, words.length));
  const rounds: Round[] = [];
  for (let i = 0; i < n; i++) {
    const answer = order[i % order.length];
    const others = shuffle(words.filter((w) => w.word !== answer.word)).slice(0, 3);
    const kind: Round["kind"] = hasAudio && answer.audio && i % 2 === 1 ? "hear" : "see";
    rounds.push({ kind, answer, choices: shuffle([answer, ...others]) });
  }
  return rounds;
}

export function WordCatch({ lang, artifactId, onFinish }: { lang: LangBlock; artifactId: number; onFinish: (score: number, total: number) => void }) {
  const hasAudio = lang.words.some((w) => w.audio);
  const [rounds, setRounds] = useState(() => makeRounds(lang.words, hasAudio));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);
  const round = rounds[i];

  useEffect(() => () => void (timer.current && window.clearTimeout(timer.current)), []);
  // A listening round starts by saying the word.
  useEffect(() => {
    if (!done && round?.kind === "hear") play(mediaSrc(artifactId, round.answer.audio));
  }, [i, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (w: LangWord) => {
    if (picked) return;
    setPicked(w.word);
    const right = w.word === round.answer.word;
    if (right) {
      setScore((s) => s + 1);
      if (round.kind === "see") play(mediaSrc(artifactId, w.audio));
    }
    timer.current = window.setTimeout(() => {
      setPicked(null);
      if (i + 1 >= rounds.length) {
        const final = score + (right ? 1 : 0);
        setDone(true);
        onFinish(final, rounds.length);
      } else setI(i + 1);
    }, right ? 900 : 1600);
  };

  const again = () => {
    setRounds(makeRounds(lang.words, hasAudio));
    setI(0);
    setScore(0);
    setPicked(null);
    setDone(false);
  };

  if (done) {
    const passed = score >= Math.ceil(rounds.length * 0.7);
    return (
      <div className="space-y-4 rounded-3xl bg-gradient-to-b from-emerald-50 to-white p-6 text-center ring-2 ring-emerald-200">
        <p className="text-5xl" aria-hidden="true">{passed ? "🎉" : "💪"}</p>
        <h4 className="text-2xl font-black text-emerald-900">{score} of {rounds.length} caught!</h4>
        {passed ? (
          <>
            <p className="text-slate-700">You earned your {lang.label} stamp.</p>
            <div className="flex justify-center"><Stamp lang={lang} big /></div>
          </>
        ) : (
          <p className="text-slate-700">Catch {Math.ceil(rounds.length * 0.7)} to earn your {lang.label} stamp. Read the book again, then try once more!</p>
        )}
        <button type="button" onClick={again} className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-base font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700">
          Play again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl bg-gradient-to-b from-sky-50 to-emerald-50 p-5 ring-2 ring-emerald-200">
      <style>{`@keyframes aikBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
      <div className="flex items-center justify-between text-sm font-bold text-emerald-800">
        <span>Word Catch · {lang.flag} {lang.label}</span>
        <span>
          Round {i + 1} of {rounds.length} · ⭐ {score}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(i / rounds.length) * 100}%` }} />
      </div>

      <div className="text-center">
        {round.kind === "see" ? (
          <>
            <p className="text-sm font-semibold text-slate-600">Catch the {lang.label} word for…</p>
            <p className="text-7xl" aria-hidden="true">{round.answer.emoji}</p>
            <p className="text-lg font-bold text-slate-800">{round.answer.english}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-600">Listen! Which picture is it?</p>
            <button type="button" onClick={() => play(mediaSrc(artifactId, round.answer.audio))} className="mt-2 rounded-full bg-white px-6 py-4 text-4xl shadow ring-2 ring-emerald-200 hover:bg-emerald-50" aria-label="Hear the word again">
              🔊
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {round.choices.map((w, k) => {
          const isAnswer = w.word === round.answer.word;
          const state = !picked ? "idle" : isAnswer ? "right" : picked === w.word ? "wrong" : "idle";
          return (
            <button
              key={`${i}-${w.word}`}
              type="button"
              onClick={() => choose(w)}
              disabled={Boolean(picked)}
              style={{ animation: picked ? undefined : `aikBob ${2.2 + k * 0.35}s ease-in-out ${k * 0.2}s infinite` }}
              className={cx(
                "flex min-h-[84px] flex-col items-center justify-center rounded-full px-4 py-3 text-center shadow-md ring-2 transition",
                state === "right" && "bg-emerald-500 text-white ring-emerald-600",
                state === "wrong" && "bg-rose-100 text-rose-900 ring-rose-300",
                state === "idle" && "bg-white text-slate-900 ring-sky-200 hover:ring-emerald-400",
              )}
            >
              {round.kind === "see" ? (
                <>
                  <span dir="auto" className="text-xl font-black">{w.word}</span>
                  {w.roman && <span className="text-xs font-semibold opacity-80">{w.roman}</span>}
                </>
              ) : (
                <span className="text-4xl" aria-label={w.english}>{w.emoji}</span>
              )}
              {picked && isAnswer && round.kind === "hear" && <span dir="auto" className="text-sm font-bold">{w.word}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Passport stamps (kept on this device)
 * ------------------------------------------------------------------ */

type StampBook = Record<string, { label: string; flag: string; hello: string; date: string; best: number; total: number }>;
const KEY = "aik-passport-v1";

export function readStamps(): StampBook {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") as StampBook;
  } catch {
    return {};
  }
}

export function saveStamp(lang: LangBlock, score: number, total: number): StampBook {
  const book = readStamps();
  if (score < Math.ceil(total * 0.7)) return book;
  const prev = book[lang.code];
  book[lang.code] = {
    label: lang.label,
    flag: lang.flag,
    hello: lang.hello,
    date: prev?.date ?? new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    best: Math.max(prev?.best ?? 0, score),
    total,
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    /* private window: the stamp still shows for this visit */
  }
  return book;
}

const STAMP_COLORS: Record<string, string> = { es: "#dc2626", fr: "#2563eb", zh: "#b91c1c", sw: "#15803d", ar: "#0f766e", hi: "#ea580c", ja: "#be123c" };

export function Stamp({ lang, big, date }: { lang: Pick<LangBlock, "code" | "label" | "flag" | "hello">; big?: boolean; date?: string }) {
  const c = STAMP_COLORS[lang.code] ?? "#059669";
  const size = big ? 150 : 96;
  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center rounded-full text-center"
      style={{ width: size, height: size, border: `4px double ${c}`, color: c, transform: "rotate(-8deg)", background: "rgba(255,255,255,.85)" }}
      aria-label={`${lang.label} passport stamp`}
    >
      <span style={{ fontSize: big ? 34 : 22 }} aria-hidden="true">{lang.flag}</span>
      <span className="font-black uppercase leading-none" style={{ fontSize: big ? 14 : 10, letterSpacing: ".08em" }}>{lang.label}</span>
      <span dir="auto" className="font-bold" style={{ fontSize: big ? 13 : 10 }}>{lang.hello}</span>
      {date && <span className="font-semibold opacity-80" style={{ fontSize: big ? 11 : 8 }}>{date}</span>}
    </div>
  );
}

export function PassportStamps({ book }: { book: StampBook }) {
  const entries = Object.entries(book);
  if (!entries.length) return <p className="text-sm text-slate-600">No stamps yet. Finish Word Catch to earn your first one!</p>;
  return (
    <div className="flex flex-wrap gap-4">
      {entries.map(([code, s]) => (
        <Stamp key={code} lang={{ code, label: s.label, flag: s.flag, hello: s.hello }} date={s.date} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Everything under the book
 * ------------------------------------------------------------------ */

export function LanguageExtras({ lang, artifactId }: { lang: LangBlock; artifactId: number }) {
  const [tab, setTab] = useState<"words" | "catch" | "passport">("words");
  const [stamps, setStamps] = useState<StampBook>(() => readStamps());
  const tabs: [typeof tab, string][] = [
    ["words", `📖 My ${lang.label} words`],
    ["catch", "🎯 Word Catch"],
    ["passport", "🛂 My passport"],
  ];
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 rounded-3xl bg-white p-4 ring-2 ring-emerald-100 sm:p-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cx("rounded-2xl px-4 py-2 text-sm font-bold", tab === id ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100")}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "words" && <WordShelf lang={lang} artifactId={artifactId} />}
      {tab === "catch" && <WordCatch lang={lang} artifactId={artifactId} onFinish={(s, t) => setStamps(saveStamp(lang, s, t))} />}
      {tab === "passport" && <PassportStamps book={stamps} />}
      {!lang.checked && <p className="text-xs text-amber-700">These words weren't double-checked automatically. Ask your facilitator to look them over.</p>}
    </div>
  );
}
