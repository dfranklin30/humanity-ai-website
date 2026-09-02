import { Link, useLocation } from "wouter";
import { PageMeta } from "@/components/page-meta";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Heart,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  UserPlus,
  Shield,
  GraduationCap,
  Microscope,
  Users,
  BookOpen,
  Brain,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { SiLinkedin, SiSlack } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import type { BlogPost, Event } from "@workspace/db";
import daniellePhoto from "@assets/image_1775903656206.png";
import jofiaPhoto from "@assets/image_1775903668936.png";
import williamPhoto from "@assets/william_portrait_opt.webp";
import davidWoodPhoto from "@assets/David_Wood212_-_edit_may_2026_1779893283704.jpg";
import vasuPhoto from "@assets/headshot_Vasu_AI_Advertisting_1779900210920.jpeg";
import vinaPhoto from "@assets/image_1780429062430.png";
import williamZhuPhoto from "@assets/william_zhu_portrait_opt.webp";
import alexisPhoto from "@assets/alexis_portrait_opt.webp";
import teamCoverPhoto from "@assets/team_cover_opt.webp";
import { AmbientBackground } from "@/components/ambient-bg";
import { AINewsTicker, ArxivFeed } from "@/components/ai-news";
import { VoicesShowcase } from "@/components/voices-showcase";
import { SlackCommunity } from "@/components/slack-community";
import { SLACK_INVITE_URL } from "@/lib/community";

const pillars = [
  {
    icon: Shield,
    title: "AI Ethics & Governance",
    desc: "Establishing frameworks for responsible AI development and deployment that prioritize human values and dignity.",
  },
  {
    icon: GraduationCap,
    title: "Education & Mentorship",
    desc: "Empowering the next generation of tech leaders with knowledge, skills, and ethical foundations for AI innovation.",
  },
  {
    icon: Microscope,
    title: "Research & Innovation",
    desc: "Pioneering research in interspecies communication, neuromorphic computing, and human-centered AI applications.",
  },
  {
    icon: Users,
    title: "Community Building",
    desc: "Creating inclusive spaces where technologists, researchers, and community members collaborate on AI for good.",
  },
];

const stats = [
  { value: "Est. 2024", label: "Founded" },
  { value: "7+", label: "Active Programs" },
  { value: "Global", label: "Community Reach" },
  { value: "100%", label: "Mission Driven" },
];

const board: Array<{
  name: string;
  title: string;
  seat: string;
  slug: string;
  photo: string;
  highlight: string;
  bio: string;
  isNew?: boolean;
}> = [
  {
    name: "Danielle A. Franklin",
    title: "Founder & Board Chair",
    seat: "Seat 1",
    slug: "danielle-franklin",
    photo: daniellePhoto,
    highlight: "20+ Yrs Defense & AI",
    bio: "Defense tech executive & AI innovator. Chief Architect of SDA's $1.8B+ space architecture. Former NVIDIA DoD AI strategist. WOSB defense contractor.",
  },
  {
    name: "Jofiah Jose Prakash",
    title: "AI Ethics & Governance Director",
    seat: "Seat 2",
    slug: "jofia-jose-prakash",
    photo: jofiaPhoto,
    highlight: "4 AI Patents",
    bio: "Enterprise AI Architect at American Chemical Society. AI Ethics Chair at the American Council for Ethical AI. 15+ years in enterprise AI systems.",
  },
  {
    name: "William Kreitzer",
    title: "Finance & Fundraising Strategist",
    seat: "Seat 3",
    slug: "william-kreitzer",
    photo: williamPhoto,
    highlight: "InclusiCare & InclusiGear Founder",
    bio: "Senior Manufacturing Engineer at Anduril Industries. Founder of InclusiCare & InclusiGear — AI-powered platforms for neurodivergent families. Parent of five and community advocate.",
  },
  {
    name: "David Wood",
    title: "Strategic Partnerships & Human-Centered AI",
    seat: "Seat 6",
    slug: "david-wood",
    photo: davidWoodPhoto,
    highlight: "USMC Veteran · Gladwood Founder",
    bio: "Strategic coach, USMC veteran, and Founding Partner of Gladwood LLC. Senior Advisor at Neuroscale and Senior Board Advisor at the National Artificial Intelligence Association. 40+ years bridging federal technology, executive leadership, and human-centered AI.",
  },
  {
    name: "Vasu Raj Jain",
    title: "Chief of AI in Advertising & Media",
    seat: "Seat 7",
    slug: "vasu-raj-jain",
    photo: vasuPhoto,
    highlight: "Amazon Ads · Forbes Tech Council",
    bio: "Senior SDE at Amazon Ads leading large-scale ad serving infrastructure generating billions in annual revenue across Prime Video, live sports, and DOOH. Forbes Technology Council member, IAB Tech Lab contributor, builder of agentic AI on MCP servers and RAG.",
  },
  {
    name: "Vina Torossian",
    title: "Director, Human Authenticity, Leadership, Consciousness & AI, and Board Treasurer",
    seat: "Seat 8",
    slug: "vina-torossian",
    photo: vinaPhoto,
    highlight: "Northern Bank VP · TEDx Speaker",
    bio: "VP & Cash Management Relationship Leader at Northern Bank with 20+ years in global transaction banking, treasury strategy, and trade finance — stewarding a $200M+ portfolio. Founder of leadership consultancy Karaka, TEDx speaker, and international keynote presenter fluent in English, Armenian, and French.",
  },
  {
    name: "William Zhu",
    title: "Board Director, Applied AI & Community Strategy",
    seat: "Seat 9",
    slug: "william-zhu",
    photo: williamZhuPhoto,
    highlight: "Choice Hotels · AI Discussion Club DC",
    bio: "Senior Data Scientist & Applied AI Engineer at Choice Hotels International, shipping ML and AI products across thousands of properties. Founding organizer of Washington, DC's AI Discussion Club (900+ builders) and a 2026 Technical.ly RealLIST Connector. M.A. Computational Social Science, University of Chicago.",
    isNew: true,
  },
  {
    name: "Alexis Ramsey-Tobienne, PhD",
    title: "Director, AI Literacy & Academic Integrity",
    seat: "Seat 10",
    slug: "alexis-ramsey-tobienne",
    photo: alexisPhoto,
    highlight: "Eckerd College · Assistant Dean for AI",
    bio: "Assistant Dean for Artificial Intelligence and Learning Integrity at Eckerd College, advancing critical AI literacy and the ethical integration of AI in liberal arts education. Chair of the Academic Honor Council and of the Southeastern Region Consortia for the International Center for Academic Integrity. PhD in Rhetoric and Composition, Purdue University.",
    isNew: true,
  },
];

