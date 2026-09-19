import { Check, Star, ArrowRight } from "lucide-react";
import Seo from "../components/Seo";
import { Button, Card, Eyebrow, H2, Lede, Placeholder, Section, cx } from "../components/ui";
import { BASE, PROGRAM, SCHOLARSHIP, TIERS, formatPrice } from "../content/program";

export default function Pricing() {
  const anyUnpriced = TIERS.some((t) => t.price === null);

  return (
    <>
      <Seo
        title="Pricing & Scholarships | AI Builders Academy"
        description="Tuition for the eight-week AI Builders Academy. Creator tier $399 for the full program. Need-based scholarships available for every session — no student is turned away for cost."
        path={`${BASE}/pricing`}
      />

      <Section tone="gradient" className="!pb-10">
        <Eyebrow>Pricing</Eyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          One price, the whole program
        </h1>
        <Lede>
          Tuition covers all {PROGRAM.weeks} sessions, materials, the certificate and the Week 8
          showcase. There are no add-ons to buy mid-program and nothing required at home.
        </Lede>
      </Section>

      <Section tone="white" className="!pt-4">
        <ul className="grid gap-6 lg:grid-cols-2">
          {TIERS.map((t) => (
            <Card
              as="li"
              key={t.id}
              className={cx(
                "relative flex flex-col",
                t.recommended && "border-2 border-purple-400 shadow-lg",
              )}
            >
              {t.recommended ? (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  <Star className="h-3 w-3" aria-hidden="true" /> Recommended
                </span>
              ) : null}

              <h2 className="text-2xl font-extrabold text-slate-900">
                {t.name} {t.emoji ? <span aria-hidden="true">{t.emoji}</span> : null}
              </h2>
              <p className="mt-1 text-slate-600">{t.summary}</p>

              <p className="mt-6 flex items-baseline gap-2">
                <span
                  className={cx(
                    "text-4xl font-extrabold tracking-tight",
                    t.price === null ? "text-slate-400" : "text-slate-900",
                  )}
                >
                  {formatPrice(t.price)}
                </span>
                <span className="text-sm text-slate-500">{t.cadence}</span>
              </p>
              {t.note ? <p className="mt-1 text-sm font-medium text-purple-700">{t.note}</p> : null}

              <ul className="mt-7 flex-1 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                    <span className="text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  href={`${BASE}/enroll?tier=${t.id}`}
                  size="lg"
                  variant={t.recommended ? "primary" : "secondary"}
                  className="w-full"
                >
                  Choose {t.name} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          ))}
        </ul>

        {anyUnpriced ? (
          <div className="mt-8">
            <Placeholder>
              <strong>Note for Humanity + AI:</strong> the Explorer price has not been set yet, so the
              site honestly shows "Coming soon" rather than a guessed number. Set{" "}
              <code>TIERS[0].price</code> in <code>content/program.ts</code> and it appears everywhere,
              including checkout. Only Creator ($399) can be paid for today.
            </Placeholder>
          </div>
        ) : null}
      </Section>

      <Section tone="tint">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Scholarships</Eyebrow>
            <H2>{SCHOLARSHIP.headline}</H2>
            <Lede>{SCHOLARSHIP.body}</Lede>
            <Button href={`${BASE}/scholarships`} variant="accent" size="lg" className="mt-8">
              Apply for a scholarship
            </Button>
          </div>
          <Card>
            <ul className="space-y-3">
              {SCHOLARSHIP.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                  <span className="text-slate-700">{p}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section tone="white">
        <H2>What tuition pays for</H2>
        <Lede>
          {PROGRAM.name} is run by a nonprofit. Tuition covers instructors, materials and the cost of
          running the cohort — and every sponsored seat and scholarship is funded by donors and
          partners rather than by charging other families more.
        </Lede>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/donate" variant="secondary">
            Sponsor a student
          </Button>
          <Button href={`${BASE}/schools`} variant="secondary">
            Bring it to a school
          </Button>
        </div>
      </Section>
    </>
  );
}
