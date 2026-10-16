/**
 * The Screen Time Lounge: something good to watch while you wait.
 *
 * Two shelves. "Made by us" plays the class's own approved movies, songs and
 * books. "Picked for you" is what the facilitator chose, plus a starter set
 * of trusted kids' sources. A YouTube pick plays right here (nocookie embed,
 * related videos off); everything else opens in a new tab.
 */
import { useEffect, useState } from "react";
import { childLounge, type ArtifactMeta, type LoungeItem } from "./api";
import { ArtifactLoader, BigButton, Card, Spinner, kindEmoji } from "./components";
import { RoomIcon, ROOM_THEME } from "./icons";

export function Lounge() {
  const [data, setData] = useState<{ picked: LoungeItem[]; made: ArtifactMeta[] } | null>(null);
  const [playing, setPlaying] = useState<LoungeItem | null>(null);
  const [open, setOpen] = useState<ArtifactMeta | null>(null);
  useEffect(() => {
    childLounge()
      .then(setData)
      .catch(() => setData({ picked: [], made: [] }));
  }, []);
  if (!data) return <Spinner label="Turning on the Lounge…" />;
  const theme = ROOM_THEME.lounge;

  if (open) {
    return (
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xl font-black">
            {kindEmoji(open.kind)} {open.title} <span className="text-sm font-semibold text-slate-500">by {open.avatar} {open.nickname ?? "the facilitator"}</span>
          </h3>
          <BigButton variant="ghost" onClick={() => setOpen(null)}>
            ← Back to the Lounge
          </BigButton>
        </div>
        <ArtifactLoader id={open.id} />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-[28px] bg-white p-5 ring-2 ring-teal-100">
        <RoomIcon id="lounge" size={48} />
        <div>
          <h2 className="text-2xl font-black text-slate-900">Screen Time Lounge</h2>
          <p className="text-sm font-semibold text-slate-600">Finished early, or waiting for a turn? Watch something good. Everything here was picked by a grown-up.</p>
        </div>
      </div>

      {playing && (
        <Card>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-lg font-black">{playing.title}</p>
            <BigButton variant="ghost" onClick={() => setPlaying(null)}>
              ✕ Close
            </BigButton>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
            <iframe
              title={playing.title}
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${playing.youtubeId}?rel=0&modestbranding=1&iv_load_policy=3`}
              allow="encrypted-media; picture-in-picture; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">From {playing.source || "YouTube"} · videos can show ads; tell your facilitator if you see something that isn't for kids.</p>
        </Card>
      )}

      <section>
        <h3 className="mb-2 text-xl font-black text-slate-900">Made by us</h3>
        {data.made.length === 0 ? (
          <Card tone="tint">Nothing on this shelf yet. When your class publishes a movie, song or book, it shows up here.</Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.made.map((a) => (
              <button key={a.id} onClick={() => setOpen(a)} className="rounded-3xl bg-white p-4 text-left ring-2 ring-teal-100 transition hover:-translate-y-0.5 hover:ring-teal-400">
                <p className="text-3xl">{kindEmoji(a.kind)}</p>
                <p className="mt-1 text-lg font-black">{a.title}</p>
                <p className="text-sm font-semibold text-slate-500">
                  by {a.avatar} {a.nickname ?? "the facilitator"}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xl font-black text-slate-900">Picked for you</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.picked.map((v) =>
            v.youtubeId ? (
              <button key={v.id} onClick={() => setPlaying(v)} className="flex flex-col rounded-3xl bg-white p-4 text-left ring-2 ring-teal-100 transition hover:-translate-y-0.5 hover:ring-teal-400">
                <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-100">
                  <img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                </div>
                <p className="mt-2 text-lg font-black leading-tight">{v.title}</p>
                <p className="text-xs font-bold" style={{ color: theme.accent }}>
                  ▶ Play here · {v.source}
                </p>
                {v.note && <p className="mt-1 text-sm font-semibold text-slate-600">{v.note}</p>}
              </button>
            ) : (
              <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="flex flex-col rounded-3xl bg-white p-4 text-left ring-2 ring-teal-100 transition hover:-translate-y-0.5 hover:ring-teal-400">
                <div className="flex aspect-video w-full items-center justify-center rounded-2xl" style={{ background: theme.tile }}>
                  <RoomIcon id="lounge" size={40} tile={false} />
                </div>
                <p className="mt-2 text-lg font-black leading-tight">{v.title}</p>
                <p className="text-xs font-bold" style={{ color: theme.accent }}>
                  ↗ Opens in a new tab · {v.source}
                </p>
                {v.note && <p className="mt-1 text-sm font-semibold text-slate-600">{v.note}</p>}
              </a>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
