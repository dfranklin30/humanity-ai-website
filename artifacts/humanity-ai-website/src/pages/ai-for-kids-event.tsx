import { PageMeta } from "@/components/page-meta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Mail,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Users,
  Heart,
  Landmark,
  Cpu,
  BookOpen,
  HandHeart,
  School,
  Megaphone,
} from "lucide-react";

const EVENT_DATE = "Saturday, October 17, 2026";
const EVENT_TIME = "10:00 AM – 2:00 PM";
const EVENT_CITY = "Washington, DC";
const RSVP_EMAIL = "danielle@humanityplusai.org";

const RSVP_MAILTO = `mailto:${RSVP_EMAIL}?subject=${encodeURIComponent(
  "RSVP — Be Ready for AI (Oct 17, Washington, DC)",
)}&body=${encodeURIComponent(
  "Hi Humanity + AI team,\n\nI'd like to RSVP for Be Ready for AI on Saturday, October 17, 2026 in Washington, DC.\n\nName:\nNumber of adults:\nNumber of kids (and ages/grades):\nSchool or organization (optional):\n\nThank you!",
)}`;

const VOLUNTEER_MAILTO = `mailto:${RSVP_EMAIL}?subject=${encodeURIComponent(
  "Volunteer / Partner — Be Ready for AI (Oct 17, Washington, DC)",
)}&body=${encodeURIComponent(
  "Hi Humanity + AI team,\n\nI'd like to help with Be Ready for AI on October 17, 2026.\n\nName:\nOrganization (optional):\nHow I'd like to help (volunteer, sponsor, partner, speak):\n\nThank you!",
)}`;

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const facts = [
  { value: "Grades 3–12", label: "Age-based tracks for every kid" },
  { value: "Free", label: "Open community event" },
  { value: "Fall 2026", label: "In the heart of the nation's capital" },
  { value: "All Welcome", label: "Families, educators & neighbors" },
];

const tracks = [
  {
    icon: Sparkles,
    title: "Elementary · Grades 3–5",
    desc: "Playful, hands-on AI discovery stations — kids meet AI through games, art, and storytelling, and learn that technology is something they can shape, not just consume.",
  },
  {
    icon: Cpu,
    title: "Middle School · Grades 6–8",
    desc: "Build-something workshops: train a simple model, talk to an AI safely, and see how the tools behind the headlines actually work.",
  },
  {
    icon: GraduationCap,
    title: "High School · Grades 9–12",
    desc: "Real talk about AI and the future of work — careers, college pathways, portfolio projects, and how to stand out in an AI-shaped economy.",
  },
  {
    icon: Users,
    title: "Parents & Guardians",
    desc: "A plain-language session on what AI means for your child's education, safety online, and the questions to ask your school this year.",
  },
  {
    icon: BookOpen,
    title: "Educators & Mentors",
    desc: "Classroom-ready AI literacy resources and a chance to connect with other DC-area teachers, librarians, and youth leaders.",
  },
  {
    icon: Megaphone,
    title: "Community Panel",
    desc: "DC voices — technologists, educators, and parents — on closing the AI readiness gap in our own neighborhoods, from every ward.",
  },
];

const audiences = [
  {
    icon: Heart,
    title: "Families",
    desc: "Bring the kids. Every activity is designed to be done together — no tech background needed.",
  },
  {
    icon: School,
    title: "Schools & Educators",
    desc: "Teachers, counselors, librarians, and administrators from across DC, Maryland, and Virginia.",
  },
  {
    icon: Landmark,
    title: "Community Leaders",
    desc: "Faith leaders, civic organizations, rec centers, and neighborhood groups who reach our youth every day.",
  },
  {
    icon: HandHeart,
    title: "Mentors & Volunteers",
    desc: "Technologists and students who want to give a Saturday to the next generation.",
  },
];

const photos = [
  {
    src: "https://images.unsplash.com/photo-1520525003249-2b9cdda513bc?auto=format&fit=crop&w=1200&q=80",
    alt: "The United States Capitol in Washington, DC",
    caption: "The nation's capital",
  },
  {
    src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    alt: "Kids learning together in a classroom",
    caption: "Our kids, ready to learn",
  },
  {
    src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
    alt: "Community members joining hands",
    caption: "One community, one mission",
  },
];

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  const wrapper = el.closest("[data-img-wrapper]") as HTMLElement | null;
  if (wrapper) wrapper.style.display = "none";
  else el.style.display = "none";
}

