/**
 * Kids AI Studio — the Robotics Lab's robot, in 3D.
 *
 * A plan with parts, steps and micro:bit code is the lesson; a robot a child
 * can spin around, paint and make dance is the reward. The model is the CC0
 * "RobotExpressive" (Tomás Laulhé), served from this site, rendered with
 * Google's <model-viewer> web component, which is loaded only when a robot
 * card opens so the rest of the Studio pays nothing for it.
 *
 * Two choices belong to the child and are remembered per robot on this
 * device: the paint colour of the robot's shell, and whether it moves ("Still"
 * is the default: an animation is something they pick, not something that
 * happens to them). Nothing here talks to the server.
 */
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { cx } from "../components/ui";

/** Served from the website's public folder; see public/aiforkids/robots/README.md for provenance. */
export const ROBOT_MODEL_URL = "/aiforkids/robots/robot-expressive.glb";

/** The GLB's own clip names → what a child reads. Clips not listed here (Death, Punch) are not offered. */
const MOVES: { clip: string; label: string; emoji: string }[] = [
  { clip: "Idle", label: "Breathe", emoji: "😌" },
  { clip: "Wave", label: "Wave hello", emoji: "👋" },
  { clip: "Dance", label: "Dance", emoji: "🕺" },
  { clip: "Walking", label: "Walk", emoji: "🚶" },
  { clip: "Running", label: "Run", emoji: "🏃" },
  { clip: "Jump", label: "Jump", emoji: "🦘" },
  { clip: "ThumbsUp", label: "Thumbs up", emoji: "👍" },
  { clip: "Yes", label: "Nod yes", emoji: "✅" },
  { clip: "No", label: "Shake no", emoji: "🙅" },
  { clip: "Sitting", label: "Sit down", emoji: "🪑" },
];

const PAINTS: { name: string; hex: string }[] = [
  { name: "Sky", hex: "#4da3ff" },
  { name: "Mint", hex: "#3ddc97" },
  { name: "Sunshine", hex: "#ffd23f" },
  { name: "Tangerine", hex: "#ff8c42" },
  { name: "Berry", hex: "#e4509b" },
  { name: "Grape", hex: "#8b5cf6" },
  { name: "Cherry", hex: "#ef4444" },
  { name: "Snow", hex: "#f1f5f9" },
];

type Choice = { paint: string; move: string | null };

function remembered(id: number): Choice {
  try {
    const raw = localStorage.getItem(`aik-robot-${id}`);
    if (raw) {
      const j = JSON.parse(raw);
      return { paint: PAINTS.some((p) => p.hex === j.paint) ? j.paint : PAINTS[0].hex, move: MOVES.some((m) => m.clip === j.move) ? j.move : null };
    }
  } catch {
    /* a private window or blocked storage just means defaults */
  }
  return { paint: PAINTS[0].hex, move: null };
}

