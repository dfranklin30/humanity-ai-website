/**
 * Kids AI Studio — the Hero Guide.
 *
 * The child's own hero gives the tour: a talking head in a bar pinned to the
 * bottom of the screen (face in a circle, name in small caps, the words
 * typing out as they are spoken, a stop button, and "More" for that step's
 * big button). The face is drawn from the hero's portrait and moves with
 * the voice: an analyser on the audio drives a bob, a squash-and-stretch
 * and a tilt per syllable, and a glow on the ring; between lines it
 * breathes. No video model is needed for that, just the one picture.
 *
 * Before the tour starts the child picks the hero, picks a voice and hears
 * it say hello first, and can switch on their own tune to play quietly in
 * the background. The tour walks: hello → what remixing is → asking for
 * changes → putting a piece in the Hub → the Hub front, where the hero asks
 * which room they want and listens for the answer (or takes a tap).
 *
 * Every spoken line is written on the server (guide.ts); the child's
 * nickname and the hero's name are the only words that change.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../components/ui";
import { ApiError, childGuide, childGuideHear, childGuideSay, type ChildMe, type GuideGo, type GuideInfo, type GuideHero, type GuideLine, type GuideStep, type StudioConfig, type VoiceChoice } from "./api";
import { Avatar, avatarSrc } from "./Avatar";
import { MicButton } from "./ChoiceField";
import { BigButton, Notice, Spinner } from "./components";

type Face = { name: string; src: string | null; emoji?: string; heroId?: number; voice: VoiceChoice | null };

/* ---------------------------------------------------------------------- *
 * Talking head: one audio element for speech, one analyser, one rAF loop.
 * ---------------------------------------------------------------------- */
function useTalkingHead() {
  const audio = useMemo(() => {
    const a = new Audio();
    a.preload = "auto";
    return a;
  }, []);
  const faceRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [talking, setTalking] = useState(false);
  const [progress, setProgress] = useState(0);

  const wire = useCallback(() => {
    if (ctxRef.current) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx: AudioContext = new Ctx();
      const src = ctx.createMediaElementSource(audio);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      an.smoothingTimeConstant = 0.5;
      src.connect(an);
      an.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = an;
    } catch {
      /* no Web Audio: the face still bobs on a timer below */
    }
  }, [audio]);

  useEffect(() => {
    let raf = 0;
    const buf = new Uint8Array(512);
    let t = 0;
    const tick = () => {
      const el = faceRef.current;
      if (el) {
        let level = 0;
        if (!audio.paused && !audio.ended) {
          const an = analyserRef.current;
          if (an) {
            an.getByteTimeDomainData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) {
              const v = (buf[i] - 128) / 128;
              sum += v * v;
            }
            level = Math.min(1, Math.sqrt(sum / buf.length) * 4);
          } else {
            // No analyser (or silent mock audio): a friendly made-up rhythm.
            t += 0.18;
            level = 0.35 + 0.35 * Math.abs(Math.sin(t)) * Math.abs(Math.sin(t * 0.37));
          }
          if (audio.duration > 0) setProgress(audio.currentTime / audio.duration);
        }
        el.style.setProperty("--talk", level.toFixed(3));
        el.style.setProperty("--tilt", (Math.sin(audio.currentTime * 6) * level * 4).toFixed(2));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onPlay = () => setTalking(true);
    const onStop = () => {
      setTalking(false);
      setProgress(1);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onStop);
    audio.addEventListener("ended", onStop);
    return () => {
      cancelAnimationFrame(raf);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onStop);
      audio.removeEventListener("ended", onStop);
      audio.pause();
    };
  }, [audio]);

  /** Plays one line; resolves when it has finished (or at once with no audio). */
  const say = useCallback(
    (b64: string | null, mime: string | null) =>
      new Promise<void>((resolve) => {
        wire();
        void ctxRef.current?.resume();
        if (!b64) {
          setProgress(0);
          resolve();
          return;
        }
        const done = () => {
          audio.removeEventListener("ended", done);
          audio.removeEventListener("error", done);
          resolve();
        };
        audio.addEventListener("ended", done);
        audio.addEventListener("error", done);
        audio.src = `data:${mime ?? "audio/mpeg"};base64,${b64}`;
        setProgress(0);
        audio.play().catch(done);
      }),
    [audio, wire],
  );

  const hush = useCallback(() => {
    audio.pause();
  }, [audio]);

  return { faceRef, say, hush, talking, progress };
}

