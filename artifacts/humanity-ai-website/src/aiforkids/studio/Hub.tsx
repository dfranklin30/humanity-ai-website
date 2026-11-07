/**
 * The Hub (roadmap 4): the shared place.
 *
 *   Arcade   games other kids put in the Hub (a game is always a game)
 *   Lounge   facilitator-curated videos and links; always available
 *   Gallery  shared books, movies, songs, pictures, quests, robots, websites, adventures
 *
 * There is one "Put in the Hub" action (in My stuff and on a fresh result);
 * the piece's kind decides the shelf. Facilitator approval still gates it,
 * and with the facilitator's switch on, the shelves show approved work from
 * the whole club, not only this class.
 */
import { useEffect, useState } from "react";
import { cx } from "../components/ui";
import { childHub, type ArtifactMeta } from "./api";
import { ArtifactLoader, BigButton, Card, Spinner, kindEmoji } from "./components";
import { RoomIcon, ROOM_THEME, type RoomId } from "./icons";
import { Lounge } from "./Lounge";

export type HubShelf = "arcade" | "lounge" | "gallery";

const SHELVES: { id: HubShelf; label: string; blurb: string }[] = [
  { id: "arcade", label: "Arcade", blurb: "Games other kids made. Play them!" },
  { id: "lounge", label: "Lounge", blurb: "Something good to watch, picked by a grown-up." },
  { id: "gallery", label: "Gallery", blurb: "Books, movies, songs, pictures, quests, robots, websites and adventures from the club." },
];

export function Hub({ shelf, onShelf }: { shelf: HubShelf; onShelf: (s: HubShelf) => void }) {
  const [data, setData] = useState<{ arcade: ArtifactMeta[]; gallery: ArtifactMeta[]; acrossClasses: boolean } | null>(null);
  const [open, setOpen] = useState<ArtifactMeta | null>(null);

  useEffect(() => {
    childHub()
      .then(setData)
      .catch(() => setData({ arcade: [], gallery: [], acrossClasses: false }));
  }, []);

  // Changing shelf closes whatever was open on the last one.
  useEffect(() => setOpen(null), [shelf]);

  const theme = ROOM_THEME.hub;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 rounded-[28px] bg-white p-5 ring-2 ring-sky-100">
        <RoomIcon id="hub" size={48} />
        <div className="min-w-[200px] flex-1">
          <h2 className="text-2xl font-black text-slate-900">The Hub</h2>
          <p className="text-sm font-semibold text-slate-600">
            {data?.acrossClasses ? "Everything the whole club shared, in one place." : "Everything your class shared, in one place."} Put your own work here from My stuff.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Hub shelves">
          {SHELVES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onShelf(s.id)}
              className={cx("flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-base font-extrabold transition", shelf === s.id ? "text-white" : "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50")}
              style={shelf === s.id ? { background: ROOM_THEME[s.id as RoomId].accent } : undefined}
              data-testid={`hub-shelf-${s.id}`}
            >
              <RoomIcon id={s.id as RoomId} size={18} tile={shelf !== s.id} />
              {s.label}
              {s.id !== "lounge" && data && <span className={cx("rounded-full px-2 text-xs", shelf === s.id ? "bg-white/25" : "bg-slate-100 text-slate-600")}>{data[s.id].length}</span>}
            </button>
          ))}
        </nav>
      </div>

      {shelf === "lounge" && <Lounge />}

      {shelf !== "lounge" && !data && <Spinner label={shelf === "arcade" ? "Opening the Arcade…" : "Hanging the Gallery…"} />}

      {shelf !== "lounge" && data && open && (
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-extrabold">
              {kindEmoji(open.kind)} {open.title}{" "}
              <span className="text-sm font-semibold text-slate-500">
                by {open.avatar} {open.nickname ?? "the facilitator"}
                {data.acrossClasses && open.class_name ? ` · ${open.class_name}` : ""}
              </span>
            </h3>
            <BigButton variant="ghost" onClick={() => setOpen(null)}>
              ← Back to the {shelf === "arcade" ? "Arcade" : "Gallery"}
            </BigButton>
          </div>
          <ArtifactLoader id={open.id} />
        </Card>
      )}

      {shelf !== "lounge" && data && !open && (
        <Shelf shelf={shelf} items={data[shelf]} across={data.acrossClasses} onOpen={setOpen} />
      )}

      <p className="text-xs font-semibold text-slate-500" style={{ color: theme.accent }}>
        {SHELVES.find((s) => s.id === shelf)?.blurb}
      </p>
    </div>
  );
}

/** The one line under a title. A song keeps its sheet (title, lyrics, sound prompt) as JSON in summary; show the first line of the words instead. */
function blurb(a: ArtifactMeta): string {
  if (a.kind === "audio" && a.summary?.startsWith("{")) {
    try {
      const sheet = JSON.parse(a.summary) as { lyrics?: string };
      const line = (sheet.lyrics ?? "").split("\n").map((l) => l.trim()).find(Boolean);
      return line ? `🎵 “${line}…”` : "A song";
    } catch {
      return "A song";
    }
  }
  return a.summary ?? "";
}

function Shelf({ shelf, items, across, onOpen }: { shelf: "arcade" | "gallery"; items: ArtifactMeta[]; across: boolean; onOpen: (a: ArtifactMeta) => void }) {
  const theme = ROOM_THEME[shelf];
  if (!items.length)
    return (
      <Card tone="tint">
        {shelf === "arcade" ? "The Arcade is empty. Make a game and put it in the Hub!" : "The Gallery is empty. Make something and put it in the Hub!"}
      </Card>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid={`hub-${shelf}`}>
      {items.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onOpen(a)}
          className={cx("rounded-3xl bg-white p-4 text-left ring-2 transition hover:-translate-y-0.5", theme.ring)}
        >
          <p className="text-3xl">{kindEmoji(a.kind)}</p>
          <p className="mt-1 text-lg font-extrabold">{a.title}</p>
          <p className="text-sm text-slate-600">{blurb(a)}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            by {a.avatar} {a.nickname ?? "the facilitator"}
            {across && a.class_name ? ` · ${a.class_name}` : ""}
          </p>
        </button>
      ))}
    </div>
  );
}
