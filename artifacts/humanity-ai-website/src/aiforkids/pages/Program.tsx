import { ArrowRight, CalendarClock, Users, Layers, MapPin } from "lucide-react";
import Seo from "../components/Seo";
import { Button, Card, Eyebrow, H2, Lede, Pill, Placeholder, Section, StatGrid } from "../components/ui";
import { BASE, CURRICULUM, GRADE_BANDS, PROGRAM, SESSIONS } from "../content/program";

export default function Program() {
  return (
    <>
      <Seo
        title="Program Overview | AI Builders Academy"
        description="Eight weeks, 60 minutes a week, 20 students maximum, grades 3–12. Project-based AI learning with a family showcase in Week 8."
        path={`${BASE}/program`}
      />

      <Section tone="gradient" className="!pb-12">
        <Eyebrow>Program overview</Eyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          {PROGRAM.name}
        </h1>
        <Lede>{PROGRAM.subheadline}</Lede>
        <div className="mt-10">
          <StatGrid
            items={[
              { value: `${PROGRAM.weeks}`, label: "Weeks" },
              { value: `${PROGRAM.minutesPerSession} min`, label: "Weekly session" },
              { value: `${PROGRAM.maxStudents}`, label: "Students maximum" },
              { value: "3–12", label: "Grades" },
            ]}
          />
        </div>
      </Section>

      <Section tone="white">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarClock, title: "Eight weeks", body: "One session a week, after school. Long enough to build something real, short enough to finish inside a semester." },
            { icon: Layers, title: "Project based", body: "Every week ends with a student-made artifact. Nothing is graded; everything is presented." },
            { icon: Users, title: "Small classes", body: `Capped at ${PROGRAM.maxStudents} students so every student gets instructor time and stage time.` },
            { icon: MapPin, title: "Hosted locally", body: PROGRAM.format },
          ].map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="tint">
        <Eyebrow>Grade bands</Eyebrow>
        <H2>Three bands, one curriculum</H2>
        <Lede>
          Students are grouped with their own age range. The eight-week arc is identical; the projects,
          the vocabulary and the level of independence are not.
        </Lede>
        <ul className="mt-10 grid gap-5 lg:grid-cols-3">
          {GRADE_BANDS.map((g) => (
            <Card as="li" key={g.id}>
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="text-xl font-bold text-slate-900">{g.label}</h3>
                <Pill tone="slate">{g.ages}</Pill>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{g.blurb}</p>
            </Card>
          ))}
        </ul>
      </Section>

      <Section tone="white">
        <Eyebrow>Upcoming sessions</Eyebrow>
        <H2>When the next cohorts run</H2>
        {SESSIONS.length === 0 ? (
          <div className="mt-8 max-w-3xl">
            <Placeholder>
              Cohort dates and locations are being finalised. Start an enrollment now and you'll be
              first in line — we'll email you the schedule as soon as it's set, and nothing is charged
              until you choose a confirmed session.
            </Placeholder>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href={`${BASE}/enroll`}>
                Reserve a seat <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button href={`${BASE}/contact`} variant="secondary">
                Ask about dates
              </Button>
            </div>
          </div>
        ) : (
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {SESSIONS.map((s) => (
              <Card as="li" key={s.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{s.label}</h3>
                  <Pill tone={s.status === "open" ? "teal" : "orange"}>
                    {s.status === "open" ? "Open" : s.status === "waitlist" ? "Waitlist" : "Announced"}
                  </Pill>
                </div>
                <p className="mt-2 text-sm text-slate-600">{s.schedule}</p>
                <p className="text-sm text-slate-600">{s.location}</p>
                <Button href={`${BASE}/enroll?session=${s.id}`} className="mt-5">
                  Enroll
                </Button>
              </Card>
            ))}
          </ul>
        )}
      </Section>

      <Section tone="tint">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Curriculum</Eyebrow>
            <H2>The eight weeks in brief</H2>
          </div>
          <Button href={`${BASE}/curriculum`} variant="ghost">
            Full curriculum <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <ol className="mt-8 space-y-3">
          {CURRICULUM.map((w) => (
            <li
              key={w.n}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-2xl border border-slate-200 bg-white px-6 py-4"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Week {w.n}
              </span>
              <span className="text-lg font-bold text-slate-900">{w.title}</span>
              <span className="w-full text-sm text-slate-600 sm:w-auto sm:flex-1">{w.build}</span>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
