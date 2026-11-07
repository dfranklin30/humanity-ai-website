/**
 * Kids AI Studio — the Emoji Playground.
 *
 * Make-your-own avatar, the way a seven-year-old can do it in four taps:
 * who, colours, something extra, mood. Every row is choices first, with a
 * "Surprise me" that taps for them, and a box for a few words of their own.
 * The server screens the words, draws the sticker, screens the picture and
 * hands back an avatar value; the child sees it big, and can keep it or go
 * again. Nothing about the child goes in: no photo, no name.
 *
 * Used twice: on the join screen (with the class code, before there is a
 * session) and from the top bar once signed in (where the server also puts
 * the new avatar on straight away).
 */
import { useMemo, useState } from "react";
import { cx } from "../components/ui";
import { ApiError, type Playground, type PlaygroundField, type PlaygroundPick } from "./api";
import { Avatar } from "./Avatar";
import { BigButton, Notice } from "./components";

const ORDER: PlaygroundField[] = ["who", "look", "extra", "mood"];
const MAX_TEXT = 80;

function randomPick(p: Playground): PlaygroundPick {
  const r = (f: PlaygroundField) => p[f].options[Math.floor(Math.random() * p[f].options.length)].id;
  return { who: r("who"), look: r("look"), extra: r("extra"), mood: r("mood") };
}

export function AvatarPlayground({
  playground,
  make,
  onKeep,
  onClose,
}: {
  playground: Playground;
  /** Draws one; resolves to the avatar value and the words it was made from. */
  make: (pick: PlaygroundPick) => Promise<{ avatar: string; description?: string }>;
  onKeep: (avatar: string) => void;
  onClose: () => void;
}) {
  const [pick, setPick] = useState<PlaygroundPick>(() => ({ who: playground.who.options[0]?.id, look: playground.look.options[0]?.id, extra: "none", mood: "happy" }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<{ avatar: string; description?: string } | null>(null);

  const summary = useMemo(() => {
    const label = (f: PlaygroundField) => playground[f].options.find((o) => o.id === pick[f])?.label.toLowerCase();
    const extra = pick.extra && pick.extra !== "none" ? `with ${label("extra")}` : "";
    return [label("mood"), label("who"), extra, label("look") ? `in ${label("look")}` : ""].filter(Boolean).join(" ");
  }, [pick, playground]);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      setMade(await make({ ...pick, text: (pick.text ?? "").trim() || undefined }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That one didn't come out. Try again!");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-fuchsia-50 to-violet-50 p-4 ring-2 ring-fuchsia-200 sm:p-5" role="dialog" aria-label="Emoji Playground">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-600">Emoji Playground</p>
          <h2 className="text-2xl font-extrabold text-violet-900">Make your own emoji</h2>
          <p className="text-sm text-slate-600">Tap one from each row, or type a few words. Then press Make it!</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm font-bold text-slate-500 hover:bg-white" aria-label="Close the playground">
          ✕
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_14rem]">
        <div className="space-y-3">
          {ORDER.map((f) => (
            <div key={f}>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">{playground[f].label}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {playground[f].options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    disabled={busy}
                    aria-pressed={pick[f] === o.id}
                    onClick={() => setPick((p) => ({ ...p, [f]: o.id }))}
                    className={cx(
                      "rounded-full px-3 py-1 text-sm font-semibold ring-1 transition",
                      pick[f] === o.id ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-700 ring-slate-300 hover:bg-violet-100",
                    )}
                  >
                    <span aria-hidden>{o.emoji}</span> {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Or say it your way</p>
            <input
              value={pick.text ?? ""}
              onChange={(e) => setPick((p) => ({ ...p, text: e.target.value.slice(0, MAX_TEXT) }))}
              disabled={busy}
              maxLength={MAX_TEXT}
              autoComplete="off"
              placeholder="like: a dragon eating spaghetti"
              className="mt-1 w-full rounded-2xl border-2 border-violet-200 bg-white px-4 py-2 text-base font-semibold text-violet-900 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <BigButton type="button" variant="ghost" className="!px-4 !py-2 !text-base" disabled={busy} onClick={() => setPick((p) => ({ ...randomPick(playground), text: p.text }))}>
              🎲 Surprise me
            </BigButton>
            <BigButton type="button" className="!px-5 !py-2 !text-base" disabled={busy} onClick={go}>
              {busy ? "Drawing…" : made ? "✨ Make another" : "✨ Make it!"}
            </BigButton>
          </div>
          {error && <Notice>{error}</Notice>}
        </div>

        <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-4 text-center ring-2 ring-violet-100">
          {busy ? (
            <>
              <div className="h-24 w-24 animate-pulse rounded-full bg-gradient-to-br from-fuchsia-200 to-violet-200" />
              <p className="mt-3 text-sm font-bold text-violet-700">Drawing your {summary}…</p>
              <p className="text-xs text-slate-500">About 20 seconds.</p>
            </>
          ) : made ? (
            <>
              <Avatar value={made.avatar} size="xl" className="!h-28 !w-28" title="Your new emoji" />
              <p className="mt-3 text-sm font-semibold text-slate-700">{made.description ?? summary}</p>
              <BigButton type="button" className="mt-3 w-full !px-4 !py-2 !text-base" onClick={() => onKeep(made.avatar)}>
                I'll take it! 🎉
              </BigButton>
            </>
          ) : (
            <>
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-violet-50 text-5xl">
                <span aria-hidden>{playground.who.options.find((o) => o.id === pick.who)?.emoji ?? "🙂"}</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">A {summary}</p>
              <p className="text-xs text-slate-500">Your picture shows up here.</p>
            </>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">A grown-up facilitator can see every emoji the class makes. Keep it kind and silly!</p>
    </div>
  );
}
