import { PageMeta } from "@/components/page-meta";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  GraduationCap, Play, ExternalLink, Search, Filter,
  Sparkles, ArrowRight, Brain, Code, Wrench, Users,
  BookOpen, Zap, Globe, ChevronRight, Star, Clock,
  BarChart3, Bot, Shield, Layers, Heart, Lightbulb,
  Target, Compass, Rocket, TrendingUp, Database,
  FileText, Building2, Scale, Eye, Leaf, HandHeart, Award,
  MessageSquare, ShieldCheck, CheckCircle2,
  Video,
} from "lucide-react";
import { SiYoutube, SiGithub, SiLinkedin } from "react-icons/si";
import { EditorialMasthead } from "@/components/editorial-masthead";
import { useQuery } from "@tanstack/react-query";
import { CampaignMeter, type CampaignProgress } from "@/components/campaign-meter";
import jofiaPhoto from "@assets/image_1775903668936.png";
import { VideoClipCard } from "@/components/video-clip";
import { claudeHacksClips, type VideoClip } from "@/data/claude-hacks";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

interface JourneyPhase {
  title: string;
  slug: string;
  icon: typeof Brain;
  color: string;
  iconBg: string;
  description: string;
  questions: string[];
  modules: JourneyModule[];
}

interface JourneyModule {
  title: string;
  icon: typeof Brain;
  description: string;
  externalUrl: string;
  resources: ModuleResource[];
}

interface ModuleResource {
  title: string;
  type: "video" | "article" | "course" | "tool" | "case-study" | "guide";
  url: string;
  source: string;
}

const journeyPhases: JourneyPhase[] = [
  {
    title: "Curiosity",
    slug: "curiosity",
    icon: Lightbulb,
    color: "from-sky-500/10 to-blue-500/10 dark:from-sky-500/20 dark:to-blue-500/20",
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    description: "Your organization is curious about AI, but has not taken any tangible steps towards planning or implementation.",
    questions: [
      "What is AI and how can it help my organization?",
      "How do we build executive and cultural buy-in for AI?",
      "What does responsible AI look like for nonprofits?"
    ],
    modules: [
      {
        title: "AI 101",
        icon: BookOpen,
        description: "Build a foundational understanding of what AI is, how it can be applied to further an organization's impact, and what the journey to AI adoption might look like.",
        externalUrl: "https://learn.mcgovern.org/AI-101-16b70021ed8c80a18a2ed4dd7f7668c7",
        resources: [
          { title: "AI 101 Module — 30-min Overview", type: "video", url: "https://learn.mcgovern.org/AI-101-Module-15570021ed8c80cdb527f197d7878771", source: "PJMF" },
          { title: "AI Use Case Library", type: "guide", url: "https://learn.mcgovern.org/18f70021ed8c80479916ead19d", source: "PJMF" },
        ],
      },
      {
        title: "Social Responsibility",
        icon: Heart,
        description: "Ensure AI is leveraged responsibly — from fairness and data privacy to environmental sustainability and inclusion. An ongoing foundational layer across all phases of the AI Journey.",
        externalUrl: "https://learn.mcgovern.org/Social-Responsibility-16b70021ed8c80bcbedce413440dd803",
        resources: [
          { title: "Social Responsibility Module", type: "video", url: "https://learn.mcgovern.org/Social-Responsibility-Module-26c70021ed8c8089b694f7d2a7d160b4", source: "PJMF" },
          { title: "Case Study: Social Responsibility Comes First", type: "case-study", url: "https://learn.mcgovern.org/Social-Responsibility-Comes-First-1cf70021ed8c8000b6d4e6bf20626dcc", source: "PJMF" },
        ],
      },
      {
        title: "Organizational Readiness",
        icon: Users,
        description: "Build alignment from key stakeholders — leadership, board, staff, and community. Prepare your organization with policies, expertise, and cross-team collaboration for the AI journey.",
        externalUrl: "https://learn.mcgovern.org/Organizational-Readiness-16b70021ed8c800a9d72fad7ac743135",
        resources: [
          { title: "Case Study: Building Organizational Readiness", type: "case-study", url: "https://learn.mcgovern.org/Building-Organizational-Readiness-1cf70021ed8c80389095d3dd998568e4", source: "PJMF" },
        ],
      },
    ],
  },
  {
    title: "Exploration",
    slug: "exploration",
    icon: Compass,
    color: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    description: "Your organization has aspirations to implement AI and is actively exploring how to make it a reality.",
    questions: [
      "How do we build our data and AI fluency?",
      "Do we have the right data and infrastructure?",
      "Should we build a custom solution or buy off-the-shelf?",
      "How do we plan and budget for an AI project?"
    ],
    modules: [
      {
        title: "Problem Definition",
        icon: Target,
        description: "Take a people-first approach to defining problems. Not taking time to properly understand the problem can lead to solutions that don't meet users' needs, cost more, or fail to gain traction.",
        externalUrl: "https://learn.mcgovern.org/Problem-Definition-10e70021ed8c805eb0bee9c97b93749d",
        resources: [
          { title: "Problem Definition Module — Self-paced Course", type: "course", url: "https://learn.mcgovern.org/Problem-Definition-Module-12e70021ed8c802b8d70dd67ea8bde48", source: "PJMF" },
          { title: "Case Study: Climate Policy Radar", type: "case-study", url: "https://medium.com/patrick-j-mcgovern-foundation/michal-nachmany-unlocking-better-climate-legislation-with-ai-129f5f8d82a0", source: "Medium" },
        ],
      },
      {
        title: "Build vs. Buy",
        icon: Wrench,
        description: "Many AI use cases can be achieved with off-the-shelf tools. Building custom solutions is a big undertaking requiring ongoing maintenance. Learn how to make the right decision for your organization.",
        externalUrl: "https://learn.mcgovern.org/Build-Vs-Buy-16b70021ed8c80a5aa10f3d27358bccb",
        resources: [],
      },
      {
        title: "Data Readiness",
        icon: Database,
        description: "Having good data readiness is critical for effective AI. Think about what data exists, what's still needed, quality of that data, and infrastructure to support safe and successful implementation.",
        externalUrl: "https://learn.mcgovern.org/Data-Readiness-16b70021ed8c80a394d1f53281734132",
        resources: [
          { title: "Case Study: Tackling Data Readiness Challenges", type: "case-study", url: "https://learn.mcgovern.org/Tackling-Data-Readiness-Challenges-2fc70021ed8c80e8bce8ccb913ae9e8a", source: "PJMF" },
        ],
      },
      {
        title: "AI Project Planning",
        icon: FileText,
        description: "Plan for AI-specific components: building the right team, budgeting for infrastructure, auditing for biases, and planning model training, testing, deployment, and monitoring.",
        externalUrl: "https://learn.mcgovern.org/AI-Project-Planning-16b70021ed8c800e875be3a0b82c6ecf",
        resources: [],
      },
      {
        title: "Funding AI Innovation",
        icon: HandHeart,
        description: "Secure funding for your AI innovations. Learn guiding principles for shaping strong tech proposals and put your best foot forward with funding partners.",
        externalUrl: "https://learn.mcgovern.org/Funding-AI-Innovation-1c070021ed8c8046ac8ce288c30515ae",
        resources: [],
      },
    ],
  },
  {
    title: "Adoption",
    slug: "adoption",
    icon: Rocket,
    color: "from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    description: "Your organization has adopted AI and is testing, evaluating, or refining an AI-based solution.",
    questions: [
      "How do we select the right AI model?",
      "How do we test, evaluate, and refine our solution?",
      "What data governance practices should be in place?"
    ],
    modules: [
      {
        title: "Data Governance",
        icon: Shield,
        description: "People, processes, and technology to ensure data is effectively managed throughout its lifecycle — from collection and processing to storage, retention, and deletion.",
        externalUrl: "https://learn.mcgovern.org/Data-Governance-27d70021ed8c8088bf35fb83b7742ba1",
        resources: [],
      },
      {
        title: "AI Model Development",
        icon: Brain,
        description: "Develop an effective AI model: from training and fine-tuning to evaluation and safe deployment. Learn the technical and ethical considerations at each stage.",
        externalUrl: "https://learn.mcgovern.org/AI-Model-Development-27d70021ed8c80f3a2c0db2d7f5572db",
        resources: [],
      },
      {
        title: "Product Development",
        icon: Code,
        description: "Build user interfaces for AI models. Create user testing plans, prototype, and get feedback. Ensure social responsibility principles show up in the product.",
        externalUrl: "https://learn.mcgovern.org/Product-Development-27d70021ed8c807bacf1e43e58a9156f",
        resources: [],
      },
      {
        title: "AI Strategy",
        icon: BarChart3,
        description: "Establish concrete metrics, invest in learning and evaluation processes to track progress. Your AI strategy can evolve as you gain more experience.",
        externalUrl: "https://learn.mcgovern.org/AI-Strategy-27d70021ed8c801f9533e21d69b830fe",
        resources: [],
      },
    ],
  },
  {
    title: "Impact",
    slug: "impact",
    icon: TrendingUp,
    color: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    description: "Your organization has a working solution and is looking to start scaling up and/or optimizing for greater impact.",
    questions: [
      "How can we optimize our solution for more effectiveness?",
      "How do we overcome scaling challenges?",
      "How can we strengthen the wider ecosystem?"
    ],
    modules: [
      {
        title: "Evolution",
        icon: Sparkles,
        description: "Continue improving your solution's impact and ensure it evolves with new technology best practices and emerging needs.",
        externalUrl: "https://learn.mcgovern.org/Evolution-27d70021ed8c80228d8bf62072abe970",
        resources: [],
      },
      {
        title: "Scaling",
        icon: TrendingUp,
        description: "Once confident your AI solution works, learn how to scale it to new audiences, geographies, and use cases.",
        externalUrl: "https://learn.mcgovern.org/Scaling-27d70021ed8c806c8c85e12f7558f23a",
        resources: [],
      },
      {
        title: "Strengthening the Ecosystem",
        icon: Globe,
        description: "Amplify learnings to create impact beyond direct programs. Share through open-sourcing, strategic collaborations, white papers, and documenting lessons learned.",
        externalUrl: "https://learn.mcgovern.org/Strengthening-the-Ecosystem-27d70021ed8c803c8dcffd09ac994559",
        resources: [],
      },
      {
        title: "Direct + Indirect Effects",
        icon: Leaf,
        description: "Assess current effects, anticipate future ones, and mitigate negative impacts or unintended side effects on communities, the environment, and society.",
        externalUrl: "https://learn.mcgovern.org/Direct-Indirect-Effects-27d70021ed8c80289784e7225cf4b022",
        resources: [],
      },
    ],
  },
];

