import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Seo from "../components/Seo";
import { Button, Eyebrow, H2, Lede, Section, cx } from "../components/ui";
import { BASE, FAQS, ORG } from "../content/program";

type Filter = "all" | "parents" | "schools";

export default function Faq() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(FAQS[0]?.q ?? null);

  const visible = FAQS.filter((f) =>
    filter === "all" ? true : f.audience === filter || f.audience === "both",
  );

  return (
    <>
      <Seo
        title="FAQ | AI Builders Academy"
        description="Answers for parents and school administrators: ages, experience required, devices, software used, missed classes, insurance, screening and cost."
        path={`${BASE}/faq`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      <Section tone="gradient" className="!pb-10">
        <Eyebrow>FAQ</Eyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Questions, answered plainly
        </h1>
        <Lede>
          If the answer you need isn't here, email {ORG.email} or call {ORG.phone}. A real person
          replies.
        </Lede>
      </Section>

      <Section tone="white" className="!pt-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter questions">
          {(
            [
              ["all", "All questions"],
              ["parents", "For parents"],
              ["schools", "For schools"],
            ] as [Filter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={cx(
                "rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300",
                filter === id
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {visible.map((f) => {
            const isOpen = open === f.q;
            return (
              <li key={f.q}>
                <h2>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : f.q)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-200 sm:px-8"
                  >
                    <span className="text-lg font-bold text-slate-900">{f.q}</span>
                    <ChevronDown
                      className={cx(
                        "mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </h2>
                {isOpen ? (
                  <div className="px-6 pb-6 text-sm leading-relaxed text-slate-600 sm:px-8">{f.a}</div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section tone="tint">
        <H2>Still have a question?</H2>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={`${BASE}/contact`}>Contact us</Button>
          <Button href={`${BASE}/schools`} variant="secondary">
            School administrators
          </Button>
          <Button href={`${BASE}/enroll`} variant="secondary">
            Enroll a student
          </Button>
        </div>
      </Section>
    </>
  );
}
