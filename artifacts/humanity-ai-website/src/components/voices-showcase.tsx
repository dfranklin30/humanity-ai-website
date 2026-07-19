import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Play, Volume2, Sparkles } from "lucide-react";

type Voice = {
  src: string;
  poster: string;
  title: string;
  topic: string;
};

const voices: Voice[] = [
  { src: "/videos/bridging-the-gap.mp4", poster: "/videos/bridging-the-gap.jpg", title: "Humanity + AI: Bridging the Gap", topic: "The Mission" },
  { src: "/videos/elevating-humanity.mp4", poster: "/videos/elevating-humanity.jpg", title: "Elevating Humanity, Not Replacing It", topic: "The Vision" },
  { src: "/videos/people-first.mp4", poster: "/videos/people-first.jpg", title: "AI: People First, Always", topic: "Our Values" },
  { src: "/videos/human-judgment.mp4", poster: "/videos/human-judgment.jpg", title: "AI Can't Replace Human Judgment", topic: "Ethics" },
  { src: "/videos/nonverbal-communication.mp4", poster: "/videos/nonverbal-communication.jpg", title: "AI for Nonverbal Communication", topic: "InclusiCare" },
  { src: "/videos/human-design.mp4", poster: "/videos/human-design.jpg", title: "Can Human Design Be Used for Evil?", topic: "Responsibility" },
];

function VoiceCard({
  voice,
  index,
  canPlay,
  isClone,
  onOpen,
}: {
  voice: Voice;
  index: number;
  canPlay: boolean;
  isClone: boolean;
  onOpen: (v: Voice) => void;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { root: null, threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (canPlay && inView) {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      el.pause();
    }
  }, [canPlay, inView]);

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => onOpen(voice)}
      aria-hidden={isClone || undefined}
      tabIndex={isClone ? -1 : undefined}
      className="group/card relative shrink-0 w-[230px] sm:w-[260px] aspect-[9/16] rounded-[1.75rem] overflow-hidden ring-1 ring-[#FAF9F6]/15 bg-[#0a2117] hover-elevate snap-center"
      data-testid={`card-voice-${index}`}
      aria-label={`Watch: ${voice.title}`}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={voice.src}
        poster={voice.poster}
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#081c14] via-[#081c14]/20 to-transparent" />

      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#0a2117]/70 backdrop-blur px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6ee7b7]">
        <Sparkles className="h-3 w-3" />
        {voice.topic}
      </span>

      <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#f0c674] text-[#081c14] opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all">
        <Volume2 className="h-4 w-4" />
      </span>

      <div className="absolute inset-x-0 bottom-0 p-4 text-left">
        <h3 className="font-serif text-lg font-bold leading-snug text-[#FAF9F6]">
          {voice.title}
        </h3>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-[#FAF9F6]/65">
          <Play className="h-3 w-3 fill-current" />
          Tap to watch
        </span>
      </div>
    </button>
  );
}

export function VoicesShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Voice | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleOpen = (v: Voice) => {
    setCurrent(v);
    setOpen(true);
  };

  // Background clips only play while the section is visible, no dialog is open,
  // and the user has not requested reduced motion.
  const canPlay = active && !open && !reducedMotion;
  const items = reducedMotion ? voices : [...voices, ...voices];

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-[#0a2117] text-[#FAF9F6]"
      data-testid="section-voices"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(110,231,183,0.10),transparent_55%)]" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#6ee7b7]/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-[#f0c674]/10 blur-3xl" />
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-8 pt-16 md:pt-20 text-center">
        <div className="text-[11px] sm:text-xs font-semibold tracking-[0.28em] uppercase text-[#6ee7b7] flex items-center justify-center gap-2 mb-6">
          <span className="h-px w-6 bg-[#6ee7b7]/50" />
          Voices in Motion
          <span className="h-px w-6 bg-[#6ee7b7]/50" />
        </div>
        <h2 className="font-serif text-4xl md:text-5xl font-bold leading-[1.08] tracking-tight">
          Ideas worth{" "}
          <span className="italic font-light text-[#6ee7b7]">hearing.</span>
        </h2>
        <p className="text-base md:text-lg text-[#FAF9F6]/70 leading-relaxed max-w-2xl mx-auto mt-5 font-serif">
          Short, candid reflections from founder Danielle A. Franklin on the
          questions shaping our future — from keeping people first to giving a
          voice to those who can't speak for themselves. Tap any clip to listen.
        </p>
      </div>

      <div className="voices-track relative mt-12 md:mt-14 pb-16 md:pb-20">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 md:w-24 bg-gradient-to-r from-[#0a2117] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 md:w-24 bg-gradient-to-l from-[#0a2117] to-transparent" />

        {reducedMotion ? (
          <div
            className="flex gap-5 px-4 md:px-12 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            data-testid="track-voices-static"
          >
            {items.map((voice, i) => (
              <VoiceCard
                key={`${voice.src}-${i}`}
                voice={voice}
                index={i}
                canPlay={false}
                isClone={false}
                onOpen={handleOpen}
              />
            ))}
          </div>
        ) : (
          <div
            className={`flex w-max gap-5 px-4 animate-voices-marquee ${canPlay ? "" : "is-paused"}`}
          >
            {items.map((voice, i) => (
              <VoiceCard
                key={`${voice.src}-${i}`}
                voice={voice}
                index={i}
                canPlay={canPlay}
                isClone={i >= voices.length}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[420px] border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{current?.title ?? "Video"}</DialogTitle>
          {current && (
            <div className="overflow-hidden rounded-[1.75rem] bg-[#081c14] ring-1 ring-[#FAF9F6]/15">
              <video
                key={current.src}
                className="aspect-[9/16] w-full bg-black"
                src={current.src}
                poster={current.poster}
                controls
                autoPlay
                playsInline
                data-testid="video-voice-player"
              />
              <div className="p-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6ee7b7]">
                  {current.topic}
                </span>
                <h3 className="font-serif text-xl font-bold text-[#FAF9F6] mt-1">
                  {current.title}
                </h3>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
