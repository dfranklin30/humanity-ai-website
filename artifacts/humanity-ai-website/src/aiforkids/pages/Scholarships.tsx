import { Check, HeartHandshake } from "lucide-react";
import Seo from "../components/Seo";
import InquiryForm from "../components/InquiryForm";
import { Button, Card, Eyebrow, H2, Lede, Section } from "../components/ui";
import { BASE, HERITAGE, ORG, SCHOLARSHIP } from "../content/program";

export default function Scholarships() {
  return (
    <>
      <Seo
        title="Scholarships | AI Builders Academy"
        description="Need-based scholarships cover partial or full tuition for the eight-week AI Builders Academy. No student is turned away for cost, and no documentation of hardship is required."
        path={`${BASE}/scholarships`}
      />

      <Section tone="gradient" className="!pb-12">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-purple-500 text-white">
          <HeartHandshake className="h-7 w-7" aria-hidden="true" />
        </span>
        <Eyebrow>Scholarships</Eyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          {SCHOLARSHIP.headline}
        </h1>
        <Lede className="text-xl">{SCHOLARSHIP.body}</Lede>
      </Section>

      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <H2>How it works</H2>
            <ul className="mt-6 space-y-3">
              {SCHOLARSHIP.points.map((p) => (
                <li key={p} className="flex gap-2.5">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                  <span className="text-slate-700">{p}</span>
                </li>
              ))}
            </ul>

            <Card className="mt-8 bg-gradient-to-br from-purple-50 to-white">
              <h3 className="text-lg font-bold text-slate-900">What we will and won't ask</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                We ask for your contact details, your student's grade, and roughly what you're able to
                contribute. We do not ask for tax returns, pay stubs, benefit letters or an explanation
                of your circumstances. Families should not have to prove hardship to a stranger to get
                their child into a classroom.
              </p>
            </Card>

            <Card className="mt-6">
              <h3 className="text-lg font-bold text-slate-900">Where the money comes from</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Scholarship seats are funded by donors, local businesses and school partners — never by
                charging other families more. {ORG.shortName} is a {ORG.status}, and sponsoring a seat
                is the single most direct way to put a student in this room.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button href="/donate" variant="accent">
                  Sponsor a student
                </Button>
                <Button href={`${BASE}/schools`} variant="secondary">
                  Reserve seats for a school
                </Button>
              </div>
            </Card>
          </div>

          <div>
            <InquiryForm
              kind="scholarship"
              heading="Scholarship interest"
              submitLabel="Send scholarship request"
              messageLabel="Tell us what would help"
              messagePlaceholder="Your student's grade, whether you're able to contribute anything toward tuition, and any timing constraints."
            />
            <p className="mt-4 text-sm text-slate-500">
              You can also start a regular enrollment and choose the scholarship option at the payment
              step — nothing is charged until a scholarship decision is made.
            </p>
            <Button href={`${BASE}/enroll`} variant="ghost" className="mt-3">
              Start an enrollment instead
            </Button>
          </div>
        </div>
      </Section>

      <Section tone="tint">
        <Eyebrow>{HERITAGE.communities.headline}</Eyebrow>
        <H2>Who these seats are for</H2>
        <Lede>{HERITAGE.communities.body}</Lede>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {HERITAGE.communities.groups.map((g) => (
            <Card as="li" key={g.title}>
              <h3 className="text-lg font-bold text-slate-900">{g.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{g.body}</p>
            </Card>
          ))}
        </ul>
      </Section>
    </>
  );
}
