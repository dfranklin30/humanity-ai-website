import {
  CalendarCheck,
  Download,
  ShieldCheck,
  BadgeCheck,
  Building2,
  ArrowRight,
  Printer,
  CheckCircle2,
} from "lucide-react";
import Seo from "../components/Seo";
import InquiryForm from "../components/InquiryForm";
import { Button, Card, Eyebrow, H2, Lede, Pill, Placeholder, Section } from "../components/ui";
import {
  BASE,
  COMPLIANCE,
  CURRICULUM,
  DOWNLOADS,
  FAQS,
  INSTRUCTORS,
  INSTRUCTOR_STANDARD,
  MEETING_URL,
  ORG,
  PARTNERSHIP_MODELS,
  PROGRAM,
  SCHOOL_REQUIREMENTS,
} from "../content/program";

function ScheduleButton({ size = "lg", variant = "primary" as const }) {
  if (MEETING_URL) {
    return (
      <Button href={MEETING_URL} external size={size as "lg"} variant={variant}>
        <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Schedule a Meeting
      </Button>
    );
  }
  return (
    <Button href="#schedule" size={size as "lg"} variant={variant}>
      <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Schedule a Meeting
    </Button>
  );
}

export default function Schools() {
  const schoolFaqs = FAQS.filter((f) => f.audience === "schools" || f.audience === "both");
  const schoolDownloads = DOWNLOADS.filter((d) => d.audience === "schools");

  return (
    <>
      <Seo
        title="Bring AI Builders Academy to Your School | Humanity + AI"
        description="A turnkey six-week AI enrichment program for grades 3–12. Instructor provided, curriculum provided, no teacher prep, insured and background-checked. Partnership models, requirements and brochures for school administrators in Tampa Bay."
        path={`${BASE}/schools`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: schoolFaqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-teal-200 to-blue-200 opacity-40 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-3">
              <Pill tone="blue">For school and district leaders</Pill>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl">
                Bring a real AI program to your school —{" "}
                <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                  without adding a single hour of staff work.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-700">
                {PROGRAM.name} is a six-week, 90-minute-per-week after-school program for grades 3–12.
                Humanity + AI provides the instructor, the curriculum, the materials and the family
                showcase. You provide a room and a time slot.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ScheduleButton />
                <Button href="#brochures" size="lg" variant="secondary">
                  <Download className="h-4 w-4" aria-hidden="true" /> Download the brochure
                </Button>
              </div>
              <p className="mt-5 text-sm text-slate-600">
                Questions before you commit to a call? {ORG.email} · {ORG.phone}
              </p>
            </div>

            <Card className="lg:col-span-2 bg-white">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                What you're agreeing to
              </h2>
              <ul className="mt-5 space-y-3 text-sm">
                {[
                  "A room and a 90-minute after-school block, once a week for six weeks",
                  "A point of contact at the school",
                  "Devices your students already use — Chromebooks are fine",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                    <span className="text-slate-700">{t}</span>
                  </li>
                ))}
              </ul>
              <h2 className="mt-7 text-sm font-semibold uppercase tracking-wider text-slate-500">
                What you're not
              </h2>
              <ul className="mt-5 space-y-3 text-sm">
                {[
                  "No teacher preparation or lesson planning",
                  "No curriculum to review, write or license",
                  "No money moving through the school office",
                  "No new hardware purchase",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                    <span className="text-slate-600">{t}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Partnership models */}
      <Section tone="tint" id="models">
        <Eyebrow>Partnership models</Eyebrow>
        <H2>Four ways schools run the academy</H2>
        <Lede>
          Most partners start with the first model and move to a sponsored cohort once they've seen a
          showcase. Nothing here is fixed — tell us your constraints and we'll shape it around them.
        </Lede>
        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {PARTNERSHIP_MODELS.map((m) => (
            <Card as="li" key={m.id} className="flex flex-col">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{m.name}</h3>
                  <p className="text-sm font-medium text-purple-700">{m.bestFor}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{m.body}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {m.points.map((p) => (
                  <li key={p} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                    <span className="text-slate-700">{p}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </ul>
      </Section>

      {/* Curriculum */}
      <Section tone="white" id="curriculum">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>What gets taught</Eyebrow>
            <H2>The six-week curriculum</H2>
          </div>
          <Button href={`${BASE}/curriculum`} variant="ghost">
            Full detail, week by week <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <ol className="mt-10 space-y-4">
          {CURRICULUM.map((w) => (
            <li
              key={w.n}
              className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-[auto,1fr,1fr] sm:items-start"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                {w.n}
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{w.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{w.summary}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Student deliverable
                </p>
                <p className="mt-1 text-sm text-slate-700">{w.build}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Requirements */}
      <Section tone="tint" id="requirements">
        <Eyebrow>Logistics</Eyebrow>
        <H2>{SCHOOL_REQUIREMENTS.headline}</H2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCHOOL_REQUIREMENTS.items.map((r) => (
            <li key={r.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold text-slate-900">{r.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{r.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Compliance & insurance */}
      <Section tone="white" id="compliance">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <Eyebrow>Due diligence</Eyebrow>
            <H2 className="!text-3xl">{COMPLIANCE.headline}</H2>
          </div>
        </div>
        <Lede>
          This is the section your business office will ask for. Everything below can be provided in
          writing before a first session — ask and we'll send the documents directly.
        </Lede>
        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {COMPLIANCE.items.map((c) => (
            <Card as="li" key={c.title}>
              <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
            </Card>
          ))}
        </ul>
        <Placeholder>
          <strong>Note for Humanity + AI before publishing:</strong> confirm the insurance carrier,
          coverage limits and additional-insured process, and the exact background-check vendor and
          cadence, then remove this notice. Districts verify these claims.
        </Placeholder>
      </Section>

      {/* Instructors */}
      <Section tone="tint" id="instructors">
        <Eyebrow>Who stands in front of your students</Eyebrow>
        <H2>Instructor credentials</H2>
        <Lede>
          Every instructor meets the same standard before they lead a cohort. We'll provide the
          specific instructor's credentials and screening documentation for your site on request.
        </Lede>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 text-white">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">The standard</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {INSTRUCTOR_STANDARD.map((s) => (
                <li key={s} className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                  <span className="text-slate-700">{s}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-5 lg:col-span-2">
            {INSTRUCTORS.map((i) => (
              <Card key={i.name}>
                <h3 className="text-xl font-bold text-slate-900">{i.name}</h3>
                <p className="text-sm font-semibold text-purple-700">{i.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{i.bio}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {i.credentials.map((c) => (
                    <li key={c}>
                      <Pill tone="slate">{c}</Pill>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
            <Placeholder>
              Additional instructor profiles — names, photos, credentials and LinkedIn — are added in{" "}
              <code>content/program.ts</code> as the roster is confirmed. Nothing invented is shown here.
            </Placeholder>
          </div>
        </div>
      </Section>

      {/* Brochures */}
      <Section tone="white" id="brochures">
        <Eyebrow>Take it to your team</Eyebrow>
        <H2>Downloadable brochures</H2>
        <Lede>
          Each of these opens a clean, print-ready page — use your browser's print dialog and choose
          "Save as PDF" to forward it to a principal, PTA board or district office.
        </Lede>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {schoolDownloads.map((d) => (
            <Card as="li" key={d.id} className="flex flex-col">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                <Printer className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{d.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{d.description}</p>
              <Button href={d.href} variant="secondary" className="mt-5 self-start">
                Open <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Card>
          ))}
        </ul>
      </Section>

      {/* FAQ */}
      <Section tone="tint" id="faq">
        <Eyebrow>Administrator questions</Eyebrow>
        <H2>Frequently asked</H2>
        <dl className="mt-10 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white">
          {schoolFaqs.map((f) => (
            <div key={f.q} className="p-6 sm:p-8">
              <dt className="text-lg font-bold text-slate-900">{f.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Schedule */}
      <Section tone="white" id="schedule">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Eyebrow>Next step</Eyebrow>
            <H2>Schedule a meeting</H2>
            <Lede>
              Twenty minutes is enough to work out whether this fits your calendar, your space and your
              families. Tell us roughly when you're free and we'll confirm a time.
            </Lede>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "What your cohort would look like",
                "Which partnership model fits your funding",
                "Insurance, screening and any district paperwork",
                "A realistic start date",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                  <span className="text-slate-700">{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-slate-600">
              Prefer email or phone? {ORG.email} · {ORG.phone}
            </p>
          </div>
          <div className="lg:col-span-3">
            <InquiryForm
              kind="school_meeting"
              heading="Request a meeting"
              submitLabel="Request a meeting"
              messageLabel="Anything we should know first?"
              messagePlaceholder="Grade levels you're thinking about, how many students, funding situation, timing…"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
