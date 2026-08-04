/**
 * AI Builders Academy — single source of truth for all program content.
 *
 * EVERYTHING the public site says about the program lives in this file.
 * To change pricing, dates, curriculum, instructors or partner terms,
 * edit here — no page components need to change.
 *
 * Items marked NEEDS_REVIEW are placeholders that must be confirmed by
 * Humanity + AI before the page they appear on is promoted publicly.
 */

export const ORG = {
  name: "Humanity + AI, Inc.",
  shortName: "Humanity + AI",
  mission: "Making Artificial Intelligence Accessible to Everyone.",
  status: "501(c)(3) nonprofit", // NEEDS_REVIEW: confirm exact filing status/EIN before publishing
  site: "https://humanityplusai.org",
  email: "danielle@humanityplusai.org",
  phone: "808-652-2090",
  region: "Tampa Bay, Florida",
} as const;

export const PROGRAM = {
  name: "AI Builders Academy",
  tagline: "Build the Future with AI",
  subheadline:
    "A six-week hands-on Artificial Intelligence Academy where students create real AI projects, learn responsible AI, and build the skills they'll use for the rest of their lives.",
  weeks: 6,
  minutesPerSession: 90,
  sessionsPerWeek: 1,
  maxStudents: 20,
  format: "In person, after school — hosted at partner schools and community sites",
} as const;

export type GradeBand = {
  id: string;
  label: string;
  ages: string;
  blurb: string;
};

export const GRADE_BANDS: GradeBand[] = [
  {
    id: "3-5",
    label: "Grades 3–5",
    ages: "Ages 8–11",
    blurb:
      "Playful, guided discovery. Students work on instructor-operated accounts, explore how AI sees and creates, and build a first AI helper with plenty of support.",
  },
  {
    id: "6-8",
    label: "Grades 6–8",
    ages: "Ages 11–14",
    blurb:
      "The sweet spot for building. Students design their own projects, learn real prompt engineering, and start thinking hard about bias, sourcing and safety.",
  },
  {
    id: "9-12",
    label: "Grades 9–12",
    ages: "Ages 14–18",
    blurb:
      "Portfolio and career focused. Students ship something they can show a college or an employer, and connect it to real AI work happening in the Tampa Bay region.",
  },
];

export type Week = {
  n: number;
  title: string;
  summary: string;
  topics: string[];
  build: string;
};

export const CURRICULUM: Week[] = [
  {
    n: 1,
    title: "Introduction to AI",
    summary:
      "What artificial intelligence actually is, how a model like ChatGPT produces an answer, and the ground rules we'll use all six weeks.",
    topics: [
      "What is AI, and what is it not",
      "How large language models work, in plain language",
      "AI ethics: fairness, bias and who gets left out",
      "Staying safe: privacy, personal information and never trusting blindly",
      "Prompt engineering fundamentals",
    ],
    build: "Students build their first AI assistant.",
  },
  {
    n: 2,
    title: "AI Creativity",
    summary:
      "Images, stories and design — plus the harder question of what it means to make something with a machine.",
    topics: [
      "AI image generation",
      "Storytelling and character building",
      "Comic creation",
      "Graphic design with AI tools",
      "Copyright, credit and attribution",
      "Responsible use of generated work",
    ],
    build: "Students create an illustrated story or comic they wrote themselves.",
  },
  {
    n: 3,
    title: "Video, Voice, Music and Digital Media",
    summary:
      "Turning ideas into media — and learning to recognise synthetic media when they see it.",
    topics: [
      "AI video tools",
      "Voice and narration",
      "Music generation",
      "Podcast creation",
      "Digital media literacy and spotting deepfakes",
    ],
    build: "Students produce their own multimedia project.",
  },
  {
    n: 4,
    title: "Programming with AI",
    summary:
      "Using AI as a coding partner — and understanding enough of the code to stay in charge of it.",
    topics: [
      "Building a website with AI assistance",
      "Making a simple game",
      "Introduction to Python",
      "No-code and low-code AI tools",
      "Debugging: why the AI's first answer is often wrong",
    ],
    build: "Students create an interactive application.",
  },
  {
    n: 5,
    title: "AI in the Real World",
    summary:
      "Where AI already lives outside a browser tab — including a live demonstration of ROSIE and TalkingDOG.",
    topics: [
      "Robotics and sensors",
      "Computer vision",
      "AI in healthcare",
      "AI for animals — a live ROSIE and TalkingDOG demonstration",
      "Autonomous systems",
      "AI careers in the Tampa Bay region",
    ],
    build: "Students connect their project idea to a real-world problem.",
  },
  {
    n: 6,
    title: "Final Showcase",
    summary:
      "Families come in. Students present. This is the part they remember.",
    topics: [
      "Presentation coaching",
      "Student project presentations",
      "Parents and guardians attend",
      "Certificates awarded",
      "Builder awards",
      "Networking with instructors and partners",
    ],
    build: "Students present their portfolio to a real audience.",
  },
];

