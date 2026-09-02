import type { IStorage } from "./storage";

const SITE_URL = "https://humanityplusai.org";
const SITE_NAME = "Humanity + AI, Inc.";
const DEFAULT_TITLE = "Humanity + AI, Inc. | Bridging Humanity and Artificial Intelligence";
const DEFAULT_DESC =
  "Humanity + AI, Inc. is a nonprofit dedicated to ethical AI development, education, and community building. Founded by Danielle A. Franklin.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

interface MetaData {
  title: string;
  description: string;
  canonical: string;
  ogType: string;
  ogImage: string;
  noIndex?: boolean;
}

interface BodyContent {
  heading: string;
  subheading?: string;
  body: string;
  nav?: string;
}

const STATIC_ROUTES: Record<string, MetaData & { bodyContent: BodyContent }> = {
  "/": {
    title: DEFAULT_TITLE,
    description:
      "Humanity + AI, Inc. is a nonprofit bridging humanity and artificial intelligence through ethical AI development, education, and community empowerment. Founded by Danielle A. Franklin.",
    canonical: `${SITE_URL}/`,
    ogType: "website",
    ogImage: DEFAULT_IMAGE,
    bodyContent: {
      heading: "Humanity + AI, Inc.",
      subheading: "Bridging Humanity and Artificial Intelligence",
      body: "Humanity + AI, Inc. is a nonprofit organization dedicated to ethical AI development, community empowerment, and ensuring that artificial intelligence serves all of humanity. Founded by Danielle A. Franklin, a 20+ year defense and AI executive, we bring together technologists, ethicists, educators, and community leaders to shape the future of AI responsibly.",
      nav: "About | Programs | Blog | Events | AI Hub | Contact | Donate",
    },
  },
  "/about": {
    title: `About — Mission, Board & Story | ${SITE_NAME}`,
    description:
      "Learn about Humanity + AI, Inc. — our mission to bridge humanity and artificial intelligence, our founding story, and the board of directors driving ethical AI education and community empowerment.",
    canonical: `${SITE_URL}/about`,
    ogType: "website",
    ogImage: DEFAULT_IMAGE,
    bodyContent: {
      heading: "About Humanity + AI, Inc.",
      subheading: "Our Mission, Story & Team",
      body: "Humanity + AI, Inc. was founded to ensure that advances in artificial intelligence benefit humanity broadly, not just a privileged few. Our mission is to bridge the gap between human values and AI capabilities through education, advocacy, and community building. We are led by a diverse board of directors including Danielle A. Franklin (Founder & Executive Director), Jofiah Jose Prakash (AI Ethics & Governance Director), William Kreitzer (Finance & Fundraising Strategist), and other distinguished leaders in technology, ethics, and social impact.",
      nav: "Mission | Board of Directors | Our Story | Values | Timeline",
    },
  },
  "/programs": {
    title: `Programs — Initiatives & Research | ${SITE_NAME}`,
    description:
      "Explore Humanity + AI programs including Project ROSIE, AI Ethics, Tech Leadership, Community AI Literacy, AI Training Hub, Book Series, and Animal Welfare initiatives.",
    canonical: `${SITE_URL}/programs`,
    ogType: "website",
    ogImage: DEFAULT_IMAGE,
    bodyContent: {
      heading: "Programs & Initiatives",
      subheading: "Making AI Accessible, Ethical, and Human-Centered",
      body: "Humanity + AI, Inc. runs a portfolio of programs designed to make AI education accessible and to ensure ethical AI development. Our flagship programs include: Project ROSIE — empowering underrepresented communities in tech; AI Ethics & Governance — developing frameworks for responsible AI deployment; Tech Leadership — cultivating the next generation of technology leaders; Community AI Literacy — hands-on AI education for all skill levels; AI Training Hub — free courses and learning paths; Book Series — curated reading on AI and society; and Animal Welfare AI — applying AI to improve outcomes for animals.",
      nav: "Project ROSIE | AI Ethics | Tech Leadership | AI Literacy | Training Hub | Book Series | Animal Welfare",
    },
  },
  "/training": {
    title: `AI Learning Hub — Courses, Paths & Tools | ${SITE_NAME}`,
    description:
      "Access free AI education resources, hands-on courses, structured learning paths, and open-source tools curated by Humanity + AI, Inc. for all skill levels.",
    canonical: `${SITE_URL}/training`,
    ogType: "website",
    ogImage: DEFAULT_IMAGE,
    bodyContent: {
      heading: "AI Learning Hub",
      subheading: "Free Courses, Learning Paths & Open Source Tools",
      body: "The Humanity + AI Learning Hub provides free, accessible AI education resources for everyone — from curious beginners to seasoned professionals. Our curriculum is built on the PJMF AI Journey framework covering foundational AI concepts, machine learning, ethics, and real-world applications. Features include structured learning paths, video courses, open-source tool recommendations, case studies, and an AI & Philanthropy resource track.",
      nav: "Getting Started | Learning Paths | Video Courses | Open Source Tools | Case Studies | AI & Philanthropy",
    },
  },
  "/blog": {
    title: `Thought Leadership — Articles & Books | ${SITE_NAME}`,
    description:
      "Read expert articles, books, and insights on AI ethics, technology leadership, and the future of artificial intelligence from the Humanity + AI community.",
    canonical: `${SITE_URL}/blog`,
    ogType: "website",
    ogImage: DEFAULT_IMAGE,
    bodyContent: {
      heading: "Thought Leadership",
      subheading: "Articles, Books & Insights on AI, Ethics & Technology",
      body: "Our editorial hub features expert perspectives on artificial intelligence, technology leadership, and the future of human-AI collaboration. Browse peer articles from our community of practitioners, ethicists, and educators — plus a curated library of AI and machine learning books. Topics include AI ethics, governance, responsible deployment, inclusion in tech, and the societal implications of advancing AI systems.",
      nav: "All Articles | Books | AI Ethics | Technology Leadership | Community Voices",
    },
  },
  "/events": {
    title: `Events — Workshops, Talks & Meetups | ${SITE_NAME}`,
    description:
      "Join Humanity + AI events including workshops, seminars, networking meetups, and educational talks on AI ethics, technology leadership, and community empowerment.",
    canonical: `${SITE_URL}/events`,
    ogType: "website",
    ogImage: DEFAULT_IMAGE,
    bodyContent: {
      heading: "Events",
      subheading: "Workshops, Seminars & Networking Meetups",
      body: "Connect with the Humanity + AI community at our upcoming events. We host workshops, seminars, webinars, networking meetups, and educational talks on AI ethics, technology leadership, and community empowerment. Events are designed for technologists, ethicists, policymakers, educators, and anyone curious about the future of artificial intelligence.",
      nav: "Upcoming Events | Workshops | Seminars | Networking | Past Events",
    },
  },
  "/ai-hub": {
    title: `AI Hub — Community Q&A Assistant | ${SITE_NAME}`,
    description:
      "Chat with our AI assistant for answers about Humanity + AI programs, resources, AI ethics, and community initiatives. Powered by OpenAI.",
    canonical: `${SITE_URL}/ai-hub`,
    ogType: "website",
    ogImage: DEFAULT_IMAGE,
    noIndex: true,
    bodyContent: {
      heading: "AI Community Hub",
      subheading: "Ask Our AI Assistant",
      body: "The Humanity + AI Community Hub features an AI-powered assistant ready to answer your questions about our programs, resources, AI ethics, and community initiatives. Powered by OpenAI, our assistant provides thoughtful, contextual responses to help you navigate the world of responsible AI.",
    },
  },
  "/contact": {
    title: `Contact — Questions, Partnerships & Press | ${SITE_NAME}`,
    description:
      "Get in touch with Humanity + AI, Inc. We welcome questions, partnership inquiries, media requests, and community collaboration. Reach us at danielle@humanityplusai.org.",
    canonical: `${SITE_URL}/contact`,
    ogType: "website",
    ogImage: DEFAULT_IMAGE,
    bodyContent: {
      heading: "Contact Humanity + AI, Inc.",
      subheading: "Questions, Partnerships & Press Inquiries",
      body: "We welcome questions, partnership opportunities, media requests, and community collaboration. Reach us by email at danielle@humanityplusai.org, by phone at (808) 652-2090, or find us on Instagram @humanity_ai_inc and LinkedIn at /company/humanity-plus-ai-inc/. Use the contact form to send us a message directly.",
    },
  },
  "/donate": {
    title: `Donate — Support Ethical AI for All | ${SITE_NAME}`,
    description:
      "Support Humanity + AI, Inc. with a tax-deductible donation. Fund AI education, ethics programs, and community empowerment initiatives that make AI accessible to everyone.",
    canonical: `${SITE_URL}/donate`,
    ogType: "website",
    ogImage: DEFAULT_IMAGE,
    bodyContent: {
      heading: "Support Humanity + AI, Inc.",
      subheading: "Make a Tax-Deductible Donation",
      body: "Your donation directly funds AI education programs, ethics research, community workshops, and initiatives that make artificial intelligence accessible and beneficial to everyone. We offer one-time and recurring donation options with impact areas including AI Literacy, Ethics & Governance, Tech Leadership, Community Programs, and Animal Welfare AI. Every contribution helps shape a future where AI serves humanity.",
    },
  },
};