const foundationalLayers = [
  {
    title: "Social Responsibility",
    icon: Heart,
    description: "Ethics, IDEA (Inclusion, Diversity, Equity, and Accessibility), safety, security, and sustainability of an organization's data and AI usage."
  },
  {
    title: "AI Strategy",
    icon: Target,
    description: "How AI can be applied in a way that furthers the mission of an organization."
  },
  {
    title: "Stakeholder Engagement & Training",
    icon: Users,
    description: "Opportunities to engage with AI planning/adoption and training to keep staff and stakeholders included at each step."
  },
  {
    title: "Data Management & Governance",
    icon: Database,
    description: "Management of data across the lifecycle (collection, processing, storage, retention, deletion) and associated policies and roles."
  },
  {
    title: "Technology",
    icon: Layers,
    description: "Infrastructure, models, databases, tools used to manage data and/or AI solutions."
  },
];

const caseStudies = [
  {
    title: "Tackling Data Readiness Challenges",
    url: "https://learn.mcgovern.org/Tackling-Data-Readiness-Challenges-2fc70021ed8c80e8bce8ccb913ae9e8a",
    phase: "Exploration",
  },
  {
    title: "Building Organizational Readiness",
    url: "https://learn.mcgovern.org/Building-Organizational-Readiness-1cf70021ed8c80389095d3dd998568e4",
    phase: "Curiosity",
  },
  {
    title: "Social Responsibility Comes First",
    url: "https://learn.mcgovern.org/Social-Responsibility-Comes-First-1cf70021ed8c8000b6d4e6bf20626dcc",
    phase: "Curiosity",
  },
];

type Level = "beginner" | "intermediate" | "advanced" | "all";

interface TrainingResource {
  title: string;
  channel: string;
  url: string;
  description: string;
  level: Exclude<Level, "all">;
  category: string;
  duration: string;
  isFree: boolean;
}

const trainingResources: TrainingResource[] = [
  {
    title: "But what is a neural network?",
    channel: "3Blue1Brown",
    url: "https://www.youtube.com/@3blue1brown",
    description: "Beautiful visual explanations of neural networks and deep learning fundamentals. The best starting point for understanding how AI actually works.",
    level: "beginner",
    category: "AI Foundations",
    duration: "Series",
    isFree: true,
  },
  {
    title: "Neural Networks: Zero to Hero",
    channel: "Andrej Karpathy",
    url: "https://www.youtube.com/@AndrejKarpathy",
    description: "Build neural networks from scratch in Python. Former Tesla AI Director walks you through building GPT-level models step by step.",
    level: "intermediate",
    category: "Deep Learning",
    duration: "Series",
    isFree: true,
  },
  {
    title: "Machine Learning Specialization",
    channel: "Stanford Online",
    url: "https://www.youtube.com/@stanfordonline",
    description: "Andrew Ng's legendary Stanford ML course. Covers linear regression, neural networks, SVMs, clustering, and more with mathematical rigor.",
    level: "intermediate",
    category: "Machine Learning",
    duration: "Full Course",
    isFree: true,
  },
  {
    title: "Machine Learning & AI for Beginners",
    channel: "freeCodeCamp",
    url: "https://www.youtube.com/@freecodecamp",
    description: "Comprehensive free courses covering Python for AI, TensorFlow, PyTorch, and practical machine learning projects from scratch.",
    level: "beginner",
    category: "Machine Learning",
    duration: "Full Course",
    isFree: true,
  },
  {
    title: "Deep Learning Specialization",
    channel: "DeepLearning.AI",
    url: "https://www.youtube.com/@Deeplearningai",
    description: "Andrew Ng's deep learning course series covering CNNs, RNNs, transformers, and practical deep learning strategies.",
    level: "advanced",
    category: "Deep Learning",
    duration: "Full Course",
    isFree: true,
  },
  {
    title: "Python Machine Learning Tutorials",
    channel: "sentdex",
    url: "https://www.youtube.com/@sentdex",
    description: "Practical Python tutorials for machine learning, neural networks, data analysis, and building AI applications with real-world datasets.",
    level: "beginner",
    category: "Machine Learning",
    duration: "Series",
    isFree: true,
  },
  {
    title: "AI Research Paper Reviews",
    channel: "Two Minute Papers",
    url: "https://www.youtube.com/@TwoMinutePapers",
    description: "Quick, accessible explanations of cutting-edge AI research papers. Stay up to date on the latest breakthroughs in AI and ML.",
    level: "advanced",
    category: "AI Foundations",
    duration: "Ongoing",
    isFree: true,
  },
  {
    title: "ML Paper Explanations & Coding",
    channel: "Yannic Kilcher",
    url: "https://www.youtube.com/@YannicKilcher",
    description: "In-depth explanations of machine learning research papers with code walkthroughs. Covers transformers, GANs, reinforcement learning, and more.",
    level: "advanced",
    category: "Deep Learning",
    duration: "Ongoing",
    isFree: true,
  },
  {
    title: "StatQuest: ML Statistics Explained",
    channel: "StatQuest",
    url: "https://www.youtube.com/@statquest",
    description: "Statistics and machine learning concepts explained clearly with fun illustrations. Perfect for understanding the math behind ML algorithms.",
    level: "beginner",
    category: "AI Foundations",
    duration: "Series",
    isFree: true,
  },
  {
    title: "Python AI & ML Projects",
    channel: "Tech With Tim",
    url: "https://www.youtube.com/@TechWithTim",
    description: "Hands-on Python tutorials building real AI projects including chatbots, game AI, neural networks, and machine learning applications.",
    level: "beginner",
    category: "Tools & Projects",
    duration: "Series",
    isFree: true,
  },
  {
    title: "Computer Vision & Object Detection",
    channel: "Nicholas Renotte",
    url: "https://www.youtube.com/@NicholasRenotte",
    description: "Practical computer vision tutorials using TensorFlow, PyTorch, and OpenCV. Build real-world object detection and image classification systems.",
    level: "intermediate",
    category: "Computer Vision",
    duration: "Series",
    isFree: true,
  },
  {
    title: "NLP with Transformers",
    channel: "Corey Schafer",
    url: "https://www.youtube.com/@coreyms",
    description: "Python programming tutorials with excellent coverage of NLP libraries, data processing, and building AI-powered text applications.",
    level: "intermediate",
    category: "NLP & Language",
    duration: "Series",
    isFree: true,
  },
];

