import { PageMeta } from "@/components/page-meta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { StructuredData } from "@/components/structured-data";
import {
  ArrowLeft, ArrowRight, Award, BookOpen, ExternalLink, Globe, Briefcase, GraduationCap, Lightbulb, PlayCircle, Mail
} from "lucide-react";
import { SiLinkedin } from "react-icons/si";
import daniellePhoto from "@assets/image_1775903656206.png";
import jofiaPhoto from "@assets/image_1775903668936.png";
import williamPhoto from "@assets/william_portrait_opt.webp";
import nirmalPhoto from "@assets/1profile-pic_1776517679611.jpg";
import williamZhuPhoto from "@assets/william_zhu_portrait_opt.webp";
import mikePhoto from "@assets/mike_portrait_opt.webp";
import davidWoodPhoto from "@assets/David_Wood212_-_edit_may_2026_1779893283704.jpg";
import vasuPhoto from "@assets/headshot_Vasu_AI_Advertisting_1779900210920.jpeg";
import vinaPhoto from "@assets/image_1780429062430.png";

const boardMembers: Record<string, {
  name: string;
  slug: string;
  title: string;
  seat: string;
  seatLabel: string;
  photo: string;
  badgeColor: string;
  linkedin: string;
  shortBio: string;
  fullBio: string[];
  credentials: string[];
  focus: string[];
  links: { label: string; url: string; icon: string }[];
  articleHighlights?: { title: string; source: string; url: string }[];
  videoHighlight?: { title: string; embedId: string; source?: string; description?: string };
  tagline?: string;
  subtitle?: string;
  stats?: { value: string; label: string }[];
  buildingProjects?: { name: string; description: string }[];
  perspectives?: string[];
}> = {
  "danielle-franklin": {
    name: "Danielle A. Franklin",
    slug: "danielle-franklin",
    title: "Founder, Executive Director & Board Chair",
    seat: "Seat 1",
    seatLabel: "Founder & Board Chair",
    photo: daniellePhoto,
    badgeColor: "bg-primary/5 text-emerald-300 border-primary/20",
    linkedin: "https://www.linkedin.com/in/danielle-franklin-53318269/",
    shortBio: "Defense technology executive and AI innovator with 20+ years driving mission-impact across OSD, SDA, U.S. Navy, MDA, and USSF.",
    fullBio: [
      "Danielle A. Franklin is a defense technology executive and AI innovator with 20+ years driving mission-impact across the Office of the Secretary of Defense (OSD), Space Development Agency (SDA), U.S. Navy, Missile Defense Agency (MDA), and U.S. Space Force (USSF).",
      "As Chief Architect of SDA's $1.8B+ Proliferated Warfighter Space Architecture, she designed the technical backbone of next-generation space defense systems. She authored the DoD Digital Engineering Body of Knowledge and served as NVIDIA's DoD AI strategist for MDA, Space Force, and DIU.",
      "Danielle is President of N Systems LLC and Founder of Doolittle Corporation.",
      "She founded Humanity + AI, Inc. to ensure that the transformative power of artificial intelligence serves all of humanity — not just those with access to resources and expertise. Through HAVI, she has launched 6 major initiatives focused on AI ethics, education, and community empowerment.",
      "Danielle holds three degrees from the University of Maryland: M.S. in Cybersecurity Policy, M.S. in IT & Software Engineering, and B.S. in Aerospace Engineering. She is a certified NVIDIA GPU Genius and has been recognized in Marquis Who's Who in 2025 and 2026."
    ],
    credentials: [
      "M.S. Cybersecurity Policy — University of Maryland",
      "M.S. IT & Software Engineering — University of Maryland",
      "B.S. Aerospace Engineering — University of Maryland",
      "NVIDIA GPU Genius Certification",
      "Marquis Who's Who 2025 & 2026"
    ],
    focus: [
      "Strategic Vision & Organizational Leadership",
      "Defense Technology & AI Innovation",
      "Digital Engineering & Space Architecture",
      "Patent Development & Commercialization"
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/danielle-franklin-53318269/", icon: "linkedin" },
      { label: "Medium", url: "https://medium.com/@daniellefranklin808", icon: "medium" }
    ],
  "jofia-jose-prakash": {
    name: "Jofiah Jose Prakash",
    slug: "jofia-jose-prakash",
    title: "AI Ethics & Governance Director",
    seat: "Seat 2",
    seatLabel: "AI Ethics & Governance",
    photo: jofiaPhoto,
    badgeColor: "bg-purple-500/5 text-purple-300 border-purple-500/20",
    linkedin: "https://www.linkedin.com/in/jofiajoseprakash/",
    shortBio: "Enterprise AI Architect with 15+ years of experience in software engineering and machine learning, holding 4 AI patents.",
    fullBio: [
      "Jofiah Jose Prakash is an Enterprise AI Architect with over 15 years of experience in software engineering, machine learning, and AI systems design. She currently leads AI architecture at the American Chemical Society, where she designs and deploys enterprise-scale AI solutions.",
      "Jofia serves as AI Ethics Chair for The American Council for Ethical AI, where she helps shape policy frameworks and governance standards for responsible AI deployment across industries.",
      "She holds 4 AI patents, demonstrating her commitment to innovation at the frontier of artificial intelligence. Her patent portfolio spans natural language processing, intelligent automation, and ethical AI frameworks.",
      "As a board member of Humanity + AI, Jofia brings deep technical expertise combined with a principled approach to AI governance. She ensures that the organization's programs and initiatives align with the highest standards of responsible AI development.",
      "Jofia is an active international conference speaker on topics including Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), and agentic AI systems. She holds an M.S. in Computer Science.",
      "She is the author of the RAG Architecture Series — a six-part deep dive into production retrieval-augmented generation, moving from the core RAG loop through naive and advanced retrieval, routing and graph RAG, and agentic RAG, and closing with a decision guide for choosing the right pattern by evaluation signal rather than architectural hype."
    ],
    credentials: [
      "M.S. Computer Science",
      "4 AI Patents",
      "AI Ethics Chair — American Council for Ethical AI",
      "Enterprise AI Architect — American Chemical Society",
      "International Conference Speaker"
    ],
    focus: [
      "Responsible AI Policy & Federal Alignment",
      "AI Ethics Governance & Standards",
      "Enterprise AI Architecture",
      "Patent Development & Innovation"
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/jofiajoseprakash/", icon: "linkedin" },
      { label: "RAG Architecture Series", url: "https://www.thejofia.com/rag-architecture-series", icon: "external" },
      { label: "AI & ML Courses (Beginner to Advanced)", url: "https://www.thejofia.com/ai-ml-courses-beginner-to-advanced", icon: "external" }
    ],
    articleHighlights: [
      {
        title: "RAG Architecture Series: From Core Loop to Agentic Systems",
        source: "thejofia.com · 6-Part Series · 45 min read",
        url: "https://www.thejofia.com/rag-architecture-series"
      },
      {
        title: "Cache-Aware Agent Architecture: Why Cache Topology Is Becoming a Core Engineering Discipline",
        source: "Humanity + AI Blog · April 19, 2026",
        url: "/blog/jofia-cache-aware-agent-architecture"
      },
      {
        title: "Learn One Framework Deeply: A Developer's Guide to Mastering Agentic AI in 2026",
        source: "Humanity + AI Blog · March 7, 2026",
        url: "/blog/jofia-learn-one-framework-deeply-2026"
      },
      {
        title: "Securing OpenClaw on a VPS with Docker: A Security-First Setup Guide",
        source: "Humanity + AI Blog · February 7, 2026",
        url: "/blog/jofia-secure-openclaw-vps"
      }
    ]
  },
  "william-kreitzer": {
    name: "William Kreitzer",
    slug: "william-kreitzer",
    title: "Finance & Fundraising Strategist",
    seat: "Seat 3",
    seatLabel: "Finance & Fundraising Strategy",
    photo: williamPhoto,
    badgeColor: "bg-emerald-500/5 text-emerald-300 border-emerald-500/20",
    linkedin: "https://www.linkedin.com/in/wkreitzer/",
    shortBio: "Finance & Fundraising Strategist overseeing financial health, grant strategy, donor development, and budget planning for Humanity + AI, Inc.",
    fullBio: [
      "As Finance & Fundraising Strategist for Humanity + AI, Inc., William Kreitzer oversees the organization's financial health, grant strategy, donor development, and budget planning. He leads efforts to secure and steward funding from foundations, federal sources, and philanthropic partners — ensuring the organization has the durable resources it needs to deliver on its mission.",
      "William brings a rare combination of engineering rigor, entrepreneurial drive, and deep community advocacy to the board. With over a decade of experience in advanced manufacturing at organizations including Anduril Industries, GE Aerospace, and ZeroAvia, he has built a career at the intersection of emerging technology, compliance, and operational excellence — working within some of the most demanding aerospace and defense quality frameworks in the world.",
      "Beyond his engineering career, William is the founder of InclusiGear and InclusiCare — an advocacy apparel brand and AI-powered care coordination platform built specifically for families navigating complex neurodivergent care journeys. His lived experience as a parent of five children, including members of the neurodivergent community, directly informs his belief that AI must be designed with and for the people it serves, not simply deployed at them.",
      "On the board, William pairs disciplined budgeting and fundraising leadership with a practitioner's perspective on responsible AI adoption and a founder's understanding of resource-constrained innovation — helping ensure that the organizations, families, and communities too often left out of the AI conversation have a seat at the table and the funding to make it real."
    ],
    credentials: [
      "MBA — William Jewell College",
      "B.S. Engineering Management — Arizona State University",
      "Senior Manufacturing Engineer — Anduril Industries",
      "Former Lead Manufacturing Engineer — GE Aerospace",
      "Former Senior Manufacturing Engineer — ZeroAvia",
      "FAA, CAA, AS9100 Compliance Expertise",
      "Board Advisor — Sarge (veteran discount verification)"
    ],
    focus: [
      "Financial Health & Budget Planning",
      "Grant Strategy & Foundation Funding",
      "Donor Development & Stewardship",
      "Federal & Philanthropic Partnerships"
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/wkreitzer/", icon: "linkedin" },
      { label: "InclusiGear", url: "https://inclusigear.com", icon: "external" }
    ]
  },
  "nirmal-jingar": {
    name: "Nirmal Jingar",
    slug: "nirmal-jingar",
    title: "AI & Emerging Technology Strategy and Governance Director",
    seat: "Seat 4",
    seatLabel: "AI & Emerging Technology Strategy and Governance",
    photo: nirmalPhoto,
    badgeColor: "bg-blue-500/5 text-blue-300 border-blue-500/20",
    linkedin: "https://www.linkedin.com/in/nirmaljingar",
    shortBio: "Senior technology leader directing enterprise AI, platforms, and modernization at Wayfair. IEEE Senior Member, Forbes Technology Council, and recognized voice on responsible AI at production scale.",
    fullBio: [
      "Nirmal Jingar leads the organization's strategy and public leadership in emerging technologies including AI, AGI, and advanced computing systems. He defines frameworks and standards for responsible adoption and real-world implementation across industry and research communities, and represents Humanity + AI in conferences, panels, and cross-institutional collaborations.",
      "In his role on the board, Nirmal oversees the design of high-impact programs and learning initiatives that shape how technology leaders understand and apply emerging technologies. He advises on technical direction, evaluates external work and partnerships, and contributes to broader conversations on technology policy and governance.",
      "Professionally, Nirmal serves as a Senior Engineering Manager at Wayfair, where he directs enterprise AI and supply chain engineering across a $10B+ global e-commerce operation. His teams build and operationalize production AI capabilities that surface root causes from logs and commit history, migrate legacy codebases using structured retrieval frameworks, automate engineering workflows under defined guardrails, and embed AI into optimization and routing systems influencing real operational decisions. This work has contributed over $300M in cumulative enterprise impact through reduced costs, faster incident resolution, margin gains, and modernization of constrained systems.",
      "Nirmal's perspective is shaped by years working inside complex, regulated systems: \"Complex systems don't become reliable by accident. You design reliability in from the start or spend your time managing failure. That lesson applies directly to enterprise AI.\" He focuses on building AI systems that perform under financial, operational, and regulatory pressure — not demo environments — and is a frequent speaker on board AI education, executive AI literacy, enterprise AI at global production scale, AI governance, and aligning AI with business strategy.",
      "He also serves as a Board Member at Resilient Coders and the US Proptech Council, a Top 15 MIT & Harvard Startup Mentor with TNT, Board Advisor for the AI Leaders Council, Member of the Board of Advisors at the University of New Haven, Judge & Mentor at MassChallenge, Executive Advisor on AI Education & Workforce Strategy at Jala University, and Advisor on Applied AI at Wentworth Institute of Technology."
    ],
    credentials: [
      "AI Strategy and Leadership — Massachusetts Institute of Technology",
      "Senior Engineering Manager — Wayfair",
      "Forbes Technology Council Member",
      "IEEE Senior Member · IEEE TEMS Member",
      "2026 Global Recognition Award™",
      "Board Member — Resilient Coders",
      "Board Member — US Proptech Council",
      "Top 15 MIT & Harvard Startup Mentor (TNT)",
      "Board Advisor — AI Leaders Council",
      "Board of Advisors — University of New Haven",
      "Judge & Mentor — MassChallenge",
      "Executive Advisor — Jala University (AI Education & Workforce Strategy)",
      "Advisor, Applied AI — Wentworth Institute of Technology",
      "Patents in agentic AI, supply chain orchestration, and distributed ML systems"
    ],
    focus: [
      "Strategy & public leadership in AI, AGI, and advanced computing",
      "Frameworks and standards for responsible AI adoption",
      "High-impact programs and learning initiatives for technology leaders",
      "Technical direction, partnership evaluation, and external work review",
      "Technology policy and AI governance"
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/nirmaljingar", icon: "linkedin" },
      { label: "Watch TEDx Talk", url: "https://www.youtube.com/watch?v=pxUChqiyp2Y", icon: "external" }
    ],
    videoHighlight: {
      title: "TEDx Talk: The Future of Responsible AI",
      embedId: "pxUChqiyp2Y",
      source: "TEDx",
      description: "Nirmal takes the TEDx stage to explore how we build AI that holds up under real-world pressure — and why responsible, governed intelligence is the defining engineering challenge of our era."
    },
    articleHighlights: [
      {
        title: "Your AI's Failing Because You're Measuring The Wrong Thing",
        source: "Forbes Tech Council · April 21, 2026",
        url: "https://www.forbes.com/councils/forbestechcouncil/2026/04/21/your-ais-failing-because-youre-measuring-the-wrong-thing/"
      },
      {
        title: "From Fragile Systems to Governed AI: The Supply Chain Engineering Philosophy of Wayfair's Nirmal Jingar",
        source: "Forbes Councils — Executive Spotlight",
        url: "https://councils.forbes.com/executive-spotlight/from-fragile-systems-to-governed-ai-the-supply-chain-engineering-philosophy-of-wayfairs-nirmal-jingar"
      }
    ]
  },
  "mike-klyce": {
    name: "Mike Klyce",
    slug: "mike-klyce",
    title: "Chief Legal & AI Governance Officer (CLAGO)",
    seat: "Seat 5",
    seatLabel: "Chief Legal & AI Governance Officer",
    photo: mikePhoto,
    badgeColor: "bg-rose-500/5 text-rose-300 border-rose-500/20",
    linkedin: "https://www.linkedin.com/in/mike-klyce-521b8b318",
    shortBio: "Founder & CEO of EnscribeAI and Artist in the Model. Duke Law-trained attorney and former Katten Muchin Rosenman partner focused on rights-clear human training data, AI governance, and human-AI alignment at global scale.",
    fullBio: [
      "Mike Klyce is a Washington, D.C.-based attorney, AI governance leader, and entrepreneur working at the intersection of law, frontier AI, and human creativity. He is Founder & CEO of EnscribeAI and Founder of the nonprofit research entity Artist in the Model, both dedicated to ensuring artificial intelligence evolves in genuine alignment with human values, judgment, and creativity rather than drifting toward closed synthetic self-reference.",
      "As Humanity + AI's Chief Legal & AI Governance Officer (CLAGO), Mike leads the organization's legal posture and AI governance strategy. He advises the board on emerging AI law and policy, regulatory developments, transparency and provenance standards, training-data rights, contractual safeguards, and the governance frameworks our programs and partners adopt. His work helps ensure that everything Humanity + AI publishes, teaches, and operationalizes meets a high bar for legal rigor and responsible AI practice.",
      "At EnscribeAI, Mike has built a model designed to scale a global platform of approximately 100,000 vetted human experts to provide a continuous stream of human-authored, rights-clear data — usable both as direct training data and as ground-truth anchor, oracle, and control signal for large-scale synthetic data pipelines. As regulators and courts move toward higher standards of transparency, EnscribeAI's clear contractual terms and full data lineage allow labs to demonstrate compliance while improving training outcomes, minimizing bias and contamination, and unlocking scientifically defined control datasets at scale.",
      "Through Artist in the Model (AIM), Mike investigates whether incorporating original human-created art and music into training pipelines — as deliberate human expression rather than as raw pixels and waveforms — produces measurable gains in model alignment, interpretability, and benchmark performance. AIM also draws on neuroscience, psycholinguistics, musicology, and computational aesthetics to study the structure of learning itself, positioning artists and creators as central rather than peripheral to next-generation AI development.",
      "Mike previously served as a Partner at Katten Muchin Rosenman LLP in Washington, D.C., where he practiced for over a decade. He earned his J.D. from Duke University School of Law. The throughline across his work — from law firm partnership to frontier AI infrastructure — is a conviction that the most capable and trustworthy AI systems will be those that learn from the full depth and diversity of real human expertise, governed by clear rights, transparent provenance, and rigorous accountability."
    ],
    credentials: [
      "Founder & CEO — EnscribeAI",
      "Founder — Artist in the Model (AIM)",
      "Former Partner — Katten Muchin Rosenman LLP",
      "J.D. — Duke University School of Law",
      "Focus: AI Governance · Human-AI Alignment · Global AI Policy"
    ],
    focus: [
      "AI Governance, Policy & Regulatory Strategy",
      "Training-Data Rights, Provenance & Transparency",
      "Human-AI Alignment & Frontier Lab Partnerships",
      "Legal Frameworks for Responsible AI Deployment",
      "Art, Creativity & Human Expression as AI Signal"
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/mike-klyce-521b8b318", icon: "linkedin" }
    ]
  },
  "david-wood": {
    name: "David Wood",
    slug: "david-wood",
    title: "Board Director, Strategic Partnerships & Human-Centered AI",
    seat: "Seat 6",
    seatLabel: "Strategic Partnerships & Human-Centered AI",
    photo: davidWoodPhoto,
    badgeColor: "bg-indigo-500/5 text-indigo-300 border-indigo-500/20",
    linkedin: "https://www.linkedin.com/in/savoyie",
    tagline: "Strategic Coach · Trusted Advisor · USMC Veteran",
    subtitle: "Helping AI and GovTech leaders grow with clarity, courage, and human judgment — at the intersection of emerging technology and timeless human values.",
    shortBio: "Strategic coach, trusted advisor, and USMC veteran with 40+ years across startups, executive leadership, federal technology sales, and AI advisory. Founding Partner of Gladwood LLC and Senior Advisor across multiple AI and nonprofit boards.",
    fullBio: [
      "David Wood is a strategic coach, trusted advisor, and lifelong builder with over 40 years of experience spanning the U.S. Marine Corps, enterprise technology, executive leadership, and the frontier of human-centered AI. He is the backbone of Gladwood LLC, where he combines people-oriented leadership with deep expertise in strategic business development to coach high-performing teams, companies, and individuals.",
      "As Board Director for Strategic Partnerships & Human-Centered AI at Humanity + AI, Inc., David helps the organization build the relationships, partnerships, and ecosystems that turn mission into measurable impact. He advises the board on partnership strategy, advisor and donor cultivation, and how to design AI programs that genuinely serve people — drawing on decades of experience translating complex technology into outcomes that organizations can actually use.",
      "David's career began with a 20-year career in the United States Marine Corps, where he developed the leadership, discipline, and systems thinking that still anchor his work today. He then spent 25 years in executive leadership, business development, and sales roles in technology across both the commercial and federal government sectors — including senior positions at Verizon Enterprise Solutions, QTS Data Centers, Government Acquisitions, Flosum, and Activu, where he led federal account strategy for DoD, DHS, the Intelligence Community, and civilian agencies.",
      "An early adopter of artificial intelligence with what he describes as \"unbounded curiosity,\" David currently serves as Senior Advisor to Neuroscale, pioneers of Agentic AI for next-generation assessment, and as Senior Board Advisor to the National Artificial Intelligence Association (NAIA) in Washington, D.C. He also serves on the board of Operation Beautiful Feet, a Christian nonprofit led by Joy Griffin, and previously served nine years on the board of Next Century Technology.",
      "Through Gladwood and the Hartman Value Profile (HVP), David's vision is to develop organizations and leaders — and then equip them for the ongoing process of transforming their own teams. His philosophy is grounded in a core belief: when we understand people deeply, we lead better, build smarter businesses, and unlock the full potential of innovation, especially in the age of AI.",
      "David holds a Bachelor of Science in Business Administration and Computer Science from the University of Florida, and a Master of Science in Systems Engineering from the Naval Postgraduate School in Monterey, California. He is also the former founder, owner, and winemaker of Savoy-Lee Winery, a 120-acre operation at Smith Mountain Lake, Virginia — a reminder that the throughline of his career has always been building things, with people, that last."
    ],
    credentials: [
      "Founding Partner — Gladwood LLC",
      "Senior Advisor — Neuroscale (Agentic AI for Assessments)",
      "Senior Board Advisor — National Artificial Intelligence Association (NAIA)",
      "Board Member — Operation Beautiful Feet",
      "USMC Veteran — 20-Year Career",
      "M.S. Systems Engineering — Naval Postgraduate School",
      "B.S. Business Administration & Computer Science — University of Florida",
      "Hartman Value Profile (HVP) Practitioner",
      "16K+ LinkedIn Followers"
    ],
    focus: [
      "Strategic Partnerships & Ecosystem Building",
      "Human-Centered AI & Values-Based Leadership",
      "Executive Coaching & Team Transformation",
      "Federal & GovTech AI Adoption",
      "Board Advisory & Nonprofit Governance"
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/savoyie", icon: "linkedin" },
      { label: "Gladwood LLC", url: "https://www.gladwoodllc.com", icon: "external" }
    ],
    perspectives: [
      "When we understand people deeply, we lead better, build smarter businesses, and unlock the full potential of innovation — especially in the age of AI.",
      "AI should augment human potential, not replace it. The most durable systems pair emerging technology with timeless principles of human value.",
      "Strategy without people is just a slide. The work that lasts is built on trust, clarity, and shared judgment."
    ]
  },
  "vasu-raj-jain": {
    name: "Vasu Raj Jain",
    slug: "vasu-raj-jain",
    title: "Chief of AI in Advertising & Media",
    seat: "Seat 7",
    seatLabel: "Chief of AI in Advertising & Media",
    photo: vasuPhoto,
    badgeColor: "bg-teal-500/5 text-teal-300 border-teal-500/20",
    linkedin: "https://www.linkedin.com/in/vasujain00",
    tagline: "Builder · Distributed Systems · Agentic AI for Advertising",
    subtitle: "Scaling the ad infrastructure that funds the open internet — and shaping how AI is built, governed, and applied in advertising and media at global scale.",
    shortBio: "Senior Software Development Engineer at Amazon Ads leading large-scale ad serving infrastructure that generates billions in annual revenue across Prime Video, live sports, and DOOH. Forbes Technology Council member, IAB Tech Lab contributor, and builder of agentic AI platforms.",
    fullBio: [
      "Vasu Raj Jain is a builder at the intersection of distributed systems, AI infrastructure, and advertising technology. As a Senior Software Development Engineer at Amazon Ads in Seattle, he leads architecture and development of large-scale ad serving infrastructure generating billions in annual revenue across Prime Video, live sports streaming, and Digital Out-of-Home platforms.",
      "Vasu directly leads 30 engineers and influences over 150 across the organization. He has designed hybrid multi-tenant infrastructure handling millions of requests per second, developed agentic AI solutions built on MCP servers and RAG, and delivered a 300% improvement in release management through automation. He also designed a BDD testing framework that reduced test creation from days to under one hour, and contributes to industry standards through IAB Tech Lab working groups.",
      "Previously, Vasu spent nearly four years on Amazon's Video & AI Platform and Prime Video teams, where he built the authoritative data store powering personalization models, an embedding generation service for video-to-vector inference, a copyright protection service for Prime Video, and the encoding and sampling services underpinning Amazon's video understanding platform.",
      "Earlier, he was a Software Engineer at Barclays Investment Bank in New York, developing nodes of a fixed-income price engine and the middleware messaging layer connecting it to the electronic trading portal.",
      "Vasu is a member of the Forbes Technology Council, certified in Agentic Economy (Arc Judge), and was awarded the Google × Tata Trust Scholarship. As Chief of AI in Advertising & Media at Humanity + AI, Inc., he focuses on ensuring the next generation of advertising and media AI is built responsibly — with strong governance, transparent measurement, and a clear-eyed view of how it shapes the open internet.",
      "He holds a Master's in Computer Science from the University of Florida and a Bachelor of Technology from Jaypee University of Engineering and Technology. He is the founder of Streetingo, a hyper-local street food discovery app, and shares his work at linkedin.com/in/vasujain00."
    ],
    credentials: [
      "Senior Software Development Engineer — Amazon Ads",
      "Forbes Technology Council Member",
      "IAB Tech Lab Working Groups Contributor",
      "M.S. Computer Science — University of Florida",
      "B.Tech Computer Science — Jaypee University of Engineering and Technology",
      "Top 10 Mentor · 500+ Mentorship Minutes",
      "Agentic Economy (Arc Judge) Certified",
      "Google × Tata Trust Scholarship Recipient",
      "Google Clickathon Winner"
    ],
    focus: [
      "AI Infrastructure for Advertising & Media",
      "Distributed Systems at Planetary Scale",
      "Agentic AI, MCP Servers & RAG Architectures",
      "Responsible AI Governance for Ad-Funded Platforms",
      "Engineering Leadership & Mentorship"
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/vasujain00", icon: "linkedin" },
      { label: "Forbes Council Profile", url: "https://councils.forbes.com/profile/Vasu-Raj-Jain-Impact-Focused-Engineering-Lead-Amazon-Ads/b376d852-61fd-442e-977c-8552e9f06766", icon: "external" }
    ],
    perspectives: [
      "True progress happens at the intersection of engineering theory, art, and humanitarian needs — and the goal of technology is to help other people in new and creative ways.",
      "Advertising funds the open internet. The AI we build for it has to be efficient, transparent, and accountable — not just clever.",
      "Agentic systems only earn trust when the foundations underneath them — data, infrastructure, and governance — are built with the same care as the model on top."
    ]
  },
  "vina-torossian": {
    name: "Vina Torossian",
    slug: "vina-torossian",
    title: "Director, Human Authenticity, Leadership, Consciousness & AI, and Board Treasurer",
    seat: "Seat 8",
    seatLabel: "Director, Human Authenticity, Leadership, Consciousness & AI, and Board Treasurer",
    photo: vinaPhoto,
    badgeColor: "bg-fuchsia-500/5 text-fuchsia-300 border-fuchsia-500/20",
    linkedin: "https://www.linkedin.com/in/vinatorossian",
    tagline: "Banking Leader · Treasury & Cash Management · TEDx Speaker",
    subtitle: "Bringing institutional financial discipline and a human-centered philosophy of \"collective significance\" to how a mission-driven organization grows, sustains itself, and scales its impact.",
    shortBio: "Vice President and Cash Management Relationship Leader with 20+ years across global transaction banking, treasury strategy, and trade finance. A TEDx speaker and international keynote presenter on leadership, resilience, and collective impact.",
    fullBio: [
      "Vina Torossian is a senior banking executive who has spent more than two decades helping organizations master the financial machinery that lets them grow with confidence. As Vice President and Cash Management Relationship Leader at Northern Bank, she leads the middle-market vertical — advising CFOs, treasurers, and C-suite leaders on liquidity optimization, payment modernization, and the treasury infrastructure that turns ambition into durable, scalable operations.",
      "Her expertise spans the full architecture of modern finance: corporate treasury strategy, global trade finance, cross-border payments, and banking technology. She currently stewards a $200M+ commercial banking portfolio, partnering with business owners and executive teams to drive deposit growth, strengthen working capital, and implement future-ready financial systems. Earlier, at RBC Investor & Treasury Services and Bank of America, she managed strategic relationships with global financial institutions across North America and Europe — structuring letters of credit, guarantees, and documentary collections, and operating fluently across SWIFT, correspondent banking, and international liquidity management.",
      "On the board of Humanity + AI, Inc., Vina brings the financial rigor and institutional perspective that a fast-growing nonprofit needs to build for the long term. She focuses on capital strategy, treasury and financial sustainability, and the institutional partnerships — across banking, fintech, medtech, and philanthropy — that expand the organization's reach. Her instinct for translating complex financial products into practical outcomes helps ensure the mission is matched by the means to deliver it.",
      "Beyond banking, Vina is the founder of Karaka, a leadership and wellbeing consultancy that helps individuals and organizations integrate a \"whole presence\" — mind, body, and spirit — into how they lead and grow. A certified Wholebeing Positive Psychology Practitioner and Mindfulness-Based Stress Reduction practitioner, she pairs hard financial expertise with a deeply human philosophy of leadership and character.",
      "Vina is a TEDx speaker and international keynote presenter. Her TEDxBryantU talk, \"Collective Significance,\" draws on the alphabet, the human body, and a simple key ring to illustrate how every individual part holds meaning within a greater whole — a conviction that animates her board service and her belief that technology, like finance, must ultimately serve people. She is fluent in English, Armenian, and French, with working Arabic, enabling relationship-building with international clients and stakeholders worldwide."
    ],
    credentials: [
      "Vice President, Cash Management Relationship Leader — Northern Bank",
      "Founder — Karaka (Leadership & Wellbeing Consultancy)",
      "TEDx Speaker — \"Collective Significance,\" TEDxBryantU",
      "Distinguished Speaker Certificate — Gross Global Happiness Conferences",
      "Certified Wholebeing Positive Psychology Practitioner (WiCPP)",
      "Mindfulness-Based Stress Reduction & Meditation Certified",
      "Financial Paraplanner Qualified Professional (FPQP)",
      "20+ years across RBC Investor & Treasury Services and Bank of America"
    ],
    focus: [
      "Treasury Strategy & Financial Sustainability",
      "Capital Strategy & Institutional Partnerships",
      "Global Payments, Trade Finance & Liquidity",
      "Banking Technology & Treasury Modernization",
      "Leadership, Wellbeing & Human-Centered Growth"
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/vinatorossian", icon: "linkedin" },
      { label: "TEDx Talk — Collective Significance", url: "https://www.youtube.com/watch?v=aIgsGsLS5mY", icon: "external" }
    ],
    videoHighlight: {
      title: "TEDx Talk: Collective Significance",
      embedId: "aIgsGsLS5mY",
      source: "TEDxBryantU",
      description: "Drawing on the alphabet, the human body, and a simple key ring, Vina reveals how every individual part holds meaning within a greater whole — a meditation on significance, contribution, and the value each of us brings."
    }
  },
  "william-zhu": {
    name: "William Zhu",
    slug: "william-zhu",
    title: "Board Director, Applied AI & Community Strategy",
    seat: "Seat 9",
    seatLabel: "Applied AI & Community Strategy",
    photo: williamZhuPhoto,
    badgeColor: "bg-sky-500/5 text-sky-300 border-sky-500/20",
    linkedin: "https://www.linkedin.com/in/william-wei-zhu",
    tagline: "Applied AI Builder · Data Scientist · Community Organizer",
    subtitle: "Building applied AI products and convening the people who shape them — at the intersection of technology, community, and human judgment.",
    stats: [
      { value: "900+", label: "AI Builders Convened" },
      { value: "12K+", label: "LinkedIn Followers" },
      { value: "2026", label: "RealLIST Connector" }
    ],
    shortBio: "Applied AI builder, data scientist, and community organizer. Senior Data Scientist & Applied AI Engineer at Choice Hotels International and founding organizer of DC's AI Discussion Club (900+ builders). M.A. Computational Social Science, University of Chicago.",
    fullBio: [
      "William Zhu is an applied AI builder, data scientist, and community organizer working at the intersection of AI products, growth, and human connection. Across his professional and independent work, the throughline is the same: use AI to help people make better decisions, build stronger organizations, and connect more meaningfully.",
      "As Board Director for Applied AI & Community Strategy at Humanity + AI, Inc., William advises the board on how to design AI programs that genuinely serve people and how to grow the community and ecosystem around the organization's mission. He brings a practitioner's perspective on what it takes to ship AI products responsibly and to convene the builders and innovators who move a field forward.",
      "William is a Senior Data Scientist and Applied AI Engineer at Choice Hotels International, where he ships machine learning and AI products that drive growth and loyalty across thousands of properties. His work spans event-driven pricing lift models, personalized recommendation systems, and the company's first production-grade retrieval-augmented AI pipeline (RAG), and he has led enterprise-wide AI workshops for hundreds of associates to support responsible adoption. He was named a 2025 Choice Innovation Award Finalist.",
      "Beyond his day-to-day work, William is the founding organizer of Washington, DC's AI Discussion Club, hosting in-person events for 900+ AI builders and innovators across the DC area, and was named one of 20 DC 2026 RealLIST Connectors by Technical.ly.",
      "He holds a master's in Computational Social Science from the University of Chicago, with a concentration in Quantitative Marketing at Chicago Booth, and a bachelor's in Sociology from Haverford College. A data scientist by training and a social scientist at heart, William is drawn to how technology shapes human behavior, organizations, and collective decision-making."
    ],
    credentials: [
      "Senior Data Scientist, Applied AI Engineering — Choice Hotels International",
      "Founding Organizer — AI Discussion Club (Washington, DC)",
      "2026 RealLIST Connector — Technical.ly",
      "2025 Choice Innovation Award Finalist",
      "AWS Certified Machine Learning Engineer Associate & AI Practitioner",
      "M.A. Computational Social Science — University of Chicago",
      "Quantitative Marketing Concentration — Chicago Booth School of Business",
      "B.A. Sociology, Minor in Statistics — Haverford College"
    ],
    focus: [
      "Applied AI Products & Deployment",
      "Community Building & Ecosystem Growth",
      "Responsible AI Adoption & Governance",
      "Data Science, Machine Learning & Growth",
      "Consumer & Product Strategy"
    ],
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/william-wei-zhu", icon: "linkedin" },
      { label: "Stories", url: "https://williamzhu.ai/stories", icon: "external" },
      { label: "Projects", url: "https://williamzhu.ai/projects", icon: "external" },
      { label: "Books", url: "https://williamzhu.ai/books", icon: "external" },
      { label: "Email", url: "mailto:williamzhu@humanityplusai.org", icon: "mail" }
    ],
    perspectives: [
      "The point of AI is to help people make better decisions, build stronger organizations, and connect more meaningfully — not to replace the human judgment at the center of it all.",
      "Communities aren't an afterthought to technology; convening the builders and innovators who move a field forward is how responsible AI actually gets built.",
      "A data scientist by training and a social scientist at heart — what matters most is how technology shapes human behavior, organizations, and collective decision-making."
    ]
  }
};

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

