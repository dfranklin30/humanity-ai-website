import { Sparkles, Wand2, Video, Code2, Bot, Trophy, ArrowRight, Printer } from "lucide-react";
import Seo from "../components/Seo";
import { Button, Card, Eyebrow, H2, Lede, Pill, Section } from "../components/ui";
import { BASE, CURRICULUM, GRADE_BANDS, OUTCOMES, PROGRAM } from "../content/program";

const ICONS = [Sparkles, Wand2, Video, Code2, Bot, Trophy];

export default function Curriculum() {
  return (
    <>
      <Seo
        title="Six-Week AI Curriculum | AI Builders Academy"
        description="Week by week: introduction to AI, AI creativity, video and voice, programming with AI, AI in the real world with a live ROSIE demonstration, and the final family showcase."
        path={`${BASE}/curriculum`}
      />

      <Section tone="gradient" className="!pb-12">
        <Eyebrow>Curriculum</Eyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Six weeks, six builds, one showcase
        </h1>
        <Lede>
          Every session is {PROGRAM.minutesPerSession} minutes and ends with something the student
          made. The arc is the same across all three grade bands — the depth changes.
        </Lede>
        <div className="mt-8 flex flex-wrap gap-2">
          {GRADE_BANDS.map((g) => (
            <Pill key={g.id} tone="purple">
              {g.label} · {g.ages}
            </Pill>
          ))}
        </div>
        <div className="mt-8">
          <Button href={`${BASE}/brochure/curriculum`} variant="secondary">
            <Printer className="h-4 w-4" aria-hidden="true" /> Print-ready outline
          </Button>
        </div>
      </Section>

      <Section tone="white">
        <ol className="space-y-6">
          {CURRICULUM.map((w, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            return (
              <Card as="li" key={w.n}>
                <div className="grid gap-6 lg:grid-cols-[auto,1fr]">
                  <div className="flex items-center gap-4 lg:w-44 lg:flex-col lg:items-start">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 text-white">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Week {w.n}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{w.title}</h2>
                    <p className="mt-2 leading-relaxed text-slate-600">{w.summary}</p>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          What we cover
                        </h3>
                        <ul className="mt-2.5 space-y-1.5 text-sm text-slate-700">
                          {w.topics.map((t) => (
                            <li key={t} className="flex gap-2">
                              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          What they build
                        </h3>
                        <p className="mt-2.5 rounded-2xl bg-teal-50 px-5 py-4 text-sm font-medium text-teal-900">
                          {w.build}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </ol>
      </Section>

      <Section tone="tint">
        <Eyebrow>Outcomes</Eyebrow>
        <H2>What students leave with</H2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map((o) => (
            <li key={o.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">{o.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{o.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Button href={`${BASE}/enroll`} size="lg">
            Enroll your student <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </Section>
    </>
  );
}