interface OpenSourceTool {
  name: string;
  description: string;
  url: string;
  github: string;
  category: string;
  icon: typeof Brain;
  difficulty: Exclude<Level, "all">;
}

const openSourceTools: OpenSourceTool[] = [
  {
    name: "PyTorch",
    description: "Leading deep learning framework by Meta. Flexible, Pythonic, and widely used in research and production for building neural networks.",
    url: "https://pytorch.org",
    github: "https://github.com/pytorch/pytorch",
    category: "Deep Learning",
    icon: Zap,
    difficulty: "intermediate",
  },
  {
    name: "TensorFlow",
    description: "Google's end-to-end ML platform. Excellent for production deployment, mobile/edge AI, and large-scale distributed training.",
    url: "https://www.tensorflow.org",
    github: "https://github.com/tensorflow/tensorflow",
    category: "Deep Learning",
    icon: Layers,
    difficulty: "intermediate",
  },
  {
    name: "Hugging Face Transformers",
    description: "The go-to library for state-of-the-art NLP models. Access thousands of pre-trained models for text, vision, and audio tasks.",
    url: "https://huggingface.co",
    github: "https://github.com/huggingface/transformers",
    category: "NLP & Models",
    icon: Bot,
    difficulty: "intermediate",
  },
  {
    name: "scikit-learn",
    description: "The essential ML library for Python. Simple, efficient tools for classification, regression, clustering, and data preprocessing.",
    url: "https://scikit-learn.org",
    github: "https://github.com/scikit-learn/scikit-learn",
    category: "Machine Learning",
    icon: BarChart3,
    difficulty: "beginner",
  },
  {
    name: "LangChain",
    description: "Framework for building applications powered by LLMs. Chain prompts, agents, and tools together for complex AI workflows.",
    url: "https://www.langchain.com",
    github: "https://github.com/langchain-ai/langchain",
    category: "LLM Apps",
    icon: Code,
    difficulty: "intermediate",
  },
  {
    name: "Ollama",
    description: "Run large language models locally on your machine. Easy setup, privacy-preserving, and supports models like Llama, Mistral, and more.",
    url: "https://ollama.com",
    github: "https://github.com/ollama/ollama",
    category: "Local AI",
    icon: Globe,
    difficulty: "beginner",
  },
  {
    name: "FastAI",
    description: "Makes deep learning accessible with high-level APIs. Build world-class models in just a few lines of code. Great for learning and prototyping.",
    url: "https://www.fast.ai",
    github: "https://github.com/fastai/fastai",
    category: "Deep Learning",
    icon: Zap,
    difficulty: "beginner",
  },
  {
    name: "Stable Diffusion (CompVis)",
    description: "Open source image generation model. Create, edit, and transform images using AI. The foundation for many creative AI tools.",
    url: "https://huggingface.co/CompVis/stable-diffusion",
    github: "https://github.com/CompVis/stable-diffusion",
    category: "Image Generation",
    icon: Sparkles,
    difficulty: "advanced",
  },
];

const levelColors = {
  beginner: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
};

const levelLabels = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const resourceTypeLabels: Record<string, string> = {
  video: "Video",
  article: "Article",
  course: "Course",
  tool: "Tool",
  "case-study": "Case Study",
  guide: "Guide",
};

const interestCategories = [
  "AI Foundations",
  "Machine Learning",
  "Deep Learning",
  "NLP & Language",
  "Computer Vision",
  "Tools & Projects",
] as const;

const builderTemplates = [
  {
    title: "Build Your First RAG App",
    blurb: "Ground a chatbot in your own documents. Vector store, embeddings, retrieval, generation — end-to-end.",
    stack: ["LangChain", "Chroma", "OpenAI"],
    icon: Database,
    accent: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20",
    iconBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    primaryLabel: "Open the RAG Tutorial",
    primaryUrl: "https://python.langchain.com/docs/tutorials/rag/",
    secondaryLabel: "RAG Cookbook (HuggingFace)",
    secondaryUrl: "https://huggingface.co/learn/cookbook/en/rag_with_hf_and_milvus",
  },
  {
    title: "Create a Personal AI Agent",
    blurb: "An agent with memory, tools, and goals. Calls APIs, reasons over results, returns answers — not just text.",
    stack: ["LangGraph", "Tools", "Memory"],
    icon: Bot,
    accent: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20",
    iconBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    primaryLabel: "HuggingFace Agents Course",
    primaryUrl: "https://huggingface.co/learn/agents-course/unit0/introduction",
    secondaryLabel: "LangGraph Quickstart",
    secondaryUrl: "https://langchain-ai.github.io/langgraph/tutorials/introduction/",
  },
  {
    title: "Event Assistant Bot",
    blurb: "A grounded chat assistant for your events page — answers questions about programs, board, and signups.",
    stack: ["Humanity + AI Hub", "OpenAI", "Live"],
    icon: MessageSquare,
    accent: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20",
    iconBg: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    primaryLabel: "Try Our AI Hub Live",
    primaryUrl: "/ai-hub",
    primaryInternal: true,
    secondaryLabel: "OpenAI Quickstart",
    secondaryUrl: "https://platform.openai.com/docs/quickstart",
  },
];