const BOARD_MEMBERS: Record<string, { name: string; title: string; shortBio: string; fullBio?: string }> = {
  "danielle-franklin": {
    name: "Danielle A. Franklin",
    title: "Founder, Executive Director & Board Chair",
    shortBio:
      "Defense technology executive and AI innovator with 20+ years driving mission-impact across OSD, SDA, U.S. Navy, MDA, and USSF.",
    fullBio:
      "Danielle A. Franklin is the founder and executive director of Humanity + AI, Inc. With over 20 years of experience at the intersection of defense technology and artificial intelligence, she has led strategic initiatives at the Office of the Secretary of Defense, Space Development Agency, U.S. Navy, Missile Defense Agency, and U.S. Space Force. She founded Humanity + AI to ensure that the benefits of AI are accessible to all communities and that AI development remains aligned with human values.",
  },
  "jofia-jose-prakash": {
    name: "Jofiah Jose Prakash",
    title: "AI Ethics & Governance Director",
    shortBio:
      "Enterprise AI Architect with 15+ years of experience in software engineering and machine learning, holding 4 AI patents.",
    fullBio:
      "Jofiah Jose Prakash serves as AI Ethics & Governance Director at Humanity + AI, Inc. As an Enterprise AI Architect with 15+ years in software engineering and machine learning, he holds 4 AI patents and has deep expertise in designing responsible, production-grade AI systems. He contributes thought leadership on cache-aware agent architecture and the emerging engineering disciplines required for trustworthy AI at scale.",
  },
  "william-kreitzer": {
    name: "William Kreitzer",
    title: "Finance & Fundraising Strategist",
    shortBio:
      "Finance & Fundraising Strategist overseeing financial health, grant strategy, donor development, and budget planning for Humanity + AI, Inc.",
  },
  "nirmal-jingar": {
    name: "Nirmal Jingar",
    title: "AI & Emerging Technology Strategy and Governance Director",
    shortBio:
      "Senior technology leader directing enterprise AI, platforms, and modernization at Wayfair. IEEE Senior Member, Forbes Technology Council, and recognized voice on responsible AI at production scale.",
  },
  "william-zhu": {
    name: "William Zhu",
    title: "Board Director, Applied AI & Community Strategy",
    shortBio:
      "Applied AI builder, data scientist, and community organizer. Senior Data Scientist & Applied AI Engineer at Choice Hotels International and founding organizer of Washington, DC's AI Discussion Club (900+ builders). M.A. Computational Social Science, University of Chicago.",
  },
  "alexis-ramsey-tobienne": {
    name: "Alexis Ramsey-Tobienne, PhD",
    title: "Director, AI Literacy & Academic Integrity",
    shortBio:
      "Assistant Dean for Artificial Intelligence and Learning Integrity at Eckerd College, focused on critical AI literacy and the ethical integration of AI in liberal arts education. Chair of the Academic Honor Council and of the Southeastern Region Consortia for the International Center for Academic Integrity. PhD in Rhetoric and Composition, Purdue University.",
  },
  "mike-klyce": {
    name: "Mike Klyce",
    title: "Chief AI Storytelling & Creative Officer",
    shortBio:
      "AI Creative Technologist and researcher exploring where artificial intelligence meets human expression, storytelling, and cognitive science.",
  },
  "david-wood": {
    name: "David Wood",
    title: "Chief Consciousness & Human Flourishing Officer",
    shortBio:
      "Futurist, author, and technologist exploring the intersection of AI, consciousness, and human flourishing. Chair of London Futurists.",
  },
  "vasu-raj-jain": {
    name: "Vasu Raj Jain",
    title: "Chief of AI in Advertising & Media",
    shortBio:
      "Senior Software Development Engineer at Amazon Ads leading large-scale ad serving infrastructure that generates billions in annual revenue across Prime Video, live sports, and DOOH.",
  },
  "vina-torossian": {
    name: "Vina Torossian",
    title: "Chief Inclusion & Social Impact Officer",
    shortBio:
      "Senior leader dedicated to inclusive innovation, accessible AI, and social impact programs that bridge the digital divide.",
  },
};

