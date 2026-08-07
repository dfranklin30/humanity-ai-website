import { PageMeta } from "@/components/page-meta";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Microscope, BookOpen, GraduationCap, Shield, Users, Heart,
  ArrowRight, Sparkles, Brain, Fingerprint, Accessibility, ExternalLink
} from "lucide-react";
import { EditorialMasthead } from "@/components/editorial-masthead";
import { useQuery } from "@tanstack/react-query";
import { CampaignMeter, type CampaignProgress } from "@/components/campaign-meter";

import daniellePhoto from "@assets/image_1775903656206.png";
import jofiaPhoto from "@assets/image_1775903668936.png";
import williamPhoto from "@assets/business_portrait_1775934336460.png";
import nirmalPhoto from "@assets/1profile-pic_1776517679611.jpg";
import mikePhoto from "@assets/image_1777566222402.png";
import davidWoodPhoto from "@assets/David_Wood212_-_edit_may_2026_1779893283704.jpg";

import imgRosie from "@assets/generated_images/initiative-rosie.png";
import imgCanineMind from "@assets/generated_images/initiative-canine-mind.png";
import imgInclusicare from "@assets/generated_images/initiative-inclusicare.png";
import imgTlc from "@assets/generated_images/initiative-tlc.png";
import imgEthics from "@assets/generated_images/initiative-ethics.png";
import imgHumansInModel from "@assets/generated_images/initiative-humans-in-model.png";
import imgLiteracy from "@assets/generated_images/initiative-literacy.png";
import imgTrainingHub from "@assets/generated_images/initiative-training-hub.png";
import imgAnimalWelfare from "@assets/generated_images/initiative-animal-welfare.png";

const campaignSlugByTitle: Record<string, string> = {
  "Project ROSIE": "project-rosie",
  "Tech Leadership Community": "tech-leadership-community",
  "AI Ethics & Governance": "ai-ethics-governance",
  "A Science of the Canine Mind": "science-canine-mind",
  "Community AI Literacy": "community-ai-literacy",
  "AI Training Hub": "ai-training-hub",
  "Animal Welfare Advocacy": "animal-welfare-advocacy",
};

type Person = { name: string; photo: string };

const peopleBySlug: Record<string, Person> = {
  "danielle-franklin": { name: "Danielle A. Franklin", photo: daniellePhoto },
  "jofia-jose-prakash": { name: "Jofiah Jose Prakash", photo: jofiaPhoto },
  "nirmal-jingar": { name: "Nirmal Jingar", photo: nirmalPhoto },
  "william-kreitzer": { name: "William Kreitzer", photo: williamPhoto },
  "mike-klyce": { name: "Mike Klyce", photo: mikePhoto },
  "david-wood": { name: "David Wood", photo: davidWoodPhoto },
};

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

type ProgramLink = { label: string; url: string };
type ProgramPerson = { slug: string; role: string };

type Program = {
  icon: typeof Microscope;
  image: string;
  title: string;
  subtitle: string;
  desc: string;
  highlights: string[];
  people: ProgramPerson[];
  color: string;
  iconColor: string;
  bgColor: string;
  glow: string;
  links?: ProgramLink[];
  link?: string;
};