const learningHighlights = [
  { icon: BookOpen, label: "12+ Free Courses", sub: "YouTube verified" },
  { icon: Brain, label: "3 Learning Paths", sub: "Beginner to Advanced" },
  { icon: Lightbulb, label: "8+ Open Source Tools", sub: "Industry standard" },
  { icon: Users, label: "All Skill Levels", sub: "Everyone welcome" },
];

function BoardRow({ member, index }: { member: (typeof board)[number]; index: number }) {
  const [, setLocation] = useLocation();
  const navigate = () => setLocation(`/about/board/${member.slug}`);
  return (
    <div
      className="flex gap-6 group cursor-pointer items-start"
      data-testid={`card-home-board-${index}`}
      onClick={navigate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate();
        }
      }}
      role="link"
      tabIndex={0}
    >
      <div className="w-24 h-32 shrink-0 bg-muted overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-500">
        <img
          src={member.photo}
          alt={member.name}
          className="w-full h-full object-cover object-top mix-blend-multiply"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />
        {member.isNew && (
          <div
            className="absolute top-1 left-1 bg-primary text-primary-foreground text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5"
            data-testid={`badge-home-board-new-${member.slug}`}
          >
            Newly Appointed
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            {member.seat}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
            {member.highlight}
          </span>
        </div>
        <h3 className="font-serif text-xl font-bold leading-tight group-hover:text-primary transition-colors">
          {member.name}
        </h3>
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/60 mb-2">
          {member.title}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 font-serif">
          {member.bio}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: posts } = useQuery<BlogPost[]>({ queryKey: ["/api/blog"] });
  const { data: events } = useQuery<Event[]>({ queryKey: ["/api/events"] });

  const upcomingEvents = (events || [])
    .filter(
      (e) =>
        !e.recordingUrl &&
        new Date(e.date + "T00:00:00").getTime() >=
          new Date(new Date().toDateString()).getTime(),
    )
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  const featuredEvent = upcomingEvents[0];
  const secondaryEvent = upcomingEvents[1];
  const featuredEventDate = featuredEvent
    ? new Date(featuredEvent.date + "T00:00:00")
    : null;
  const secondaryEventDate = secondaryEvent
    ? new Date(secondaryEvent.date + "T00:00:00")
    : null;

  const featuredPosts = (posts || [])
    .filter((p) => (p.contentType || "article") === "article")
    .slice(0, 3);

  return (
    <div className="font-sans bg-transparent text-foreground min-h-screen selection:bg-primary/20 selection:text-primary">
      <PageMeta
        canonical="/"
        description="Humanity + AI, Inc. is a nonprofit bridging humanity and artificial intelligence through ethical AI development, education, and community empowerment. Founded by Danielle A. Franklin."
      />
      {/* Flashing Membership Beacon */}
      <Link href="/donate" data-testid="link-membership-bar">
        <div className="group relative w-full bg-[#081c14]/70 backdrop-blur-sm border-b border-[#f0c674]/30 overflow-hidden cursor-pointer">
          <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-center">
            <span className="animate-membership-flash inline-flex items-center gap-2 text-[#f0c674] font-bold uppercase tracking-[0.16em] text-[11px] sm:text-sm">
              <Sparkles className="h-4 w-4" />
              Become a Member — Plans from $10/month
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0c674] text-[#081c14] font-bold text-xs px-4 py-1 animate-membership-glow group-hover:scale-105 transition-transform">
              Join Now <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>

      {/* Rolling AI News highlights — arXiv + AI news + markets, clickable to source */}
      <AINewsTicker />

      {/* Dark AI Hero — deep field where humanity meets AI */}
      <section
        className="relative isolate overflow-hidden bg-[#0a2117]/55 backdrop-blur-[2px] text-[#FAF9F6]"
        data-testid="section-hero"
      >
        {/* Topographic dotted line-art */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <svg
            className="animate-hero-rings absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 opacity-[0.22]"
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(110,231,183,0.12),transparent_60%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#0a2117]" />
        </div>

        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-16 md:py-24 flex flex-col items-center text-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 -z-10 mx-auto h-44 w-44 md:h-56 md:w-56 rounded-full bg-[#6ee7b7]/25 blur-3xl" />
            <img
              src="/humanity-ai-logo.png"
              alt="Humanity + AI animated logo"
              className="animate-logo-float relative mx-auto h-44 w-44 md:h-56 md:w-56 object-contain drop-shadow-[0_0_45px_rgba(110,231,183,0.35)]"
              data-testid="img-animated-logo"
            />
          </div>
          <div className="text-[11px] sm:text-xs font-semibold tracking-[0.28em] uppercase text-[#6ee7b7] flex items-center gap-2 mb-7">
            <span className="h-px w-6 bg-[#6ee7b7]/50" />
            Nonprofit · Aligning AI with Humanity
            <span className="h-px w-6 bg-[#6ee7b7]/50" />
          </div>

          <h1
            className="font-serif text-5xl md:text-7xl lg:text-[7.5rem] leading-[0.95] tracking-tight font-bold text-[#FAF9F6]"
            data-testid="text-masthead"
          >
            Humanity + AI
          </h1>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[10px] sm:text-xs font-medium text-[#FAF9F6]/55 uppercase tracking-[0.2em] border-t border-b border-[#FAF9F6]/15 py-2.5">
            <span>Issue 01</span>
            <span className="hidden sm:inline text-[#6ee7b7]/70">◦</span>
            <span>Where Humanity Meets Artificial Intelligence</span>
            <span className="hidden sm:inline text-[#6ee7b7]/70">◦</span>
            <span>Est. 2024</span>
          </div>

          <h2
            className="font-serif text-3xl md:text-5xl font-bold leading-[1.08] tracking-tight mt-10 max-w-3xl"
            data-testid="text-hero-title"
          >
            Where Humanity Meets{" "}
            <span className="italic font-light text-[#6ee7b7]">
              Artificial Intelligence.
            </span>
          </h2>
          <p
            className="text-base md:text-lg text-[#FAF9F6]/70 leading-relaxed max-w-2xl mt-6 font-serif"
            data-testid="text-hero-subtitle"
          >
            We're a nonprofit on a mission to keep the most powerful technology
            of our time deeply human — through ethical AI, open education, and a
            community that puts people first, always.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 mt-10">
            <Button
              asChild
              size="lg"
              className="animate-membership-glow rounded-full px-8 h-12 bg-[#f0c674] text-[#081c14] hover:bg-[#f0c674] hover:text-[#081c14] font-bold tracking-wide text-base"
              data-testid="button-hero-membership"
            >
              <Link href="/donate">
                <Sparkles className="h-4 w-4 mr-2" />
                Become a Member · From $10/mo
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full px-8 h-12 bg-transparent border-[#FAF9F6]/40 text-[#FAF9F6] hover:bg-[#FAF9F6] hover:text-[#0a2117] font-serif italic tracking-wide"
              data-testid="button-hero-ai"
            >
              <Link href="/ai-hub">
                Explore the AI Hub
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <VoicesShowcase />

      {/* Latest AI research & models streamed from arXiv */}
      <ArxivFeed />

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 relative isolate bg-[#FAF9F6] dark:bg-[#0a2117] rounded-t-[2.5rem] shadow-[0_-24px_70px_rgba(3,2,12,0.55)]">
        <AmbientBackground className="-z-10" />
        {/* Top Fold: Cover Feature + Organization Brief */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch border-b border-foreground/10 py-16">
          {/* Cover Feature */}
          <div className="lg:col-span-7 relative group overflow-hidden">
            <div className="aspect-[4/3] bg-foreground relative">
              <img
                src={teamCoverPhoto}
                alt="The Humanity + AI team"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                data-testid="img-cover-feature"
                fetchPriority="high"
                decoding="async"
              />
            </div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-3 font-semibold">
              Cover Feature — The Team
            </div>
          </div>

          {/* Organization Brief */}
          <div className="lg:col-span-5 flex">
            <div className="bg-primary/5 p-6 md:p-8 border border-primary/10 w-full">
              <h3
                className="font-serif text-2xl font-bold mb-4 text-primary"
                data-testid="text-about-section"
              >
                The Organization
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                Founded in August 2024 by Danielle A. Franklin, a distinguished
                engineer and technologist with a celebrated career in U.S.
                defense and aerospace sectors, Humanity + AI, Inc. is a
                nonprofit dedicated to ensuring that artificial intelligence
                serves humanity.
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                Recognized by Marquis Who's Who for excellence in technology,
                defense, and nonprofit services, our organization brings deep
                technical expertise to the critical conversation about AI's
                role in society.
              </p>
              <Link href="/about">
                <Button
                  variant="ghost"
                  className="rounded-none font-serif italic p-0 h-auto text-primary hover:bg-transparent hover:text-primary/80"
                  data-testid="button-read-more-about"
                >
                  Read More
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b border-foreground/10">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div
                className="font-serif text-4xl md:text-5xl font-bold text-primary mb-2 tracking-tighter"
                data-testid={`text-stat-${i}`}
              >
                {stat.value}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Live Slack Community */}
        <SlackCommunity className="border-b border-foreground/10" />

        {/* Middle Section: Featured Event + Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 py-16 border-b border-foreground/10">
          {/* Left: Featured Event */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-6">
              <Calendar className="h-4 w-4" />
              {featuredEvent ? "Upcoming Gatherings" : "Our Events"}
            </div>

            {featuredEvent && featuredEventDate ? (
              <div
                className="border-2 border-primary relative bg-white dark:bg-card shadow-lg"
                data-testid="card-featured-event"
              >
                <div className="absolute -top-3 left-6 z-10 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 shadow-md">
                  ★ Next Up · Featured
                </div>
                {featuredEvent.imageUrl && (
                  <div className="border-b border-foreground/10 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10">
                    <img
                      src={featuredEvent.imageUrl}
                      alt={featuredEvent.title}
                      className="w-full h-80 md:h-[28rem] object-contain p-4"
                      data-testid="img-featured-event"
                    />
                  </div>
                )}
                <div className="p-6 md:p-8 relative">
                <div className="absolute top-0 right-0 p-4 border-l border-b border-foreground/10 bg-[#FAF9F6] dark:bg-background text-center min-w-[80px]">
                  <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">
                    {featuredEventDate.toLocaleString("en-US", {
                      month: "short",
                    })}
                  </span>
                  <span className="block font-serif text-3xl font-bold text-foreground leading-none mt-1">
                    {featuredEventDate.getDate()}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-xs px-3 py-1 border border-foreground/20 font-serif italic text-muted-foreground">
                    {featuredEvent.type}
                  </span>
                </div>
                <h3
                  className="font-serif text-2xl md:text-3xl font-bold leading-tight mb-4 pr-20"
                  data-testid="text-featured-event-title"
                >
                  {featuredEvent.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6 font-serif">
                  {featuredEvent.description}
                </p>

                <div className="space-y-3 text-sm text-foreground/80 mb-8 border-t border-foreground/10 pt-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    {featuredEventDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary" />
                    {featuredEvent.time}
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    {featuredEvent.location}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/events" className="flex-1">
                    <Button
                      className="rounded-none font-serif italic w-full"
                      data-testid="button-featured-event-signup"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Sign Up
                    </Button>
                  </Link>
                  {featuredEvent.link && (
                    <a
                      href={featuredEvent.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="rounded-none font-serif italic w-full border-foreground/20"
                        data-testid="button-featured-event-join"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Link
                      </Button>
                    </a>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-foreground/10">
                  <Link href="/events">
                    <Button
                      variant="ghost"
                      className="rounded-none font-serif italic p-0 h-auto text-primary hover:bg-transparent hover:text-primary/80"
                      data-testid="link-all-events"
                    >
                      See all events
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                </div>
              </div>
            ) : (
              <div className="border border-foreground/10 p-6 md:p-8 bg-white dark:bg-card">
                <h3 className="font-serif text-2xl font-bold leading-tight mb-4">
                  More gatherings on the way
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6 font-serif">
                  Our next live event is being scheduled. Browse the full
                  calendar or check back soon for the announcement.
                </p>
                <Link href="/events">
                  <Button
                    className="rounded-none font-serif italic"
                    data-testid="link-all-events"
                  >
                    See all events
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}

            {secondaryEvent && secondaryEventDate && (
              <div className="mt-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="h-px flex-1 bg-foreground/15" />
                  Also Coming Up
                  <span className="h-px flex-1 bg-foreground/15" />
                </div>
                <div
                  className="border border-foreground/10 bg-card hover-elevate flex gap-4 p-4"
                  data-testid="card-secondary-event"
                >
                  {secondaryEvent.imageUrl && (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 overflow-hidden bg-gradient-to-br from-primary/5 to-accent/10 flex items-center justify-center">
                      <img
                        src={secondaryEvent.imageUrl}
                        alt={secondaryEvent.title}
                        className="w-full h-full object-contain p-1"
                        data-testid="img-secondary-event"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary font-bold mb-1">
                        <Calendar className="h-3 w-3" />
                        {secondaryEventDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground normal-case tracking-normal font-normal truncate">
                          {secondaryEvent.time}
                        </span>
                      </div>
                      <h4
                        className="font-serif text-base font-bold leading-snug line-clamp-2 mb-1"
                        data-testid="text-secondary-event-title"
                      >
                        {secondaryEvent.title}
                      </h4>
                    </div>
                    <Link href="/events">
                      <button
                        className="text-[11px] text-primary hover:underline font-bold uppercase tracking-widest inline-flex items-center gap-1 mt-1"
                        data-testid="link-secondary-event"
                      >
                        View Details <ArrowRight className="h-3 w-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right: Pillars */}
          <div className="lg:col-span-7">
            <div className="mb-8">
              <h2
                className="font-serif text-3xl font-bold"
                data-testid="text-pillars-title"
              >
                The Four Pillars
              </h2>
              <p className="text-muted-foreground mt-2 font-serif italic">
                Foundational principles guiding our work in responsible AI.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-10">
              {pillars.map((pillar, i) => (
                <div key={i} className="group cursor-default">
                  <div className="mb-4 flex items-center justify-between border-b border-foreground/10 pb-4">
                    <div className="flex items-center gap-3">
                      <pillar.icon className="h-5 w-5 text-primary" />
                      <h3 className="font-serif text-lg font-bold">
                        {pillar.title}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">
                      0{i + 1}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed font-serif group-hover:text-foreground transition-colors">
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Welcome new board member: William Zhu */}
        <div
          className="py-12 border-b border-foreground/10"
          data-testid="block-welcome-william-zhu"
        >
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 md:gap-12 items-center">
            <div className="relative aspect-[3/4] overflow-hidden bg-muted w-full max-w-[300px] mx-auto md:mx-0">
              <img
                src={williamZhuPhoto}
                alt="William Zhu"
                className="w-full h-full object-cover object-top grayscale hover:grayscale-0 transition-all duration-500"
                data-testid="img-welcome-william-zhu"
              />
              <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 shadow-md">
                Newly Appointed
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Welcome to the Board · Seat 9
              </div>
              <h3
                className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-3"
                data-testid="text-welcome-william-zhu-name"
              >
                Welcome,{" "}
                <span className="italic font-light text-primary">William Zhu</span>
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-wide text-foreground/60 mb-4">
                Board Director, Applied AI & Community Strategy
              </p>
              <p className="text-base text-muted-foreground leading-relaxed font-serif mb-6 max-w-2xl">
                We're delighted to welcome William Zhu to the Humanity + AI, Inc.
                Board of Directors. An applied AI builder, data scientist, and
                community organizer, William is a Senior Data Scientist & Applied
                AI Engineer at Choice Hotels International and the founding
                organizer of Washington, DC's AI Discussion Club — convening 900+
                AI builders and innovators. He holds an M.A. in Computational
                Social Science from the University of Chicago and was named a 2026
                RealLIST Connector by Technical.ly.
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link href="/about/board/william-zhu">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none font-serif italic border-foreground/20"
                    data-testid="link-welcome-william-zhu-profile"
                  >
                    Read William's Profile
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </Link>
                <a
                  href="https://williamzhu.ai/stories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-serif italic font-medium text-primary hover:text-primary/80"
                  data-testid="link-welcome-william-zhu-stories"
                >
                  Stories <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://williamzhu.ai/projects"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-serif italic font-medium text-primary hover:text-primary/80"
                  data-testid="link-welcome-william-zhu-projects"
                >
                  Projects <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://williamzhu.ai/books"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-serif italic font-medium text-primary hover:text-primary/80"
                  data-testid="link-welcome-william-zhu-books"
                >
                  Books <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://www.linkedin.com/in/william-wei-zhu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-serif italic font-medium text-primary hover:text-primary/80"
                  data-testid="link-welcome-william-zhu-linkedin"
                >
                  LinkedIn <SiLinkedin className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Board members feature: David Wood + Vasu Raj Jain + Vina Torossian */}
        <div
          className="py-12 border-b border-foreground/10"
          data-testid="block-board-announcement"
        >
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-4 flex items-center justify-center gap-2">
              <Sparkles className="h-3 w-3" />
              Board of Directors
              <Sparkles className="h-3 w-3" />
            </div>
            <h3
              className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-3"
              data-testid="text-board-announcement-name"
            >
              Meet{" "}
              <span className="italic font-light text-primary">David Wood</span>,{" "}
              <span className="italic font-light text-primary">Vasu Raj Jain</span>{" "}
              &{" "}
              <span className="italic font-light text-primary">Vina Torossian</span>
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed font-serif">
              Members of the Humanity + AI, Inc. Board of Directors — bringing
              decades of leadership across federal technology, human-centered AI,
              planetary-scale infrastructure, the future of advertising and media,
              and global banking, treasury strategy, and conscious leadership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
            {/* David Wood */}
            <article
              className="grid grid-cols-[140px_1fr] gap-5 items-start"
              data-testid="block-announcement-david-wood"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src={davidWoodPhoto}
                  alt="David Wood"
                  className="w-full h-full object-cover object-top grayscale hover:grayscale-0 transition-all duration-500"
                  data-testid="img-board-announcement-david-wood"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                  Seat 6
                </div>
                <h4 className="font-serif text-xl font-bold leading-tight mb-1">
                  David Wood
                </h4>
                <p className="text-[11px] font-bold uppercase tracking-wide text-foreground/60 mb-3">
                  Strategic Partnerships & Human-Centered AI
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed font-serif mb-4">
                  Strategic coach, trusted advisor, and USMC veteran with 40+
                  years across startups, executive leadership, and federal
                  technology sales. Founding Partner of Gladwood LLC, Senior
                  Advisor at Neuroscale, and Senior Board Advisor at the
                  National Artificial Intelligence Association.
                </p>
                <Link href="/about/board/david-wood">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none font-serif italic border-foreground/20"
                    data-testid="link-board-announcement-profile"
                  >
                    Read David's Profile
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </Link>
              </div>
            </article>

            {/* Vasu Raj Jain */}
            <article
              className="grid grid-cols-[140px_1fr] gap-5 items-start"
              data-testid="block-announcement-vasu"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src={vasuPhoto}
                  alt="Vasu Raj Jain"
                  className="w-full h-full object-cover object-top grayscale hover:grayscale-0 transition-all duration-500"
                  data-testid="img-board-announcement-vasu"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                  Seat 7
                </div>
                <h4 className="font-serif text-xl font-bold leading-tight mb-1">
                  Vasu Raj Jain
                </h4>
                <p className="text-[11px] font-bold uppercase tracking-wide text-foreground/60 mb-3">
                  Chief of AI in Advertising & Media
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed font-serif mb-4">
                  Senior Software Development Engineer at Amazon Ads leading
                  large-scale ad serving infrastructure generating billions in
                  annual revenue across Prime Video, live sports, and DOOH.
                  Forbes Technology Council member and IAB Tech Lab contributor
                  building agentic AI on MCP servers and RAG.
                </p>

                <div className="mb-4 border-t border-foreground/10 pt-3">
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                    Now Contributing to Our Blog
                  </div>
                  <ul className="space-y-1.5" data-testid="list-vasu-contributions">
                    <li>
                      <Link
                        href="/blog/vasu-hybrid-multitenant-stateful-aws"
                        className="text-xs font-serif italic text-foreground/80 hover:text-primary leading-snug flex items-start gap-1.5"
                        data-testid="link-vasu-post-hybrid"
                      >
                        <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
                        Building Hybrid Multi-tenant Architecture for Stateful Services on AWS
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/blog/vasu-agentic-revolution-real-time-bidding"
                        className="text-xs font-serif italic text-foreground/80 hover:text-primary leading-snug flex items-start gap-1.5"
                        data-testid="link-vasu-post-agentic-rtb"
                      >
                        <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
                        The Agentic Revolution in Real-Time Bidding
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/blog/vasu-invisible-backbone-global-ad-infrastructure"
                        className="text-xs font-serif italic text-foreground/80 hover:text-primary leading-snug flex items-start gap-1.5"
                        data-testid="link-vasu-post-backbone"
                      >
                        <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
                        Engineering the Invisible Backbone of Global Ad Infrastructure
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/blog/vasu-developer-diagnostic-tools-distributed-systems"
                        className="text-xs font-serif italic text-foreground/80 hover:text-primary leading-snug flex items-start gap-1.5"
                        data-testid="link-vasu-post-diagnostic"
                      >
                        <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
                        Why Developer Diagnostic Tools Should Be Designed Like Distributed Systems
                      </Link>
                    </li>
                  </ul>
                </div>

                <Link href="/about/board/vasu-raj-jain">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none font-serif italic border-foreground/20"
                    data-testid="link-board-announcement-profile-vasu"
                  >
                    Read Vasu's Profile
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </Link>
              </div>
            </article>

            {/* Vina Torossian */}
            <article
              className="grid grid-cols-[140px_1fr] gap-5 items-start"
              data-testid="block-announcement-vina"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src={vinaPhoto}
                  alt="Vina Torossian"
                  className="w-full h-full object-cover object-top grayscale hover:grayscale-0 transition-all duration-500"
                  data-testid="img-board-announcement-vina"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                  Seat 8
                </div>
                <h4 className="font-serif text-xl font-bold leading-tight mb-1">
                  Vina Torossian
                </h4>
                <p className="text-[11px] font-bold uppercase tracking-wide text-foreground/60 mb-3">
                  Director, Human Authenticity, Leadership, Consciousness & AI, and Board Treasurer
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed font-serif mb-4">
                  VP & Cash Management Relationship Leader at Northern Bank with
                  20+ years in global transaction banking, treasury strategy, and
                  trade finance — stewarding a $200M+ portfolio. Founder of
                  leadership consultancy Karaka, TEDx speaker, and international
                  keynote presenter fluent in English, Armenian, and French.
                </p>
                <Link href="/about/board/vina-torossian">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none font-serif italic border-foreground/20"
                    data-testid="link-board-announcement-profile-vina"
                  >
                    Read Vina's Profile
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </Link>
              </div>
            </article>
          </div>
        </div>

        {/* Board & Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 py-16 border-b border-foreground/10 items-start">
          {/* Left: The Board */}
          <div className="lg:col-span-5">
            <div className="mb-8 flex items-baseline justify-between border-b border-foreground/10 pb-4">
              <h2
                className="font-serif text-3xl font-bold"
                data-testid="text-meet-board"
              >
                The Board
              </h2>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Leadership
              </span>
            </div>

            <div className="space-y-8">
              {board.map((member, i) => (
                <BoardRow key={member.slug} member={member} index={i} />
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-foreground/10">
              <Link href="/about">
                <Button
                  variant="ghost"
                  className="rounded-none font-serif italic p-0 h-auto text-primary hover:bg-transparent hover:text-primary/80"
                  data-testid="button-full-board"
                >
                  Meet the full board
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Latest Insights */}
          <div className="lg:col-span-7 lg:border-l lg:border-foreground/10 lg:pl-12">
            <div className="mb-8 flex items-baseline justify-between border-b border-foreground/10 pb-4">
              <h2
                className="font-serif text-3xl font-bold"
                data-testid="text-latest-insights"
              >
                Latest Insights
              </h2>
              <Link href="/blog">
                <Button
                  variant="ghost"
                  className="text-xs uppercase tracking-widest font-semibold hover:bg-transparent hover:text-primary p-0 h-auto rounded-none"
                  data-testid="link-view-all-blog"
                >
                  Read All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>

            {featuredPosts.length > 0 ? (
              <div className="grid gap-0">
                {featuredPosts.map((post, i) => {
                  const formattedDate = new Date(
                    post.publishedAt || post.createdAt,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <article
                        className="group cursor-pointer relative border-t border-foreground/15 pt-6 pb-8"
                        data-testid={`card-post-${post.slug}`}
                      >
                        <div className="absolute -top-px left-0 w-12 h-0.5 bg-primary transition-all duration-300 group-hover:w-32" />
                        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 items-baseline">
                          <span className="font-serif text-3xl md:text-4xl font-bold text-primary/30 tabular-nums leading-none group-hover:text-primary/70 transition-colors">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.2em] font-bold">
                            <span className="text-primary">{post.category}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="text-muted-foreground">
                              {post.author}
                            </span>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="text-muted-foreground/70 normal-case tracking-normal font-medium font-serif italic">
                              {formattedDate}
                            </span>
                          </div>
                          <span aria-hidden className="hidden md:block" />
                          <h3 className="font-serif text-2xl md:text-[1.7rem] font-bold leading-[1.15] tracking-tight group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <span aria-hidden className="hidden md:block" />
                          <p className="text-muted-foreground font-serif text-[15px] leading-relaxed line-clamp-2">
                            {post.excerpt}
                          </p>
                          <span aria-hidden className="hidden md:block" />
                          <div className="text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary flex items-center mt-1">
                            Read Article{" "}
                            <ArrowRight className="h-3 w-3 ml-2 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-0">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="border-t border-foreground/15 pt-6 pb-8 space-y-3"
                  >
                    <div className="h-3 w-32 bg-muted/60 rounded" />
                    <div className="h-6 w-full bg-muted/60 rounded" />
                    <div className="h-4 w-4/5 bg-muted/40 rounded" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RAG Architecture Series — Board Reading Series */}
        <div className="py-16 border-b border-foreground/10" data-testid="section-rag-series">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-6">
            <BookOpen className="h-4 w-4" />
            From Our Board · Reading Series
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5">
              <h2 className="font-serif text-4xl md:text-5xl font-bold leading-[1.05] mb-4">
                RAG Architecture <span className="italic text-primary">Series</span>
              </h2>
              <p className="font-serif text-lg text-muted-foreground italic mb-6">
                From Core Loop to Agentic Systems
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Six patterns that define production RAG architecture — what each one does, what it costs, and when it earns its complexity. A field guide from Humanity + AI board director and Enterprise AI Architect Jofiah Jose Prakash.
              </p>
              <div className="flex items-center gap-6 text-sm text-foreground/70 mb-8 border-t border-foreground/10 pt-6">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> 6 Parts
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> 45 min read
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://www.thejofia.com/rag-architecture-series" target="_blank" rel="noopener noreferrer">
                  <Button className="rounded-none font-serif italic w-full sm:w-auto" data-testid="button-rag-explore-home">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Explore the Full Series
                  </Button>
                </a>
                <Link href="/training">
                  <Button variant="outline" className="rounded-none font-serif italic w-full sm:w-auto border-foreground/20" data-testid="button-rag-learning-hub">
                    In the Learning Hub
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="grid sm:grid-cols-2 gap-px bg-foreground/10 border border-foreground/10">
                {[
                  { n: 1, title: "The Core RAG Loop", mins: "10 min", url: "https://www.thejofia.com/rag-series-1-core-rag-loop" },
                  { n: 2, title: "Naive RAG", mins: "6 min", url: "https://www.thejofia.com/rag-series-2-naive-rag" },
                  { n: 3, title: "Advanced Retrieval", mins: "7 min", url: "https://www.thejofia.com/rag-series-3-advanced-rag" },
                  { n: 4, title: "Routing & Graph RAG", mins: "7 min", url: "https://www.thejofia.com/rag-series-4-modular-graph-rag" },
                  { n: 5, title: "Agentic RAG", mins: "7 min", url: "https://www.thejofia.com/rag-series-5-agentic-rag" },
                  { n: 6, title: "The Decision Guide", mins: "8 min", url: "https://www.thejofia.com/rag-series-6-decision-guide" },
                ].map((part) => (
                  <a
                    key={part.n}
                    href={part.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-[#FAF9F6] dark:bg-[#0a2117] p-5 hover:bg-white dark:hover:bg-[#0c2a1c] transition-colors"
                    data-testid={`link-rag-home-part-${part.n}`}
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-serif text-2xl font-bold text-primary">
                        {String(part.n).padStart(2, "0")}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {part.mins}
                      </span>
                    </div>
                    <h3 className="font-serif text-base font-bold leading-snug group-hover:text-primary transition-colors">
                      {part.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      Read Part {part.n}
                      <ArrowRight className="h-3 w-3" />
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Learning Hub & Community Closing */}
        <div className="py-16">
          <div className="bg-foreground text-background p-8 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 relative z-10">
              <div>
                <div className="text-xs uppercase tracking-widest font-bold text-primary mb-4 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Free Training
                </div>
                <h2
                  className="font-serif text-4xl md:text-5xl font-bold mb-6 text-background"
                  data-testid="text-training-promo"
                >
                  Learn AI at <br />
                  Your Own Pace
                </h2>
                <p className="text-background/70 leading-relaxed mb-8 font-serif text-lg max-w-md">
                  Our Learning Hub features the PJMF AI Journey framework,
                  curated free courses from top educators, open source tools,
                  and resources for every stage. No paywalls, no gatekeeping.
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-8 mb-10">
                  {learningHighlights.map((item, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="flex items-center gap-3 mb-2">
                        <item.icon className="h-5 w-5 text-primary" />
                        <span className="font-serif font-bold text-background">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-xs text-background/50 uppercase tracking-widest pl-8">
                        {item.sub}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/training">
                  <Button
                    size="lg"
                    className="rounded-none font-serif italic px-8 bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-explore-training"
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Explore Learning Hub
                  </Button>
                </Link>
              </div>

              <div className="lg:border-l lg:border-background/10 lg:pl-16 flex flex-col justify-center">
                <h2 className="font-serif text-4xl font-bold mb-6 text-background">
                  Join Our Community
                </h2>
                <p className="text-background/70 mb-10 font-serif text-lg leading-relaxed">
                  Whether you're a tech leader, researcher, student, or simply
                  passionate about responsible AI, there's a place for you in
                  our community.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/ai-hub">
                    <Button
                      size="lg"
                      className="rounded-none font-serif italic px-8 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                      data-testid="button-explore-ai-hub"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Explore AI Hub
                    </Button>
                  </Link>
                  <a
                    href={SLACK_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-none font-serif italic px-8 border-background/20 text-background hover:bg-background hover:text-foreground w-full sm:w-auto"
                      data-testid="button-join-slack"
                    >
                      <SiSlack className="h-4 w-4 mr-2" />
                      Join on Slack
                    </Button>
                  </a>
                  <Link href="/contact">
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-none font-serif italic px-8 border-background/20 text-background hover:bg-background hover:text-foreground w-full sm:w-auto"
                      data-testid="button-get-in-touch"
                    >
                      Get In Touch
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