function TalkingFace({ face, faceRef, talking, size = "lg" }: { face: Face; faceRef: React.RefObject<HTMLDivElement | null>; talking: boolean; size?: "lg" | "xl" }) {
  const px = size === "xl" ? "h-28 w-28" : "h-14 w-14";
  return (
    <div
      ref={faceRef}
      className={cx("relative shrink-0 rounded-full", px, talking ? "guide-face-talking" : "guide-face-idle")}
      style={{ ["--talk" as any]: 0, ["--tilt" as any]: 0 }}
      data-testid="guide-face"
      aria-hidden
    >
      <div className="guide-ring absolute inset-0 rounded-full ring-4 ring-white shadow-lg" />
      <div className="guide-head absolute inset-0 overflow-hidden rounded-full bg-gradient-to-br from-fuchsia-100 to-violet-100">
        {face.src ? (
          <img src={face.src} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <span className={cx("flex h-full w-full items-center justify-center", size === "xl" ? "text-6xl" : "text-3xl")}>{face.emoji ?? "🙂"}</span>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- *
 * The guide
 * ---------------------------------------------------------------------- */
export function HeroGuide({
  me,
  config,
  go,
  onClose,
  onMadeHero,
}: {
  me: ChildMe;
  config: StudioConfig;
  /** Moves the Studio to a tab or a Hub room. */
  go: (where: GuideGo) => void;
  onClose: () => void;
  /** "Make a hero first": takes the child to the Remix tab. */
  onMadeHero: () => void;
}) {
  const [info, setInfo] = useState<GuideInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"setup" | "tour" | "done">("setup");

  // Setup choices
  const [heroId, setHeroId] = useState<number | "buddy">("buddy");
  const [voice, setVoice] = useState<VoiceChoice | null | "hero">("hero");
  const [tuneOn, setTuneOn] = useState(true);
  const [previewing, setPreviewing] = useState(false);

  // Tour state
  const [stepIx, setStepIx] = useState(0);
  const [caption, setCaption] = useState("");
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const head = useTalkingHead();
  const tune = useMemo(() => {
    const a = new Audio();
    a.loop = true;
    a.preload = "none";
    a.volume = 0.12;
    return a;
  }, []);
  useEffect(() => () => tune.pause(), [tune]);

  useEffect(() => {
    childGuide()
      .then((g) => {
        setInfo(g);
        if (g.heroes[0]) setHeroId(g.heroes[0].artifactId);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "The guide isn't answering right now."));
  }, []);

  const hero: GuideHero | null = useMemo(() => (info && heroId !== "buddy" ? (info.heroes.find((h) => h.artifactId === heroId) ?? null) : null), [info, heroId]);
  const face: Face = useMemo(
    () =>
      hero
        ? { name: hero.name, src: hero.portrait, heroId: hero.artifactId, voice: hero.voice }
        : { name: "Studio Buddy", src: avatarSrc(me.child.avatar), emoji: me.child.avatar, voice: null },
    [hero, me.child.avatar],
  );
  const pickedVoice: VoiceChoice | null = voice === "hero" ? face.voice : voice;

  const sayLine = useCallback(
    async (line: GuideLine) => {
      const r = await childGuideSay({ line, heroId: face.heroId, heroName: face.heroId ? undefined : face.name, voice: pickedVoice });
      setCaption(r.text);
      tune.volume = 0.05;
      await head.say(r.audio, r.mime);
      tune.volume = 0.12;
      return r.text;
    },
    [face, pickedVoice, head, tune],
  );

  const steps: GuideStep[] = info?.steps ?? [];
  const step = steps[stepIx];

  const runStep = useCallback(
    async (ix: number) => {
      const s = steps[ix];
      if (!s) return;
      setStepIx(ix);
      setMore(false);
      setHeard("");
      setError(null);
      go(s.where === "hub" && s.id === "front" ? "hub" : s.where);
      setBusy(true);
      try {
        await sayLine({ kind: "step", id: s.id });
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Your guide lost its voice for a second. Try again!");
      } finally {
        setBusy(false);
      }
    },
    [steps, go, sayLine],
  );

  const start = async () => {
    setPhase("tour");
    if (tuneOn && info?.tune) {
      tune.src = info.tune.src;
      tune.play().catch(() => undefined);
    }
    await runStep(0);
  };

  const preview = async () => {
    setPreviewing(true);
    setError(null);
    try {
      await sayLine({ kind: "preview" });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't play that voice. Try another!");
    } finally {
      setPreviewing(false);
    }
  };

  const stop = () => {
    head.hush();
    setBusy(false);
  };

  const next = () => {
    if (stepIx + 1 < steps.length) void runStep(stepIx + 1);
  };

  const answer = async (text: string) => {
    setHeard(text);
    setListening(false);
    setBusy(true);
    try {
      const { room } = await childGuideHear(text);
      await sayLine({ kind: "reply", id: room ?? "unsure" });
      if (room) {
        go(room);
        setPhase("done");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Say that once more?");
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    head.hush();
    tune.pause();
    onClose();
  };

  // Caption typing: reveal in step with the audio, or at a reading pace with no audio.
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!caption) return void setTyped("");
    if (head.talking) {
      setTyped(caption.slice(0, Math.max(1, Math.round(caption.length * Math.min(1, head.progress + 0.04)))));
      return;
    }
    setTyped(caption);
  }, [caption, head.progress, head.talking]);

  /* ---------------- setup card ---------------- */
  if (phase === "setup") {
    return (
      <div className="rounded-3xl bg-gradient-to-b from-fuchsia-50 to-violet-50 p-4 ring-2 ring-fuchsia-200 sm:p-5" role="dialog" aria-label="Hero Guide" data-testid="guide-setup">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-600">Hero Guide</p>
            <h2 className="text-2xl font-extrabold text-violet-900">Let your hero show you around</h2>
            <p className="text-sm text-slate-600">Pick who guides you and how they sound. Then press Start.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm font-bold text-slate-500 hover:bg-white" aria-label="Close the guide">
            ✕
          </button>
        </div>
        {!info && !error && <Spinner label="Finding your heroes…" />}
        {error && <Notice>{error}</Notice>}
        {info && (
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_12rem]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Who's your guide?</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {info.heroes.map((h) => (
                    <button
                      key={h.artifactId}
                      type="button"
                      aria-pressed={heroId === h.artifactId}
                      onClick={() => setHeroId(h.artifactId)}
                      className={cx("flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-bold ring-1 transition", heroId === h.artifactId ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-700 ring-slate-300 hover:bg-violet-100")}
                      data-testid={`guide-hero-${h.artifactId}`}
                    >
                      {h.portrait ? <img src={h.portrait} alt="" className="h-7 w-7 rounded-full object-cover" /> : <span className="text-xl">🦸</span>}
                      {h.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-pressed={heroId === "buddy"}
                    onClick={() => setHeroId("buddy")}
                    className={cx("flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-bold ring-1 transition", heroId === "buddy" ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-700 ring-slate-300 hover:bg-violet-100")}
                    data-testid="guide-hero-buddy"
                  >
                    <Avatar value={me.child.avatar} size="sm" /> Studio Buddy (me!)
                  </button>
                </div>
                {info.heroes.length === 0 && (
                  <p className="mt-2 text-sm text-slate-600">
                    No hero yet? Your Studio Buddy can guide you now, or{" "}
                    <button type="button" onClick={onMadeHero} className="font-bold text-violet-700 underline">
                      make a hero first
                    </button>{" "}
                    in the Remix tab so it can be them.
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">How do they sound?</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {face.voice && (
                    <VoicePill on={voice === "hero"} onClick={() => setVoice("hero")} testID="guide-voice-hero">
                      ⭐ {face.name}'s own voice
                    </VoicePill>
                  )}
                  <VoicePill on={voice === null} onClick={() => setVoice(null)} testID="guide-voice-house">
                    🎙️ Studio voice
                  </VoicePill>
                  {info.voices.slice(0, 10).map((v) => (
                    <VoicePill key={v.provider + v.id} on={voice !== "hero" && voice !== null && voice.id === v.id} onClick={() => setVoice({ provider: v.provider, id: v.id, name: v.name })} testID={`guide-voice-${v.id}`}>
                      {v.name}
                    </VoicePill>
                  ))}
                </div>
                {info.ttsReady ? (
                  <BigButton type="button" variant="ghost" className="mt-2 !px-4 !py-1.5 !text-base" disabled={previewing} onClick={preview} data-testid="guide-preview">
                    {previewing ? "Listening…" : "▶ Hear it first"}
                  </BigButton>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">Voices are off for this class, so your guide will show its words instead.</p>
                )}
              </div>

              {info.tune && (
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={tuneOn} onChange={(e) => setTuneOn(e.target.checked)} className="h-4 w-4" data-testid="guide-tune" />
                  🎵 Play my tune “{info.tune.title}” quietly while we go
                </label>
              )}

              <BigButton type="button" className="!px-6 !py-2 !text-lg" onClick={start} data-testid="guide-start">
                🧭 Start the tour
              </BigButton>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-white p-4 text-center ring-2 ring-violet-100">
              <TalkingFace face={face} faceRef={head.faceRef} talking={head.talking} size="xl" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">{face.name}</p>
              <p className="min-h-[2.5rem] text-sm font-semibold text-slate-700" data-testid="guide-caption">
                {typed || "Press ▶ Hear it first to try the voice."}
              </p>
            </div>
          </div>
        )}
        <GuideStyles />
      </div>
    );
  }

  /* ---------------- the bar ---------------- */
  const isFront = step?.id === "front";
  const last = stepIx === steps.length - 1;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" data-testid="guide-bar">
      <div className="mx-auto max-w-5xl rounded-3xl bg-[#1b1430]/95 p-3 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur">
        <div className="flex items-center gap-3">
          <TalkingFace face={face} faceRef={head.faceRef} talking={head.talking} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">{face.name}</p>
              <button type="button" onClick={() => setMore((m) => !m)} className="text-sm font-bold text-white/80 hover:text-white" aria-expanded={more} data-testid="guide-more">
                {more ? "Less ∧" : "More ∨"}
              </button>
            </div>
            <p className={cx("text-[15px] font-semibold leading-snug", !more && "line-clamp-2")} data-testid="guide-caption">
              {phase === "done" ? "That's the tour! Come find me any time. 🎉" : typed || (busy ? "…" : "")}
            </p>
          </div>
          {head.talking ? (
            <button type="button" onClick={stop} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 ring-2 ring-amber-300 hover:bg-white/20" aria-label="Stop" data-testid="guide-stop">
              <span className="block h-4 w-4 rounded-sm bg-white" />
            </button>
          ) : phase === "done" ? (
            <button type="button" onClick={finish} className="shrink-0 rounded-full bg-amber-300 px-4 py-2 text-sm font-extrabold text-[#1b1430]" data-testid="guide-finish">
              Bye! 👋
            </button>
          ) : (
            <button type="button" onClick={() => void runStep(stepIx)} disabled={busy} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/40 hover:bg-white/20 disabled:opacity-50" aria-label="Say it again" data-testid="guide-replay">
              <span className="text-lg">▶</span>
            </button>
          )}
        </div>

        {phase !== "done" && (more || isFront) && step && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            {more && <p className="mr-auto text-xs font-bold uppercase tracking-wide text-white/60">{step.title} · {stepIx + 1} of {steps.length}</p>}
            {isFront
              ? step.listen?.map((l) => (
                  <button key={l.go} type="button" disabled={busy} onClick={() => void answer(l.word)} className="rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-violet-900 hover:bg-amber-100 disabled:opacity-50" data-testid={`guide-room-${l.go}`}>
                    {l.label}
                  </button>
                ))
              : step.action && (
                  <button type="button" disabled={busy} onClick={() => (last ? setPhase("done") : next())} className="rounded-full bg-amber-300 px-4 py-1.5 text-sm font-extrabold text-[#1b1430] hover:bg-amber-200 disabled:opacity-50" data-testid="guide-action">
                    {step.action.label} ›
                  </button>
                )}
            {isFront && info?.micAllowed && (
              <span className="flex items-center gap-2">
                <MicButton size="md" allowed={me.class.micEnabled !== false} disabled={busy} label="Say a room" onText={(t) => void answer(t)} onInterim={(t) => { setListening(true); setHeard(t); }} />
                {listening && heard && <span className="text-xs text-white/70">“{heard}”</span>}
              </span>
            )}
            {!isFront && !last && (
              <button type="button" disabled={busy} onClick={next} className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-white ring-1 ring-white/30 hover:bg-white/20 disabled:opacity-50" data-testid="guide-next">
                Next ›
              </button>
            )}
            <button type="button" onClick={finish} className="rounded-full px-3 py-1.5 text-sm font-bold text-white/70 hover:text-white" data-testid="guide-close">
              Close
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-sm font-semibold text-amber-200">{error}</p>}
      </div>
      <GuideStyles />
    </div>
  );
}

function VoicePill({ on, onClick, children, testID }: { on: boolean; onClick: () => void; children: React.ReactNode; testID: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cx("rounded-full px-3 py-1 text-sm font-semibold ring-1 transition", on ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-700 ring-slate-300 hover:bg-violet-100")} data-testid={testID}>
      {children}
    </button>
  );
}

/** The face's motion: driven by --talk (0..1) and --tilt (degrees) set from the audio analyser. */
function GuideStyles() {
  return (
    <style>{`
      .guide-head { transform-origin: 50% 100%; transition: transform 60ms linear; }
      .guide-face-talking .guide-head {
        transform: translateY(calc(var(--talk) * -7px)) scale(calc(1 + var(--talk) * 0.14), calc(1 - var(--talk) * 0.07)) rotate(calc(var(--tilt) * 1deg));
      }
      .guide-face-talking .guide-ring {
        box-shadow: 0 0 0 calc(2px + var(--talk) * 10px) rgba(251, 191, 36, calc(0.25 + var(--talk) * 0.5)), 0 10px 30px rgba(0,0,0,0.25);
        transition: box-shadow 80ms linear;
      }
      .guide-face-idle .guide-head { animation: guide-breathe 3.2s ease-in-out infinite; }
      @keyframes guide-breathe {
        0%, 100% { transform: translateY(0) scale(1, 1); }
        50% { transform: translateY(-2px) scale(1.02, 0.99); }
      }
      @media (prefers-reduced-motion: reduce) {
        .guide-face-talking .guide-head, .guide-face-idle .guide-head { animation: none; transform: none; }
      }
    `}</style>
  );
}