const programs: Program[] = [
  {
    icon: Microscope,
    image: imgRosie,
    title: "Project ROSIE",
    subtitle: "Research On Species Intelligence and Empathy",
    desc: "Our flagship research initiative integrating AI, frequency analysis, and behavioral science to pioneer interspecies communication. ROSIE powers TalkingDOG — a multi-sensor wearable harness that streams a dog's physiological and behavioral signals into the ROSIE engine and its 40-state Canine Emotional Resonance (CER) taxonomy, translating them into plain, first-person language in real time. Hardware-agnostic by design, ROSIE is built to work with any wearable, robot, or telehealth device — reaching across the tree of life to give a voice to beings who cannot speak for themselves.",
    highlights: ["TalkingDOG multi-sensor wearable harness", "ROSIE engine & 40-state CER taxonomy", "Real-time signal-to-language translation", "Hardware-agnostic SaaS / API platform"],
    people: [{ slug: "danielle-franklin", role: "Founder & Principal Investigator" }],
    color: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    glow: "bg-emerald-400/20",
  },
  {
    icon: BookOpen,
    image: imgCanineMind,
    title: "A Science of the Canine Mind",
    subtitle: "Book Series by Danielle A. Franklin",
    desc: "A groundbreaking two-volume book series by founder Danielle A. Franklin uniting data, empathy, and science to begin true communication with animals. Supported by Project ROSIE, these works bridge AI research with practical applications in understanding canine cognition and emotion — laying the scientific foundation behind the CER taxonomy and the broader interspecies mission.",
    highlights: ["Vol. 1: Foundations for Communication", "Vol. 2: The CERT — Canine Emotional Resonance Techniques", "Grounded in Project ROSIE research", "Practical communication techniques"],
    people: [{ slug: "danielle-franklin", role: "Author & Founder" }],
    color: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    glow: "bg-amber-400/20",
  },
  {
    icon: Accessibility,
    image: imgInclusicare,
    title: "InclusiCare & InclusiGear",
    subtitle: "AI for Nonverbal & Neurodivergent Communication",
    desc: "AI built to speak for those who can't always speak for themselves — and to capture their needs for the future. Founded by board member William Kreitzer, InclusiCare provides personalized, evidence-based autism therapy, education, and life-skills support, while InclusiGear's CARLA AI lets families capture what matters about a child's care — triggers, routines, what calms them, what doesn't — and hand it off to any caregiver in 60 seconds. Born from lived experience, both are built with and for the neurodivergent community, ensuring AI is designed for the people it serves, not simply deployed at them.",
    highlights: ["Capture the needs of nonverbal individuals", "CARLA AI caregiver hand-off in 60 seconds", "Evidence-based autism therapy & education", "Designed with and for neurodivergent families"],
    people: [{ slug: "william-kreitzer", role: "Founder, InclusiCare & InclusiGear" }, { slug: "danielle-franklin", role: "Founder & Executive Director" }],
    links: [{ label: "InclusiCare", url: "https://inclusicare.org" }, { label: "InclusiGear", url: "https://inclusigear.com" }],
    color: "from-sky-500/10 to-blue-500/10 dark:from-sky-500/20 dark:to-blue-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-500/10 dark:bg-sky-500/20",
    glow: "bg-sky-400/20",
  },
  {
    icon: GraduationCap,
    image: imgTlc,
    title: "Tech Leadership Community",
    subtitle: "Mentoring the Next Generation",
    desc: "A thriving membership network for emerging and established tech leaders. Members gain one-on-one career and business strategy directly from our board members and community directors — seasoned operators across defense, enterprise AI, governance, finance, and go-to-market — alongside mentorship, peer connection, and leadership resources. TLC turns hard-won experience into practical guidance, helping the next generation lead with clarity, courage, and ethics in the AI era.",
    highlights: ["Membership network & community", "1:1 career & business strategy", "Guidance from board & community directors", "Leadership workshops & peer connection"],
    people: [{ slug: "danielle-franklin", role: "Founder & Executive Director" }],
    color: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    glow: "bg-blue-400/20",
  },
  {
    icon: Shield,
    image: imgEthics,
    title: "AI Ethics & Governance",
    subtitle: "Frameworks for Responsible AI",
    desc: "Developing and advocating comprehensive ethical frameworks that guide how AI is built, governed, and deployed. Led by AI Ethics & Governance Director Jofiah Jose Prakash with AI & Emerging Technology strategist Nirmal Jingar, the program pairs enterprise architecture and production-scale governance with principled policy work. The board's aim is to build a platform for speaking on responsible AI — through conferences, panels, publications, and public education — so the standards shaping our future are set in the open.",
    highlights: ["Responsible AI frameworks & standards", "A platform for thought leadership & speaking", "Policy advocacy & industry partnerships", "Public education on AI governance"],
    people: [{ slug: "jofia-jose-prakash", role: "Director, AI Ethics & Governance" }, { slug: "nirmal-jingar", role: "AI & Emerging Tech Strategy" }, { slug: "danielle-franklin", role: "Founder & Executive Director" }],
    color: "from-purple-500/10 to-violet-500/10 dark:from-purple-500/20 dark:to-violet-500/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    glow: "bg-purple-400/20",
  },
  {
    icon: Fingerprint,
    image: imgHumansInModel,
    title: "Humans in the Model",
    subtitle: "Keeping People at the Center of AI",
    desc: "An initiative championing human-centered AI — ensuring the most capable, trustworthy systems learn from the full depth and diversity of real human expertise. Led by Chief Legal & AI Governance Officer Mike Klyce (Founder & CEO of EnscribeAI and founder of the nonprofit Artist in the Model), the program advances rights-clear, human-authored training data, full data lineage, and transparent provenance — keeping verified humans as the ground-truth anchor, oracle, and control signal for AI rather than letting models drift toward closed synthetic self-reference.",
    highlights: ["Rights-clear, human-authored training data", "Provenance, lineage & transparency standards", "Human-in-the-loop as ground-truth signal", "Reducing bias & synthetic contamination"],
    people: [{ slug: "mike-klyce", role: "Chief Legal & AI Governance Officer" }, { slug: "danielle-franklin", role: "Founder & Executive Director" }],
    color: "from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    glow: "bg-rose-400/20",
  },
  {
    icon: Users,
    image: imgLiteracy,
    title: "Community AI Literacy",
    subtitle: "Education for Everyone",
    desc: "Making AI accessible and understandable for everyone through workshops, seminars, and online resources. Curriculum and hands-on learning are shaped with AI architecture guidance from Jofiah Jose Prakash and strategic partnerships led by David Wood — ensuring the communities too often left out of the AI conversation have a seat at the table. We believe AI literacy is essential for informed participation in an increasingly digital society.",
    highlights: ["Free community workshops", "Hands-on, beginner-friendly curriculum", "Online learning resources", "Digital inclusion initiatives"],
    people: [{ slug: "jofia-jose-prakash", role: "AI Architecture & Curriculum" }, { slug: "david-wood", role: "Strategic Partnerships" }, { slug: "danielle-franklin", role: "Founder & Executive Director" }],
    color: "from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    glow: "bg-pink-400/20",
  },
  {
    icon: Brain,
    image: imgTrainingHub,
    title: "AI Training Hub",
    subtitle: "Free Learning for All Levels",
    desc: "A comprehensive training resource center featuring curated free courses, tutorials, and hands-on projects for AI and machine learning. Guided by Jofiah Jose Prakash — whose beginner-to-advanced AI & ML course library anchors the hub — learners move from fundamentals to advanced research topics with verified video content and an open-source tools directory.",
    highlights: ["Curated beginner-to-advanced courses", "Verified video learning paths", "Open-source AI tools directory", "Hands-on project tutorials"],
    people: [{ slug: "jofia-jose-prakash", role: "Courses & Curriculum Lead" }, { slug: "danielle-franklin", role: "Founder & Executive Director" }],
    color: "from-cyan-500/10 to-sky-500/10 dark:from-cyan-500/20 dark:to-sky-500/20",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
    glow: "bg-cyan-400/20",
    link: "/training",
  },
  {
    icon: Heart,
    image: imgAnimalWelfare,
    title: "Animal Welfare Advocacy",
    subtitle: "Supporting SOS Galgos & Beyond",
    desc: "Active support for international animal welfare, anchored by our partnership with SOS Galgos — a 501(c)(3) nonprofit (Spain & USA) rescuing, rehabilitating, and rehoming Spain's abandoned galgos (greyhounds), tens of thousands of whom are killed each year as hunting waste. Having given new lives to more than 3,000 galgos, SOS Galgos pairs rescue and adoption with legislative reform and humane education. Our advocacy connects technology with compassion — using AI tools to support rescue operations and animal-welfare research.",
    highlights: ["SOS Galgos partnership (Spain & USA)", "3,000+ galgos rescued & rehomed", "Legislative reform & humane education", "AI-assisted rescue & welfare research"],
    people: [{ slug: "danielle-franklin", role: "Founder & Executive Director" }],
    links: [{ label: "SOS Galgos", url: "https://www.sosgalgos.org/" }],
    color: "from-red-500/10 to-rose-500/10 dark:from-red-500/20 dark:to-rose-500/20",
    iconColor: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10 dark:bg-red-500/20",
    glow: "bg-red-400/20",
  },
];

