import type { Feather } from "@expo/vector-icons";

/**
 * Static editorial content mirrored from the Humanity + AI website
 * (programs, learning hub, donation copy). Dynamic content (updates,
 * events) comes from the production API instead — see lib/api.ts.
 */

type FeatherIcon = keyof typeof Feather.glyphMap;

export interface ProgramPerson {
  name: string;
  role: string;
  photo: number;
}

export interface ProgramLink {
  label: string;
  url: string;
}

export interface Program {
  icon: FeatherIcon;
  image: number;
  title: string;
  subtitle: string;
  desc: string;
  highlights: string[];
  people: ProgramPerson[];
  links?: ProgramLink[];
  tint: string;
}

const people = {
  danielle: {
    name: "Danielle A. Franklin",
    photo: require("@/assets/images/people/danielle.png") as number,
  },
  jofiah: {
    name: "Jofiah Jose Prakash",
    photo: require("@/assets/images/people/jofiah.png") as number,
  },
  william: {
    name: "William Kreitzer",
    photo: require("@/assets/images/people/william.png") as number,
  },
  nirmal: {
    name: "Nirmal Jingar",
    photo: require("@/assets/images/people/nirmal.jpg") as number,
  },
  mike: {
    name: "Mike Klyce",
    photo: require("@/assets/images/people/mike.png") as number,
  },
  david: {
    name: "David Wood",
    photo: require("@/assets/images/people/david.jpg") as number,
  },
};

