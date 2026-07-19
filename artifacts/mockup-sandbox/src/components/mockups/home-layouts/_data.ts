// Shared mock data for all home-layouts variants.
// Mirrors the shape returned by /api/blog and /api/events in the main app.

export const PILLARS = [
  { iconName: "Shield" as const, title: "AI Ethics & Governance", desc: "Establishing frameworks for responsible AI development and deployment that prioritize human values and dignity." },
  { iconName: "GraduationCap" as const, title: "Education & Mentorship", desc: "Empowering the next generation of tech leaders with knowledge, skills, and ethical foundations for AI innovation." },
  { iconName: "Microscope" as const, title: "Research & Innovation", desc: "Pioneering research in interspecies communication, neuromorphic computing, and human-centered AI applications." },
  { iconName: "Users" as const, title: "Community Building", desc: "Creating inclusive spaces where technologists, researchers, and community members collaborate on AI for good." },
];

export const STATS = [
  { value: "Est. 2024", label: "Founded" },
  { value: "7+", label: "Active Programs" },
  { value: "Global", label: "Community Reach" },
  { value: "100%", label: "Mission Driven" },
];

export const BOARD = [
  {
    name: "Danielle A. Franklin",
    title: "Founder & Board Chair",
    seat: "Seat 1",
    slug: "danielle-franklin",
    photo: "/__mockup/images/board/danielle.png",
    linkedin: "https://www.linkedin.com/in/danielle-franklin-53318269/",
    highlight: "20+ Yrs Defense & AI",
    bio: "Defense tech executive & AI innovator. Chief Architect of SDA's $1.8B+ space architecture. Former NVIDIA DoD AI strategist. WOSB defense contractor.",
  },
  {
    name: "Jofiah Jose Prakash",
    title: "AI Ethics & Governance Director",
    seat: "Seat 2",
    slug: "jofia-jose-prakash",
    photo: "/__mockup/images/board/jofia.png",
    linkedin: "https://www.linkedin.com/in/jofiajoseprakash/",
    highlight: "4 AI Patents",
    bio: "Enterprise AI Architect at American Chemical Society. AI Ethics Chair at the American Council for Ethical AI. 15+ years in enterprise AI systems.",
  },
  {
    name: "William Kreitzer",
    title: "Senior Manufacturing Engineer & Community Advocate",
    seat: "Seat 3",
    slug: "william-kreitzer",
    photo: "/__mockup/images/board/william.png",
    linkedin: "https://www.linkedin.com/in/wkreitzer/",
    highlight: "InclusiCare & InclusiGear Founder",
    bio: "Senior Manufacturing Engineer at Anduril Industries. Founder of InclusiCare & InclusiGear — AI-powered platforms for neurodivergent families. Parent of five and community advocate.",
  },
];

export const POSTS = [
  {
    id: "1",
    slug: "ethical-ai-frameworks",
    title: "Building Ethical AI: A Framework for Responsible Development",
    excerpt: "Why responsible AI begins with the questions we choose not to answer with code, and how nonprofits can lead the field in stewardship.",
    author: "Danielle A. Franklin",
    category: "AI Ethics",
    contentType: "article" as const,
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "2",
    slug: "interspecies-communication",
    title: "Interspecies Communication: Decoding the Language of Animals with AI",
    excerpt: "From whale song to canine vocalization, large models are starting to translate the signals other species use to navigate their world.",
    author: "Danielle A. Franklin",
    category: "Research",
    contentType: "article" as const,
    imageUrl: "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "3",
    slug: "training-llms",
    title: "Training Large Language Models: A Beginner's Honest Guide",
    excerpt: "What it actually takes — in compute, data, and human judgement — to teach a model to write a sentence you'd want to read.",
    author: "Danielle A. Franklin",
    category: "Education",
    contentType: "article" as const,
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=60",
  },
];

export const FEATURED_EVENT = {
  id: "evt-1",
  title: "AI for Public Good — Community Roundtable",
  description: "Join Danielle and the Humanity + AI board for an open conversation about putting AI to work for nonprofits, classrooms, and community organizations.",
  date: "2026-06-12",
  time: "5:00 PM PT",
  location: "Virtual — Zoom",
  type: "Community" as const,
  link: "https://example.com/join",
  imageUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200&auto=format&fit=crop&q=60",
  secondaryImageUrl: null as string | null,
};
