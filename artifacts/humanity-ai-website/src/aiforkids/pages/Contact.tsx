import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import Seo from "../components/Seo";
import InquiryForm, { type InquiryKind } from "../components/InquiryForm";
import { Card, Eyebrow, H2, Lede, Section, cx } from "../components/ui";
import { BASE, ORG } from "../content/program";

const KINDS: { id: InquiryKind; label: string; blurb: string }[] = [
  { id: "general", label: "General inquiry", blurb: "Questions about the program, sessions or enrollment." },
  { id: "school_partnership", label: "School partnership", blurb: "Bring the academy to your school or district." },
  { id: "instructor", label: "Instructor application", blurb: "Teach the academy. Background check required." },
  { id: "volunteer", label: "Volunteer", blurb: "Help at sessions or at the Week 6 showcase." },
  { id: "sponsor", label: "Sponsor", blurb: "Fund a classroom, scholarships or equipment." },
];

export default function Contact() {
  const [kind, setKind] = useState<InquiryKind>("general");
  const active = KINDS.find((k) => k.id === kind)!;

  return (
    <>
      <Seo
        title="Contact | AI Builders Academy"
        description="Contact Humanity + AI about AI Builders Academy — general questions, school partnerships, instructor applications, volunteering or sponsorship."
        path={`${BASE}/contact`}
      />

      <Section tone="gradient" className="!pb-10">
        <Eyebrow>Contact</Eyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Talk to a human
        </h1>
        <Lede>
          Every message goes to {ORG.shortName} directly. We reply within two business days.
        </Lede>
      </Section>

      <Section tone="white" className="!pt-6">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-bold text-slate-900">Reach us directly</h2>
              <ul className="mt-5 space-y-4 text-sm">
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                  <a className="font-medium text-slate-800 hover:text-blue-700" href={`mailto:${ORG.email}`}>
                    {ORG.email}
                  </a>
                </li>
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                  <a
                    className="font-medium text-slate-800 hover:text-blue-700"
                    href={`tel:${ORG.phone.replace(/\D/g, "")}`}
                  >
                    {ORG.phone}
                  </a>
                </li>
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                  <span className="text-slate-700">{ORG.region}</span>
                </li>
              </ul>
            </Card>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                What's this about?
              </legend>
              <div className="mt-4 space-y-2">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    aria-pressed={kind === k.id}
                    className={cx(
                      "w-full rounded-2xl border px-5 py-4 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200",
                      kind === k.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <span className="block font-semibold text-slate-900">{k.label}</span>
                    <span className="block text-sm text-slate-600">{k.blurb}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="lg:col-span-3">
            <InquiryForm
              key={kind}
              kind={kind}
              heading={active.label}
              submitLabel="Send message"
              messageLabel="Your message"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