export const programs: Program[] = [
  {
    icon: "radio",
    image: require("@/assets/images/programs/initiative-rosie.png") as number,
    title: "Project ROSIE",
    subtitle: "Research On Species Intelligence and Empathy",
    desc: "Our flagship research initiative integrating AI, frequency analysis, and behavioral science to pioneer interspecies communication. Commercialized through founder Danielle A. Franklin's Doolittle Corporation, ROSIE powers TalkingDOG — a multi-sensor wearable harness that streams a dog's physiological and behavioral signals into the ROSIE engine and its 40-state Canine Emotional Resonance (CER) taxonomy, translating them into plain, first-person language in real time. Hardware-agnostic by design, ROSIE licenses as a platform to any wearable, robot, or telehealth product — reaching across the tree of life to give a voice to beings who cannot speak for themselves.",
    highlights: [
      "TalkingDOG multi-sensor wearable harness",
      "ROSIE engine & 40-state CER taxonomy",
      "Real-time signal-to-language translation",
      "Hardware-agnostic SaaS / API platform",
    ],
    people: [{ ...people.danielle, role: "Founder & Principal Investigator" }],
    links: [
      { label: "ROSIE × TalkingDOG", url: "https://rosie-talkingdog-doolittlecorp.replit.app" },
      { label: "Doolittle Corporation", url: "https://doolittlecorp.replit.app" },
    ],
    tint: "#34d399",
  },
  {
    icon: "book-open",
    image: require("@/assets/images/programs/initiative-canine-mind.png") as number,
    title: "A Science of the Canine Mind",
    subtitle: "Book Series by Danielle A. Franklin",
    desc: "A groundbreaking two-volume book series by founder Danielle A. Franklin uniting data, empathy, and science to begin true communication with animals. Supported by Project ROSIE, these works bridge AI research with practical applications in understanding canine cognition and emotion — laying the scientific foundation behind the CER taxonomy and the broader interspecies mission.",
    highlights: [
      "Vol. 1: Foundations for Communication",
      "Vol. 2: The CERT — Canine Emotional Resonance Techniques",
      "Grounded in Project ROSIE research",
      "Practical communication techniques",
    ],
    people: [{ ...people.danielle, role: "Author & Founder" }],
    tint: "#f59e0b",
  },
  {
    icon: "message-circle",
    image: require("@/assets/images/programs/initiative-inclusicare.png") as number,
    title: "InclusiCare & InclusiGear",
    subtitle: "AI for Nonverbal & Neurodivergent Communication",
    desc: "AI built to speak for those who can't always speak for themselves — and to capture their needs for the future. Founded by board member William Kreitzer, InclusiCare provides personalized, evidence-based autism therapy, education, and life-skills support, while InclusiGear's CARLA AI lets families capture what matters about a child's care — triggers, routines, what calms them, what doesn't — and hand it off to any caregiver in 60 seconds. Born from lived experience, both are built with and for the neurodivergent community, ensuring AI is designed for the people it serves, not simply deployed at them.",
    highlights: [
      "Capture the needs of nonverbal individuals",
      "CARLA AI caregiver hand-off in 60 seconds",
      "Evidence-based autism therapy & education",
      "Designed with and for neurodivergent families",
    ],
    people: [
      { ...people.william, role: "Founder, InclusiCare & InclusiGear" },
      { ...people.danielle, role: "Founder & Executive Director" },
    ],
    links: [
      { label: "InclusiCare", url: "https://inclusicare.org" },
      { label: "InclusiGear", url: "https://inclusigear.com" },
    ],
    tint: "#38bdf8",
  },
  {
    icon: "users",
    image: require("@/assets/images/programs/initiative-tlc.png") as number,
    title: "Tech Leadership Community",
    subtitle: "Mentoring the Next Generation",
    desc: "A thriving membership network for emerging and established tech leaders. Members gain one-on-one career and business strategy directly from our board members and community directors — seasoned operators across defense, enterprise AI, governance, finance, and go-to-market — alongside mentorship, peer connection, and leadership resources. TLC turns hard-won experience into practical guidance, helping the next generation lead with clarity, courage, and ethics in the AI era.",
    highlights: [
      "Membership network & community",
      "1:1 career & business strategy",
      "Guidance from board & community directors",
      "Leadership workshops & peer connection",
    ],
    people: [{ ...people.danielle, role: "Founder & Executive Director" }],
    tint: "#60a5fa",
  },
  {
    icon: "shield",
    image: require("@/assets/images/programs/initiative-ethics.png") as number,
    title: "AI Ethics & Governance",
    subtitle: "Frameworks for Responsible AI",
    desc: "Developing and advocating comprehensive ethical frameworks that guide how AI is built, governed, and deployed. Led by AI Ethics & Governance Director Jofiah Jose Prakash with AI & Emerging Technology strategist Nirmal Jingar, the program pairs enterprise architecture and production-scale governance with principled policy work. The board's aim is to build a platform for speaking on responsible AI — through conferences, panels, publications, and public education — so the standards shaping our future are set in the open.",
    highlights: [
      "Responsible AI frameworks & standards",
      "A platform for thought leadership & speaking",
      "Policy advocacy & industry partnerships",
      "Public education on AI governance",
    ],
    people: [
      { ...people.jofiah, role: "Director, AI Ethics & Governance" },
      { ...people.nirmal, role: "AI & Emerging Tech Strategy" },
      { ...people.danielle, role: "Founder & Executive Director" },
    ],
    tint: "#a78bfa",
  },
  {
    icon: "user-check",
    image: require("@/assets/images/programs/initiative-humans-in-model.png") as number,
    title: "Humans in the Model",
    subtitle: "Keeping People at the Center of AI",
    desc: "An initiative championing human-centered AI — ensuring the most capable, trustworthy systems learn from the full depth and diversity of real human expertise. Led by Chief Legal & AI Governance Officer Mike Klyce (Founder & CEO of EnscribeAI and founder of the nonprofit Artist in the Model), the program advances rights-clear, human-authored training data, full data lineage, and transparent provenance — keeping verified humans as the ground-truth anchor, oracle, and control signal for AI rather than letting models drift toward closed synthetic self-reference.",
    highlights: [
      "Rights-clear, human-authored training data",
      "Provenance, lineage & transparency standards",
      "Human-in-the-loop as ground-truth signal",
      "Reducing bias & synthetic contamination",
    ],
    people: [
      { ...people.mike, role: "Chief Legal & AI Governance Officer" },
      { ...people.danielle, role: "Founder & Executive Director" },
    ],
    tint: "#fb7185",
  },
  {
    icon: "globe",
    image: require("@/assets/images/programs/initiative-literacy.png") as number,
    title: "Community AI Literacy",
    subtitle: "Education for Everyone",
    desc: "Making AI accessible and understandable for everyone through workshops, seminars, and online resources. Curriculum and hands-on learning are shaped with AI architecture guidance from Jofiah Jose Prakash and strategic partnerships led by David Wood — ensuring the communities too often left out of the AI conversation have a seat at the table. We believe AI literacy is essential for informed participation in an increasingly digital society.",
    highlights: [
      "Free community workshops",
      "Hands-on, beginner-friendly curriculum",
      "Online learning resources",
      "Digital inclusion initiatives",
    ],
    people: [
      { ...people.jofiah, role: "AI Architecture & Curriculum" },
      { ...people.david, role: "Strategic Partnerships" },
      { ...people.danielle, role: "Founder & Executive Director" },
    ],
    tint: "#f472b6",
  },
  {
    icon: "layers",
    image: require("@/assets/images/programs/initiative-training-hub.png") as number,
    title: "AI Training Hub",
    subtitle: "Free Learning for All Levels",
    desc: "A comprehensive training resource center featuring curated free courses, tutorials, and hands-on projects for AI and machine learning. Guided by Jofiah Jose Prakash — whose beginner-to-advanced AI & ML course library anchors the hub — learners move from fundamentals to advanced research topics with verified video content and an open-source tools directory.",
    highlights: [
      "Curated beginner-to-advanced courses",
      "Verified video learning paths",
      "Open-source AI tools directory",
      "Hands-on project tutorials",
    ],
    people: [
      { ...people.jofiah, role: "Courses & Curriculum Lead" },
      { ...people.danielle, role: "Founder & Executive Director" },
    ],
    links: [{ label: "Visit the AI Training Hub", url: "https://humanityplusai.org/training" }],
    tint: "#22d3ee",
  },
  {
    icon: "heart",
    image: require("@/assets/images/programs/initiative-animal-welfare.png") as number,
    title: "Animal Welfare Advocacy",
    subtitle: "Supporting SOS Galgos & Beyond",
    desc: "Active support for international animal welfare, anchored by our partnership with SOS Galgos — a 501(c)(3) nonprofit (Spain & USA) rescuing, rehabilitating, and rehoming Spain's abandoned galgos (greyhounds), tens of thousands of whom are killed each year as hunting waste. Having given new lives to more than 3,000 galgos, SOS Galgos pairs rescue and adoption with legislative reform and humane education. Our advocacy connects technology with compassion — using AI tools to support rescue operations and animal-welfare research.",
    highlights: [
      "SOS Galgos partnership (Spain & USA)",
      "3,000+ galgos rescued & rehomed",
      "Legislative reform & humane education",
      "AI-assisted rescue & welfare research",
    ],
    people: [{ ...people.danielle, role: "Founder & Executive Director" }],
    links: [{ label: "SOS Galgos", url: "https://www.sosgalgos.org/en/home" }],
    tint: "#f87171",
  },
];

