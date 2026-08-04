import { ArrowRight, Printer, ShieldCheck, Check } from "lucide-react";
import Seo from "../components/Seo";
import InquiryForm from "../components/InquiryForm";
import { Button, Card, Eyebrow, H2, Lede, Placeholder, Section } from "../components/ui";
import { BASE, COMPLIANCE, CURRICULUM, FAQS, OUTCOMES, SCHOLARSHIP } from "../content/program";

export default function Parents() {
  const parentFaqs = FAQS.filter((f) => f.audience !== "schools");

  return (
    <>
      <Seo
        title="For Parents | AI Builders Academy"
        description="Why AI literacy matters, how we keep students safe, what your child will build, and what it costs. Scholarships available for every session."
        path={`${BASE}/parents`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: parentFaqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      <Section tone="gradient" className="!pb-12">
        <Eyebrow>For parents and guardians</Eyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          You don't need to understand AI. Your child does.
        </h1>
        <Lede>
          Most parents arrive with the same two feelings: this matters, and I don't know how to help.
          The academy is built for exactly that — no prior experience needed at home, no homework, and
          a showcase in Week 6 where you get to see what your student actually made.
        </Lede>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={`${BASE}/enroll`} size="lg">
            Enroll your student <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button href={`${BASE}/brochure/parents`} size="lg" variant="secondary">
            <Printer className="h-4 w-4" aria-hidden="true" /> Parent guide
          </Button>
        </div>
      </Section>

      <Section tone="white">
        <Eyebrow>Why it matters</Eyebrow>
        <H2>The skill isn't using AI. It's judging it.</H2>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 leading-relaxed text-slate-600">
            <p>
              Your child will graduate into a workplace where AI drafts the first version of almost
              everything. The students who do well won't be the ones who type the fastest prompt — they'll
              be the ones who can tell when the answer is wrong, who know where the training data came
              from, and who can explain their reasoning to a human being.
            </p>
            <p>
              That's what these six weeks are pointed at. Students build real things, and every build is
              followed by the same question: how do you know this is right, and who might it fail?
            </p>
            <p>
              The career awareness is real too. Week 5 connects the work to AI jobs that exist in the
              Tampa Bay region today, and students meet ROSIE — an AI system built here, in use, doing
              something useful.
            </p>
          </div>
          <Card>
            <h3 className="text-lg font-bold text-slate-900">What your student leaves with</h3>
            <ul className="mt-5 grid gap-2.5">
              {OUTCOMES.map((o) => (
                <li key={o.title} className="flex gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                  <span>
                    <span className="font-semibold text-slate-900">{o.title}.</span>{" "}
                    <span className="text-slate-600">{o.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section tone="tint">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <Eyebrow>Safety</Eyebrow>
            <H2 className="!text-3xl">How we keep students safe</H2>
          </div>
        </div>
        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {COMPLIANCE.items
            .filter((c) => c.title !== "General liability insurance")
            .map((c) => (
              <Card as="li" key={c.title}>
                <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
              </Card>
            ))}
        </ul>
      </Section>

      <Section tone="white">
        <Eyebrow>Week by week</Eyebrow>
        <H2>What your child will actually do</H2>
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

      <Section tone="tint">
        <Eyebrow>Cost</Eyebrow>
        <H2>{SCHOLARSHIP.headline}</H2>
        <Lede>{SCHOLARSHIP.body}</Lede>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={`${BASE}/pricing`}>See pricing</Button>
          <Button href={`${BASE}/scholarships`} variant="accent">
            Apply for a scholarship
          </Button>
        </div>
      </Section>

      <Section tone="white">
        <Eyebrow>Questions</Eyebrow>
        <H2>Parent FAQ</H2>
        <dl className="mt-8 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white">
          {parentFaqs.map((f) => (
            <div key={f.q} className="p-6 sm:p-8">
              <dt className="text-lg font-bold text-slate-900">{f.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section tone="tint">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Eyebrow>Still deciding?</Eyebrow>
            <H2>Ask us anything</H2>
            <Lede>
              A real person reads these. If you're not sure the academy is right for your student, say
              so — we'd rather tell you honestly than fill a seat.
            </Lede>
            <div className="mt-8">
              <Placeholder>
                Family testimonials will appear here after the first cohort's showcase. We're not going
                to publish quotes from students who haven't taken the program yet.
              </Placeholder>
            </div>
          </div>
          <div className="lg:col-span-3">
            <InquiryForm
              kind="general"
              heading="Question for the academy"
              submitLabel="Send question"
              messageLabel="Your question"
              messagePlaceholder="Grade level, anything you're unsure about, scheduling…"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