export const OUTCOMES: { title: string; body: string }[] = [
  { title: "Confidence using AI", body: "Students stop being intimidated by the blank prompt box." },
  { title: "AI ethics literacy", body: "They can explain bias, sourcing and consent in their own words." },
  { title: "Prompt engineering", body: "Structured, iterative prompting — not guesswork." },
  { title: "Portfolio projects", body: "Real artifacts they built and can show to anyone." },
  { title: "Presentation skills", body: "Every student presents at the showcase in Week 6." },
  { title: "Teamwork", body: "Small groups, shared critique, real collaboration." },
  { title: "Critical thinking", body: "Checking an AI's answer instead of accepting it." },
  { title: "Creativity", body: "AI as an instrument, not an autopilot." },
  { title: "Digital literacy", body: "Recognising synthetic media and protecting their own data." },
  { title: "Career awareness", body: "What AI jobs actually look like, and how you get one." },
];

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

export type Tier = {
  id: string;
  name: string;
  emoji?: string;
  /** Price in whole US dollars. null = not yet set; UI shows "Coming soon". */
  price: number | null;
  cadence: string;
  summary: string;
  features: string[];
  recommended?: boolean;
  /** Shown as a small note under the price. */
  note?: string;
};

export const TIERS: Tier[] = [
  {
    id: "explorer",
    name: "Explorer",
    price: null, // NEEDS_REVIEW: Humanity + AI to confirm the Explorer price
    cadence: "for the full 6-week program",
    summary: "The complete academy experience.",
    features: [
      "All six weekly 90-minute sessions",
      "Full AI Builders curriculum",
      "Small class — 20 students maximum",
      "Final showcase presentation",
      "Certificate of completion",
      "Take-home AI safety and prompt guides",
    ],
    note: "Pricing to be announced",
  },
  {
    id: "creator",
    name: "Creator",
    emoji: "⭐",
    price: 399,
    cadence: "for the full 6-week program",
    summary: "Everything in Explorer, plus the portfolio extras.",
    recommended: true,
    features: [
      "Everything in Explorer",
      "AI project portfolio",
      "Personalized instructor feedback",
      "Bonus AI resources",
      "AI Builder badge",
      "Downloadable project files",
      "Priority registration for future programs",
    ],
    note: "Most popular option",
  },
];

