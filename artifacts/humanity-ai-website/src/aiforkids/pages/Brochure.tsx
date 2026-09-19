import { Printer } from "lucide-react";
import Seo from "../components/Seo";
import { Logo } from "../components/KidsLayout";
import {
  BASE,
  COMPLIANCE,
  CURRICULUM,
  FAQS,
  GRADE_BANDS,
  HERITAGE,
  INSTRUCTOR_STANDARD,
  ORG,
  OUTCOMES,
  PARTNERSHIP_MODELS,
  PROGRAM,
  SCHOLARSHIP,
  SCHOOL_REQUIREMENTS,
  TIERS,
  formatPrice,
} from "../content/program";

type Variant = "schools" | "curriculum" | "parents";

const TITLES: Record<Variant, { title: string; subtitle: string; description: string }> = {
  schools: {
    title: "School Partner Brochure",
    subtitle: "A turnkey eight-week AI enrichment program for grades 3–12",
    description:
      "Printable one-page overview of AI Builders Academy for school and district leaders — partnership models, site requirements, insurance and screening.",
  },
  curriculum: {
    title: "Eight-Week Curriculum Outline",
    subtitle: "Week-by-week topics, projects and student outcomes",
    description:
      "Printable week-by-week curriculum outline for AI Builders Academy, suitable for attaching to a district enrichment proposal.",
  },
  parents: {
    title: "Parent Guide to AI",
    subtitle: "What your student learns, and how we keep them safe",
    description:
      "Printable parent guide to AI Builders Academy — what students learn, how AI tools are supervised, pricing and scholarships.",
  },
};

function PrintBar() {
  return (
    <div className="print:hidden">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-5">
        <a href={`${BASE}/schools`} className="text-sm font-semibold text-blue-700 hover:underline">
          ← Back to the school partner page
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Printer className="h-4 w-4" aria-hidden="true" /> Print or save as PDF
        </button>
      </div>
    </div>
  );
}

