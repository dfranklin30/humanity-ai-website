/**
 * Advanced Special Training results (roadmap 6.2).
 *
 * A website is one HTML document, hardened on the server exactly like a game
 * and shown in the same locked sandbox. An adventure is JSON: pages with
 * choices; the reader taps a choice and the next page appears. Both land in
 * My stuff like any other piece and can go to the Hub Gallery.
 */
import { useMemo, useState } from "react";
import { downloadUrl, type Artifact } from "./api";
import { GameFrame } from "./components";

export function SiteView({ artifact, compact }: { artifact: Artifact; compact?: boolean }) {
  return (
    <div className="space-y-3">
      <GameFrame html={artifact.content} title={artifact.title} tall={!compact} />
      {!compact && (
        <a href={downloadUrl(artifact.id)} className="inline-block rounded-2xl bg-white px-4 py-2 text-base font-bold text-indigo-800 ring-2 ring-indigo-200 hover:bg-indigo-50">
          ⬇️ Download the website (opens in any browser)
        </a>
      )}
    </div>
  );
}

export type AdventurePage = { id: string; text: string; choices: { text: string; go: string }[] };
export type Adventure = { format: "adventure"; title: string; start: string; pages: AdventurePage[] };

export function parseAdventure(content: string): Adventure | null {
  try {
    const j = JSON.parse(content);
    return j && Array.isArray(j.pages) && j.pages.length ? (j as Adventure) : null;
  } catch {
    return null;
  }
}

export function AdventureView({ artifact }: { artifact: Artifact }) {
  const story = useMemo(() => parseAdventure(artifact.content), [artifact.content]);
  const [at, setAt] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([]);
  if (!story) return <p className="text-sm font-semibold text-slate-600">This adventure didn't load. Try again!</p>;
  const current = story.pages.find((p) => p.id === (at ?? story.start)) ?? story.pages[0];
  const ending = current.choices.length === 0;
  const endings = story.pages.filter((p) => p.choices.length === 0).length;
  return (
    <div className="rounded-3xl bg-white p-5 ring-2 ring-indigo-100">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-indigo-700">🗺️ Choose your own adventure · page {trail.length + 1}</p>
        <p className="text-xs font-semibold text-slate-500">
          {story.pages.length} pages · {endings} ending{endings === 1 ? "" : "s"}
        </p>
      </div>
      <p className="text-lg leading-relaxed text-slate-800">{current.text}</p>
      {ending ? (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
          <p className="font-black text-emerald-900">🏁 The End — one of {endings}.</p>
          <button
            type="button"
            onClick={() => {
              setAt(null);
              setTrail([]);
            }}
            className="mt-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700"
          >
            ↩ Start over and pick a different path
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {current.choices.map((c, i) => (
            <button
              key={`${current.id}-${i}`}
              type="button"
              onClick={() => {
                setTrail((t) => [...t, current.id]);
                setAt(c.go);
              }}
              className="rounded-2xl bg-indigo-50 px-4 py-3 text-left text-base font-bold text-indigo-900 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
            >
              ➜ {c.text}
            </button>
          ))}
        </div>
      )}
      {trail.length > 0 && !ending && (
        <button
          type="button"
          onClick={() => {
            const back = trail[trail.length - 1];
            setTrail((t) => t.slice(0, -1));
            setAt(back);
          }}
          className="mt-3 text-sm font-bold text-slate-500 underline"
        >
          ← Go back a page
        </button>
      )}
    </div>
  );
}
