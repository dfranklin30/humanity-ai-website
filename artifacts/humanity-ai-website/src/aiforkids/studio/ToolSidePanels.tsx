/**
 * Hub tools: the Lounge and "My work", available inside every tool.
 *
 * Making a movie or a book takes a minute or more. Leaving the tool to watch
 * something or to look back at earlier work used to throw the tool away, and
 * with it the progress bar. The drawer opens over the side of the tool
 * instead, so the request keeps running underneath and the result is waiting
 * when the drawer closes.
 */
import { useEffect, useState } from "react";
import { fLounge, hubLoad, type ArtifactMeta, type LoungeItem } from "./api";
import { ArtifactLoader, BigButton, Spinner, kindEmoji } from "./components";

export type DrawerTab = "lounge" | "work";

export function ToolDrawerButtons({ busy, onOpen }: { busy: boolean; onOpen: (t: DrawerTab) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BigButton variant="ghost" className="!px-3 !py-1.5 !text-sm" onClick={() => onOpen("lounge")}>
        📺 Lounge
      </BigButton>
      <BigButton variant="ghost" className="!px-3 !py-1.5 !text-sm" onClick={() => onOpen("work")}>
        🗂️ My work
      </BigButton>
      {busy && <span className="text-xs font-semibold text-violet-700">Still making it. You can watch something or look through your work while you wait.</span>}
    </div>
  );
}

export function ToolDrawer({ tab, onTab, onClose, busy }: { tab: DrawerTab; onTab: (t: DrawerTab) => void; onClose: () => void; busy: boolean }) {
  // Escape closes the drawer, never the tool.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-xl flex-col bg-slate-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={tab === "lounge" ? "Lounge" : "My work"}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex gap-2">
            {(
              [
                ["lounge", "📺 Lounge"],
                ["work", "🗂️ My work"],
              ] as [DrawerTab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => onTab(id)}
                className={
                  tab === id
                    ? "rounded-full bg-violet-700 px-3 py-1.5 text-sm font-bold text-white"
                    : "rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:ring-violet-300"
                }
              >
                {label}
              </button>
            ))}
          </div>
          <BigButton variant="ghost" className="!px-3 !py-1.5 !text-sm" onClick={onClose}>
            ✕ Back to the tool
          </BigButton>
        </div>
        {busy && (
          <p className="border-b border-violet-100 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-800">
            Your piece is still being made. Close this panel any time; it carries on either way.
          </p>
        )}
        <div className="flex-1 overflow-y-auto p-4">{tab === "lounge" ? <LoungePanel /> : <WorkPanel />}</div>
      </aside>
    </div>
  );
}

function LoungePanel() {
  const [data, setData] = useState<LoungeItem[] | null>(null);
  const [playing, setPlaying] = useState<LoungeItem | null>(null);
  useEffect(() => {
    fLounge()
      .then((d) => setData([...d.items, ...d.starters]))
      .catch(() => setData([]));
  }, []);
  if (!data) return <Spinner label="Turning on the Lounge…" />;
  return (
    <div className="space-y-4">
      {playing && (
        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-extrabold">{playing.title}</p>
            <button className="text-sm font-semibold text-violet-700 underline underline-offset-2" onClick={() => setPlaying(null)}>
              Close
            </button>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              title={playing.title}
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${playing.youtubeId}?rel=0&modestbranding=1&iv_load_policy=3`}
              allow="encrypted-media; picture-in-picture; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
      {data.length === 0 ? (
        <p className="text-sm text-slate-600">Nothing in the Lounge yet. Add videos from the Lounge menu on the dashboard.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((v) => (
            <li key={String(v.id)} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <p className="font-bold">{v.title}</p>
              {v.note && <p className="text-xs text-slate-600">{v.note}</p>}
              <div className="mt-1 text-sm">
                {v.youtubeId ? (
                  <button className="font-semibold text-violet-700 underline underline-offset-2" onClick={() => setPlaying(v)}>
                    ▶ Play here
                  </button>
                ) : (
                  <a className="font-semibold text-violet-700 underline underline-offset-2" href={v.url} target="_blank" rel="noopener noreferrer">
                    Open {v.source || "link"} ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WorkPanel() {
  const [items, setItems] = useState<ArtifactMeta[] | null>(null);
  const [open, setOpen] = useState<ArtifactMeta | null>(null);
  useEffect(() => {
    hubLoad()
      .then((s) => setItems(s.recent.filter((a) => a.kind !== "chat")))
      .catch(() => setItems([]));
  }, []);
  if (!items) return <Spinner label="Finding your work…" />;
  if (open)
    return (
      <div className="space-y-3">
        <button className="text-sm font-semibold text-violet-700 underline underline-offset-2" onClick={() => setOpen(null)}>
          ← All my work
        </button>
        <h3 className="text-lg font-extrabold">
          {kindEmoji(open.kind)} {open.title}
        </h3>
        <ArtifactLoader id={open.id} compact />
      </div>
    );
  if (items.length === 0) return <p className="text-sm text-slate-600">Nothing made yet. Your work shows up here as soon as it exists.</p>;
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id}>
          <button onClick={() => setOpen(a)} className="w-full rounded-xl bg-white p-3 text-left ring-1 ring-slate-200 hover:ring-violet-300">
            <span className="font-bold">
              {kindEmoji(a.kind)} {a.title}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * Auto-save preference
 * ------------------------------------------------------------------ */

const AUTOSAVE_KEY = "aik.hub.autosave";

/** On unless the facilitator has switched it off on this device. */
export function readAutosave(): boolean {
  try {
    return window.localStorage.getItem(AUTOSAVE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function writeAutosave(on: boolean): void {
  try {
    window.localStorage.setItem(AUTOSAVE_KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable: the default (on) still applies */
  }
}

/**
 * The project name auto-save files a new piece under: the name the person
 * typed, else the hero it was made from, else the piece's own title.
 */
export function autoSaveName(opts: { typed: string; heroTitle?: string | null; pieceTitle: string; toolName: string }): string {
  const typed = opts.typed.trim();
  if (typed) return typed.slice(0, 80);
  if (opts.heroTitle && opts.heroTitle.trim()) return `${opts.heroTitle.trim()}'s work`.slice(0, 80);
  const piece = opts.pieceTitle.trim();
  return (piece ? piece : `${opts.toolName} work`).slice(0, 80);
}
