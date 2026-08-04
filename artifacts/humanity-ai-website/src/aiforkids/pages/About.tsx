import { Check } from "lucide-react";
import Seo from "../components/Seo";
import { Logo } from "../components/KidsLayout";
import { Button, Card, Eyebrow, H2, Lede, Pill, Placeholder, Section } from "../components/ui";
import {
  BASE,
  FOUNDER,
  HERITAGE,
  INSTRUCTORS,
  INSTRUCTOR_STANDARD,
  ORG,
  PROGRAM,
} from "../content/program";

export default function About() {
  return (
    <>
      <Seo
        title="About & Heritage | AI Builders Academy by Humanity + AI"
        description="AI Builders Academy is a program of Humanity + AI, Inc., founded by Danielle Franklin — former NVIDIA, 20 years supporting the Department of Defense, developer of ROSIE. Our mission: making artificial intelligence accessible to everyone."
        path={`${BASE}/about`}
      />

      <Section tone="gradient" className="!pb-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Logo />
          <div>
            <Eyebrow>About</Eyebrow>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              {HERITAGE.headline}
            </h1>
          </div>
        </div>
        <Lede className="mt-6 text-xl">{HERITAGE.lede}</Lede>
      </Section>

      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-5 leading-relaxed text-slate-700 lg:col-span-2">
            {HERITAGE.paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "text-lg" : undefined}>
                {p}
              </p>
            ))}
          </div>
          <Card className="h-fit bg-gradient-to-br from-blue-50 to-white">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              The mission
            </h2>
            <p className="mt-3 text-xl font-bold leading-snug text-slate-900">{ORG.mission}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {PROGRAM.name} is a program of {ORG.name}, a {ORG.status}. Tuition funds the program.
              Sponsors fund students.
            </p>
            <Button href="/" variant="secondary" className="mt-6">
              Visit {ORG.shortName}
            </Button>
          </Card>
        </div>
      </Section>

      <Section tone="tint">
        <Eyebrow>Founder</Eyebrow>
        <H2>{FOUNDER.name}</H2>
        <p className="mt-2 text-lg font-semibold text-purple-700">{FOUNDER.role}</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {FOUNDER.credentials.map((c) => (
            <li key={c}>
              <Pill tone="slate">{c}</Pill>
            </li>
          ))}
        </ul>
        <Lede>
          Danielle built ROSIE — the AI system students meet in Week 5 — and teaches the academy's
          instructor cohort herself. The program's insistence on real tools, real projects and real
          scrutiny comes directly from two decades of working where a wrong answer had consequences.
        </Lede>
      </Section>

      <Section tone="white">
        <Eyebrow>{HERITAGE.communities.headline}</Eyebrow>
        <H2>Who this program is for</H2>
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

      <Section tone="tint">
        <Eyebrow>Instructors</Eyebrow>
        <H2>Who teaches</H2>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card className="h-fit">
            <h3 className="text-lg font-bold text-slate-900">Every instructor meets this standard</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {INSTRUCTOR_STANDARD.map((s) => (
                <li key={s} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
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
              </Card>
            ))}
            <Placeholder>
              The instructor roster grows as cohorts are scheduled. Real names, photos and credentials
              only — no stock profiles.
            </Placeholder>
          </div>
        </div>
      </Section>

      <Section tone="white">
        <Eyebrow>Partners</Eyebrow>
        <H2>Schools, sponsors and community organizations</H2>
        <Placeholder>
          Partner logos and names will be listed here once agreements are signed. If your school,
          company or foundation wants to be among the first, the{" "}
          <a className="font-semibold underline" href={`${BASE}/schools`}>
            school partner page
          </a>{" "}
          is the place to start.
        </Placeholder>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={`${BASE}/schools`}>Partner with us</Button>
          <Button href="/donate" variant="secondary">
            Sponsor a student
          </Button>
          <Button href={`${BASE}/contact`} variant="secondary">
            Volunteer or teach
          </Button>
        </div>
      </Section>
    </>
  );
}