export const SCHOLARSHIP = {
  headline: "No student is turned away for cost.",
  body:
    "Humanity + AI exists to make artificial intelligence accessible to everyone — which is only true if the price of a seat never decides who learns. Need-based scholarships cover partial or full tuition, and applying takes about five minutes. Families are never asked to prove hardship with documentation.",
  points: [
    "Full and partial scholarships available for every session",
    "Applications reviewed on a rolling basis",
    "Sponsored seats funded by local businesses and individual donors",
    "School partners can reserve scholarship seats for their own students",
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Heritage — why this program exists and who it serves                */
/* ------------------------------------------------------------------ */

export const HERITAGE = {
  headline: "Where this program comes from",
  lede:
    "AI Builders Academy is not a franchise curriculum bought off a shelf. It grew out of one engineer's work and one organization's mission.",
  paragraphs: [
    "Humanity + AI, Inc. was founded on a single conviction: artificial intelligence is going to reshape every career our children will ever hold, and access to it should not depend on a family's zip code or income. That conviction is the whole mission — making artificial intelligence accessible to everyone — and the academy is what that mission looks like when it is pointed at a nine-year-old.",
    "The program was built by Danielle Franklin, who spent two decades supporting the Department of Defense and worked at NVIDIA as AI moved from research curiosity to national infrastructure. She founded Doolittle Corporation and developed ROSIE, an AI system that reads an animal's health signals and translates them into something a person can act on. Week 5 of the academy is not a slideshow about robotics — students meet ROSIE and TalkingDOG directly, because a child who has watched an AI interpret a living creature understands the field differently than one who has only read about it.",
    "The academy carries the Humanity + AI mark for a reason. Every seat, every scholarship and every school partnership sits inside the nonprofit's work, which means tuition funds the program rather than a shareholder, and sponsors fund students rather than marketing.",
  ],
  communities: {
    headline: "The communities we serve",
    body:
      "The academy is built for the Tampa Bay region first — St. Petersburg, Clearwater, and Pinellas County schools — and is designed to travel from there.",
    groups: [
      {
        title: "Title I and under-resourced schools",
        body: "Schools without an existing STEM budget are the reason the scholarship fund exists. We bring the instructor, the curriculum and the equipment plan.",
      },
      {
        title: "Students underrepresented in tech",
        body: "Girls, students of color, and students who have never been told they belong in a computer lab. Small classes exist so nobody disappears in the back row.",
      },
      {
        title: "Military and veteran families",
        body: "Frequent moves break continuity in enrichment programs. A six-week format finishes inside a single semester.",
      },
      {
        title: "Homeschool co-ops and community sites",
        body: "Libraries, community centers and homeschool groups can host a cohort with the same curriculum and the same instructor support.",
      },
    ],
  },
} as const;

export const FOUNDER = {
  name: "Danielle Franklin",
  role: "Founder, Humanity + AI",
  credentials: [
    "Former NVIDIA",
    "20 years supporting the Department of Defense",
    "Founder, Doolittle Corporation",
    "Developer of ROSIE",
    "AI educator and speaker",
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Schools / partnership                                               */
/* ------------------------------------------------------------------ */

export type PartnershipModel = {
  id: string;
  name: string;
  bestFor: string;
  body: string;
  points: string[];
};

export const PARTNERSHIP_MODELS: PartnershipModel[] = [
  {
    id: "hosted",
    name: "We run it, you host it",
    bestFor: "Best for schools with no STEM staff capacity",
    body:
      "Humanity + AI supplies the instructor, the curriculum, the materials and the showcase. The school supplies a room and a time slot. Families register and pay through this site, so no money moves through the school office.",
    points: [
      "No teacher preparation required",
      "Instructor provided and background-checked",
      "Curriculum, handouts and certificates provided",
      "Registration, payment and waivers handled by Humanity + AI",
      "Scholarship seats available for your students",
    ],
  },
  {
    id: "sponsored",
    name: "Sponsored cohort",
    bestFor: "Best for schools with grant, PTA or Title I funding",
    body:
      "The school, PTA, district grant or a corporate sponsor funds the cohort as a whole and seats are free to families. This is the fastest way to reach students who would never enroll at any price.",
    points: [
      "One invoice, no family-level billing",
      "Every seat free to the student",
      "Sponsor recognition at the Week 6 showcase",
      "Enrollment priority controlled by the school",
    ],
  },
  {
    id: "enrichment",
    name: "After-school enrichment partner",
    bestFor: "Best for schools with an existing enrichment vendor list",
    body:
      "The academy slots into an existing after-school enrichment block alongside your other providers, on your calendar and your registration process where required.",
    points: [
      "Fits a standard 90-minute enrichment block",
      "Six-week term aligns to a single semester",
      "Vendor paperwork and certificates of insurance provided",
      "Can run consecutive terms for multiple grade bands",
    ],
  },
  {
    id: "training",
    name: "Educator training",
    bestFor: "Best for districts building internal capacity",
    body:
      "We train your teachers to run the curriculum themselves, then stay available for support. Suited to districts that want the program to outlast a single vendor relationship.",
    points: [
      "Teacher training workshop",
      "Full curriculum license",
      "Ongoing instructor support",
      "Optional co-taught first cohort",
    ],
  },
];

export const SCHOOL_REQUIREMENTS = {
  headline: "What a host site needs",
  items: [
    { title: "A room", body: "A classroom, media center or lab. A dedicated computer lab is optional." },
    { title: "Devices", body: "One device per student or per pair. Chromebooks are perfectly acceptable — no high-end hardware required." },
    { title: "Internet", body: "Standard school broadband. We provide the list of domains to allow ahead of the first session." },
    { title: "A display", body: "A projector or large screen for demonstrations and the Week 6 showcase." },
    { title: "A 90-minute block", body: "One session per week for six weeks, after school." },
  ],
} as const;

export const COMPLIANCE = {
  headline: "Insurance, safety and compliance",
  items: [
    {
      title: "General liability insurance",
      body:
        "Humanity + AI carries general liability coverage and will name the host school or district as an additional insured on request. A certificate of insurance is issued directly to your business office before the first session.",
      status: "NEEDS_REVIEW", // confirm carrier, limits and additional-insured language before publishing
    },
    {
      title: "Background-checked instructors",
      body:
        "Every instructor and volunteer who works with students completes a criminal background check before the first session, and we complete whatever additional district-specific screening or badging your policy requires.",
      status: "NEEDS_REVIEW",
    },
    {
      title: "Student data and privacy",
      body:
        "We collect the minimum required to run the program: a parent or guardian's contact details, the student's first name and last initial, grade band, and any medical or accommodation note the family chooses to share. Students never create their own accounts on third-party AI tools — younger students work on instructor-operated accounts under supervision. Student data is never sold and never used for advertising.",
    },
    {
      title: "Supervised AI tool use",
      body:
        "Every AI tool used in class is chosen for age appropriateness, run with safety filters enabled, and used with an instructor present. Students are taught from Week 1 never to enter personal information into any AI system.",
    },
    {
      title: "Parental consent",
      body:
        "Enrollment is parent-initiated. Consent to participate, consent to supervised AI tool use, media release and the activity waiver are each agreed separately — never bundled — and a timestamped record is retained.",
    },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

export type Faq = { q: string; a: string; audience: "parents" | "schools" | "both" };

export const FAQS: Faq[] = [
  {
    q: "What ages is the academy for?",
    a: "Grades 3 through 12, taught in three separate bands: grades 3–5, 6–8 and 9–12. Students are grouped with their own age range, and the projects differ accordingly.",
    audience: "both",
  },
  {
    q: "Does my child need programming experience?",
    a: "No. The academy assumes zero prior experience. Week 4 introduces programming with AI assistance, and students who already code are given harder versions of the same project rather than being held back.",
    audience: "parents",
  },
  {
    q: "Does my child need their own computer?",
    a: "No. Devices are provided at the host site. If a family prefers their student to bring a personal laptop, that is fine, but nothing is required at home.",
    audience: "parents",
  },
  {
    q: "Can schools host the academy?",
    a: "Yes — that is the primary way the program runs. Humanity + AI provides the instructor and the full curriculum; the school provides a room and a time slot. No teacher preparation is required.",
    audience: "both",
  },
  {
    q: "Can homeschool students attend?",
    a: "Yes. Homeschool students are welcome in any open cohort, and homeschool co-ops can host a cohort of their own.",
    audience: "parents",
  },
  {
    q: "What software is used?",
    a: "Age-appropriate, mainstream AI tools for text, image, audio and video, plus a browser-based coding environment. Younger students work on instructor-operated accounts rather than creating their own. The exact tool list for each session is shared with families before the program begins.",
    audience: "both",
  },
  {
    q: "What if my child misses a class?",
    a: "We send a catch-up summary and the session materials, and instructors work with the student at the start of the next session so nobody falls behind on their project. The six-week arc is designed to survive one missed week.",
    audience: "parents",
  },
  {
    q: "Is my child's data safe?",
    a: "We collect the minimum needed to run the program and never sell it. Students are taught in Week 1 never to enter personal information into an AI system, and that rule is enforced in every session that follows.",
    audience: "both",
  },
  {
    q: "How much does it cost, and what if we can't afford it?",
    a: "The Creator tier is $399 for the full six-week program. Need-based scholarships cover partial or full tuition and are available for every session — no family is turned away for cost, and no documentation of hardship is required.",
    audience: "parents",
  },
  {
    q: "What does it cost the school?",
    a: "In the hosted model, nothing. Families register and pay through this site, so no money moves through the school office. Sponsored cohorts are funded by a grant, PTA or corporate sponsor and are free to families.",
    audience: "schools",
  },
  {
    q: "How much staff time does this take?",
    a: "Effectively none. We provide the instructor, the curriculum, the materials and the certificates, and we handle registration, payment, waivers and family communication. The school provides a room, a time slot and a point of contact.",
    audience: "schools",
  },
  {
    q: "How many students can participate?",
    a: "Cohorts are capped at 20 students so every student gets instructor attention and presents at the showcase. Schools with more demand can run consecutive terms.",
    audience: "schools",
  },
  {
    q: "Are you insured, and are instructors background-checked?",
    a: "Yes to both. Humanity + AI carries general liability coverage and will name your school or district as an additional insured; a certificate of insurance is issued to your business office before the first session. Every instructor and volunteer completes a criminal background check, plus any district-specific screening your policy requires.",
    audience: "schools",
  },
  {
    q: "What technology does our site need?",
    a: "A room, one device per student or per pair, standard school broadband and a projector or large screen. Chromebooks are fine. A dedicated computer lab is optional.",
    audience: "schools",
  },
];

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export type Session = {
  id: string;
  label: string;
  gradeBandId: string;
  location: string;
  schedule: string;
  status: "open" | "waitlist" | "announced";
};

/**
 * NEEDS_REVIEW: no cohort dates have been confirmed yet.
 * While this array is empty the site shows an honest "dates announced soon"
 * state and enrollment collects interest rather than a specific seat.
 */
export const SESSIONS: Session[] = [];

/* ------------------------------------------------------------------ */
/* Instructors                                                         */
/* ------------------------------------------------------------------ */

export type Instructor = {
  name: string;
  role: string;
  bio: string;
  credentials: string[];
  linkedin?: string;
  photo?: string;
};

/**
 * NEEDS_REVIEW: instructor roster not yet supplied.
 * The founder profile below is drawn from Humanity + AI's own materials.
 * Additional instructors should be added here with real names, real
 * credentials and real photos — the Schools page shows a credential
 * standard rather than invented people while this list is short.
 */
export const INSTRUCTORS: Instructor[] = [
  {
    name: FOUNDER.name,
    role: FOUNDER.role,
    bio: "Danielle spent two decades supporting the Department of Defense and worked at NVIDIA before founding Humanity + AI and Doolittle Corporation. She developed ROSIE, the AI system students meet in Week 5, and teaches the academy's instructor cohort herself.",
    credentials: [...FOUNDER.credentials],
  },
];

export const INSTRUCTOR_STANDARD = [
  "Criminal background check completed before working with students",
  "Direct professional experience with AI systems, not just curriculum delivery",
  "Trained on the full six-week curriculum before leading a cohort",
  "District-specific screening or badging completed on request",
] as const;

/* ------------------------------------------------------------------ */
/* Downloads                                                           */
/* ------------------------------------------------------------------ */

export type Download = {
  id: string;
  title: string;
  description: string;
  audience: "parents" | "schools";
  /** Generated on the fly from program content — no static PDF to maintain. */
  href: string;
  kind: "print" | "file";
};

export const DOWNLOADS: Download[] = [
  {
    id: "school-brochure",
    title: "School Partner Brochure",
    description:
      "One-page overview of the program, partnership models, requirements and compliance — formatted to print or save as a PDF and forward to a principal or district office.",
    audience: "schools",
    href: "/aiforkids/brochure/schools",
    kind: "print",
  },
  {
    id: "curriculum-outline",
    title: "Six-Week Curriculum Outline",
    description:
      "Week-by-week topics, projects and student outcomes, suitable for attaching to a district enrichment proposal.",
    audience: "schools",
    href: "/aiforkids/brochure/curriculum",
    kind: "print",
  },
  {
    id: "parent-guide",
    title: "Parent Guide to AI",
    description:
      "What your child is learning, how we keep them safe, and how to keep the conversation going at home.",
    audience: "parents",
    href: "/aiforkids/brochure/parents",
    kind: "print",
  },
];

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

/**
 * External scheduling link (Calendly, Google Appointment Schedule, etc.).
 * When null, the "Schedule a Meeting" buttons open the on-site meeting
 * request form instead, which emails Humanity + AI directly.
 * NEEDS_REVIEW: paste a scheduling URL here to switch to one-click booking.
 */
export const MEETING_URL: string | null = null;

export const BASE = "/aiforkids";

export const NAV: { href: string; label: string }[] = [
  { href: `${BASE}`, label: "Home" },
  { href: `${BASE}/program`, label: "Program" },
  { href: `${BASE}/curriculum`, label: "Curriculum" },
  { href: `${BASE}/pricing`, label: "Pricing" },
  { href: `${BASE}/parents`, label: "Parents" },
  { href: `${BASE}/schools`, label: "Schools" },
  { href: `${BASE}/scholarships`, label: "Scholarships" },
  { href: `${BASE}/about`, label: "About" },
  { href: `${BASE}/faq`, label: "FAQ" },
  { href: `${BASE}/contact`, label: "Contact" },
];

export function formatPrice(price: number | null): string {
  return price === null ? "Coming soon" : `$${price.toLocaleString("en-US")}`;
}