function remember(id: number, c: Choice) {
  try {
    localStorage.setItem(`aik-robot-${id}`, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

function hexToRgb(hex: string): [number, number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  // Linear-ish values keep the colours vivid under model-viewer's lighting.
  const c = (v: number) => Math.pow(v / 255, 2.2);
  return [c((n >> 16) & 255), c((n >> 8) & 255), c(n & 255), 1];
}

/* <model-viewer> is a custom element; React 19 needs to be told it exists (JSX lives on the react module now). */
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}

type ModelViewerElement = HTMLElement & {
  availableAnimations?: string[];
  animationName?: string;
  autoplay?: boolean;
  pause: () => void;
  play: (opts?: { repetitions?: number }) => void;
  model?: { materials: { name: string; pbrMetallicRoughness: { setBaseColorFactor: (rgba: [number, number, number, number]) => void } }[] };
};

/** The viewer itself, split out so the ~1 MB web component only loads for robot cards. */
const Viewer = lazy(async () => {
  await import("@google/model-viewer");
  function ModelViewer({ paint, move, name }: { paint: string; move: string | null; name: string }) {
    const ref = useRef<ModelViewerElement | null>(null);
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);
    const [clips, setClips] = useState<string[]>([]);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const onLoad = () => {
        setReady(true);
        setClips(el.availableAnimations ?? []);
      };
      const onError = () => setFailed(true);
      el.addEventListener("load", onLoad);
      el.addEventListener("error", onError);
      return () => {
        el.removeEventListener("load", onLoad);
        el.removeEventListener("error", onError);
      };
    }, []);

    // Paint: the robot's shell is the material called "Main"; the joints stay grey.
    useEffect(() => {
      const el = ref.current;
      if (!el || !ready || !el.model) return;
      const main = el.model.materials.find((m) => m.name === "Main") ?? el.model.materials[0];
      main?.pbrMetallicRoughness.setBaseColorFactor(hexToRgb(paint));
    }, [paint, ready]);

    // Move: "Still" pauses on the first frame; a clip plays on a loop.
    useEffect(() => {
      const el = ref.current;
      if (!el || !ready) return;
      if (move && clips.includes(move)) {
        el.animationName = move;
        el.play();
      } else {
        el.pause();
      }
    }, [move, ready, clips]);

    if (failed) {
      return (
        <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-100 p-6 text-center text-sm text-slate-600">
          The 3D robot couldn't load on this device. Your plan, parts and code are all still here below.
        </div>
      );
    }
    return (
      <model-viewer
        ref={ref}
        src={ROBOT_MODEL_URL}
        alt={`A 3D robot called ${name}`}
        camera-controls=""
        touch-action="pan-y"
        auto-rotate={move ? undefined : ""}
        auto-rotate-delay="1500"
        shadow-intensity="1"
        shadow-softness="0.8"
        exposure="1.05"
        interaction-prompt="auto"
        camera-orbit="25deg 78deg 115%"
        min-camera-orbit="auto auto 60%"
        max-camera-orbit="auto auto 250%"
        camera-target="auto auto auto"
        style={{ width: "100%", height: "18rem", background: "linear-gradient(180deg,#eef2ff 0%,#f8fafc 100%)", borderRadius: "1rem" }}
      >
        <div slot="poster" className="flex h-full items-center justify-center text-sm font-semibold text-violet-700">
          Warming up the robot…
        </div>
      </model-viewer>
    );
  }
  return { default: ModelViewer };
});

export function RobotStage({ artifactId, name, compact }: { artifactId: number; name: string; compact?: boolean }) {
  const [choice, setChoice] = useState<Choice>(() => remembered(artifactId));
  const update = (patch: Partial<Choice>) => {
    setChoice((c) => {
      const next = { ...c, ...patch };
      remember(artifactId, next);
      return next;
    });
  };

  return (
    <div className="rounded-2xl bg-white p-3 ring-2 ring-slate-200">
      <Suspense
        fallback={
          <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-violet-700">
            Warming up the robot…
          </div>
        }
      >
        <Viewer paint={choice.paint} move={choice.move} name={name} />
      </Suspense>
      <p className="mt-2 text-center text-xs text-slate-500">Drag to spin {name}. Pinch or scroll to zoom.</p>

      {!compact && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Paint</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {PAINTS.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  title={p.name}
                  aria-label={`Paint it ${p.name}`}
                  aria-pressed={choice.paint === p.hex}
                  onClick={() => update({ paint: p.hex })}
                  className={cx("h-8 w-8 rounded-full ring-2 ring-offset-2 transition", choice.paint === p.hex ? "ring-violet-600" : "ring-transparent hover:ring-slate-300")}
                  style={{ background: p.hex }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Make it move</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={choice.move === null}
                onClick={() => update({ move: null })}
                className={cx("rounded-full px-3 py-1 text-sm font-semibold ring-1 transition", choice.move === null ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50")}
              >
                🧊 Still
              </button>
              {MOVES.map((m) => (
                <button
                  key={m.clip}
                  type="button"
                  aria-pressed={choice.move === m.clip}
                  onClick={() => update({ move: m.clip })}
                  className={cx("rounded-full px-3 py-1 text-sm font-semibold ring-1 transition", choice.move === m.clip ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50")}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