function Head({ variant }: { variant: Variant }) {
  const t = TITLES[variant];
  return (
    <header className="mb-8 border-b-2 border-slate-900 pb-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {ORG.name} · {ORG.mission}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            {PROGRAM.name}
          </h1>
          <p className="mt-1 text-lg font-semibold text-slate-700">{t.title}</p>
          <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
        </div>
        <Logo />
      </div>
      <p className="mt-5 text-sm text-slate-600">
        {ORG.email} · {ORG.phone} · {ORG.site}
        {BASE}
      </p>
    </header>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7 break-inside-avoid">
      <h2 className="mb-2.5 text-sm font-bold uppercase tracking-[0.14em] text-slate-900">{title}</h2>
      <div className="text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export default function Brochure({ variant }: { variant: Variant }) {
  const t = TITLES[variant];

  return (
    <div className="bg-slate-100 print:bg-white">
      <Seo
        title={`${t.title} | ${PROGRAM.name}`}
        description={t.description}
        path={`${BASE}/brochure/${variant}`}
      />
      <PrintBar />
      <article className="mx-auto max-w-4xl bg-white px-8 py-10 shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none sm:px-12">
        <Head variant={variant} />

        {variant === "schools" ? (
          <>
            <Block title="The program in one paragraph">
              <p>
                {PROGRAM.name} is a {PROGRAM.weeks}-week, {PROGRAM.minutesPerSession}-minute-per-week
                after-school program for grades 3–12, capped at {PROGRAM.maxStudents} students.{" "}
                {ORG.shortName} provides the instructor, the curriculum, the materials and a family
                Creator Expo in Week 8. The host site provides a room, a weekly time slot and a point of
                contact. No teacher preparation is required.
              </p>
            </Block>

            <Block title="Partnership models">
              <ul className="space-y-2.5">
                {PARTNERSHIP_MODELS.map((m) => (
                  <li key={m.id}>
                    <strong className="text-slate-900">{m.name}</strong> — {m.bestFor.replace("Best for ", "")}.{" "}
                    {m.body}
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="What a host site needs">
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {SCHOOL_REQUIREMENTS.items.map((r) => (
                  <li key={r.title}>
                    <strong className="text-slate-900">{r.title}:</strong> {r.body}
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="Curriculum at a glance">
              <ol className="space-y-1">
                {CURRICULUM.map((w) => (
                  <li key={w.n}>
                    <strong className="text-slate-900">Week {w.n} — {w.title}.</strong> {w.build}
                  </li>
                ))}
              </ol>
            </Block>

            <Block title="Insurance, screening and student privacy">
              <ul className="space-y-2">
                {COMPLIANCE.items.map((c) => (
                  <li key={c.title}>
                    <strong className="text-slate-900">{c.title}:</strong> {c.body}
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="Instructor standard">
              <ul className="list-disc space-y-1 pl-5">
                {INSTRUCTOR_STANDARD.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Block>

            <Block title="Cost to the school">
              <p>
                In the hosted model, nothing — families register and pay through {ORG.site}
                {BASE}, so no money moves through the school office. Sponsored cohorts are funded by a
                grant, PTA or corporate sponsor and are free to families. {SCHOLARSHIP.headline}{" "}
                Need-based scholarships are available for every session.
              </p>
            </Block>
          </>
        ) : null}

        {variant === "curriculum" ? (
          <>
            <Block title="Format">
              <p>
                {PROGRAM.weeks} weeks · one {PROGRAM.minutesPerSession}-minute session per week ·
                maximum {PROGRAM.maxStudents} students · project-based · taught in three grade bands.
              </p>
              <ul className="mt-2 space-y-1">
                {GRADE_BANDS.map((g) => (
                  <li key={g.id}>
                    <strong className="text-slate-900">{g.label} ({g.ages}):</strong> {g.blurb}
                  </li>
                ))}
              </ul>
            </Block>

            {CURRICULUM.map((w) => (
              <Block key={w.n} title={`Week ${w.n} — ${w.title}`}>
                <p>{w.summary}</p>
                <ul className="mt-2 list-disc space-y-0.5 pl-5">
                  {w.topics.map((topic) => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
                <p className="mt-2">
                  <strong className="text-slate-900">Student deliverable:</strong> {w.build}
                </p>
              </Block>
            ))}

            <Block title="Student outcomes">
              <ul className="grid gap-1 sm:grid-cols-2">
                {OUTCOMES.map((o) => (
                  <li key={o.title}>
                    <strong className="text-slate-900">{o.title}:</strong> {o.body}
                  </li>
                ))}
              </ul>
            </Block>
          </>
        ) : null}

        {variant === "parents" ? (
          <>
            <Block title="What your student will do">
              <p>
                Eight weeks, eight makes, one showcase. Students work in small groups on real AI tools with
                an instructor present, and every student presents their project to families in Week 8.
              </p>
              <ol className="mt-2 space-y-1">
                {CURRICULUM.map((w) => (
                  <li key={w.n}>
                    <strong className="text-slate-900">Week {w.n} — {w.title}.</strong> {w.build}
                  </li>
                ))}
              </ol>
            </Block>

            <Block title="How we keep students safe">
              <ul className="space-y-2">
                {COMPLIANCE.items
                  .filter((c) => c.title !== "General liability insurance")
                  .map((c) => (
                    <li key={c.title}>
                      <strong className="text-slate-900">{c.title}:</strong> {c.body}
                    </li>
                  ))}
              </ul>
            </Block>

            <Block title="Talking about AI at home">
              <ul className="list-disc space-y-1 pl-5">
                <li>Ask to see the project — every week produces something they can show you.</li>
                <li>Ask "how do you know that's right?" Checking an AI's answer is the core habit we teach.</li>
                <li>Reinforce the rule from Week 1: never type personal information into an AI tool.</li>
                <li>Let them teach you. Explaining it back is where the learning locks in.</li>
              </ul>
            </Block>

            <Block title="Cost and scholarships">
              <ul className="space-y-1">
                {TIERS.map((t2) => (
                  <li key={t2.id}>
                    <strong className="text-slate-900">
                      {t2.name} — {formatPrice(t2.price)}
                    </strong>{" "}
                    {t2.cadence}. {t2.summary}
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                <strong className="text-slate-900">{SCHOLARSHIP.headline}</strong> {SCHOLARSHIP.body}
              </p>
            </Block>

            <Block title="Common questions">
              <ul className="space-y-2">
                {FAQS.filter((f) => f.audience !== "schools")
                  .slice(0, 7)
                  .map((f) => (
                    <li key={f.q}>
                      <strong className="text-slate-900">{f.q}</strong> {f.a}
                    </li>
                  ))}
              </ul>
            </Block>
          </>
        ) : null}

        <Block title="About Humanity + AI">
          <p>{HERITAGE.paragraphs[0]}</p>
          <p className="mt-2">{HERITAGE.paragraphs[1]}</p>
        </Block>

        <footer className="mt-8 border-t border-slate-300 pt-4 text-xs text-slate-500">
          <p>
            {ORG.name} · {ORG.email} · {ORG.phone} · {ORG.site}
            {BASE} — {ORG.mission}
          </p>
        </footer>
      </article>
    </div>
  );
}
