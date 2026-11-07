/**
 * Kids AI Studio — ChoiceField and voice input.
 *
 * The Monday club (Nov 2026) asked for two things on every form: lots of
 * choices to tap, and a way to speak instead of type. ChoiceField is one
 * text box with a row of idea chips above it (tap one and it fills the box;
 * the child can still edit or type their own) and a microphone button.
 *
 * Voice uses the browser's own Web Speech API. The transcript lands in the
 * field for the child to read and fix before anything is sent; nothing is
 * recorded, stored or uploaded by us, and the button is hidden when the
 * browser has no speech recognition or the class turned microphones off.
 * Whatever gets submitted goes through the same server-side screening as
 * typed text.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cx } from "../components/ui";

/* ------------------------------------------------------------------ *
 * Web Speech API
 * ------------------------------------------------------------------ */

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function recognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** True when this browser can turn speech into text (Chrome, Edge, Safari; not Firefox). */
export function speechSupported(): boolean {
  return recognitionCtor() !== null;
}

export type SpeechState = "idle" | "listening" | "denied" | "error";

/**
 * One microphone session: start, listen for a phrase, stop. Interim results
 * stream through `onInterim` so the child sees words appear; the final
 * transcript goes to `onResult`. Stops by itself when the child pauses.
 */
export function useSpeech(onResult: (text: string) => void, onInterim?: (text: string) => void) {
  const [state, setState] = useState<SpeechState>("idle");
  const ref = useRef<RecognitionLike | null>(null);
  const supported = useMemo(() => speechSupported(), []);
  const stop = useCallback(() => {
    ref.current?.stop();
  }, []);
  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    if (ref.current) {
      ref.current.abort();
      ref.current = null;
    }
    const rec = new Ctor();
    rec.lang = document.documentElement.lang || "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (interim && onInterim) onInterim((finalText + " " + interim).trim());
    };
    rec.onerror = (e: any) => {
      const kind = String(e?.error ?? "");
      setState(kind === "not-allowed" || kind === "service-not-allowed" ? "denied" : kind === "no-speech" || kind === "aborted" ? "idle" : "error");
    };
    rec.onend = () => {
      ref.current = null;
      const t = finalText.trim();
      if (t) onResult(t);
      setState((s) => (s === "denied" || s === "error" ? s : "idle"));
    };
    ref.current = rec;
    setState("listening");
    try {
      rec.start();
    } catch {
      ref.current = null;
      setState("error");
    }
  }, [onResult, onInterim]);
  useEffect(() => () => ref.current?.abort(), []);
  return { supported, state, start, stop, listening: state === "listening" };
}

/**
 * The microphone button beside a text box. Renders nothing when speech is
 * not available or not allowed, so a form never shows a button that cannot
 * work. Tap to listen; tap again to stop early.
 */
export function MicButton({
  onText,
  onInterim,
  allowed = true,
  disabled,
  size = "lg",
  label = "Say it instead of typing",
}: {
  onText: (text: string) => void;
  onInterim?: (text: string) => void;
  allowed?: boolean;
  disabled?: boolean;
  size?: "md" | "lg";
  label?: string;
}) {
  const speech = useSpeech(onText, onInterim);
  if (!allowed || !speech.supported) return null;
  const denied = speech.state === "denied";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => (speech.listening ? speech.stop() : speech.start())}
      aria-pressed={speech.listening}
      aria-label={speech.listening ? "Stop listening" : label}
      title={denied ? "The browser didn't allow the microphone. Ask your facilitator." : speech.listening ? "Listening… tap to stop" : label}
      className={cx(
        "shrink-0 rounded-xl ring-2 transition disabled:opacity-50",
        size === "lg" ? "px-3 py-2 text-lg" : "px-2.5 py-1.5 text-base",
        speech.listening ? "animate-pulse bg-rose-500 text-white ring-rose-500" : denied ? "bg-slate-100 text-slate-400 ring-slate-200" : "bg-white ring-violet-200 hover:ring-violet-400",
      )}
    >
      {speech.listening ? "🔴" : "🎤"}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * ChoiceField
 * ------------------------------------------------------------------ */

/** Pick one random entry. */
export function pickOne<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

export function ChoiceField({
  id,
  label,
  hint,
  required,
  value,
  onChange,
  ideas,
  maxChars,
  mic = true,
  disabled,
}: {
  id: string;
  label: string;
  hint: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  /** Tappable ideas; the box stays free text either way. */
  ideas?: string[];
  maxChars: number;
  /** False hides the microphone (class setting). */
  mic?: boolean;
  disabled?: boolean;
}) {
  const [interim, setInterim] = useState<string | null>(null);
  const hasIdeas = Boolean(ideas && ideas.length);
  const shown = interim ?? value;
  return (
    <div>
      <label htmlFor={id} className="block text-base font-bold text-slate-800">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {hasIdeas && (
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Ideas for ${label}`}>
          {ideas!.map((c) => {
            const picked = value.trim() === c;
            return (
              <button
                type="button"
                key={c}
                disabled={disabled}
                onClick={() => onChange(c)}
                className={cx(
                  "rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition disabled:opacity-50",
                  picked ? "bg-violet-600 text-white ring-violet-600" : "bg-violet-50 text-violet-800 ring-violet-200 hover:bg-violet-100 hover:ring-violet-400",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <input
          id={id}
          value={shown}
          maxLength={maxChars}
          disabled={disabled}
          onChange={(e) => {
            setInterim(null);
            onChange(e.target.value);
          }}
          placeholder={hasIdeas ? `…or type your own: ${hint}` : hint}
          autoComplete="off"
          className={cx(
            "w-full rounded-2xl border-2 px-4 py-3 text-lg text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none disabled:opacity-60",
            interim !== null ? "border-rose-300 bg-rose-50" : "border-slate-200",
          )}
        />
        <MicButton
          allowed={mic}
          disabled={disabled}
          onInterim={setInterim}
          onText={(t) => {
            setInterim(null);
            onChange(t.slice(0, maxChars));
          }}
        />
      </div>
    </div>
  );
}