export interface LearningPhase {
  title: string;
  icon: FeatherIcon;
  tint: string;
  description: string;
  modules: { title: string; url: string }[];
}

export const learningPhases: LearningPhase[] = [
  {
    title: "Curiosity",
    icon: "sun",
    tint: "#38bdf8",
    description:
      "Your organization is curious about AI, but has not taken any tangible steps towards planning or implementation.",
    modules: [
      { title: "AI 101", url: "https://learn.mcgovern.org/AI-101-16b70021ed8c80a18a2ed4dd7f7668c7" },
      { title: "Social Responsibility", url: "https://learn.mcgovern.org/Social-Responsibility-16b70021ed8c80bcbedce413440dd803" },
      { title: "Organizational Readiness", url: "https://learn.mcgovern.org/Organizational-Readiness-16b70021ed8c800a9d72fad7ac743135" },
    ],
  },
  {
    title: "Exploration",
    icon: "compass",
    tint: "#f59e0b",
    description:
      "Your organization has aspirations to implement AI and is actively exploring how to make it a reality.",
    modules: [
      { title: "Problem Definition", url: "https://learn.mcgovern.org/Problem-Definition-10e70021ed8c805eb0bee9c97b93749d" },
      { title: "Build vs. Buy", url: "https://learn.mcgovern.org/Build-Vs-Buy-16b70021ed8c80a5aa10f3d27358bccb" },
      { title: "Data Readiness", url: "https://learn.mcgovern.org/Data-Readiness-16b70021ed8c80a394d1f53281734132" },
      { title: "AI Project Planning", url: "https://learn.mcgovern.org/AI-Project-Planning-16b70021ed8c800e875be3a0b82c6ecf" },
      { title: "Funding AI Innovation", url: "https://learn.mcgovern.org/Funding-AI-Innovation-1c070021ed8c8046ac8ce288c30515ae" },
    ],
  },
  {
    title: "Adoption",
    icon: "send",
    tint: "#a78bfa",
    description:
      "Your organization has adopted AI and is testing, evaluating, or refining an AI-based solution.",
    modules: [
      { title: "Data Governance", url: "https://learn.mcgovern.org/Data-Governance-27d70021ed8c8088bf35fb83b7742ba1" },
      { title: "AI Model Development", url: "https://learn.mcgovern.org/AI-Model-Development-27d70021ed8c80f3a2c0db2d7f5572db" },
      { title: "Product Development", url: "https://learn.mcgovern.org/Product-Development-27d70021ed8c807bacf1e43e58a9156f" },
      { title: "AI Strategy", url: "https://learn.mcgovern.org/AI-Strategy-27d70021ed8c801f9533e21d69b830fe" },
    ],
  },
  {
    title: "Impact",
    icon: "trending-up",
    tint: "#34d399",
    description:
      "Your organization has a working solution and is looking to start scaling up and/or optimizing for greater impact.",
    modules: [
      { title: "Evolution", url: "https://learn.mcgovern.org/Evolution-27d70021ed8c80228d8bf62072abe970" },
      { title: "Scaling", url: "https://learn.mcgovern.org/Scaling-27d70021ed8c806c8c85e12f7558f23a" },
      { title: "Strengthening the Ecosystem", url: "https://learn.mcgovern.org/Strengthening-the-Ecosystem-27d70021ed8c803c8dcffd09ac994559" },
      { title: "Direct + Indirect Effects", url: "https://learn.mcgovern.org/Direct-Indirect-Effects-27d70021ed8c80289784e7225cf4b022" },
    ],
  },
];