export default function AiForKidsEvent() {
  return (
    <div className="min-h-screen">
      <PageMeta
        title="Be Ready for AI — AI for Kids | Washington, DC"
        description="Be Ready for AI is a free AI for Kids community event in Washington, DC on October 17, 2026 — closing the AI education gap among our youth with hands-on workshops for grades 3–12, parents, and educators. Hosted by Humanity + AI, Inc."
        canonical="/aiforkids/bereadyforai"
      />

      {/* ============ HERO ============ */}
      <header className="relative isolate overflow-hidden bg-[#0a2117] text-[#FAF9F6]">
        {/* Background photo of the Capitol */}
        <div className="absolute inset-0 -z-20">
          <img
            src="https://images.unsplash.com/photo-1520525003249-2b9cdda513bc?auto=format&fit=crop&w=1920&q=80"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-25"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a2117]/70 via-[#0a2117]/80 to-[#0a2117]" />
        </div>

        {/* Topographic dotted rings — matches the site masthead */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <svg
            className="absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 opacity-[0.15]"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <circle
                key={i}
                cx="500"
                cy="500"
                r={60 + i * 30}
                fill="none"
                stroke="#6ee7b7"
                strokeWidth="1.1"
                strokeDasharray="2 9"
              />
            ))}
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-emerald-300 mb-5">
              AI for Kids · Washington, DC
            </p>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Be Ready for AI
            </h1>
            <p className="text-lg md:text-xl text-[#FAF9F6]/85 max-w-2xl mx-auto mb-8">
              A free community event to close the AI education gap among our
              youth — bringing kids, families, and educators from across the
              DC area together in the nation's capital.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm md:text-base text-[#FAF9F6]/90 mb-10">
              <span className="inline-flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-300" />
                {EVENT_DATE}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-300" />
                {EVENT_TIME}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-300" />
                {EVENT_CITY} · venue shared with RSVP
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-emerald-400 text-[#0a2117] hover:bg-emerald-300 font-bold text-base px-8"
                asChild
                data-testid="button-rsvp-hero"
              >
                <a href={RSVP_MAILTO}>
                  <Mail className="w-5 h-5 mr-2" />
                  RSVP — Join Us
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#FAF9F6]/30 text-[#FAF9F6] hover:bg-[#FAF9F6]/10 text-base px-8"
                asChild
                data-testid="button-programs-hero"
              >
                <Link href="/programs">
                  Explore Our Programs
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ============ QUICK FACTS ============ */}
      <section className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {facts.map((f, i) => (
            <motion.div key={f.label} {...fadeIn} transition={{ delay: i * 0.08, duration: 0.4 }}>
              <p className="font-serif text-2xl md:text-3xl font-bold text-primary">
                {f.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{f.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ WHY ============ */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <motion.div {...fadeIn}>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Why this event
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
            AI is rewriting the future of work. Our kids deserve a head start —
            not a hurdle.
          </h2>
          <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            <p>
              Artificial intelligence is already reshaping the careers our
              children will grow into — but access to AI education isn't
              reaching every neighborhood equally. In the shadow of the
              Capitol, too many young people in our own community are being
              left out of the conversation that will define their generation.
            </p>
            <p>
              <span className="text-foreground font-semibold">
                Be Ready for AI
              </span>{" "}
              is a day for the whole community — a hands-on, no-jargon,
              family-friendly festival of learning where kids discover that AI
              is something they can understand, question, and build. Parents
              leave with answers. Educators leave with resources. Kids leave
              believing the future belongs to them too.
            </p>
            <p>
              Hosted by Humanity + AI, Inc., a nonprofit dedicated to ethical
              AI development, education, and community building — because
              being ready for AI shouldn't depend on your zip code.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ============ PHOTO STRIP ============ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16 md:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {photos.map((p, i) => (
            <motion.figure
              key={p.src}
              {...fadeIn}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              data-img-wrapper
              className="relative rounded-lg overflow-hidden group"
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                onError={hideOnError}
                className="w-full h-64 md:h-72 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-[#FAF9F6] text-sm font-medium px-4 pt-10 pb-3">
                {p.caption}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* ============ WHAT TO EXPECT ============ */}
      <section className="bg-card/50 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
          <motion.div {...fadeIn} className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
              What to expect
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              Something for every age — and every grown-up too
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((t, i) => (
              <motion.div key={t.title} {...fadeIn} transition={{ delay: i * 0.07, duration: 0.4 }}>
                <Card className="p-6 h-full hover-elevate">
                  <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <t.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t.desc}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHO SHOULD COME ============ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <motion.div {...fadeIn} className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Calling all of DC
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold">
            This is a whole-community effort
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((a, i) => (
            <motion.div key={a.title} {...fadeIn} transition={{ delay: i * 0.07, duration: 0.4 }}>
              <div className="text-center px-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <a.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{a.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {a.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="relative isolate overflow-hidden bg-[#0a2117] text-[#FAF9F6]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(110,231,183,0.12),transparent_60%)]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-20 text-center">
          <motion.div {...fadeIn}>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
              Join us this fall in the nation's capital
            </h2>
            <p className="text-lg text-[#FAF9F6]/80 max-w-2xl mx-auto mb-3">
              {EVENT_DATE} · {EVENT_TIME} · {EVENT_CITY}
            </p>
            <p className="text-base text-[#FAF9F6]/70 max-w-2xl mx-auto mb-10">
              Seats are free but space is limited. RSVP today — and if you'd
              like to volunteer, sponsor, or bring your school or organization,
              we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-emerald-400 text-[#0a2117] hover:bg-emerald-300 font-bold text-base px-8"
                asChild
                data-testid="button-rsvp-footer"
              >
                <a href={RSVP_MAILTO}>
                  <Mail className="w-5 h-5 mr-2" />
                  RSVP — Be Ready for AI
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#FAF9F6]/30 text-[#FAF9F6] hover:bg-[#FAF9F6]/10 text-base px-8"
                asChild
                data-testid="button-volunteer-footer"
              >
                <a href={VOLUNTEER_MAILTO}>
                  <HandHeart className="w-5 h-5 mr-2" />
                  Volunteer or Partner
                </a>
              </Button>
            </div>
            <p className="text-sm text-[#FAF9F6]/50 mt-8">
              An AI for Kids initiative by{" "}
              <Link href="/" className="underline underline-offset-4 hover:text-[#FAF9F6]">
                Humanity + AI, Inc.
              </Link>{" "}
              · humanityplusai.org/aiforkids/bereadyforai
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