function PeopleRow({ people, cardIndex }: { people: ProgramPerson[]; cardIndex: number }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {people.map((p) => {
        const person = peopleBySlug[p.slug];
        if (!person) return null;
        return (
          <Link
            key={p.slug}
            href={`/about/board/${p.slug}`}
            className="group flex items-center gap-2.5 rounded-full bg-background/70 backdrop-blur border border-border/60 pl-1.5 pr-4 py-1.5 hover-elevate"
            data-testid={`link-person-${cardIndex}-${p.slug}`}
          >
            <img
              src={person.photo}
              alt={person.name}
              loading="lazy"
              decoding="async"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-background grayscale group-hover:grayscale-0 transition-all duration-300"
              data-testid={`img-person-${cardIndex}-${p.slug}`}
            />
            <span className="leading-tight">
              <span className="block text-sm font-medium group-hover:text-primary transition-colors">{person.name}</span>
              <span className="block text-[11px] text-muted-foreground">{p.role}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Programs() {
  const { data: campaigns } = useQuery<CampaignProgress[]>({ queryKey: ["/api/campaigns"] });
  const campaignBySlug = (slug: string) => campaigns?.find((c) => c.slug === slug);
  return (
    <div>
      <PageMeta
        title="Programs — Initiatives & Research"
        description="Explore Humanity + AI initiatives: Project ROSIE, A Science of the Canine Mind, InclusiCare & InclusiGear, AI Ethics & Governance, Humans in the Model, Community AI Literacy, AI Training Hub, and Animal Welfare Advocacy with SOS Galgos."
        canonical="/programs"
      />
      <EditorialMasthead kicker="What We Do" title="Programs" tagline="Initiatives & Research" />

      {/* Intro */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-24 w-[30rem] h-[30rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-20 -right-40 w-[34rem] h-[34rem] rounded-full bg-amber-400/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-7 border border-primary/15">
              <Sparkles className="h-3.5 w-3.5" />
              Our Programs
            </div>
            <h1 className="font-serif text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-7 text-white" data-testid="text-programs-title">
              Where humanity<br />
              meets{" "}
              <span className="italic bg-gradient-to-r from-primary via-emerald-500 to-teal-400 bg-clip-text text-transparent">
                intelligence
              </span>
            </h1>
            <p className="text-xl text-white/75 leading-relaxed">
              From groundbreaking research to community education, our initiatives tackle the most pressing questions at the intersection of people and AI — each one led, in the open, by the experts building it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Initiatives */}
      <section className="relative pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {programs.map((program, i) => {
            const slug = campaignSlugByTitle[program.title];
            const campaign = slug ? campaignBySlug(slug) : undefined;
            const reverse = i % 2 === 1;
            return (
              <motion.div
                key={program.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55 }}
                className="relative"
              >
                {/* soft glow bubble behind card */}
                <div className={`pointer-events-none absolute -z-10 ${reverse ? "-left-16" : "-right-16"} top-1/2 -translate-y-1/2 w-72 h-72 rounded-full ${program.glow} blur-3xl`} />

                <div
                  className={`group rounded-[2.5rem] border border-border/60 bg-gradient-to-br ${program.color} shadow-xl shadow-primary/5 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10`}
                  data-testid={`card-program-${i}`}
                >
                  <div className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
                    {/* Image bubble */}
                    <div className="lg:w-[44%] p-4 sm:p-5">
                      <div className="relative h-64 sm:h-80 lg:h-full min-h-[18rem] rounded-[2rem] overflow-hidden ring-1 ring-border/40">
                        <img
                          src={program.image}
                          alt={program.title}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                          data-testid={`img-program-${i}`}
                        />
                        <div className="absolute top-4 left-4 flex items-center gap-3">
                          <span className="flex items-center justify-center w-14 h-14 rounded-full bg-background/90 backdrop-blur font-serif text-xl font-bold text-primary shadow-lg">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="lg:w-[56%] p-7 sm:p-9 lg:p-12">
                      <div className="flex items-start gap-4 mb-5">
                        <div className={`w-14 h-14 rounded-full ${program.bgColor} flex items-center justify-center shrink-0`}>
                          <program.icon className={`h-6 w-6 ${program.iconColor}`} />
                        </div>
                        <div>
                          <h2 className="font-serif text-2xl lg:text-3xl font-bold leading-tight text-white" data-testid={`text-program-title-${i}`}>{program.title}</h2>
                          <p className="text-sm text-white/70 mt-0.5">{program.subtitle}</p>
                        </div>
                      </div>

                      <p className="text-white/85 leading-relaxed">{program.desc}</p>

                      <div className="flex flex-wrap gap-2 mt-6">
                        {program.highlights.map((h, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center gap-1.5 rounded-full bg-background/60 backdrop-blur border border-border/50 px-3.5 py-1.5 text-xs font-medium text-foreground/80"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {h}
                          </span>
                        ))}
                      </div>

                      <div className="mt-7">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">Led By</h4>
                        <PeopleRow people={program.people} cardIndex={i} />
                      </div>

                      {(program.links || program.link) && (
                        <div className="flex flex-wrap items-center gap-3 mt-7">
                          {program.link && (
                            <Button asChild size="lg" className="rounded-full gap-1.5">
                              <Link href={program.link} data-testid={`button-visit-${i}`}>
                                Visit Hub
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          {program.links?.map((l) => (
                            <Button asChild key={l.url} size="lg" variant="outline" className="rounded-full gap-1.5 bg-background/50 backdrop-blur">
                              <a
                                href={l.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid={`link-program-ext-${i}-${l.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                              >
                                {l.label}
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          ))}
                        </div>
                      )}

                      {campaign ? <CampaignMeter campaign={campaign} /> : null}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24 bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-16 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeIn}>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-5">Support Our Programs</h2>
            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-9">
              Your contribution helps us expand our research, education, and community initiatives.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="secondary" size="lg" className="rounded-full gap-2">
                <Link href="/donate">
                  <Heart className="h-4 w-4" />
                  Donate Now
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full gap-2 text-primary-foreground border-primary-foreground/30 bg-transparent">
                <Link href="/contact">
                  Get Involved
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
