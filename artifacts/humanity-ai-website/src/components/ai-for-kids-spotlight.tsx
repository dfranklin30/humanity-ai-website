import { Link } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Home-page spotlight for AI for Kids — the Winter 2027 "AI Explorers"
 * after-school cohorts run with the Montgomery Sports Association (MSA).
 *
 * Families register on MSA's site; the Hub (facilitators & parents) lives on
 * the kids host, so both are plain external links rather than wouter routes.
 * School list mirrors MSA's public Winter 2027 AI Explorers listing.
 */
export const MSA_AI_EXPLORERS_URL =
  "https://www.montgomerysports.org/page/show/9631910-winter-2027-ai-explorers";
export const AI_FOR_KIDS_HUB_URL =
  "https://aiforkids.humanityplusai.org/aiforkids/hub";

const schools: { name: string; day: string }[] = [
  { name: "Wood Acres ES", day: "Mon" },
  { name: "Bethesda ES", day: "Mon" },
  { name: "Stone Mill ES", day: "Tue" },
  { name: "Wyngate ES", day: "Tue" },
  { name: "Cabin Branch ES", day: "Wed" },
  { name: "Bradley Hills ES", day: "Wed" },
  { name: "Travilah ES", day: "Thu" },
  { name: "DuFief ES", day: "Thu" },
  { name: "Potomac ES", day: "Fri" },
  { name: "Luxmanor ES", day: "Fri" },
];

const facts = [
  { icon: CalendarDays, label: "8 weeks" },
  { icon: Clock, label: "1 class a week · 75 min" },
  { icon: Users, label: "Max 20 students" },
  { icon: GraduationCap, label: "Grades 3–5 · Ages 8–12" },
];

export function AiForKidsSpotlight() {
  return (
    <section
      className="relative isolate overflow-hidden bg-[#0E6B4A] text-white"
      data-testid="section-ai-for-kids"
      aria-labelledby="ai-for-kids-title"
    >
      {/* soft glow + dotted field, echoing the hero's line-art */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-[#6ee7b7]/25 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-[#f0c674]/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 md:py-14 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        {/* Left: what it is + links */}
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/25 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em]"
            data-testid="text-ai-for-kids-eyebrow"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#f0c674]" />
            AI for Kids · Winter 2027 · Montgomery County, MD
          </div>

          <h2
            id="ai-for-kids-title"
            className="font-serif text-3xl md:text-5xl font-bold leading-[1.08] tracking-tight mt-5 max-w-2xl"
            data-testid="text-ai-for-kids-title"
          >
            AI Explorers: after-school AI classes{" "}
            <span className="italic font-light text-[#f0c674]">for ages 8–12.</span>
          </h2>

          <p
            className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-white/85 font-serif"
            data-testid="text-ai-for-kids-copy"
          >
            An eight-week, hands-on program from Humanity + AI where kids explore,
            create and build with AI — game making, creative storytelling, AI art
            and image creation, simple AI projects, and digital citizenship and
            safety — and learn to ask how they know an answer is right. Delivered
            after school with the Montgomery Sports Association, which provides the
            computers and supplies.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90" data-testid="list-ai-for-kids-facts">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#f0c674]" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full px-7 h-12 bg-[#f0c674] text-[#14201B] hover:bg-[#f7d58a] hover:text-[#14201B] font-bold tracking-wide text-base shadow-lg shadow-black/20"
              data-testid="button-ai-for-kids-signup"
            >
              <a href={MSA_AI_EXPLORERS_URL} target="_blank" rel="noopener noreferrer">
                Sign up at montgomerysports.org
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full px-7 h-12 bg-transparent border-white/50 text-white hover:bg-white hover:text-[#0E6B4A] font-serif italic tracking-wide"
              data-testid="button-ai-for-kids-site"
            >
              <Link href="/aiforkids/">
                Explore AI for Kids
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <a
              href={AI_FOR_KIDS_HUB_URL}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 underline-offset-4 hover:underline hover:text-white"
              data-testid="link-ai-for-kids-hub"
            >
              Facilitator &amp; Parent Hub
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Right: the schools */}
        <div
          className="rounded-3xl bg-white/[0.08] ring-1 ring-white/20 backdrop-blur-sm p-6 md:p-8"
          data-testid="card-ai-for-kids-schools"
        >
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#f0c674]">
            <MapPin className="h-4 w-4" />
            Where we're teaching this winter
          </div>
          <h3 className="mt-2 font-serif text-2xl md:text-3xl font-bold" data-testid="text-ai-for-kids-schools-title">
            10 Montgomery County Public Schools
          </h3>

          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5" data-testid="list-ai-for-kids-schools">
            {schools.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/10 ring-1 ring-white/15 px-3.5 py-2.5"
              >
                <span className="font-semibold text-sm sm:text-[15px]">{s.name}</span>
                <span className="shrink-0 rounded-full bg-[#f0c674] text-[#14201B] text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                  {s.day}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-sm text-white/80 leading-relaxed" data-testid="text-ai-for-kids-schools-note">
            After school, about 3:30–5:00 PM depending on the school. Exact times,
            pricing, sibling discounts and need-based scholarships are on MSA's AI
            Explorers page.
          </p>
          <p className="mt-3 inline-flex items-start gap-2 text-xs text-white/70">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#6ee7b7]" />
            Students work on facilitator-created accounts — no email, no real names.
          </p>
        </div>
      </div>
    </section>
  );
}