const responsibleAIPrinciples = [
  {
    icon: Eye,
    title: "Transparency",
    desc: "Every model, prompt, and pipeline is explainable end-to-end. No black boxes shipped to people who can't audit them.",
  },
  {
    icon: HandHeart,
    title: "Accountability",
    desc: "Every AI decision has a named human owner. Escalation paths are written before launch, not after harm.",
  },
  {
    icon: Scale,
    title: "Fairness & Equity",
    desc: "Bias is measured, monitored, and reported on — across groups, regions, and use cases. Not assumed away.",
  },
  {
    icon: Shield,
    title: "Privacy & Consent",
    desc: "Data dignity is non-negotiable. Minimum data, maximum protection, clear consent. Forever.",
  },
  {
    icon: Layers,
    title: "Safety & Resilience",
    desc: "Systems are designed to fail gracefully and visibly — not silently or catastrophically. Red-team before ship.",
  },
];

const buildResponsiblyCheckpoints = [
  {
    phase: "Before You Build",
    icon: Compass,
    items: [
      "Define the risk class (low / medium / high impact on people)",
      "Identify who is affected if it gets it wrong",
      "Document the decision — what is the AI replacing or assisting?",
    ],
  },
  {
    phase: "During Build",
    icon: Code,
    items: [
      "Run bias audits across representative data slices",
      "Add explainability checks to every model output",
      "Log prompts, responses, and model versions for reproducibility",
    ],
  },
  {
    phase: "Before Deploy",
    icon: ShieldCheck,
    items: [
      "Human-in-the-loop review for any decision affecting people",
      "Red-team adversarial cases — including non-English, edge cases",
      "Sign-off from a named accountable owner",
    ],
  },
  {
    phase: "After Deploy",
    icon: TrendingUp,
    items: [
      "Monitor drift in model behavior and outcomes by group",
      "Open a clear feedback channel for users to flag harm",
      "Schedule re-audits — quarterly minimum for high-risk systems",
    ],
  },
];

interface LearningModule {
  slug: string;
  title: string;
  subtitle: string;
  provider: string;
  description: string;
  format: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  steps?: number;
  price: string;
  /** External "Start the Module" link. Omit for modules whose content is embedded (e.g. video series). */
  url?: string;
  tags: string[];
  outcomes: string[];
  requirements?: string;
  relatedEvent?: { label: string; date: string; url: string };
  /** Embedded video clips rendered inside the module card (streamed from Azure Blob Storage). */
  videos?: VideoClip[];
  icon?: typeof Rocket;
}

// Self-paced learning modules. Add new entries here — the "Modules" section
// on the Learning Hub renders this list in order.
const learningModules: LearningModule[] = [
  {
    slug: "claude-hacks",
    title: "Claude Hacks",
    subtitle: "Short video hacks for getting real work done with Claude",
    provider: "Video series · hosted by Danielle A. Franklin, Founder",
    description:
      "Bite-sized screen recordings from the Humanity + AI founder showing exactly how we use Claude to run a nonprofit — Projects, Cowork, and repeatable workflows. Watch a clip, copy the move, use it today. New episodes drop regularly; the newest are at the top.",
    format: "Video series",
    duration: `${claudeHacksClips.length} clips · ~${claudeHacksClips.reduce((n, c) => n + parseInt(c.duration, 10), 0)} min`,
    level: "Beginner",
    price: "Free",
    tags: ["Claude", "Projects", "Cowork", "Nonprofit Ops"],
    outcomes: [
      "Set up a Claude Project so it remembers your organization's context",
      "Kick off tasks in Cowork instead of re-explaining yourself every chat",
      "Turn a recurring chore into a workflow you can rerun in minutes",
    ],
    requirements: "A Claude account (free tier works). No coding.",
    videos: claudeHacksClips,
    icon: Video,
  },
  {
    slug: "build-your-first-website",
    title: "Build Your First Website",
    subtitle: "From idea to a live, secure web app with Claude",
    provider: "Feedback Lab · guide by William Zhu",
    description:
      "A beginner-friendly, step-by-step guide for non-coders who want to turn an idea into a working website using AI. You describe the features you want, Claude generates the code, and by the end you have a real app at a public web address with a secure backup. No coding experience required.",
    format: "Self-paced interactive guide",
    duration: "~45 min",
    level: "Beginner",
    steps: 21,
    price: "Free",
    url: "https://feedbacklab.app/workshop",
    tags: ["No-Code", "Claude", "Deploy to the Web", "Hands-On"],
    outcomes: [
      "Set up Claude and build a working web app from a plain-English idea",
      "Deploy it to a live, shareable web address",
      "Secure it and keep a backup of your code",
    ],
    requirements: "A laptop and an idea. Accounts on Claude and Vercel are recommended.",
    relatedEvent: {
      label: "Join the in-person workshop",
      date: "Sep 17",
      url: "/events",
    },
  },
];