function escape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildBodyPreview(content: BodyContent): string {
  const navHtml = content.nav
    ? `<nav><p>${escape(content.nav)}</p></nav>`
    : "";
  const subHtml = content.subheading
    ? `<p><strong>${escape(content.subheading)}</strong></p>`
    : "";
  return `<div id="prerender-content" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;" aria-hidden="true">${navHtml}<main><h1>${escape(content.heading)}</h1>${subHtml}<p>${escape(content.body)}</p></main></div>`;
}

function replaceHeadMeta(html: string, meta: MetaData, bodyContent?: BodyContent): string {
  let result = html;

  result = result.replace(/<title>[^<]*<\/title>/, `<title>${escape(meta.title)}</title>`);
  result = result.replace(/<meta\s+name="description"[^>]*>/g, "");
  result = result.replace(/<link\s+rel="canonical"[^>]*>/g, "");
  result = result.replace(/<meta\s+name="robots"[^>]*>/g, "");
  result = result.replace(/<meta\s+property="og:[^"]*"[^>]*>/g, "");
  result = result.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/g, "");

  const desc = escape(meta.description);
  const canonical = escape(meta.canonical);
  const image = escape(meta.ogImage);
  const title = escape(meta.title);
  const ogType = escape(meta.ogType);
  const robots = meta.noIndex ? `\n    <meta name="robots" content="noindex, nofollow" />` : "";

  const injected = [
    `<meta name="description" content="${desc}" />`,
    `<link rel="canonical" href="${canonical}" />${robots}`,
    `<meta property="og:site_name" content="${escape(SITE_NAME)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join("\n    ");

  result = result.replace("</head>", `    ${injected}\n  </head>`);

  if (bodyContent) {
    const bodyPreview = buildBodyPreview(bodyContent);
    result = result.replace('<div id="root">', `${bodyPreview}\n    <div id="root">`);
  }

  return result;
}

export async function injectSeoMeta(
  url: string,
  html: string,
  storage: IStorage,
): Promise<string> {
  const pathname = url.split("?")[0].split("#")[0];

  const staticRoute = STATIC_ROUTES[pathname];
  if (staticRoute) {
    return replaceHeadMeta(html, staticRoute, staticRoute.bodyContent);
  }

  const blogMatch = pathname.match(/^\/blog\/(.+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    try {
      const post = await storage.getBlogPostBySlug(slug);
      if (post) {
        const metaTitle = post.seoTitle || post.title;
        const metaDesc =
          post.seoDescription ||
          post.excerpt ||
          `Read ${post.title} on Humanity + AI.`;
        const image = post.featuredImageUrl || post.imageUrl || DEFAULT_IMAGE;
        const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

        const canonical = post.mediumUrl
          ? post.mediumUrl
          : `${SITE_URL}/blog/${post.slug}`;

        const publishedDate = post.publishedAt
          ? new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";

        const fullMeta = {
          title: `${metaTitle} | ${SITE_NAME}`,
          description: metaDesc.slice(0, 160),
          canonical,
          ogType: "article",
          ogImage: imageUrl,
        };

        const bodyContent: BodyContent = {
          heading: post.title,
          subheading: publishedDate
            ? `${post.contentType === "book" ? "Book" : "Article"} · ${publishedDate}`
            : post.contentType === "book" ? "Book" : "Article",
          body: post.excerpt || metaDesc.slice(0, 300),
        };

        return replaceHeadMeta(html, fullMeta, bodyContent);
      }
    } catch {
    }
    return replaceHeadMeta(html, STATIC_ROUTES["/blog"], STATIC_ROUTES["/blog"].bodyContent);
  }

  const profileMatch = pathname.match(/^\/profile\/(.+)$/);
  if (profileMatch) {
    const username = profileMatch[1];
    try {
      const user = await storage.getUserByUsername(username);
      if (user) {
        const name = user.displayName || user.username;
        const desc = user.bio
          ? `${name} — ${user.bio}`.slice(0, 160)
          : `Author profile for ${name} on Humanity + AI, Inc.`;
        const image =
          user.avatarUrl && user.avatarUrl.startsWith("http")
            ? user.avatarUrl
            : user.avatarUrl
              ? `${SITE_URL}${user.avatarUrl}`
              : DEFAULT_IMAGE;

        const fullMeta = {
          title: `${name} — Author Profile | ${SITE_NAME}`,
          description: desc,
          canonical: `${SITE_URL}/profile/${user.username}`,
          ogType: "profile",
          ogImage: image,
        };

        const bodyContent: BodyContent = {
          heading: name,
          subheading: user.title
            ? `${user.title}${user.organization ? ` · ${user.organization}` : ""}`
            : user.organization || "Author",
          body: user.bio || `${name} is an author and contributor at Humanity + AI, Inc.`,
        };

        return replaceHeadMeta(html, fullMeta, bodyContent);
      }
    } catch {
    }
    return html;
  }

  const boardMatch = pathname.match(/^\/about\/board\/(.+)$/);
  if (boardMatch) {
    const slug = boardMatch[1];
    const member = BOARD_MEMBERS[slug];
    if (member) {
      const fullMeta = {
        title: `${member.name} — ${member.title} | ${SITE_NAME}`,
        description: member.shortBio,
        canonical: `${SITE_URL}/about/board/${slug}`,
        ogType: "profile",
        ogImage: DEFAULT_IMAGE,
      };

      const bodyContent: BodyContent = {
        heading: member.name,
        subheading: member.title,
        body: member.fullBio || member.shortBio,
        nav: `Board of Directors · ${member.name} · Humanity + AI, Inc.`,
      };

      return replaceHeadMeta(html, fullMeta, bodyContent);
    }
    return html;
  }

  return html;
}