export interface ImpactArea {
  icon: FeatherIcon;
  title: string;
  desc: string;
}

export const impactAreas: ImpactArea[] = [
  { icon: "shield", title: "AI Ethics Research", desc: "Fund research into responsible AI frameworks and governance." },
  { icon: "book-open", title: "Education Programs", desc: "Support AI literacy workshops and community education." },
  { icon: "users", title: "Community Building", desc: "Help us expand our mentorship and networking programs." },
  { icon: "heart", title: "Animal Welfare", desc: "Contribute to Project ROSIE and interspecies research." },
];

export interface MembershipTier {
  name: string;
  tagline: string;
  perks: string[];
  featured: boolean;
}

/**
 * Membership levels are recurring donations managed entirely on the
 * website. Prices are intentionally NOT shown in-app (App Store
 * guideline 3.1.1 — no digital-subscription pricing next to external
 * purchase links).
 */
export const membershipTiers: MembershipTier[] = [
  {
    name: "Supporter",
    tagline: "Stay close to the work and keep learning alongside our community.",
    perks: ["Exclusive webinars", "Podcast recordings", "AI resources"],
    featured: false,
  },
  {
    name: "Professional",
    tagline: "Grow your network and your toolkit with hands-on member resources.",
    perks: ["Networking events", "AI toolkits", "Certification discounts"],
    featured: true,
  },
  {
    name: "Executive",
    tagline: "A seat at the table with the leaders shaping responsible AI.",
    perks: ["Leadership roundtables", "Private discussions", "Speaker access"],
    featured: false,
  },
];

export const mission = {
  kicker: "Nonprofit · Aligning AI with Humanity",
  masthead: "Humanity + AI",
  headline: "Where Humanity Meets",
  headlineAccent: "Artificial Intelligence.",
  body: "We're a nonprofit on a mission to keep the most powerful technology of our time deeply human — through ethical AI, open education, and a community that puts people first, always.",
  orgBrief1:
    "Founded in August 2024 by Danielle A. Franklin, a distinguished engineer and technologist with a celebrated career in U.S. defense and aerospace sectors, Humanity + AI, Inc. is a nonprofit dedicated to ensuring that artificial intelligence serves humanity.",
  orgBrief2:
    "Recognized by Marquis Who's Who for excellence in technology, defense, and nonprofit services, our organization brings deep technical expertise to the critical conversation about AI's role in society.",
};

export const pillars: { icon: FeatherIcon; title: string; desc: string }[] = [
  { icon: "shield", title: "Ethical AI", desc: "Frameworks and governance that keep AI accountable to people." },
  { icon: "book-open", title: "Open Education", desc: "Free AI literacy and training resources for every level." },
  { icon: "users", title: "Community First", desc: "Mentorship and networks that put people at the center." },
  { icon: "activity", title: "Research & Innovation", desc: "From Project ROSIE to human-centered data standards." },
];