export default function Training() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<Level>("all");
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [, setLocation] = useLocation();
  const { data: campaigns } = useQuery<CampaignProgress[]>({ queryKey: ["/api/campaigns"] });
  const trainingFund = campaigns?.find((c) => c.slug === "ai-training-fund");

  const toggleInterest = (cat: string) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const filteredResources = trainingResources.filter((r) => {
    const matchesSearch =
      searchQuery === "" ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === "all" || r.level === selectedLevel;
    const matchesInterest =
      selectedInterests.size === 0 || selectedInterests.has(r.category);
    return matchesSearch && matchesLevel && matchesInterest;
  });

  const filteredTools = openSourceTools.filter((t) => {
    const matchesSearch =
      searchQuery === "" ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === "all" || t.difficulty === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div>
      <PageMeta
        title="AI Learning Hub — Courses, Paths & Tools"
        description="Access free AI education resources, hands-on courses, structured learning paths, and open-source tools curated by Humanity + AI, Inc. for all skill levels."
        canonical="/training"
      />
      <EditorialMasthead kicker="Learn With Us" title="Learning Hub" tagline="Courses, Paths & Tools" />

      {/* === Phase 1: Builder Lab (moved to top) === */}
      <section className="py-20 bg-gradient-to-br from-background via-background to-primary/5" id="builder-lab" data-testid="section-builder-lab">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest mb-4">
              <Wrench className="h-3 w-3" />
              The Builder Lab
            </div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-4" data-testid="text-builder-lab-title">
              Stop reading about AI. <span className="italic font-light text-primary">Start shipping it.</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed font-serif">
              Three production-ready starter projects, each built on the actual stack used by working AI teams. Open the tutorial, follow along, and have something running today — not someday.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {builderTemplates.map((tpl, i) => (
              <motion.div
                key={tpl.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className={`p-6 h-full flex flex-col bg-gradient-to-br ${tpl.accent} border-foreground/10`} data-testid={`card-builder-${i}`}>
                  <div className={`w-12 h-12 rounded-lg ${tpl.iconBg} flex items-center justify-center mb-4`}>
                    <tpl.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold mb-2">{tpl.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{tpl.blurb}</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {tpl.stack.map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px] bg-background/60">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    {tpl.primaryInternal ? (
                      <Link href={tpl.primaryUrl}>
                        <Button size="sm" className="w-full gap-2" data-testid={`button-builder-primary-${i}`}>
                          {tpl.primaryLabel}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    ) : (
                      <a href={tpl.primaryUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="w-full gap-2" data-testid={`button-builder-primary-${i}`}>
                          {tpl.primaryLabel}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                    <a href={tpl.secondaryUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="w-full gap-2 text-xs" data-testid={`button-builder-secondary-${i}`}>
                        {tpl.secondaryLabel}
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeIn} className="mt-10 p-6 border border-dashed border-foreground/15 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold">In-browser Builder Lab — coming soon</p>
                <p className="text-xs text-muted-foreground mt-1 font-serif">Live RAG pipelines, agent runners, and vector store playgrounds — running right here on the page. Until then, the templates above are the fastest path.</p>
              </div>
            </div>
            <Link href="/contact">
              <Button variant="outline" size="sm" className="gap-2 shrink-0" data-testid="button-builder-lab-interest">
                I want early access
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* === Phase 1: Jofia's Board-Led Course Series (moved up after Builder Lab) === */}
      <section className="py-16 bg-gradient-to-br from-purple-500/5 via-background to-primary/5" id="board-led-series">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-medium mb-4">
              <Star className="h-3.5 w-3.5" />
              Featured from Our Board
            </div>
            <h2 className="font-serif text-3xl font-bold mb-3" data-testid="text-board-led-courses">
              Board-Led AI & ML Course Series
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Curated learning paths from Humanity + AI's own board members — taking you from foundational concepts to production-grade AI systems.
            </p>
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.1, duration: 0.5 }}>
            <Card className="overflow-hidden" data-testid="card-jofia-courses">
              <div className="grid md:grid-cols-3 gap-0">
                <div className="md:col-span-1 bg-gradient-to-br from-purple-500/10 to-primary/10 dark:from-purple-500/20 dark:to-primary/20 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden ring-4 ring-background shadow-lg mb-4">
                      <img
                        src={jofiaPhoto}
                        alt="Jofiah Jose Prakash"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <h3 className="font-semibold text-base" data-testid="text-jofia-name">Jofiah Jose Prakash</h3>
                    <p className="text-xs text-primary font-medium mt-1">AI Ethics & Governance Director</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Humanity + AI · Board Seat 2</p>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mt-2">
                      <Award className="h-3 w-3" />
                      4 AI Patents · 15+ Years
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 p-8">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                      Beginner → Advanced
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">AI & Machine Learning</Badge>
                    <Badge variant="outline" className="text-[10px]">Structured Curriculum</Badge>
                  </div>
                  <h3 className="font-serif text-2xl font-bold mb-3" data-testid="text-jofia-course-title">
                    AI &amp; ML Courses — Beginner to Advanced
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    A structured course series from Humanity + AI board director and Enterprise AI Architect Jofiah Jose Prakash, taking learners from foundational concepts through advanced enterprise AI architecture. Drawing on her work designing AI systems at the American Chemical Society and her four AI patents, the curriculum covers Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), agentic AI systems, and production AI patterns — built for practitioners who want depth alongside responsible-AI grounding.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Foundations to Frontier</p>
                        <p className="text-[11px] text-muted-foreground">From AI/ML basics to LLMs, RAG, and agentic systems.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Ethics-Forward</p>
                        <p className="text-[11px] text-muted-foreground">Responsible AI governance built into every level.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Enterprise-Grade</p>
                        <p className="text-[11px] text-muted-foreground">Patterns from real-world production AI architecture.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">For Practitioners</p>
                        <p className="text-[11px] text-muted-foreground">Engineers, architects, and AI/ML team leaders.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a href="https://www.thejofia.com/ai-ml-courses-beginner-to-advanced" target="_blank" rel="noopener noreferrer">
                      <Button className="gap-1.5" data-testid="button-jofia-courses">
                        <ExternalLink className="h-4 w-4" />
                        Explore the Course Series
                      </Button>
                    </a>
                    <Link href="/about/board/jofia-jose-prakash">
                      <Button variant="outline" className="gap-1.5" data-testid="button-jofia-profile">
                        <ArrowRight className="h-4 w-4" />
                        View Jofia's Board Profile
                      </Button>
                    </Link>
                    <a href="https://www.linkedin.com/in/jofiajoseprakash/" target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" data-testid="button-jofia-linkedin">
                        <SiLinkedin className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.2, duration: 0.5 }} className="mt-6">
            <Card className="overflow-hidden" data-testid="card-rag-series">
              <div className="grid md:grid-cols-3 gap-0">
                <div className="md:col-span-1 bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                    <Layers className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold leading-tight" data-testid="text-rag-series-title">
                    RAG Architecture Series
                  </h3>
                  <p className="text-xs text-primary font-medium mt-1">From Core Loop to Agentic Systems</p>
                  <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground mt-3">
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> 6 Parts</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 45 min</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3">By Jofiah Jose Prakash · Board Seat 2</p>
                </div>
                <div className="md:col-span-2 p-8">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Production RAG</Badge>
                    <Badge variant="outline" className="text-[10px]">Architecture Patterns</Badge>
                    <Badge variant="outline" className="text-[10px]">Engineering Deep-Dive</Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-5">
                    Six patterns that define production RAG architecture — what each one does, what it costs, and when it earns its complexity. Covering query understanding, context selection, evidence quality, evaluation, and production behaviour, with architecture diagrams and engineering reasoning for every pattern.
                  </p>
                  <div className="space-y-1.5 mb-6">
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
                        className="flex items-center gap-3 p-2.5 rounded-md hover-elevate group"
                        data-testid={`link-rag-part-${part.n}`}
                      >
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {part.n}
                        </span>
                        <span className="text-sm font-medium flex-1 group-hover:text-primary transition-colors">
                          Part {part.n}: {part.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {part.mins}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </a>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a href="https://www.thejofia.com/rag-architecture-series" target="_blank" rel="noopener noreferrer">
                      <Button className="gap-1.5" data-testid="button-rag-series">
                        <ExternalLink className="h-4 w-4" />
                        Explore the RAG Series
                      </Button>
                    </a>
                    <Link href="/about/board/jofia-jose-prakash">
                      <Button variant="outline" className="gap-1.5" data-testid="button-rag-jofia-profile">
                        <ArrowRight className="h-4 w-4" />
                        View Jofia's Board Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-card border-y" id="modules" data-testid="section-modules">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <GraduationCap className="h-3.5 w-3.5" />
              Self-Paced Learning
            </div>
            <h2 className="font-serif text-3xl font-bold mb-3" data-testid="text-modules-title">
              Modules
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Short, hands-on modules you can complete on your own schedule — each one ends with something real you built. New modules are added regularly.
            </p>
          </motion.div>

          <div className="space-y-6">
            {learningModules.map((m, i) => (
              <motion.div key={m.slug} {...fadeIn} transition={{ delay: 0.05 * i, duration: 0.5 }}>
                <Card className="overflow-hidden" data-testid={`card-module-${m.slug}`}>
                  <div className="grid md:grid-cols-3 gap-0">
                    <div className="md:col-span-1 bg-gradient-to-br from-primary/10 to-accent/20 dark:from-primary/20 dark:to-accent/10 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                        {(() => { const Icon = m.icon ?? Rocket; return <Icon className="h-8 w-8 text-primary" />; })()}
                      </div>
                      <h3 className="font-serif text-xl font-bold leading-tight" data-testid={`text-module-title-${m.slug}`}>
                        {m.title}
                      </h3>
                      <p className="text-xs text-primary font-medium mt-1">{m.subtitle}</p>
                      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground mt-3">
                        {m.steps && (
                          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {m.steps} Steps</span>
                        )}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {m.duration}</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {m.level}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-3">{m.provider}</p>
                    </div>
                    <div className="md:col-span-2 p-8">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{m.format}</Badge>
                        <Badge variant="outline" className="text-[10px]">{m.price}</Badge>
                        {m.tags.map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                      <p className="text-muted-foreground leading-relaxed mb-5">{m.description}</p>
                      <div className="mb-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">You'll walk away with</h4>
                        <ul className="space-y-1.5">
                          {m.outcomes.map((o) => (
                            <li key={o} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>{o}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {m.requirements && (
                        <p className="text-xs text-muted-foreground mb-5">
                          <span className="font-semibold text-foreground">What you need:</span> {m.requirements}
                        </p>
                      )}
                      {m.videos && m.videos.length > 0 && (
                        <div className="mb-6" id={m.slug} data-testid={`videos-module-${m.slug}`}>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Watch the clips</h4>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {m.videos.map((clip) => (
                              <VideoClipCard key={clip.id} clip={clip} compact />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        {m.url && (
                          <a href={m.url} target="_blank" rel="noopener noreferrer">
                            <Button className="gap-1.5" data-testid={`button-module-start-${m.slug}`}>
                              Start the Module
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                        {m.relatedEvent && (
                          <Link href={m.relatedEvent.url}>
                            <Button variant="outline" className="gap-1.5" data-testid={`button-module-event-${m.slug}`}>
                              <Users className="h-3.5 w-3.5" />
                              {m.relatedEvent.label} · {m.relatedEvent.date}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div {...fadeIn} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <GraduationCap className="h-3.5 w-3.5" />
              Learning Hub
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6" data-testid="text-training-title">
              AI Learning <span className="text-primary">Hub</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              A comprehensive resource for organizations at every stage of the AI journey. Curated from the <a href="https://learn.mcgovern.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">PJMF Learning Hub</a>, world-class educators, and open source communities.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Whether you're just curious about AI or scaling an existing solution, find the resources, case studies, and tools to guide your organization's journey.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/ai-hub">
                <Button size="lg" className="gap-2" data-testid="button-try-ai-hub">
                  <Sparkles className="h-4 w-4" />
                  Try Our AI Hub
                </Button>
              </Link>
              <a href="https://learn.mcgovern.org" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-pjmf-hub">
                  <ExternalLink className="h-4 w-4" />
                  Visit PJMF Hub
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* === Phase 1: Pillar Bar — Learn / Build / Publish / Connect === */}
      <section className="py-12 border-y bg-card" data-testid="section-pillars">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-8">
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
              The System
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
              Learn · Build · Publish · Connect
            </h2>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              An ecosystem — not a content site. Move from learning AI, to building real systems, to publishing your work, to joining a community that does the same.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: "01", label: "Learn", desc: "Structured paths from curiosity to enterprise-grade AI.", icon: GraduationCap, action: () => scrollToId("ai-journey"), cta: "Explore Paths" },
              { num: "02", label: "Build", desc: "Launch-ready RAG, agents, and assistants — real templates, real stacks.", icon: Wrench, action: () => scrollToId("builder-lab"), cta: "Open Builder Lab" },
              { num: "03", label: "Publish", desc: "Share your experiments, essays, and case studies in our open library.", icon: BookOpen, href: "/blog", cta: "Visit the Blog" },
              { num: "04", label: "Connect", desc: "Workshops, board AMAs, and a community building responsibly together.", icon: Users, href: "/events", cta: "See Events" },
            ].map((p, i) => (
              <motion.div
                key={p.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Card
                  className="p-6 h-full hover-elevate cursor-pointer group flex flex-col"
                  onClick={() => (p.action ? p.action() : setLocation(p.href!))}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); p.action ? p.action() : setLocation(p.href!); } }}
                  tabIndex={0}
                  role="button"
                  data-testid={`card-pillar-${p.label.toLowerCase()}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-serif text-2xl text-muted-foreground/70">{p.num}</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold mb-2">{p.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{p.desc}</p>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary group-hover:gap-3 transition-all">
                    {p.cta}
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === Phase 1: Quick-Jump Use-Case Chips === */}
      <section className="py-8 bg-background border-b" data-testid="section-quick-jump">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Compass className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-foreground">Take Me To</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Build a RAG App", id: "builder-lab", icon: Database },
                { label: "Create an AI Agent", id: "builder-lab", icon: Bot },
                { label: "Responsible AI", id: "responsible-ai", icon: Shield },
                { label: "AI Foundations", id: "ai-journey", icon: Brain },
                { label: "Modules", id: "modules", icon: GraduationCap },
                { label: "Free Courses", id: "video-courses", icon: SiYoutube },
                { label: "Tools & Frameworks", id: "open-source-tools", icon: Wrench },
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => scrollToId(q.id)}
                  className="flex items-center gap-1.5 text-xs font-medium border border-foreground/15 px-3 py-1.5 rounded-full hover:bg-foreground hover:text-background transition-colors"
                  data-testid={`chip-quickjump-${i}`}
                >
                  <q.icon className="h-3 w-3" />
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16" id="ai-journey">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeIn} className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="font-serif text-3xl font-bold mb-4 text-[#14201B]" data-testid="text-ai-journey">The AI Journey</h2>
                <p className="text-[#4B5F55] leading-relaxed">
                  All organizations are in an ongoing process of moving from a current state of using data and AI to a desired next state. Resources are organized according to four phases: <strong>Curiosity</strong>, <strong>Exploration</strong>, <strong>Adoption</strong>, and <strong>Impact</strong>.
                </p>
                <p className="text-sm text-[#4B5F55] mt-3">
                  Content curated from the{" "}
                  <a href="https://learn.mcgovern.org" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
                    Patrick J. McGovern Foundation Learning Hub
                  </a>
                </p>
              </motion.div>

              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {journeyPhases.map((phase, i) => (
                  <motion.div
                    key={phase.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <Card
                      className={`p-5 cursor-pointer transition-all h-full ${
                        activePhase === phase.slug
                          ? "ring-2 ring-primary shadow-lg"
                          : "hover:shadow-md"
                      } bg-gradient-to-br ${phase.color}`}
                      onClick={() => setActivePhase(activePhase === phase.slug ? null : phase.slug)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActivePhase(activePhase === phase.slug ? null : phase.slug); } }}
                      tabIndex={0}
                      role="button"
                      data-testid={`card-phase-${phase.slug}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg ${phase.iconBg} flex items-center justify-center`}>
                          <phase.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Phase {i + 1}</div>
                          <h3 className="font-semibold">{phase.title}</h3>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{phase.description}</p>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        {phase.modules.length} modules
                        <ChevronRight className={`h-3 w-3 transition-transform ${activePhase === phase.slug ? "rotate-90" : ""}`} />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {activePhase && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  {(() => {
                    const phase = journeyPhases.find((p) => p.slug === activePhase);
                    if (!phase) return null;
                    return (
                      <Card className="p-6 mb-8" data-testid={`panel-phase-${activePhase}`}>
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`w-12 h-12 rounded-xl ${phase.iconBg} flex items-center justify-center`}>
                            <phase.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-serif text-xl font-bold">{phase.title} Phase</h3>
                            <p className="text-sm text-muted-foreground">{phase.description}</p>
                          </div>
                        </div>

                        <div className="mb-6">
                          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">You may be asking</h4>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {phase.questions.map((q, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                {q}
                              </div>
                            ))}
                          </div>
                        </div>

                        <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Modules</h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {phase.modules.map((mod, i) => (
                            <Card key={i} className="p-4 hover:shadow-md transition-shadow" data-testid={`card-module-${phase.slug}-${i}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-md ${phase.iconBg} flex items-center justify-center`}>
                                  <mod.icon className="h-4 w-4" />
                                </div>
                                <h5 className="font-semibold text-sm">{mod.title}</h5>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{mod.description}</p>
                              {mod.resources.length > 0 && (
                                <div className="space-y-1.5 mb-3">
                                  {mod.resources.map((res, j) => (
                                    <a key={j} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{resourceTypeLabels[res.type]}</Badge>
                                      <span className="truncate">{res.title}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                              <a href={mod.externalUrl} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="ghost" className="w-full gap-1.5 text-xs h-8" data-testid={`button-module-${phase.slug}-${i}`}>
                                  Explore on PJMF Hub
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </a>
                            </Card>
                          ))}
                        </div>
                      </Card>
                    );
                  })()}
                </motion.div>
              )}

              {!activePhase && (
                <motion.div {...fadeIn} className="text-center py-4">
                  <p className="text-sm text-[#4B5F55]">Click a phase above to explore its modules and resources</p>
                </motion.div>
              )}
            </div>
          </section>

          <section className="py-16 bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="font-serif text-2xl font-bold mb-3" data-testid="text-foundational-layers">Foundational Layers</h2>
                <p className="text-sm text-muted-foreground">
                  Ongoing areas of focus that become more advanced as the journey progresses, applicable across all phases.
                </p>
              </motion.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {foundationalLayers.map((layer, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  >
                    <Card className="p-4 h-full text-center" data-testid={`card-layer-${i}`}>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <layer.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm mb-2">{layer.title}</h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{layer.description}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeIn}>
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="p-6" data-testid="card-case-studies">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Case Studies</h3>
                        <p className="text-xs text-muted-foreground">Real-world perspectives on the AI Journey</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {caseStudies.map((cs, i) => (
                        <a key={i} href={cs.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-sm group-hover:text-primary transition-colors">{cs.title}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{cs.phase}</Badge>
                        </a>
                      ))}
                    </div>
                    <a href="https://learn.mcgovern.org/AI-Journey-in-Practice-19770021ed8c8046b271e971e89abd0b" target="_blank" rel="noopener noreferrer" className="block mt-4">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        View All Case Studies
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  </Card>

                  <Card className="p-6" data-testid="card-philanthropy">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">AI & Philanthropy</h3>
                        <p className="text-xs text-muted-foreground">How funders can responsibly support AI for good</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      A critical funding gap persists for nonprofit organizations deploying AI approaches to tackle major societal challenges. PJMF aims to boost funding for nonprofit AI builders, accelerate impact, and inspire more human-centered technologists to jump into the arena.
                    </p>
                    <div className="space-y-2 mb-4">
                      <a href="https://learn.mcgovern.org/AI-Philanthropy-26a70021ed8c8073bcc1e24d4ce8efc4" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <ArrowRight className="h-3.5 w-3.5" />
                        AI & Grantmaking Strategy
                      </a>
                      <a href="https://learn.mcgovern.org/Fund-AI-2025-Highlights-and-Insights-2c370021ed8c80adbd01cbf55df43c01" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <ArrowRight className="h-3.5 w-3.5" />
                        Fund.AI 2025: Highlights and Insights
                      </a>
                    </div>
                    <a href="https://learn.mcgovern.org/AI-Philanthropy-26a70021ed8c8073bcc1e24d4ce8efc4" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        Explore AI & Philanthropy
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  </Card>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-12 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="font-serif text-2xl font-bold mb-3 text-[#14201B]" data-testid="text-about-pjmf">About the PJMF Learning Hub</h2>
                <p className="text-sm text-[#4B5F55] leading-relaxed">
                  The <a href="https://www.mcgovern.org/" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">Patrick J. McGovern Foundation</a> believes that all civil society organizations will benefit from deep knowledge sharing and skill building. The pace of AI and digital transformation is accelerating, and no organization should have to figure it all out on their own.
                </p>
                <p className="text-sm text-[#4B5F55] leading-relaxed mt-3">
                  Through their Hub, PJMF makes resources and learning experiences available to all nonprofits wherever they are in their journey towards becoming a data and AI-enabled organization — by vetting and curating the strongest resources from across the web and creating hands-on learning opportunities.
                </p>
              </motion.div>
              <div className="flex justify-center">
                <a href="https://learn.mcgovern.org" target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2" data-testid="button-visit-pjmf">
                    <ExternalLink className="h-4 w-4" />
                    Visit the Full PJMF Learning Hub
                  </Button>
                </a>
              </div>
            </div>
          </section>

      {/* === Phase 1: Jofia's Responsible AI Hub === */}
      <section className="py-20 bg-foreground text-background" id="responsible-ai" data-testid="section-responsible-ai">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="grid lg:grid-cols-12 gap-10 mb-14 items-end">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-[11px] font-bold uppercase tracking-widest mb-5">
                <ShieldCheck className="h-3 w-3" />
                Responsible AI Hub · Led by Jofiah Jose Prakash
              </div>
              <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight leading-[1.05] mb-4" data-testid="text-responsible-ai-title">
                The ethics backbone of <span className="italic font-light text-emerald-300">everything we teach.</span>
              </h2>
              <p className="text-base text-background/70 leading-relaxed font-serif max-w-2xl">
                Responsible AI isn't a chapter at the end. It's the operating system underneath every learning path, every builder template, and every shipped system. Curated and led by our Director of AI Ethics & Governance.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <div className="flex items-center gap-4 border-l-2 border-primary pl-4">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary shrink-0">
                  <img src={jofiaPhoto} alt="Jofiah Jose Prakash" className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <p className="text-sm font-bold">Jofiah Jose Prakash</p>
                  <p className="text-[11px] text-background/60 uppercase tracking-widest">Director of AI Ethics</p>
                  <Link href="/about/board/jofia-jose-prakash">
                    <button className="text-[11px] text-emerald-300 hover:underline mt-1 inline-flex items-center gap-1" data-testid="link-jofia-profile-rai">
                      Board Profile <ArrowRight className="h-3 w-3" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Five Principles */}
          <div className="mb-14">
            <div className="flex items-baseline justify-between border-b border-background/15 pb-3 mb-6">
              <h3 className="font-serif text-xl font-bold">Five Principles</h3>
              <span className="text-[11px] uppercase tracking-widest text-background/50">The non-negotiables</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {responsibleAIPrinciples.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="border border-background/10 p-5 hover:border-primary/40 transition-colors"
                  data-testid={`card-rai-principle-${i}`}
                >
                  <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center mb-3">
                    <p.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-background/50 mb-1">Principle 0{i + 1}</div>
                  <h4 className="font-semibold text-sm mb-2">{p.title}</h4>
                  <p className="text-[12px] text-background/70 leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Build Responsibly Checkpoints */}
          <div className="mb-12">
            <div className="flex items-baseline justify-between border-b border-background/15 pb-3 mb-6">
              <h3 className="font-serif text-xl font-bold">Build Responsibly Checkpoints</h3>
              <span className="text-[11px] uppercase tracking-widest text-background/50">Woven into every learning path</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {buildResponsiblyCheckpoints.map((cp, i) => (
                <motion.div
                  key={cp.phase}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="bg-background/5 p-5 border-l-2 border-primary"
                  data-testid={`card-rai-checkpoint-${i}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <cp.icon className="h-4 w-4 text-primary" />
                    <h4 className="font-bold text-sm">{cp.phase}</h4>
                  </div>
                  <ul className="space-y-2">
                    {cp.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-[12px] text-background/75 leading-relaxed">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div {...fadeIn} className="grid md:grid-cols-2 gap-4">
            <a href="https://www.thejofia.com/ai-ml-courses-beginner-to-advanced" target="_blank" rel="noopener noreferrer">
              <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-rai-courses">
                <ExternalLink className="h-4 w-4" />
                Jofia's Full AI &amp; ML Course Series
              </Button>
            </a>
            <Link href="/about/board/jofia-jose-prakash">
              <Button variant="outline" className="w-full gap-2 border-background/20 text-background hover:bg-background hover:text-foreground" data-testid="button-rai-jofia-profile">
                <ArrowRight className="h-4 w-4" />
                Meet Jofia
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-6 border-b bg-card sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses, tools, channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-training-search"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Level:</span>
              </div>
              {(["all", "beginner", "intermediate", "advanced"] as Level[]).map((level) => (
                <Button
                  key={level}
                  size="sm"
                  variant={selectedLevel === level ? "default" : "outline"}
                  onClick={() => setSelectedLevel(level)}
                  data-testid={`button-filter-${level}`}
                >
                  {level === "all" ? "All Levels" : levelLabels[level]}
                </Button>
              ))}
            </div>
          </div>

          {/* Personalization: Interests Picker */}
          <div className="mt-4 pt-4 border-t border-foreground/10 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <Heart className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">My interests:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {interestCategories.map((cat) => {
                const active = selectedInterests.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleInterest(cat)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-foreground/15 text-muted-foreground hover:border-primary hover:text-foreground"
                    }`}
                    data-testid={`chip-interest-${cat.toLowerCase().replace(/\s+|&/g, "-")}`}
                  >
                    {cat}
                  </button>
                );
              })}
              {selectedInterests.size > 0 && (
                <button
                  onClick={() => setSelectedInterests(new Set())}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline ml-2"
                  data-testid="button-clear-interests"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16" id="video-courses">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeIn} className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-md bg-red-500/10 flex items-center justify-center">
                <SiYoutube className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#14201B]" data-testid="text-video-courses">Free Video Courses & Channels</h2>
                <p className="text-sm text-[#4B5F55]">Curated YouTube channels with verified, high-quality AI education</p>
              </div>
            </motion.div>

            {filteredResources.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-10 w-10 text-[#8A9A92] mx-auto mb-3" />
                <p className="text-[#4B5F55]">No courses match your current filters. Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <Card className="h-full hover-elevate cursor-pointer group" data-testid={`card-course-${i}`}>
                        <div className="h-36 bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                          <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="h-5 w-5 text-red-500 ml-0.5" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">{resource.channel}</span>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className={`text-[10px] ${levelColors[resource.level]}`}>
                              {levelLabels[resource.level]}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {resource.category}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors">{resource.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{resource.description}</p>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {resource.duration}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-primary font-medium">
                              Watch Free
                              <ExternalLink className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

      <section className="py-16 bg-card" id="open-source-tools">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeIn} className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-md bg-foreground/10 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold" data-testid="text-open-source-tools">Open Source AI Frameworks & Tools</h2>
                <p className="text-sm text-muted-foreground">Industry-standard tools you can start using today, completely free</p>
              </div>
            </motion.div>

            {filteredTools.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No tools match your current filters.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredTools.map((tool, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <Card className="p-6 h-full hover-elevate" data-testid={`card-tool-${i}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <tool.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{tool.name}</h3>
                            <Badge variant="outline" className={`text-[10px] ${levelColors[tool.difficulty]}`}>
                              {levelLabels[tool.difficulty]}
                            </Badge>
                          </div>
                          <span className="text-xs text-primary font-medium">{tool.category}</span>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{tool.description}</p>
                          <div className="flex items-center gap-3 mt-4">
                            <a href={tool.url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="gap-1.5" data-testid={`button-tool-site-${i}`}>
                                <Globe className="h-3.5 w-3.5" />
                                Website
                              </Button>
                            </a>
                            <a href={tool.github} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost" className="gap-1.5" data-testid={`button-tool-github-${i}`}>
                                <SiGithub className="h-3.5 w-3.5" />
                                GitHub
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-2xl font-bold mb-4 text-[#14201B]" data-testid="text-learning-paths">Recommended Learning Paths</h2>
            <p className="text-[#4B5F55]">Not sure where to start? Follow one of our curated paths based on your experience level.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                level: "Beginner" as const,
                icon: BookOpen,
                color: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20",
                iconColor: "text-emerald-600 dark:text-emerald-400",
                bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
                steps: [
                  "Start with 3Blue1Brown's neural network series",
                  "Learn Python basics with freeCodeCamp",
                  "Explore StatQuest for ML statistics",
                  "Install Ollama and run your first local AI",
                  "Try scikit-learn for your first ML project",
                  "Build a project with Tech With Tim tutorials",
                ],
              },
              {
                level: "Intermediate" as const,
                icon: Brain,
                color: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20",
                iconColor: "text-amber-600 dark:text-amber-400",
                bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
                steps: [
                  "Take Andrej Karpathy's Zero to Hero course",
                  "Complete Stanford's ML Specialization",
                  "Learn PyTorch or TensorFlow in depth",
                  "Build NLP projects with Hugging Face",
                  "Create AI apps with LangChain",
                  "Contribute to open source AI projects",
                ],
              },
              {
                level: "Advanced" as const,
                icon: Zap,
                color: "from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20",
                iconColor: "text-rose-600 dark:text-rose-400",
                bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
                steps: [
                  "Follow DeepLearning.AI advanced courses",
                  "Read papers with Yannic Kilcher",
                  "Stay current with Two Minute Papers",
                  "Fine-tune and deploy custom models",
                  "Explore Stable Diffusion architecture",
                  "Publish your own research or tools",
                ],
              },
            ].map((path, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className={`p-0 h-full bg-gradient-to-br ${path.color}`} data-testid={`card-path-${i}`}>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-md ${path.bgColor} flex items-center justify-center`}>
                        <path.icon className={`h-5 w-5 ${path.iconColor}`} />
                      </div>
                      <h3 className="font-semibold">{path.level} Path</h3>
                    </div>
                    <ol className="space-y-3">
                      {path.steps.map((step, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {j + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10" data-testid="section-training-fund">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div {...fadeIn}>
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-5">
                <HandHeart className="h-3.5 w-3.5" />
                Keep Learning Free
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-5">
                The AI Training Fund
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                Everything in the Learning Hub — courses, learning paths, hands-on projects, and open-source tools — is free, and we intend to keep it that way.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Your gift to the AI Training Fund underwrites curriculum development, content licensing, and the infrastructure that keeps high-quality AI education open to everyone, regardless of background or budget.
              </p>
            </motion.div>
            <motion.div {...fadeIn}>
              {trainingFund ? (
                <CampaignMeter campaign={trainingFund} variant="card" />
              ) : (
                <div className="border border-foreground/10 bg-white dark:bg-card p-8 text-center text-muted-foreground">
                  Loading the AI Training Fund…
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeIn}>
            <h2 className="font-serif text-3xl font-bold mb-4">Ready to Learn with AI?</h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Jump into our AI Hub to ask questions, explore concepts, or get personalized learning recommendations from our AI assistant.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/ai-hub">
                <Button variant="secondary" size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Open AI Hub
                </Button>
              </Link>
              <Link href="/donate">
                <Button variant="outline" size="lg" className="gap-2 text-primary-foreground border-primary-foreground/30">
                  <Heart className="h-4 w-4" />
                  Support Free Education
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