function OtherMemberCard({ member }: { member: typeof boardMembers[string] }) {
  const [, setLocation] = useLocation();
  const navigate = () => setLocation(`/about/board/${member.slug}`);
  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      data-testid={`card-other-${member.slug}`}
      onClick={navigate}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(); } }}
      tabIndex={0}
      role="link"
    >
      <div className="flex items-center gap-4 p-4">
        <img
          src={member.photo}
          alt={member.name}
          className="w-16 h-16 rounded-full object-cover object-top"
          loading="lazy"
          decoding="async"
        />
        <div>
          <h3 className="font-semibold text-sm">{member.name}</h3>
          <p className="text-xs text-primary font-medium">{member.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{member.seat}</p>
        </div>
      </div>
    </Card>
  );
}

export default function BoardMember() {
  const { slug } = useParams<{ slug: string }>();
  const member = slug ? boardMembers[slug] : undefined;

  if (!member) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Board Member Not Found</h1>
          <Link href="/about">
            <Button variant="outline" className="gap-2 text-white hover:text-white border-white/25" data-testid="link-back-about">
              <ArrowLeft className="h-4 w-4" />
              Back to About
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const otherMembers = Object.values(boardMembers).filter(m => m.slug !== member.slug);

  const siteBase = "https://humanityplusai.org";
  const memberUrl = `${siteBase}/about/board/${member.slug}`;
  const sameAsLinks = member.links.map((l) => l.url);
  if (member.linkedin && !sameAsLinks.includes(member.linkedin)) {
    sameAsLinks.unshift(member.linkedin);
  }

  const boardMemberSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${member.name} — ${member.title}`,
    url: memberUrl,
    mainEntity: {
      "@type": "Person",
      name: member.name,
      jobTitle: member.title,
      description: member.shortBio,
      url: memberUrl,
      ...(sameAsLinks.length > 0 ? { sameAs: sameAsLinks } : {}),
      memberOf: {
        "@type": "Organization",
        name: "Humanity + AI, Inc.",
        url: siteBase,
      },
    },
  };

  return (
    <div className="min-h-screen">
      <PageMeta
        title={`${member.name} — ${member.title}`}
        description={member.shortBio}
        canonical={`/about/board/${member.slug}`}
        ogType="profile"
      />
      <StructuredData schema={boardMemberSchema} />
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/about">
            <Button variant="ghost" className="gap-2 mb-8 -ml-2 text-white hover:text-white" data-testid="link-back-about">
              <ArrowLeft className="h-4 w-4" />
              Back to About
            </Button>
          </Link>

          <motion.div {...fadeIn} className="grid md:grid-cols-[320px_1fr] gap-10">
            <div>
              <div className="rounded-xl overflow-hidden shadow-lg mb-6">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full aspect-[3/4] object-cover object-top"
                  data-testid="img-board-member-photo"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
              <div className="space-y-3">
                {member.links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full gap-2 justify-start text-white hover:text-white border-white/25" data-testid={`link-${link.label.toLowerCase().replace(/\s/g, '-')}`}>
                      {link.icon === "linkedin" ? <SiLinkedin className="h-4 w-4" /> :
                       link.icon === "medium" ? <BookOpen className="h-4 w-4" /> :
                       link.icon === "mail" ? <Mail className="h-4 w-4" /> :
                       <ExternalLink className="h-4 w-4" />}
                      {link.label}
                    </Button>
                  </a>
                ))}
              </div>
            </div>

            <div>
              {member.tagline && (
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-emerald-300 mb-3" data-testid="text-board-member-tagline">
                  {member.tagline}
                </p>
              )}
              <Badge variant="outline" className={`text-xs mb-3 ${member.badgeColor}`}>
                {member.seat} — {member.seatLabel}
              </Badge>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-white" data-testid="text-board-member-name">{member.name}</h1>
              <p className="text-lg text-emerald-300 font-medium mb-3" data-testid="text-board-member-title">{member.title}</p>

              {member.subtitle && (
                <p className="font-serif italic text-base md:text-lg text-white/75 leading-relaxed mb-6 max-w-2xl" data-testid="text-board-member-subtitle">
                  {member.subtitle}
                </p>
              )}

              {member.stats && member.stats.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-8 py-4 border-y border-white/15" data-testid="board-member-stats">
                  {member.stats.map((stat, i) => (
                    <div key={i} data-testid={`stat-${i}`}>
                      <div className="font-serif text-2xl md:text-3xl font-bold text-emerald-300 leading-none">{stat.value}</div>
                      <div className="text-[10px] font-medium tracking-wider uppercase text-white/60 mt-2">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}


              <div className="space-y-4 mb-10">
                {member.fullBio.map((paragraph, i) => (
                  <p key={i} className="text-white/80 leading-relaxed">{paragraph}</p>
                ))}
              </div>

              {member.videoHighlight && (
                <div className="mb-10" data-testid="section-video-highlight">
                  <p className="text-xs font-medium text-emerald-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Featured Talk
                  </p>
                  <Card className="overflow-hidden border-l-4 border-l-primary">
                    <div className="relative w-full aspect-video bg-black">
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${member.videoHighlight.embedId}`}
                        title={member.videoHighlight.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        loading="lazy"
                        data-testid="iframe-video-highlight"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base leading-snug" data-testid="text-video-highlight-title">
                          {member.videoHighlight.title}
                        </h3>
                        {member.videoHighlight.source && (
                          <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 shrink-0">
                            {member.videoHighlight.source}
                          </Badge>
                        )}
                      </div>
                      {member.videoHighlight.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {member.videoHighlight.description}
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {member.articleHighlights && member.articleHighlights.length > 0 && (
                <div className="mb-10">
                  <p className="text-xs font-medium text-emerald-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Recent Article Highlights
                  </p>
                  <div className="space-y-3">
                    {member.articleHighlights.map((article, i) => {
                      const isInternal = article.url.startsWith("/");
                      const cardContent = (
                        <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-primary">
                          <div className="flex items-start gap-3">
                            <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base leading-snug mb-1" data-testid={`text-article-title-${i}`}>
                                {article.title}
                              </h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                {article.source}
                                {isInternal ? <ArrowRight className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                      return isInternal ? (
                        <Link key={i} href={article.url} className="block" data-testid={`link-article-highlight-${i}`}>
                          {cardContent}
                        </Link>
                      ) : (
                        <a
                          key={i}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                          data-testid={`link-article-highlight-${i}`}
                        >
                          {cardContent}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6 mb-10">
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">Credentials</h3>
                  </div>
                  <ul className="space-y-2">
                    {member.credentials.map((cred, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Award className="h-3.5 w-3.5 mt-0.5 text-primary/60 shrink-0" />
                        {cred}
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">Board Focus Areas</h3>
                  </div>
                  <ul className="space-y-2">
                    {member.focus.map((area, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Briefcase className="h-3.5 w-3.5 mt-0.5 text-primary/60 shrink-0" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {member.buildingProjects && member.buildingProjects.length > 0 && (
                <div className="mb-10" data-testid="section-building">
                  <p className="text-xs font-medium text-emerald-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    What I'm Building
                  </p>
                  <div className="grid sm:grid-cols-1 gap-3">
                    {member.buildingProjects.map((project, i) => (
                      <Card key={i} className="p-5 border-l-4 border-l-primary/60" data-testid={`card-project-${i}`}>
                        <h3 className="font-semibold text-base mb-1.5">{project.name}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {member.perspectives && member.perspectives.length > 0 && (
                <div className="mb-4" data-testid="section-perspectives">
                  <p className="text-xs font-medium text-emerald-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    My Take on Where This Is Going
                  </p>
                  <ol className="space-y-4">
                    {member.perspectives.map((take, i) => (
                      <li key={i} className="flex gap-4 items-start" data-testid={`perspective-${i}`}>
                        <span className="font-serif text-2xl font-bold text-emerald-300/40 leading-none w-8 shrink-0 pt-1">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-[15px] leading-relaxed text-white/85 border-t border-white/15 flex-1 pt-3">
                          {take}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-bold mb-8 text-center text-white">Other Board Members</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {otherMembers.map((other) => (
              <OtherMemberCard key={other.slug} member={other} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
