import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Sparkles,
  ShieldCheck,
  Users,
  Rocket,
  Wand2,
  Video,
  Code2,
  Bot,
  Trophy,
  ArrowRight,
} from "lucide-react";
import Seo from "../components/Seo";
import { Button, Card, Eyebrow, H2, Lede, Pill, Section, StatGrid } from "../components/ui";
import {
  BASE,
  CURRICULUM,
  GRADE_BANDS,
  HERITAGE,
  ORG,
  OUTCOMES,
  PROGRAM,
  SCHOLARSHIP,
} from "../content/program";

const WEEK_ICONS = [Sparkles, Wand2, Video, Code2, Bot, Trophy];

export default function Home() {
  return (
    <>
      <Seo
        title="AI for Kids | AI Builders Academy by Humanity + AI"
        description="A six-week hands-on AI academy for grades 3–12 in Tampa Bay. Students build real AI projects, learn responsible AI, and present at a family showcase. Scholarships available."
        path={`${BASE}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: `${PROGRAM.name} — ${ORG.name}`,
            url: `${ORG.site}${BASE}`,
            email: ORG.email,
            telephone: ORG.phone,
            areaServed: "Tampa Bay, Florida",
            description: PROGRAM.subheadline,
          },
          {
            "@context": "https://schema.org",
            "@type": "Course",
            name: PROGRAM.name,
            description: PROGRAM.subheadline,
            provider: { "@type": "Organization", name: ORG.name, url: ORG.site },
            educationalLevel: "Grades 3-12",
            teaches: CURRICULUM.map((w) => w.title),
          },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-purple-50 to-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-teal-200 to-blue-200 opacity-50 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-purple-200 to-orange-100 opacity-50 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="mb-6 flex flex-wrap gap-2">
              <Pill tone="purple">Grades 3–12</Pill>
              <Pill tone="teal">6 weeks · 90 minutes weekly</Pill>
              <Pill tone="orange">Scholarships available</Pill>
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
              Build the Future{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-500 bg-clip-text text-transparent">
                with AI
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-700 sm:text-xl">
              {PROGRAM.subheadline}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href={`${BASE}/enroll`} size="lg">
                Enroll Now <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button href={`${BASE}/contact`} size="lg" variant="secondary">
                Request Information
              </Button>
              <Button href={`${BASE}/schools`} size="lg" variant="secondary">
                Partner With Us
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-600">
              A program of {ORG.name} — {ORG.mission}
            </p>
          </motion.div>
        </div>
      </section>

      {/* At a glance */}
      <Section tone="white" className="!py-12">
        <StatGrid
          items={[
            { value: `${PROGRAM.weeks} weeks`, label: "Full program" },
            { value: `${PROGRAM.minutesPerSession} min`, label: "Weekly session" },
            { value: `${PROGRAM.maxStudents} max`, label: "Students per class" },
            { value: "3–12", label: "Grade levels" },
          ]}
        />
      </Section>

      {/* Why */}
      <Section tone="tint">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Why this, why now</Eyebrow>
            <H2>Your child will use AI their whole life. This is where they learn to use it well.</H2>
            <Lede>
              Every student in this academy leaves with something they built, a vocabulary for talking
              about how AI works, and the instinct to check an answer before trusting it. That last one
              is the part most programs skip.
            </Lede>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Rocket, title: "Project based", body: "Six weeks, six builds, one showcase." },
                { icon: ShieldCheck, title: "Safety first", body: "Responsible AI taught from Week 1, not bolted on." },
                { icon: Users, title: "Small classes", body: `${PROGRAM.maxStudents} students maximum, always.` },
                { icon: Sparkles, title: "Real tools", body: "The same AI tools professionals use, age-appropriately." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-bold text-slate-900">{title}</span>
                    <span className="block text-sm text-slate-600">{body}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-gradient-to-br from-white to-blue-50">
            <Eyebrow>Grade bands</Eyebrow>
            <p className="text-sm text-slate-600">
              Students are grouped with their own age range. Same six-week arc, different depth.
            </p>
            <ul className="mt-6 space-y-4">
              {GRADE_BANDS.map((g) => (
                <li key={g.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-lg font-bold text-slate-900">{g.label}</span>
                    <Pill tone="slate">{g.ages}</Pill>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{g.blurb}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* Curriculum preview */}
      <Section tone="white">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>The six weeks</Eyebrow>
            <H2>From "what is AI?" to standing on stage</H2>
          </div>
          <Button href={`${BASE}/curriculum`} variant="ghost">
            See the full curriculum <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CURRICULUM.map((w, i) => {
            const Icon = WEEK_ICONS[i] ?? Sparkles;
            return (
              <Card as="li" key={w.n}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Week {w.n}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{w.summary}</p>
                <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">
                  {w.build}
                </p>
              </Card>
            );
          })}
        </ul>
      </Section>

      {/* Outcomes */}
      <Section tone="tint">
        <Eyebrow>What students leave with</Eyebrow>
        <H2>Ten things that outlast the six weeks</H2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map((o) => (
            <li key={o.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">{o.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{o.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Heritage teaser */}
      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-5 lg:items-center">
          <div className="lg:col-span-3">
            <Eyebrow>Our heritage</Eyebrow>
            <H2>{HERITAGE.headline}</H2>
            <Lede>{HERITAGE.lede}</Lede>
            <p className="mt-5 leading-relaxed text-slate-600">{HERITAGE.paragraphs[1]}</p>
            <Button href={`${BASE}/about`} variant="secondary" className="mt-8">
              Read the full story
            </Button>
          </div>
          <Card className="lg:col-span-2 bg-gradient-to-br from-purple-50 to-white">
            <h3 className="text-lg font-bold text-slate-900">{SCHOLARSHIP.headline}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{SCHOLARSHIP.body}</p>
            <Button href={`${BASE}/scholarships`} variant="accent" className="mt-6">
              Apply for a scholarship
            </Button>
          </Card>
        </div>
      </Section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-500">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to get your student building?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-50">
            Enrollment is opened by a parent or guardian and takes about five minutes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href={`${BASE}/enroll`} size="lg" variant="accent">
              Enroll Now
            </Button>
            <Link
              href={`${BASE}/schools`}
              className="inline-flex items-center justify-center rounded-full border-2 border-white/70 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              I'm a school administrator
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
