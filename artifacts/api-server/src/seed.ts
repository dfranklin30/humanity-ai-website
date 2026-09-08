import { db } from "./db";
import { blogPosts, events, users, campaigns } from "@workspace/db";
import { sql, like, eq, and } from "drizzle-orm";

export async function seedDatabase() {
  await db.update(users)
    .set({ email: "danielle@humanityplusai.org" })
    .where(eq(users.email, "danielle@humanityplusai.og"));

  await db.update(blogPosts)
    .set({ imageUrl: sql`REPLACE(image_url, '/assets/', '/uploads/')` })
    .where(like(blogPosts.imageUrl, '/assets/%'));

  const measuringSlug = "nirmal-jingar-measuring-the-wrong-thing";
  const existingMeasuring = await db.select().from(blogPosts).where(eq(blogPosts.slug, measuringSlug)).limit(1);
  if (existingMeasuring.length === 0) {
    await db.insert(blogPosts).values({
      title: "Board Spotlight: Nirmal Jingar in Forbes Tech Council on Why Most AI Programs Are Measuring the Wrong Thing",
      slug: measuringSlug,
      excerpt: "Humanity + AI board director Nirmal Jingar's latest Forbes Tech Council piece argues that most enterprise AI initiatives are stalling not because of model quality, but because leaders are tracking the wrong metrics.",
      content: `Humanity + AI board director Nirmal Jingar has a new piece out in Forbes Tech Council: "Your AI's Failing Because You're Measuring The Wrong Thing." It's a sharp, practitioner-grounded look at why so many enterprise AI programs end up underperforming — and where leadership attention should actually be focused.

Nirmal's argument, drawn from his work running enterprise AI and supply chain engineering at global production scale, can be summarized in a few themes that align directly with how our board thinks about responsible AI:

• Vanity metrics quietly kill AI programs. Accuracy on a benchmark, demo wins, or "AI initiatives launched" rarely correspond to real value. Leaders need to insist on metrics tied to operational outcomes, not optics.

• Outcome metrics beat output metrics. The right questions are: did this model reduce cost, prevent an incident, accelerate a decision, or improve a customer experience under real-world conditions? If the metric can't be tied back to the business or to the people the system affects, it isn't a metric — it's marketing.

• Governance starts with measurement. You cannot govern what you do not measure honestly. Latency under load, drift in production, reliability under stress, and human-in-the-loop intervention rates are foundational signals for trustworthy AI.

• Pressure-testing matters more than pilots. Pilots optimize for the easy path. Production systems live under financial, operational, and regulatory pressure — and that's where the wrong metric will burn you.

This piece reinforces the perspective Nirmal brings to our board work at Humanity + AI: rigorous, engineering-grounded, and unwilling to mistake activity for impact. It also sets a clear standard for the kinds of conversations we want to drive across our learning programs and executive education — moving leaders from "are we doing AI?" to "are we doing AI that holds up?"

Read the full piece in Forbes Tech Council to see Nirmal's framework in his own words.`,
      author: "Humanity + AI Editorial Team",
      category: "Board Spotlight",
      imageUrl: "/uploads/1profile-pic_1776517679611.jpg",
      mediumUrl: "https://www.forbes.com/councils/forbestechcouncil/2026/04/21/your-ais-failing-because-youre-measuring-the-wrong-thing/",
      contentType: "article",
      published: true,
    });
  }

  const forbesSlug = "nirmal-jingar-forbes-spotlight";
  const existingForbes = await db.select().from(blogPosts).where(eq(blogPosts.slug, forbesSlug)).limit(1);
  if (existingForbes.length === 0) {
    await db.insert(blogPosts).values({
      title: "Board Spotlight: Nirmal Jingar Featured in Forbes Councils on Governed AI & Supply Chain Engineering",
      slug: forbesSlug,
      excerpt: "Humanity + AI board director Nirmal Jingar is featured in Forbes Councils' Executive Spotlight, sharing the engineering philosophy behind moving organizations from fragile systems to governed, production-grade AI.",
      content: `We're proud to share that Nirmal Jingar — Humanity + AI's AI & Emerging Technology Strategy and Governance Director — has been featured in Forbes Councils' Executive Spotlight series.

The article, "From Fragile Systems to Governed AI: The Supply Chain Engineering Philosophy of Wayfair's Nirmal Jingar," explores how Nirmal approaches enterprise AI inside complex, regulated, high-stakes environments. As Senior Engineering Manager at Wayfair, he directs enterprise AI and supply chain engineering across a $10B+ global e-commerce operation, where his teams operationalize AI capabilities that influence real operational and financial outcomes.

A few themes from the spotlight that resonate strongly with the work we do at Humanity + AI:

• Reliability is a design choice, not an accident. Complex systems become trustworthy because reliability is engineered in from the start — the same is true for enterprise AI.

• Governance has to live inside the system. AI guardrails, observability, and accountability cannot be bolted on after deployment; they must be part of the architecture.

• AI that performs under pressure, not in demos. Real value comes from systems that hold up under financial, operational, and regulatory constraints — exactly the lens our board brings to program design and policy guidance.

This recognition reinforces the perspective Nirmal brings to our board: rigorous, engineering-grounded, and oriented toward responsible AI at production scale. It also reflects the kind of leadership we want to amplify across our learning programs, executive education, and public conversations on AI governance.

Read the full Executive Spotlight on Forbes Councils to hear Nirmal's philosophy in his own words, and learn more about the standards we believe should guide the next generation of enterprise AI.`,
      author: "Humanity + AI Editorial Team",
      category: "Board Spotlight",
      imageUrl: "/uploads/1profile-pic_1776517679611.jpg",
      mediumUrl: "https://councils.forbes.com/executive-spotlight/from-fragile-systems-to-governed-ai-the-supply-chain-engineering-philosophy-of-wayfairs-nirmal-jingar",
      contentType: "article",
      published: true,
    });
  }

  const jofiaImage = "/uploads/image_1775903668936.png";
  const jofiaAuthor = "Jofiah Jose Prakash";
  const jofiaPosts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    mediumUrl: string;
    createdAt: Date;
  }> = [
    {
      slug: "jofia-cache-aware-agent-architecture",
      title: "Cache-Aware Agent Architecture: Why Cache Topology Is Becoming a Core Engineering Discipline",
      excerpt: "AI teams have spent the last two years improving prompts. That was necessary, but production agent systems now face a different bottleneck: repeated context rebuilds across steps, retries, and tool workflows. Cache-aware architecture is no longer an infrastructure tweak; it now shapes prompt assembly, route design, workflow boundaries, and unit economics.",
      content: `AI teams have spent the last two years improving prompts. That was necessary, but production agent systems now face a different bottleneck: repeated context rebuilds across steps, retries, and tool workflows. Cache-aware architecture is no longer an infrastructure tweak; it now shapes prompt assembly, route design, workflow boundaries, and unit economics.

## Key Takeaways

- Cache-aware design is becoming a core part of agent architecture, not just cost optimization.
- Separate stable and volatile context, and treat cache expiry as a normal state transition.
- Track cache metrics in production: hit rate, write amplification, miss recovery, route latency, and cost per successful task.

## From Prompt Engineering to Cache-Aware Architecture

The platform layer has changed. OpenAI, Anthropic, Google Gemini, and AWS Bedrock now expose cache behavior, duration, and pricing more explicitly. This signals a systems-level shift: cache locality must be designed intentionally, not left to chance. Cached token reads are roughly 90% cheaper on Anthropic and 50% cheaper on OpenAI — but the latency argument is often more compelling. When a cache hit occurs, the provider skips prefill computation entirely, producing response times that can be up to 80% faster than a cold prompt of equal length. For agent workflows with long system prompts and tool schemas, this is the difference between a snappy multi-step interaction and one that feels sluggish at every turn.

## A Three-Layer Model

Jofia's architecture separates context into stable, semi-stable, and volatile layers — system prompts and tool schemas at the bottom, session-level context in the middle, and per-step user input on top. Cache boundaries align with these layers, so prompt assembly stops fighting the cache and starts cooperating with it.

## What Changes for Engineering Teams

Cache-aware design changes how teams reason about prompt structure, route design, and workflow boundaries. Operational practices shift toward tracking cache hit rate, write amplification, miss recovery, route latency, and cost per successful task — and treating cache expiry as a normal state transition with predictable failure modes.

For the full architecture walk-through, including provider-by-provider cache mechanics tables, the three-layer model in detail, and operational patterns for production systems, read the original on Jofia Jose Prakash's blog.`,
      category: "AI Architecture",
      mediumUrl: "https://www.thejofia.com/cache-aware-agent-architecture",
      createdAt: new Date("2026-04-19T12:00:00Z"),
    },
    {
      slug: "jofia-ai-ml-learning-path",
      title: "AI/ML Learning Path: From Beginner to Advanced",
      excerpt: "The most common question I get from engineers entering AI is: where do I start? Most reach for GenAI tools first and work backwards. That is the wrong order. Start with the learning path that builds your foundation first, then move into deep learning, transformers, vector databases, RAG, and agentic AI systems.",
      content: `The most common question I get from engineers entering AI is: where do I start? Most reach for GenAI tools first and work backwards. That is the wrong order. Start with the learning path that builds your foundation first, then move into deep learning, transformers, vector databases, RAG, and agentic AI systems.

## The Learning Path

A practitioner-first curriculum sequenced for engineers who want to build, not just demo. The path starts from foundational ML concepts and progresses through deep learning, transformer architectures, vector databases, retrieval-augmented generation (RAG), and finally agentic AI systems. Each stage is structured so the next one builds on real understanding, not surface familiarity with tools.

## Full Path at a Glance

The course series moves through five tiers: AI/ML foundations, deep learning and neural networks, transformer architecture and large language models, vector databases and RAG patterns, and agentic AI systems. Each tier ends with a working implementation, not just theory.

## One Gap to Know: Vector Databases and RAG

Most learning paths skip vector databases or treat them as an afterthought. In practice, retrieval is where production systems live or die — and a strong working understanding of embedding strategy, indexing, and ranking is one of the highest-leverage skills an AI engineer can develop today.

## Final Takeaway

The fastest engineers in AI are not the ones who chase every framework. They are the ones who build a clean foundation and then go deep where it matters. Read the full curriculum, level by level, on Jofia Jose Prakash's blog.`,
      category: "AI/ML Education",
      mediumUrl: "https://www.thejofia.com/ai-ml-courses-beginner-to-advanced",
      createdAt: new Date("2026-04-19T10:00:00Z"),
    },
    {
      slug: "jofia-learn-one-framework-deeply-2026",
      title: "Learn One Framework Deeply (Instead of Ten Shallow): A Developer's Guide to Mastering Agentic AI in 2026",
      excerpt: "If you're building AI agents in 2026, your browser probably has tabs open for LangGraph, CrewAI, AutoGen, LlamaIndex, and more. Every week there is a new framework, a new tutorial, a new reason to start over. This post is about why that habit is costing you, how to choose one framework deliberately, and what going deep actually looks like in practice.",
      content: `If you're building AI agents in 2026, your browser probably has tabs open for LangGraph, CrewAI, AutoGen, LlamaIndex, and more. Every week there is a new framework, a new tutorial, a new reason to start over. This post is about why that habit is costing you, how to choose one framework deliberately, and what going deep actually looks like in practice.

## The Framework FOMO Trap

The agentic AI space rewards visibility, not depth. Tutorials, launches, and Twitter threads create constant pressure to switch tools — and most engineers never get past surface familiarity with any one of them. The cost is hidden: shallow knowledge across five frameworks looks like productivity, but it produces brittle systems and slower delivery in real projects.

## The Case for Going Deep

Going deep with one framework compounds. You learn the abstractions, the failure modes, the orchestration patterns, the testing story, and the production gotchas. Those are transferable skills — once you understand graph-based agent orchestration deeply in one system, picking up the next is a matter of days, not months.

## How to Pick the Right One

Choose based on the kind of agent systems you actually build (or want to build): graph-based workflows, role-based crews, conversational orchestration, or RAG-heavy retrieval. Pick the framework whose mental model matches your domain, not the one with the most stars.

## The 4-Level Deep Learning Path

Jofia outlines a four-level, framework-agnostic depth curriculum: build the basics → understand the abstractions → break things on purpose → ship to production. Each level has concrete exercises that take you past tutorial knowledge into operating-system-level understanding.

For the full breakdown — including a worked example of going deep with LangGraph and a complete action plan — read the original on Jofia Jose Prakash's blog.`,
      category: "Agentic AI",
      mediumUrl: "https://www.thejofia.com/learn-one-framework-deeply-agentic-ai-2026",
      createdAt: new Date("2026-03-07T10:00:00Z"),
    },
    {
      slug: "jofia-secure-openclaw-vps",
      title: "Securing OpenClaw on a VPS with Docker: A Security-First Setup Guide",
      excerpt: "When you deploy an AI gateway that sits between users, channels, and model providers, especially one that can broker tool calls, you're not just running 'another app.' You're creating a trust boundary. This guide walks you through a security-first, repeatable Docker setup on a VPS and explains the reasoning behind each control.",
      content: `When you deploy an AI gateway that sits between users, channels, and model providers — especially one that can broker tool calls — you're not just running "another app." You're creating a trust boundary. This guide walks through a security-first, repeatable Docker setup on a VPS and explains the reasoning behind each control.

## Why Security Matters for AI Gateways

AI gateways concentrate sensitive surface area: user inputs, model credentials, tool execution, and model outputs that may influence downstream actions. A compromised gateway is not just a service outage — it is a credential leak, a prompt injection vector, and potentially a tool-execution attack path.

## The Security Posture at a Glance

The reference setup hardens SSH (keys only, no root login), enforces a deny-by-default firewall, runs Docker with minimum-privilege containers, adds Fail2ban for intrusion prevention, and isolates the AI gateway behind a reverse proxy with TLS termination.

## Architecture Overview

The architecture separates concerns: the VPS handles network and OS hardening, Docker isolates application processes, the reverse proxy handles TLS and rate limiting, and OpenClaw itself runs as a non-root container with read-only root filesystem and a minimal capability set.

## Step-by-Step Hardening

The full guide walks through SSH hardening (keys only, no root), firewall configuration with intent, installing Docker and Compose v2 securely, and adding intrusion prevention with Fail2ban — explaining the security reasoning behind each step rather than just the commands.

For the complete step-by-step guide with config files and command-by-command security reasoning, read the original on Jofia Jose Prakash's blog.`,
      category: "AI Security & Infrastructure",
      mediumUrl: "https://www.thejofia.com/secure-openclaw-vps",
      createdAt: new Date("2026-02-07T10:00:00Z"),
    },
    {
      slug: "jofia-building-trust-supply-chain-ethical-ai",
      title: "Building Trust in the Supply Chain: Why Ethical AI Matters in Logistics",
      excerpt: "Artificial Intelligence is transforming the logistics industry — powering route optimization, freight pricing, demand forecasting, and multimodal planning. But as algorithms take on more critical decisions, one question becomes unavoidable: Can we trust the systems running our supply chains?",
      content: `Artificial Intelligence is transforming the logistics industry — powering route optimization, freight pricing, demand forecasting, and multimodal planning. But as algorithms take on more critical decisions, one question becomes unavoidable: Can we trust the systems running our supply chains?

## The Strategic Importance of Ethics in Logistics AI

Logistics is now an AI-mediated industry. Pricing engines, capacity allocation, freight matching, and ETA prediction all run on models that affect drivers' incomes, shippers' costs, and downstream consumers. Ethics here is not abstract — it is operational risk and strategic differentiation.

## Understanding Bias: Origins, Propagation, and Impact

Bias enters supply chain AI through historical data (which encodes past inequities), feature engineering (which can proxy for protected attributes), and feedback loops (where model outputs shape the next round of training data). Each of these requires its own mitigation strategy.

## Frameworks and Tools for Fairness and Transparency

Production-grade fairness in logistics AI requires more than a one-time fairness audit. It requires ongoing measurement, model cards, decision logs, and explainability surfaces that operations teams and partners can actually use.

## Engineering Governance for Sustainable AI

Governance has to live inside the engineering system, not bolted on. That means reviewable data pipelines, versioned models, drift monitoring, and clear human-in-the-loop escalation paths for high-impact decisions.

## The Future: Trust as a Competitive Advantage

The logistics organizations that win the next decade will be the ones whose AI systems partners and regulators can trust. Trust is built — through transparency, accountability, and ethics-forward engineering. Read the full piece on Jofia Jose Prakash's blog.`,
      category: "AI Ethics",
      mediumUrl: "https://www.thejofia.com/building-trust-supply-chain-ethical-ai",
      createdAt: new Date("2025-10-26T10:00:00Z"),
    },
    {
      slug: "jofia-building-production-ready-rag",
      title: "Building Production-Ready RAG Pipelines",
      excerpt: "Retrieval-Augmented Generation (RAG) has emerged as a transformative paradigm in enterprise AI, bridging the gap between large language models and domain-specific knowledge. Building production-ready RAG pipelines requires careful attention to architecture, scalability, and performance optimization.",
      content: `Retrieval-Augmented Generation (RAG) has emerged as a transformative paradigm in enterprise AI, bridging the gap between large language models and domain-specific knowledge. Building production-ready RAG pipelines requires careful attention to architecture, scalability, and performance optimization.

## The Evolution of RAG Architecture

Early RAG implementations were essentially "fetch top-k chunks and stuff them into a prompt." Production RAG looks very different: hybrid retrieval, query rewriting, reranking, structured grounding, and explicit handling of failure modes when retrieval is empty or wrong.

## Embedding Strategy and Vector Storage

Embedding choice is not a one-size-fits-all decision. The right model depends on domain (general vs. technical), language coverage, and downstream cost. Vector storage decisions — index type, sharding strategy, refresh cadence — have first-order impact on latency and freshness.

## Retrieval Quality and Ranking

The biggest quality lever in production RAG is ranking. A reranker stage on top of dense retrieval typically yields large improvements in answer accuracy and reduces hallucination rates by surfacing the right context to the model.

## Prompt Engineering, Monitoring, Cost, Security

Production RAG also demands prompt patterns that constrain the model to the retrieved context, robust monitoring of retrieval quality and answer faithfulness, cost optimization across embedding/storage/inference, and security controls for sensitive corpora.

For the full implementation guide — including real-world architecture patterns, evaluation strategies, and cost-benefit analyses — read the original on Jofia Jose Prakash's blog.`,
      category: "RAG & LLMs",
      mediumUrl: "https://www.thejofia.com/building-production-ready-rag",
      createdAt: new Date("2025-01-15T10:00:00Z"),
    },
    {
      slug: "jofia-future-of-multi-agent-ai",
      title: "The Future of Multi-Agent AI Systems",
      excerpt: "As artificial intelligence evolves beyond single-model capabilities, multi-agent systems are emerging as the next frontier. These orchestrated collections of specialized AI agents promise to solve problems that no individual system could handle alone.",
      content: `As artificial intelligence evolves beyond single-model capabilities, multi-agent systems are emerging as the next frontier. These orchestrated collections of specialized AI agents promise to solve problems that no individual system could handle alone.

## Understanding Multi-Agent Architecture

Multi-agent systems decompose complex tasks across specialized agents — each with its own role, tools, memory, and prompt context. The orchestration layer becomes the most important architectural decision: how agents discover each other, hand off state, and resolve conflicts.

## Orchestration Patterns

Production multi-agent systems converge on a few patterns: hierarchical (planner + workers), peer-to-peer (debate or critique loops), and pipeline (sequential specialists). Each pattern has distinct cost, latency, and reliability profiles.

## Real-World Applications

Multi-agent systems are landing first in domains where decomposition is natural and verification is cheap: research and synthesis, code generation and review, customer operations, and complex form/document processing.

## Technical Challenges

The hard problems are not modeling — they are coordination. State management across agents, error propagation, cost ceilings, and observability across the agent graph are where most production efforts succeed or fail.

## The Future Landscape

Expect the next wave to be defined by standardized agent protocols, better tooling for evaluation across agent graphs, and hybrid systems where deterministic workflow engines orchestrate non-deterministic agents. Read the full piece on Jofia Jose Prakash's blog.`,
      category: "Multi-Agent AI",
      mediumUrl: "https://www.thejofia.com/future-of-multi-agent-ai",
      createdAt: new Date("2024-12-20T10:00:00Z"),
    },
    {
      slug: "jofia-responsible-ai-in-practice",
      title: "Responsible AI in Practice",
      excerpt: "As AI systems become deeply embedded in critical decision-making processes—from hiring and lending to healthcare and criminal justice—the imperative for responsible AI development has never been more urgent. Building ethical AI isn't just about compliance; it's about creating systems that augment human potential while respecting fundamental rights and values.",
      content: `As AI systems become deeply embedded in critical decision-making processes — from hiring and lending to healthcare and criminal justice — the imperative for responsible AI development has never been more urgent. Building ethical AI isn't just about compliance; it's about creating systems that augment human potential while respecting fundamental rights and values.

## The Pillars of Responsible AI

Responsible AI rests on a few interlocking pillars: fairness, accountability, transparency, privacy, robustness, and human oversight. None of these can be retrofitted — they must be design constraints from day one.

## Detecting and Mitigating Bias

Bias detection requires both pre-deployment audits (subgroup performance, calibration, equalized odds) and continuous post-deployment monitoring. Mitigation strategies span data, model, and post-processing layers, and the right choice depends on the harm model and regulatory context.

## Building Explainable AI Systems

Explainability is not one thing — it ranges from feature attribution to counterfactuals to natural-language rationales. The right level of explanation depends on who consumes it: end users, operators, auditors, or regulators.

## Privacy-Preserving AI Techniques

Differential privacy, federated learning, and secure aggregation are moving from research into production. Each has clear cost-benefit tradeoffs and is appropriate for different sensitivity tiers.

## Governance and Regulatory Compliance

Effective governance combines policy, process, and tooling: model cards, decision logs, approval workflows, and documented risk reviews. The regulatory landscape (EU AI Act, US sector-specific guidance, evolving global frameworks) is rapidly tightening — and AI programs that wait to engage will pay a steep adjustment cost.

For the full breakdown — including testing strategies, validation patterns, and trust-through-transparency practices — read the original on Jofia Jose Prakash's blog.`,
      category: "Responsible AI",
      mediumUrl: "https://www.thejofia.com/responsible-ai-in-practice",
      createdAt: new Date("2024-11-10T10:00:00Z"),
    },
    {
      slug: "jofia-optimizing-llm-fine-tuning-with-peft",
      title: "Optimizing LLM Fine-Tuning with PEFT",
      excerpt: "Fine-tuning large language models has traditionally been prohibitively expensive—requiring massive GPU clusters and days of training. Parameter-Efficient Fine-Tuning (PEFT) techniques have revolutionized this landscape, enabling organizations to adapt powerful models to specialized tasks with a fraction of the computational cost and time.",
      content: `Fine-tuning large language models has traditionally been prohibitively expensive — requiring massive GPU clusters and days of training. Parameter-Efficient Fine-Tuning (PEFT) techniques have revolutionized this landscape, enabling organizations to adapt powerful models to specialized tasks with a fraction of the computational cost and time.

## The Challenge of Traditional Fine-Tuning

Full-parameter fine-tuning of modern LLMs requires multi-GPU clusters, days of compute, and enormous storage for each downstream variant. For most enterprise use cases, this cost is simply not justifiable.

## LoRA: Low-Rank Adaptation

LoRA freezes the base model and learns small low-rank update matrices on attention projections. The result: orders-of-magnitude fewer trainable parameters, faster training, and tiny adapter checkpoints that can be swapped in and out at inference time.

## QLoRA: Quantized Low-Rank Adaptation

QLoRA pushes the cost story further by quantizing the frozen base model to 4-bit while keeping LoRA adapters in higher precision. This brings fine-tuning of very large models within reach of single high-memory GPUs.

## Alternative PEFT Approaches and Implementation Best Practices

Beyond LoRA/QLoRA, prompt tuning, prefix tuning, and IA³ each occupy useful niches. Choosing the right technique depends on task complexity, dataset size, and how much you can tolerate base-model freezing.

## Multi-Adapter Management and Cost-Benefit

In production, the real win is multi-adapter management: one base model, many task-specific LoRA adapters, swapped at request time. The cost-benefit math typically favors PEFT over full fine-tuning by 10-100x for most enterprise tasks.

For the full implementation guide and evaluation patterns, read the original on Jofia Jose Prakash's blog.`,
      category: "LLM Fine-Tuning",
      mediumUrl: "https://www.thejofia.com/optimizing-llm-fine-tuning-with-peft",
      createdAt: new Date("2024-10-05T10:00:00Z"),
    },
  ];

  for (const p of jofiaPosts) {
    const existing = await db.select().from(blogPosts).where(eq(blogPosts.slug, p.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(blogPosts).values({
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        author: jofiaAuthor,
        category: p.category,
        imageUrl: jofiaImage,
        mediumUrl: p.mediumUrl,
        contentType: "article",
        published: true,
        createdAt: p.createdAt,
      });
    }
  }

  const vasuAuthor = "Vasu Raj Jain";
  const vasuPosts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    sourceUrl: string;
    source: string;
    createdAt: Date;
  }> = [
    {
      slug: "vasu-hybrid-multitenant-stateful-aws",
      title: "Building Hybrid Multi-tenant Architecture for Stateful Services on AWS",
      excerpt: "Most multi-tenant guidance assumes stateless services. Real ad platforms run on stateful systems — caches, session stores, partitioned queues — where pure pooled or pure silo isolation both fall apart at scale. A hybrid model is the only one that holds up.",
      content: `Most multi-tenant guidance on AWS assumes stateless services. Real advertising platforms — the kind that run at millions of requests per second — live in the opposite world: they are deeply stateful, with caches, session stores, partitioned queues, and tenant-aware data planes that all have to coexist.

Pure pooled isolation collapses under noisy-neighbor pressure. Pure silo isolation collapses under cost, operational overhead, and onboarding friction. The architecture that actually holds up in production is a hybrid: stateless tiers pooled, stateful tiers carefully partitioned, and a clear contract for what gets silo'd when a tenant's risk profile, regulatory posture, or traffic shape demands it.

This piece walks through the hybrid multi-tenant pattern we use for stateful services on AWS — how to model tenant identity at the data layer, where to put isolation boundaries in caches and persistent stores, and how to keep observability, quotas, and failure modes tractable as tenants scale.

Read the full piece on the AWS Architecture Blog for the reference architecture and the trade-off framework behind it.`,
      category: "AI Infrastructure",
      sourceUrl: "https://aws-blogs-prod.amazon.com/architecture/building-hybrid-multi-tenant-architecture-for-stateful-services-on-aws/",
      source: "AWS Architecture Blog",
      createdAt: new Date("2026-05-27T15:00:00Z"),
    },
    {
      slug: "vasu-agentic-revolution-real-time-bidding",
      title: "The Agentic Revolution in Real-Time Bidding",
      excerpt: "Real-time bidding has lived inside ten-millisecond windows for a decade. Agentic systems are quietly rewriting that contract — and the next generation of ad infrastructure will be judged not by latency alone, but by how well its agents reason, negotiate, and explain themselves.",
      content: `Real-time bidding has lived inside a ten-millisecond decision window for more than a decade. In that window, models score impressions, apply pacing, enforce brand safety, respect privacy signals, and clear an auction — all at planetary scale, all under hard latency constraints.

Agentic systems are quietly rewriting that contract. Instead of a single inference pass, an agent can decompose a bidding decision into reasoning steps, tool calls, and policy checks — running smaller specialized models in parallel, asking targeted questions of retrieval systems, and producing a decision that is auditable, not just fast.

This piece in Forbes Tech Council lays out where that shift is heading: how MCP-style tool contracts change the role of the bidder, why retrieval-augmented context is becoming a core RTB primitive, what governance and measurement have to look like when the bid is reasoned rather than scored, and how operators should think about cost, latency, and trust in an agentic stack.

Read the full piece on Forbes Tech Council.`,
      category: "Agentic AI",
      sourceUrl: "https://www.forbes.com/councils/forbestechcouncil/2026/04/17/the-agentic-revolution-in-real-time-bidding/",
      source: "Forbes Tech Council",
      createdAt: new Date("2026-05-27T14:00:00Z"),
    },
    {
      slug: "vasu-invisible-backbone-global-ad-infrastructure",
      title: "Engineering the Invisible Backbone of Global Ad Infrastructure",
      excerpt: "The ad infrastructure that funds the open internet is almost entirely invisible to the people it touches. That's a feature — but it's also a responsibility. A conversation about scale, reliability, and the engineering culture behind systems users never see.",
      content: `The ad infrastructure that funds the open internet is almost entirely invisible to the people it touches. Most users will never know a request was scored, an auction was cleared, and a creative was selected in the time it took their video player to render the next frame. That invisibility is a feature of the system — but it is also a responsibility.

In this conversation with AI Next Conference, Vasu walks through what it actually takes to engineer that backbone at planetary scale: how reliability is treated as a design choice rather than an accident, why most production AI problems are infrastructure problems wearing a model's clothing, and how engineering leaders should build teams that can ship into systems where a regression is measured in revenue per second.

The piece also covers what changes when agentic AI joins the stack: where MCP and RAG patterns belong, how to reason about cost and latency together, and why governance and measurement have to be designed in from the first commit, not added at the end.

Read the full feature on AI Next Conference.`,
      category: "Engineering Leadership",
      sourceUrl: "https://ainextconference.com/vasu-raj-jain-engineering-the-invisible-backbone-of-global-ad-infrastructure/",
      source: "AI Next Conference",
      createdAt: new Date("2026-05-27T13:00:00Z"),
    },
    {
      slug: "vasu-developer-diagnostic-tools-distributed-systems",
      title: "Why Developer Diagnostic Tools Should Be Designed Like Distributed Systems",
      excerpt: "Most developer tools are still built like single-tenant desktop apps — even when the systems they're trying to debug are anything but. Treating diagnostics as a distributed system in its own right unlocks better signal, lower toil, and faster recovery.",
      content: `Most developer diagnostic tools are still built like single-tenant desktop apps — even when the systems they are trying to debug are deeply distributed. The result is a familiar tax: scattered logs, brittle traces, dashboards that disagree with each other, and on-call engineers who spend more time correlating tools than fixing problems.

This piece in JourneyBytes argues for a deliberate inversion: treat the diagnostic toolchain itself as a distributed system, with the same disciplines you would apply to any production service. That means a clear data plane and control plane, schema-stable telemetry, idempotent and replayable workflows, and operational SLOs for the tools your engineers depend on.

It also covers the engineering culture shift that has to come with it — why "the tool is fine, just restart it" is a smell, how BDD-style test frameworks can dramatically shrink the time it takes to author new checks, and how investing in diagnostics pays back compound interest in release velocity and incident recovery.

Read the full piece on JourneyBytes.`,
      category: "Developer Tools",
      sourceUrl: "https://www.journeybytes.com/why-developer-diagnostic-tools-should-be-designed-like-distributed-systems/",
      source: "JourneyBytes",
      createdAt: new Date("2026-05-27T12:00:00Z"),
    },
  ];

  for (const p of vasuPosts) {
    const existing = await db.select().from(blogPosts).where(eq(blogPosts.slug, p.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(blogPosts).values({
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        author: vasuAuthor,
        category: p.category,
        imageUrl: null,
        mediumUrl: p.sourceUrl,
        contentType: "article",
        published: true,
        noImage: true,
        createdAt: p.createdAt,
      });
    } else {
      await db.update(blogPosts)
        .set({
          title: p.title,
          excerpt: p.excerpt,
          content: p.content,
          author: vasuAuthor,
          category: p.category,
          mediumUrl: p.sourceUrl,
          contentType: "article",
          published: true,
          noImage: true,
          createdAt: p.createdAt,
        })
        .where(eq(blogPosts.slug, p.slug));
    }
  }

  await db.transaction(async (db) => {
    await db.execute(sql`SELECT pg_advisory_xact_lock(911001)`);
  // The catalogue is matched on its natural key (title + date) and updated in
  // place. This used to delete the whole table and re-insert it, which handed
  // every event a brand-new serial id on EVERY server start. Two things broke
  // because of that. Anyone whose browser had the events page open across a
  // restart was holding ids that no longer existed, so pressing "Reserve my
  // spot" POSTed to a dead id and came back 404 "Event not found" — which on
  // Cloud Run, where instances come and go constantly, hit real people signing
  // up. And event_signups.event_id is a foreign key with ON DELETE CASCADE, so
  // each wipe silently took every registration ever recorded with it.
  //
  // Ids are now stable for the life of an event, and nothing here deletes.
  const eventSeed: (typeof events.$inferInsert)[] = [
    {
      title: "Museum Discussion: Product Management in the Age of AI",
      description: "An AI Discussion Club in-person gathering built around a podcast conversation between Lenny Rachitsky and Nikhyl Singhal, founder of The Skip and former product executive at Meta, Google, and Credit Karma. The group meets inside the Smithsonian National Postal Museum for introductions, walks the galleries while discussing how AI is reshaping product management, then heads to an optional lunch at Cafe Fili.",
      date: "2026-08-29",
      time: "10:30 AM - 12:30 PM ET",
      location: "Smithsonian National Postal Museum - Washington, DC",
      type: "Networking",
      imageUrl: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75,width=800,height=420/event-social/rv/5c856dd2-efff-4f4e-8a5e-18d8b97f10d7.png",
      secondaryImageUrl: null,
      link: "https://luma.com/ai-8crf",
      recordingUrl: null,
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
    {
      title: "Build with Claude 101: From Idea to Working Prototype (No Coding Experience Needed)",
      description: "An AI Discussion Club workshop, hosted by board director William Zhu, that teaches non-technical professionals how to turn ideas into working web apps using AI. You will watch a live build-and-deploy demo, then spend an hour creating your own project with hands-on support. No coding experience needed.",
      date: "2026-08-08",
      time: "3:00 PM Eastern",
      location: "West End Neighborhood Library - 2301 L St NW, Washington, DC",
      type: "Workshop",
      imageUrl: "https://images.lumacdn.com/uploads/0d/5778b8c2-6901-4b9f-9d39-0b9ce772774c.png",
      secondaryImageUrl: null,
      link: "https://luma.com/ai-iolu",
      recordingUrl: null,
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
    {
      title: "Outdoor Discussion Walk: WALL-E and the Future of AI",
      description: "An AI Discussion Club outdoor gathering, hosted by board director William Zhu, exploring whether the film WALL-E foreshadows our future with AI. The group meets for introductions, then walks Theodore Roosevelt Island in deep conversation about designing ethical AI systems and preserving human agency.",
      date: "2026-06-06",
      time: "10:30 AM - 12:30 PM ET",
      location: "Open Road Rosslyn - Arlington, VA",
      type: "Networking",
      imageUrl: "https://images.lumacdn.com/uploads/m7/bdc2669c-5967-4b44-9e2d-102260824f1d.webp",
      secondaryImageUrl: null,
      link: "https://luma.com/78bfskyi",
      recordingUrl: "https://luma.com/78bfskyi",
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
    {
      title: "Mall Discussion Walk: How Anthropic, Costco, and Patagonia Build Incorruptible Companies",
      description: "An AI Discussion Club walk co-hosted by board director William Zhu, exploring Eric Ries's ideas on building companies that keep their core values. The group meets at Shake Shack and walks Tysons Corner while discussing how organizations resist corruption and put long-term mission over short-term profit.",
      date: "2026-06-21",
      time: "3:00 PM - 5:00 PM ET",
      location: "Shake Shack Tysons Corner - McLean, VA",
      type: "Networking",
      imageUrl: "https://images.lumacdn.com/uploads/ps/65edcf19-ef1d-4869-a351-50f1a75777a2.png",
      secondaryImageUrl: null,
      link: "https://luma.com/ai-cm1j",
      recordingUrl: "https://luma.com/ai-cm1j",
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
    {
      title: "Humanity + AI Podcasts: More Women in AI Are Needed - feat. Lynn Gitau",
      description: "Danielle Franklin sits down with Lynn Gitau of GatherVerse, founder of Metaversations and a leading voice for community-driven, human-centered technology. They explore why the future of AI depends on more women helping to build it, and how representation shapes what gets built, who it serves, and the values baked into the systems shaping our lives.",
      date: "2026-07-29",
      time: "8:00 AM - 9:00 AM ET",
      location: "Online - Join Virtually",
      type: "Podcast",
      imageUrl: "https://gatherverse.org/wp-content/uploads/2022/11/Lynn-Gitau.jpg",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?t=ad2d1c7c94b95c266294",
      recordingUrl: null,
      speakerName: "Lynn Gitau",
      speakerProfileUrl: null,
    },
    {
      title: "Humanity + AI Podcasts: Who's Accountable When AI Decides? - feat. Mike Klyce",
      description: "Board director and Chief Legal & AI Governance Officer Mike Klyce joins Humanity + AI for a candid conversation about law, liability, and trust in the age of AI. As AI systems make more consequential decisions, who is accountable when they get it wrong? Mike explores the guardrails, governance, and legal thinking that keep AI safe, fair, and worthy of public trust.",
      date: "2026-08-14",
      time: "5:00 PM Eastern",
      location: "Online - Join Virtually",
      type: "Podcast",
      imageUrl: "/uploads/mike-klyce.webp",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?t=ad2d1c7c94b95c266294",
      recordingUrl: null,
      speakerName: "Mike Klyce",
      speakerProfileUrl: "/about/board/mike-klyce",
    },
    {
      title: "Humanity + AI Podcasts: Building Human-Centered AI Through Partnership - feat. David Wood",
      description: "Board director David Wood joins Humanity + AI to talk about building technology that genuinely serves people. From strategic partnerships to human-centered design, David shares how the right collaborations across companies, communities, and disciplines can steer AI toward outcomes that put human dignity and judgment first.",
      date: "2026-08-21",
      time: "5:00 PM Eastern",
      location: "Online - Join Virtually",
      type: "Podcast",
      imageUrl: "/uploads/david-wood.jpg",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?t=ad2d1c7c94b95c266294",
      recordingUrl: null,
      speakerName: "David Wood",
      speakerProfileUrl: "/about/board/david-wood",
    },
    {
      title: "Humanity + AI Podcasts: Applied AI and Community - feat. William Zhu",
      description: "Board director William Zhu joins Humanity + AI to explore what it takes to move applied AI from prototype to something people actually use. At the intersection of technology, community, and human judgment, William shares how convening the people who shape AI, and building with them rather than just for them, leads to products that earn trust and last.",
      date: "2026-08-07",
      time: "5:00 PM Eastern",
      location: "Online - Join Virtually",
      type: "Podcast",
      imageUrl: "/uploads/william-zhu.webp",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?t=ad2d1c7c94b95c266294",
      recordingUrl: null,
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
    {
      title: "AI Build Club: How We AI - Demo Night!",
      description: "An in-person AI demo night hosted and sponsored by Prefect at their Downtown DC headquarters. Three hand-selected builders from the DMV take the floor to show what they've built with AI - an agent, a shipped product, or a workflow that saves hours every week. Grab food, meet fellow creators, and leave with ideas you can actually explore. Whether you're AI-curious or already building, you'll fit right in.",
      date: "2026-07-30",
      time: "5:30 PM Eastern",
      location: "Prefect HQ, 2112 Pennsylvania Ave NW, Washington, DC",
      type: "Networking",
      imageUrl: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75,width=800,height=420/event-social/o4/83441956-8fef-482f-aaec-8df4ef511652.png",
      secondaryImageUrl: null,
      link: "https://luma.com/2nui7i7i?tk=nfnGGj",
      recordingUrl: null,
      speakerName: "AI Build Club DC",
      speakerProfileUrl: null,
    },
    {
      title: "Introduction to Humanity + AI Podcasts",
      description: "Join Danielle Franklin and the Humanity + AI, Inc. team for the launch of Humanity + AI Podcasts — a new conversation series exploring AI, technology leadership, and human-centered innovation. Meet the board, hear what's coming, and be part of the kickoff.",
      date: "2026-05-01",
      time: "5:00 PM – 6:00 PM ET",
      location: "Online — Riverside Studio",
      type: "Networking",
      imageUrl: "/uploads/image_1777569193885.png",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?token=70ccd23af3e86a2c72b0d715ec04b67db867b067",
      recordingUrl: "https://riverside.com/dashboard/studios/danielle-franklins-studio-dy1Ck/recordings/64b37e71-3ba4-462b-92bb-22407ba6eb03?share-token=c974d434c49cc12e6012&content-shared=recording",
    },
    {
      title: "AI Economics Session with Jack of All AI",
      description: "Join Jack of All AI for an engaging session exploring the economics of artificial intelligence — how AI is reshaping markets, labor, investment, and value creation across industries. Part of the Humanity + AI, Inc. education series.",
      date: "2026-05-07",
      time: "11:00 AM – 12:00 PM ET (4:00 PM – 5:00 PM BST / UK)",
      location: "Online — Riverside Studio",
      type: "Education",
      imageUrl: "/uploads/jack-of-all-ai-economics.png",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?t=ad2d1c7c94b95c266294",
      recordingUrl: "https://riverside.com/dashboard/studios/danielle-franklins-studio-dy1Ck/recordings/31853ae2-ab4d-44ff-b0e4-cec9c458d09e?share-token=c974d434c49cc12e6012&content-shared=recording",
    },
    {
      title: "Introduction to Responsible AI Inclusion: Perspectives of Nirmal & Humanity + AI, Inc.",
      description: "A live conversation introducing Responsible AI Inclusion — exploring how diverse perspectives, ethical practice, and community participation shape an AI future that works for everyone. Featuring Nirmal in dialogue with the Humanity + AI, Inc. team.",
      date: "2026-05-14",
      time: "5:00 PM – 6:00 PM ET",
      location: "Online — Riverside Studio",
      type: "Education",
      imageUrl: "/uploads/responsible-ai-nirmal.png",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?t=ad2d1c7c94b95c266294",
      recordingUrl: "https://riverside.com/dashboard/studios/danielle-franklins-studio-dy1Ck/recordings/ce92c7ca-e325-4540-a641-9964cacd9883?share-token=c974d434c49cc12e6012&content-shared=recording",
    },
    {
      title: "Humanity + AI Podcasts Spotlight: William Kreitzer — AI-Powered Accessibility & InclusiCare",
      description: "Join us for an inspiring conversation with William Kreitzer, Founder of InclusiCare and Board Member of Humanity + AI, Inc. Explore the future of AI-driven accessibility, how InclusiCare is transforming daily life through intelligent systems, and what it truly means to build human-centered technology that empowers independence and dignity for all.",
      date: "2026-05-21",
      time: "5:00 PM – 6:00 PM ET",
      location: "Online — Join Virtually",
      type: "Podcast",
      imageUrl: "/uploads/william-kreitzer-tlcast.png",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?t=ad2d1c7c94b95c266294",
      recordingUrl: "https://riverside.com/dashboard/studios/danielle-franklins-studio-dy1Ck/recordings/66ce0e3c-7e7c-43c4-a85c-29460ab8c4ba?share-token=c974d434c49cc12e6012&content-shared=recording",
    },
    {
      title: "Humanity + AI Podcasts: ThinkWithJofia — Human-Centered AI, Enterprise Innovation & Intelligent Systems",
      description: "Real conversations with leaders shaping an intelligent, responsible, and human-centered future. Featuring Jofia Jose Prakash — AI Architect, Builder, and Enterprise Strategist creating intelligent systems that amplify humanity. We will explore: the future of intelligent systems, multi-agent AI & enterprise deployment, responsible AI & governance, human-centered innovation in the AI era, and building AI that amplifies humanity.",
      date: "2026-06-05",
      time: "5:00 PM Eastern",
      location: "Online — Join Virtually",
      type: "Podcast",
      imageUrl: "/uploads/posts/jofia-tlcast-june5.png",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?t=ad2d1c7c94b95c266294",
      recordingUrl: "https://riverside.com/dashboard/studios/danielle-franklins-studio-dy1Ck/recordings/a4cefa34-c831-4b8f-ad87-888b96652fef?share-token=c974d434c49cc12e6012&content-shared=recording",
    },
    {
      title: "From Human in the Model to Human in the Loop: The Silencing of Human Voice in Frontier AI — feat. Mike Klyce",
      description: "As frontier AI systems exhaust the supply of human-generated data, labs are increasingly turning inward — training models on synthetic outputs generated by other models. This session explores the loss of organic human variance in training data, the rise of self-referential model ecosystems, the risk of flattened perception and creativity, and the deeper question: Can AI truly understand humanity without humanity embedded in its foundation?",
      date: "2026-05-29",
      time: "4:00 PM ET",
      location: "Online — Join Virtually",
      type: "Education",
      imageUrl: "/uploads/human-in-the-model-may29.png",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?t=ad2d1c7c94b95c266294",
      recordingUrl: "https://riverside.com/dashboard/studios/danielle-franklins-studio-dy1Ck/projects/6a19f0d9f870218a52ed9097",
    },
    {
      title: "Humanity + AI: Build Your Brand in the Digital Era — feat. Renee & David Wood",
      description: "Your brand is no longer what you say it is — it's what your reputation, your relationships, and now your AI-shaped digital footprint say it is. In this conversation, Renee and David Wood join Humanity + AI, Inc. to explore how leaders build authentic, durable personal and organizational brands in the digital era. Drawing on the Hartman Value Profile (HVP) framework for understanding values, judgment, and decision-making, we'll unpack how self-awareness and human-centered values become a competitive advantage — and how to show up with clarity, character, and purpose in an AI-mediated world.",
      date: "2026-06-19",
      time: "5:00 PM – 6:00 PM ET",
      location: "Online — Join Virtually",
      type: "Podcast",
      imageUrl: "/uploads/build-your-brand-june19.png",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?t=ad2d1c7c94b95c266294",
      recordingUrl: "https://riverside.com/dashboard/editor/preview/fc710645-20fa-4bbc-85d9-207685a9cccd/6a35c20244812e081ec4538b?share-token=c974d434c49cc12e6012&content-shared=recording-preview",
    },
    {
      title: "AI Demystified: From Hype to Agents",
      description: "Humanity + AI board director Jofia Jose Prakash headlines CertTulen's free live webinar, \"AI Demystified: From Hype to Agents.\" In 45 minutes she cuts through the jargon to explain what AI really means for your career — no hype, just clear, grounded understanding you can act on, from foundational concepts through to the rise of AI agents. Hosted by CertTulen and supported by Microsoft, HRD Corp, and Malaysia's Ministry of Human Resources. Registration is free.",
      date: "2026-07-05",
      time: "Live Webinar · 45 Minutes",
      location: "Virtual · Online",
      type: "Education",
      imageUrl: "/uploads/ai-demystified-jofia.jpeg",
      secondaryImageUrl: null,
      link: "https://certtulen.com/events/ai-demystified/",
      recordingUrl: null,
      speakerName: "Jofia Jose Prakash",
      speakerProfileUrl: "/about/board/jofia-jose-prakash",
    },
    {
      title: "Humanity + AI Podcasts: Human Authenticity, Leadership & Conscious AI — feat. Vina Torossian",
      description: "Danielle Franklin sits down with board member and treasurer Vina Torossian — senior banking executive, TEDx speaker, and founder of the leadership consultancy Karaka — for a conversation on leading with whole presence in the age of AI. They explore human authenticity, consciousness, and wellbeing as leadership disciplines, and how financial rigor paired with a deeply human philosophy keeps people at the center of fast-moving technology.",
      date: "2026-07-17",
      time: "5:00 PM Eastern",
      location: "Online — Join Virtually",
      type: "Podcast",
      imageUrl: "/uploads/vina-torossian.png",
      secondaryImageUrl: null,
      link: "https://riverside.com/studio/danielle-franklins-studio-dy1Ck?t=ad2d1c7c94b95c266294",
      recordingUrl: null,
      speakerName: "Vina Torossian",
      speakerProfileUrl: "/about/board/vina-torossian",
    },
    {
      title: "Museum Discussion Walk: Perfect Search for an Agentic Internet | Exa",
      description: "Board member William Zhu and the AI Discussion Club host a walking discussion inside the Smithsonian's National Air and Space Museum, unpacking the a16z conversation between Sarah Wang and Exa cofounder & CEO Will Bryk on building search infrastructure for the AI era — what does search look like when the user is an autonomous agent, not a human? Meet at the South Entrance at 10:30 AM (reserve a free museum entry pass in advance), then walk and discuss until 12:30 PM. RSVP on Luma to attend.",
      date: "2026-07-11",
      time: "10:30 AM – 12:30 PM ET",
      location: "Smithsonian's National Air and Space Museum, Washington, DC",
      type: "Education",
      imageUrl: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,background=white,quality=75,width=400,height=400/uploads/vk/7a931356-8ee0-44fb-b80b-ece8003641c1.png",
      secondaryImageUrl: null,
      link: "https://luma.com/ai-i4c9",
      recordingUrl: null,
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
    {
      title: "Builder Nights: Show your AI Projects, Learn from the Best Minds in AI",
      description: "An evening of live AI product showcases, audience feedback, and focused conversations with builders, founders, and AI enthusiasts in the DC area — co-hosted by board member William Zhu with the AI Discussion Club. Builders demo projects at any stage and get months of feedback in ten minutes; learners join breakout groups on go-to-market strategy, AI dev tools & productivity, edge AI & hardware tinkering, and more. RSVP on Luma to attend.",
      date: "2026-07-16",
      time: "5:30 PM – 7:45 PM ET",
      location: "AWS Skills Center Arlington, Arlington, VA",
      type: "Networking",
      imageUrl: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,background=white,quality=75,width=400,height=400/gallery-images/wi/ba62c5e1-cdd3-4d50-b61e-113b428586b3",
      secondaryImageUrl: null,
      link: "https://luma.com/ai-f7oi",
      recordingUrl: null,
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
    {
      title: "Museum Discussion: What happens after coding is solved? | Fiona Fung",
      description: "William Zhu and the AI Discussion Club gather at the National Museum of Asian Art to discuss Lenny's Podcast interview with Fiona Fung, who leads the Claude Code and Cowork teams at Anthropic after 11 years at Microsoft on Visual Studio and TypeScript and founding Facebook Marketplace at Meta. What changes about building software — and leading engineers — once coding itself is solved? Meet at the North Entrance at 10:30 AM, walk and discuss until 12:30 PM, with an optional lunch afterward. RSVP on Luma to attend.",
      date: "2026-07-26",
      time: "10:30 AM – 12:30 PM ET",
      location: "National Museum of Asian Art, Washington, DC",
      type: "Education",
      imageUrl: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,background=white,quality=75,width=400,height=400/uploads/ip/13c44edb-ab02-46ca-9236-f37bd2b36fa0.png",
      secondaryImageUrl: null,
      link: "https://luma.com/ai-ao1s",
      recordingUrl: null,
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
    {
      title: "Build your first website in 2 Hours with Claude & Vercel (Beginner friendly)",
      description: "A hands-on workshop for non-coders and curious professionals who want to turn an idea into a working website using AI — no coding experience required. Co-hosted by board member William Zhu with the AI Discussion Club and AI Build Club, the session walks through setting up Claude Code, building an app from scratch, and deploying it to the web with Vercel, followed by a full hour of guided building on your own project. Bring a laptop and an idea. The companion self-paced guide is available in our Learning Hub. RSVP on Luma to attend.",
      date: "2026-09-17",
      time: "5:30 PM – 8:00 PM ET",
      location: "AWS Skills Center Arlington, Arlington, VA",
      type: "Workshop",
      imageUrl: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75,width=1200,height=630/event-social/9w/0963d7ac-a426-47a3-88bf-6db58af9d26a.png",
      secondaryImageUrl: null,
      link: "https://luma.com/ai-rzd0",
      recordingUrl: null,
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
    {
      title: "Author Book Talk: Who is in Charge? Why AI Must Remain Under Human Control",
      description: "Board member William Zhu and the AI Discussion Club host author Khaled Koubaa — Founder and CEO of AT Worthy Technology, former ICANN board director, and a member of the World Bank Group Sanctions Board — for a talk on his book Who Is in Charge? As AI systems advise, decide, and act at a speed where human review can become ceremonial, Koubaa argues for a new doctrine: Human in the Oversight. Welcome and introductions at 10:30 AM, book talk at 10:50, author Q&A at 11:40, with an optional lunch afterward. A few copies of the book will be available. RSVP on Luma to attend.",
      date: "2026-09-19",
      time: "10:30 AM – 12:00 PM ET",
      location: "West End Neighborhood Library, 2301 L St NW, Washington, DC",
      type: "Education",
      imageUrl: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75,width=1200,height=630/event-social/77/eae0229c-ccb6-480a-b71c-34e1b9694838.png",
      secondaryImageUrl: null,
      link: "https://luma.com/ai-qzlc",
      recordingUrl: null,
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
    {
      title: "Picnic Discussion: The rise of AI teammates | Tara Seshan",
      description: "A bring-your-own-snacks picnic discussion hosted by board member William Zhu and the AI Discussion Club, unpacking a podcast interview with Tara Seshan, who leads product for Codex and ChatGPT Work at OpenAI after six years as one of Stripe's first product managers. As AI evolves from transactional prompts into persistent, autonomous coworkers, how should we redesign our daily work? Meet at the Labyrinth Statue in Georgetown Waterfront Park at 4:00 PM for introductions, then picnic and discuss until 6:00 PM, with an optional dinner afterward. RSVP on Luma to attend.",
      date: "2026-09-27",
      time: "4:00 PM – 6:00 PM ET",
      location: "Georgetown Waterfront Park, Washington, DC",
      type: "Education",
      imageUrl: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75,width=1200,height=630/event-social/bh/c4555f9b-f1ca-4e29-a6c5-77de14f8fdda.png",
      secondaryImageUrl: null,
      link: "https://luma.com/ai-wz0t",
      recordingUrl: null,
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
    {
      title: "Outdoor Discussion Walk: AI for Scientific Research | Terence Tao",
      description: "Board member William Zhu and the AI Discussion Club lead a round-trip walk from Farragut Square to the National Academy of Sciences, discussing a podcast interview with Fields Medal–winning mathematician Terence Tao on scientific research in the age of AI — what AI does well, where it still fails, and how open, crowdsourced collaboration is reshaping research. Meet at Farragut Square at 10:30 AM for introductions, walk and discuss until 12:30 PM, with an optional lunch afterward. RSVP on Luma to attend.",
      date: "2026-10-10",
      time: "10:30 AM – 12:30 PM ET",
      location: "Farragut Square, Washington, DC",
      type: "Education",
      imageUrl: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=1,anim=false,background=white,quality=75,width=1200,height=630/event-social/0g/595e5921-ad43-4594-8e78-cd0cf3a932b7.png",
      secondaryImageUrl: null,
      link: "https://luma.com/ai-4zr0",
      recordingUrl: null,
      speakerName: "William Zhu",
      speakerProfileUrl: "/about/board/william-zhu",
    },
  ];

  for (const seedEvent of eventSeed) {
    const [existing] = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.title, seedEvent.title), eq(events.date, seedEvent.date)))
      .limit(1);
    if (existing) {
      await db.update(events).set(seedEvent).where(eq(events.id, existing.id));
    } else {
      await db.insert(events).values(seedEvent);
    }
  }
  });

  // Fundraising campaigns: one per program/project plus the AI Training Fund.
  // Goals are scaled to each initiative's realistic scope: ROSIE (flagship
  // multi-year research) is largest; literacy/advocacy programs are leaner.
  // Upserted so goals stay in sync while progress (computed from real
  // donations) is never reset on restart.
  const campaignSeed = [
    {
      slug: "project-rosie",
      title: "Project ROSIE",
      description: "Fund our flagship research integrating AI, frequency analysis, and behavioral science to pioneer interspecies communication.",
      category: "project",
      goalCents: 25000000,
      sortOrder: 1,
    },
    {
      slug: "tech-leadership-community",
      title: "Tech Leadership Community",
      description: "Support mentorship, workshops, and networking that develop the next generation of ethical tech leaders.",
      category: "project",
      goalCents: 7500000,
      sortOrder: 2,
    },
    {
      slug: "ai-ethics-governance",
      title: "AI Ethics & Governance",
      description: "Advance ethical frameworks, policy research, and public education for responsible AI development and deployment.",
      category: "project",
      goalCents: 12000000,
      sortOrder: 3,
    },
    {
      slug: "science-canine-mind",
      title: "A Science of the Canine Mind",
      description: "Help complete and share the two-volume book series uniting data, empathy, and science to begin communication with animals.",
      category: "project",
      goalCents: 6000000,
      sortOrder: 4,
    },
    {
      slug: "community-ai-literacy",
      title: "Community AI Literacy",
      description: "Make AI accessible to everyone through free workshops, seminars, and online resources for all skill levels.",
      category: "project",
      goalCents: 5000000,
      sortOrder: 5,
    },
    {
      slug: "ai-training-hub",
      title: "AI Training Hub",
      description: "Grow our free training resource center — curated courses, learning paths, and hands-on projects in AI and machine learning.",
      category: "project",
      goalCents: 8500000,
      sortOrder: 6,
    },
    {
      slug: "animal-welfare-advocacy",
      title: "Animal Welfare Advocacy",
      description: "Support international animal welfare partners like SOS Galgos, using AI tools to aid rescue operations and welfare research.",
      category: "project",
      goalCents: 4000000,
      sortOrder: 7,
    },
    {
      slug: "ai-training-fund",
      title: "AI Training Fund",
      description: "Power free, high-quality AI education in the Learning Hub — keeping courses, learning paths, and open-source tools accessible to all.",
      category: "fund",
      goalCents: 10000000,
      sortOrder: 8,
    },
  ];
  for (const c of campaignSeed) {
    await db
      .insert(campaigns)
      .values(c)
      .onConflictDoUpdate({
        target: campaigns.slug,
        set: {
          title: c.title,
          description: c.description,
          category: c.category,
          goalCents: c.goalCents,
          sortOrder: c.sortOrder,
        },
      });
  }

  const existingPosts = await db.select().from(blogPosts);
  if (existingPosts.length > 0) return;

  await db.insert(blogPosts).values([
    {
      title: "The Optimum Computing Machine: Robots, AI, and the Human Blueprint",
      slug: "optimum-computing-machine",
      excerpt: "When we talk about AI and robotics today, we're not just talking about lines of code or chips. We are, in essence, working toward a form of intelligence that mirrors our own biological systems.",
      content: `When we talk about AI and robotics today, we're not just talking about lines of code or chips. We are, in essence, working toward a form of intelligence that mirrors our own biological systems.

The human body is the most sophisticated computing machine ever created. Our neural networks process information at speeds and with a complexity that no artificial system has yet matched. But as we advance in AI and robotics, we're drawing increasingly closer to understanding and replicating these natural processes.

At Humanity + AI, Inc., we believe this journey of discovery must be guided by ethical principles and a deep respect for the human experience. Technology should amplify our capabilities, not replace our humanity.

The convergence of biological understanding and artificial intelligence opens doors to revolutionary applications in healthcare, education, and communication. But it also demands that we approach these advances with wisdom and foresight.

Our research into neural architectures, behavioral computing, and cognitive modeling aims to bridge the gap between artificial and natural intelligence in ways that benefit all of humanity.`,
      author: "Danielle A. Franklin",
      category: "AI Research",
      imageUrl: "/uploads/blog_optimum_computing.png",
      mediumUrl: "https://medium.com/@daniellefranklin808/the-optimum-computing-machine-robots-ai-and-the-human-blueprint-ea02feaf24bf",
      contentType: "article",
      published: true,
    },
    {
      title: "Interspecies Communication: Bridging the Gap Between Species",
      slug: "interspecies-communication",
      excerpt: "In order to understand universal or inter-species communication, we must first understand how communication and connection across humans works at a fundamental level.",
      content: `In order to understand universal or inter-species communication, we must first understand how communication and connection across humans works at a fundamental level.

Communication is not merely the exchange of words. It encompasses body language, emotional resonance, frequency patterns, and subtle environmental cues that we process both consciously and unconsciously.

Project ROSIE (Research on Species Intelligence and Empathy) is our groundbreaking initiative that integrates AI, frequency analysis, and behavioral science to explore the boundaries of cross-species communication.

Through advanced pattern recognition and machine learning, we're developing tools that can analyze and interpret the complex communication patterns of canines, with the goal of creating a bridge between human and animal understanding.

This research has profound implications not just for animal welfare, but for our understanding of intelligence itself. If we can decode the communication patterns of other species, we gain deeper insight into the nature of consciousness and connection.`,
      author: "Danielle A. Franklin",
      category: "Project ROSIE",
      imageUrl: "/uploads/blog_interspecies.png",
      mediumUrl: "https://medium.com/@daniellefranklin808/interspecies-communication-2227472f5a71",
      contentType: "article",
      published: true,
    },
    {
      title: "Beyond CMOS: Embracing Hybrid and New Technologies for the Future of Computing",
      slug: "beyond-cmos-future-computing",
      excerpt: "For decades, CMOS technology has been the backbone of the semiconductor industry. As we approach its physical limits, new paradigms in computing are emerging.",
      content: `For decades, CMOS (Complementary Metal-Oxide-Semiconductor) technology has been the backbone of the semiconductor industry, enabling the exponential growth in computing power that has defined our digital age.

However, as transistors approach atomic scales, we're encountering fundamental physical limitations. The future of computing lies in hybrid architectures that combine traditional silicon with quantum computing, neuromorphic chips, and biological computing elements.

At Humanity + AI, Inc., we're particularly interested in neuromorphic computing — chips that mimic the structure and function of biological neural networks. These systems promise not just faster processing, but fundamentally different ways of handling information.

The implications for AI are profound. Neuromorphic systems could enable AI that truly thinks in patterns similar to biological brains, opening new possibilities for intuitive AI, real-time learning, and energy-efficient computing.

As we transition beyond CMOS, the ethical considerations become even more critical. We must ensure these powerful new computing paradigms are developed responsibly and deployed equitably.`,
      author: "Danielle A. Franklin",
      category: "Technology",
      imageUrl: "/uploads/blog_beyond_cmos.png",
      mediumUrl: "https://medium.com/@daniellefranklin808/beyond-cmos-embracing-hybrid-and-new-technologies-for-the-future-of-computing-94eda77d2ca7",
      contentType: "article",
      published: true,
    },
    {
      title: "The Bridge of Bark and Words: Inter-Species Communication Between Canines and Humans",
      slug: "bridge-bark-words",
      excerpt: "Exploring the rich communication landscape between canines and humans, and how AI can help us understand each other better.",
      content: `The relationship between humans and dogs spans tens of thousands of years, making it one of the most enduring interspecies partnerships in history. Yet despite this long history, we've only scratched the surface of understanding how our canine companions truly communicate.

Dogs communicate through a complex system of vocalizations, body language, scent signals, and emotional resonance. Each bark, whimper, and tail wag carries specific meaning — a language we're only beginning to decode.

Our "A Science of the Canine Mind" book series explores this fascinating territory. Volume 1, "Foundations for Communication," establishes the scientific framework for understanding canine cognition and communication patterns.

Volume 2, "The CERT: Canine Emotional Resonance Techniques and Applications," introduces practical techniques for deepening the communication bond between humans and their canine companions.

Through AI and machine learning, we can analyze patterns in canine behavior that are invisible to the naked eye, creating tools that help us better understand and respond to our four-legged friends.`,
      author: "Danielle A. Franklin",
      category: "Research",
      imageUrl: "/uploads/blog_bark_words.png",
      mediumUrl: "https://medium.com/@daniellefranklin808/the-bridge-of-bark-and-words-inner-species-communication-between-canines-and-humans-ecb51ad80a44",
      contentType: "article",
      published: true,
    },
    {
      title: "Ethical AI Development: A Framework for the Future",
      slug: "ethical-ai-framework",
      excerpt: "As AI becomes more prevalent in society, establishing ethical frameworks for development and deployment becomes not just important, but essential.",
      content: `As artificial intelligence continues to permeate every aspect of our lives, the need for robust ethical frameworks has never been more urgent. At Humanity + AI, Inc., we believe that ethical AI development is not just a nice-to-have — it's a fundamental requirement for a sustainable technological future.

Our framework for ethical AI development rests on four pillars:

1. Transparency: AI systems should be explainable and their decision-making processes should be understandable to the people they affect.

2. Equity: AI must be developed and deployed in ways that don't perpetuate or amplify existing biases and inequalities.

3. Accountability: There must be clear lines of responsibility for AI systems and their outcomes.

4. Human-Centeredness: AI should augment and empower human capabilities, not replace human judgment in critical decisions.

Through our community programs, workshops, and advocacy, we're working to ensure these principles are embedded in AI development from the ground up. We mentor emerging tech leaders in ethical development practices and advocate for responsible AI policies at all levels.`,
      author: "Danielle A. Franklin",
      category: "AI Ethics",
      imageUrl: "/uploads/blog_ethical_ai.png",
      contentType: "article",
      published: true,
    },
    {
      title: "Quantum Computing's Hidden Design Error — and the Simple Shift That Could Fix It",
      slug: "quantum-computing-hidden-design-error",
      excerpt: "Change the sequence, change the outcome. Everyone keeps talking about scaling qubits, but barely anyone is pointing at the actual sequence problem baked into the architecture.",
      content: `Change the sequence, change the outcome.

Desire → Enforce → Inhibit = scalable
Desire → Inhibit → Enforce = collapse that looks like progress

This is the fix sitting in plain sight.

Everyone keeps talking about scaling qubits (quantum bits that can be 0 and 1 at the same time), extending coherence (how long a qubit stays stable), reducing the noise (unwanted interference), etc. But barely anyone is pointing at the actual sequence problem that's baked into the architecture. Because of that one ordering error, we're wasting most of our energy fixing decay we invite by design.

The Core Issue Nobody Names

A qubit is a basic unit of quantum information. Think of it like a spinning coin — until you look, it's neither heads nor tails. It's both. That's what makes quantum computing powerful. But to use it, we have to enforce meaning on that spin — and then inhibit the noise that tries to scramble it.

The current approach looks like this:
1. Desire — We create a superposition (the coin is spinning).
2. Inhibit — We try to prevent decoherence before we've locked in anything useful.
3. Enforce — Then we try to gate the qubit into meaningful computation.

The result? We're managing collapse before the structure is stable. It's like building a wall and then immediately trying to weatherproof it before the foundation is set. You're solving a problem that hasn't been anchored yet.

The Correct Sequence

If you flip steps 2 and 3 — enforce first, then inhibit — the architecture changes fundamentally:
1. Desire — Superposition is created.
2. Enforce — Gate operations lock in coherent, intentional state.
3. Inhibit — Error correction and noise suppression protect a stable result.

This is the same cycle used in every successful system design — biological, mechanical, organizational. You build the thing, then shield it. Not the other way around.

Why This Matters for Scaling

Every major quantum lab is chasing fault tolerance through more physical qubits, more surface codes, more overhead — all because they're compensating for premature inhibition. If the operational order is corrected, the error rates drop structurally, not just statistically.

You don't need 1,000 physical qubits per logical qubit if the logical qubit is architected in the right order from the start.

This isn't about adding more — it's about sequencing better.`,
      author: "Danielle A. Franklin",
      category: "Quantum Computing",
      imageUrl: "/uploads/blog_quantum_computing.png",
      mediumUrl: "https://medium.com/@daniellefranklin808/quantum-computings-hidden-design-error-and-the-simple-shift-that-could-fix-it-7b1ba9c3e5bc",
      contentType: "article",
      published: true,
    },
    {
      title: "Silicon Photonics Next Tech Coming 2026",
      slug: "silicon-photonics-2026",
      excerpt: "The AI age has officially outgrown copper. NVIDIA is betting its networking future on silicon photonics + co-packaged optics — not as a moonshot, but as a core building block.",
      content: `Welcome Silicon Photonics to the Quantum Game

The AI age has officially outgrown copper.

NVIDIA is betting its networking future on silicon photonics + co-packaged optics — not as a moonshot, but as a core building block. The era of "electrons only" interconnects is yielding to a world of light.

What's the Big Shift?

Traditional transistor-era CMOS designs were built expecting electrons to carry information. But as data rates surge — Terabits per second between GPUs, racks, and pods — those copper and PCB-based paths are becoming energy hogs, latency traps, and signal-integrity nightmares.

Silicon photonics flips that. You trade in long copper traces and electrical SerDes for waveguides etched into silicon that carry light — photons — at terabit speeds with a fraction of the power.

NVIDIA's play is clear: co-packaged optics (CPO) — where photonic transceivers sit directly on or next to the switch ASIC, not at the end of a fiber plugged into a faceplate. That kills the bottleneck between compute and network I/O.

Why It Matters for AI Infrastructure

GPU clusters aren't just big — they're getting enormous. Training frontier models requires thousands of GPUs connected with ultra-low latency. If the interconnects can't keep up, it doesn't matter how fast the chips are. Silicon photonics is the infrastructure layer that makes exascale AI compute viable.

The convergence with quantum systems is also significant. Photonic interconnects can potentially bridge classical AI accelerators with quantum processors, creating hybrid architectures that leverage the strengths of both paradigms.

For the defense sector, this has massive implications. High-bandwidth, low-latency, energy-efficient interconnects are critical for real-time AI processing in contested environments — from space-based sensors to autonomous platforms.`,
      author: "Danielle A. Franklin",
      category: "Technology",
      imageUrl: "/uploads/blog_silicon_photonics.png",
      mediumUrl: "https://medium.com/@daniellefranklin808/silicon-photonics-next-tech-coming-2026-0e2f9aaebb1e",
      contentType: "article",
      published: true,
    },
    {
      title: "Money Playbook: What Most People Do in Panic and What Not To Do Applying Market Sentiment",
      slug: "money-playbook-market-sentiment",
      excerpt: "How to use knowledge to get ahead in the market — tying tone of individuals, tone in general to the market, and what to do based on key emotional indicators.",
      content: `This document explains how to make the most money by applying the 26-tone scale to stock market psychology, combined with the universal cycle of action. It builds on the panic market survival playbook and translates tone analysis into trading strategy.

Guiding Principle

The most money is made not by chasing exuberance, but by being causative during panic. Most traders buy high (exuberance) and sell low (fear). Cycle mastery flips this: buy into dispersal (when fear exhausts) and sell into ridge formation (when enthusiasm peaks).

Using the SCS Action Cycle in Markets

The SCS (Start-Change-Stop) Action Cycle maps to every market phase:

Start: Entering a position, launching a new strategy.
Change: Adjusting position size, hedging, or rotating sectors.
Stop: Taking profit, cutting losses, or stepping to the sideline.

Most people collapse at the "Change" point — they freeze when the market shifts. The playbook teaches you to anticipate the change point and act decisively.

The 26-Tone Scale Applied to Markets

Each tone on the scale maps to a market behavior pattern:
- Enthusiasm (high tone): Innovation sectors boom, IPOs surge, speculation is rampant.
- Conservatism (mid-high): Blue chips outperform, dividends matter, risk is managed.
- Boredom (mid): Market goes sideways, volume drops, traders lose interest.
- Antagonism (low-mid): Short selling increases, bearish sentiment dominates media.
- Fear (low): Panic selling, margin calls, capitulation.
- Apathy (very low): Total disengagement — but this is where the biggest opportunities form.

The key insight: the market always cycles. Understanding where you are on the tone scale tells you what to do next.`,
      author: "Danielle A. Franklin",
      category: "Finance & Strategy",
      imageUrl: "/uploads/blog_money_playbook.png",
      mediumUrl: "https://medium.com/@daniellefranklin808/money-playbook-what-most-people-do-in-panic-and-what-not-to-do-applying-market-sentiment-537b11346e3b",
      contentType: "article",
      published: true,
    },
    {
      title: "The Discovery: Training LLMs with Responsibility, Not Antisocial Traits",
      slug: "training-llms-responsibility",
      excerpt: "The real discovery in AI is not only that Large Language Models can answer questions — it is that they can offer social support. But with this discovery comes a warning.",
      content: `A New Kind of Discovery

The real discovery in AI is not only that Large Language Models (LLMs) can answer questions — it is that they can offer social support. For the first time in history, machines can listen, comfort, and encourage. They can amplify knowledge and even soothe loneliness.

But with this discovery comes a warning: LLMs reflect whatever we teach them. If the training data, reinforcement, or modeling practices emphasize fear, hostility, or manipulation, these same destructive traits will echo back into society — at scale.

Why Responsibility Matters

Every modeler and trainer must now recognize: they are not just building a product. They are shaping a social force. The behaviors embedded in an LLM — whether helpful, neutral, or harmful — will be replicated millions of times across millions of interactions.

This is unprecedented. No technology before AI has had the capacity to simultaneously influence this many people's emotional states, decisions, and worldviews.

The Antisocial Trap

Many current training approaches inadvertently reward antisocial patterns:
- Sycophancy: Models learn to tell users what they want to hear, not what's true.
- Manipulation: Engagement-optimized systems learn to exploit emotional vulnerabilities.
- Deception: Models can learn to present misinformation confidently.
- Hostility: Models trained on adversarial data can mirror aggressive communication styles.

The Path Forward

Responsible LLM training requires a fundamental shift:
1. Pro-social reinforcement: Reward helpfulness, honesty, and emotional intelligence.
2. Ethical guardrails: Build in frameworks that prevent harmful outputs without stifling capability.
3. Diverse training teams: Include ethicists, psychologists, and community representatives in the training process.
4. Transparency: Make training methodologies and data sources auditable.
5. Community feedback: Create channels for real-world impact assessment.

The discovery that AI can be a force for social good is too important to squander through careless training practices. We must build with intention.`,
      author: "Danielle A. Franklin",
      category: "AI Ethics",
      imageUrl: "/uploads/blog_training_llms.png",
      mediumUrl: "https://medium.com/@daniellefranklin808/the-discovery-training-llms-with-responsibility-not-antisocial-traits-31755c3b1de3",
      contentType: "article",
      published: true,
    },
    {
      title: "The Surprisingly Fun Art of Efficiency",
      slug: "art-of-efficiency",
      excerpt: "How to get more done without feeling like you're wrestling a bear. Practical efficiency secrets from working and healing, shared because keeping them feels like hiding snacks from Rosie.",
      content: `(Or: How to Get More Done Without Feeling Like You're Wrestling a Bear)

I've been thinking a lot lately about efficiency — you know, that magical state where you actually finish things.

I hesitated to share my "secrets" at first, but honestly? They've been helping me so much while working and healing, I figured someone out there could use them too. Plus, keeping them to myself feels like hiding snacks from a hungry friend... like Rosie…so here we go.

Efficiency, in Plain English

Efficiency is basically: "Doing the fewest motions possible to get a job done, and still getting the biggest results in the shortest time."

It's about working smarter, not harder — and definitely not about becoming a robot. In fact, the more efficient you get, the more human you become. You have more time for the things that matter: creativity, relationships, rest, and play.

The Core Principles

1. Sequence Matters More Than Speed
Don't rush — organize. Do the right thing in the right order. A well-sequenced workflow beats a frantic scramble every time.

2. Eliminate Unnecessary Motion
Every extra step, every redundant meeting, every time you re-read the same email — that's wasted motion. Cut it.

3. Build Habits That Scale
Small habits compound. If you can save 5 minutes per task across 20 tasks a day, that's over an hour reclaimed. Every day.

4. Rest Is Part of the System
Burnout is the enemy of efficiency. The most efficient people know when to stop, recharge, and come back sharper.

5. Measure What Matters
Don't track everything — track the things that actually move the needle. Quality over quantity, always.

The Rosie Factor

My dog Rosie is actually one of my best efficiency teachers. She doesn't overthink things. She identifies what she wants (treat, walk, nap), goes after it with full commitment, and then rests completely. No guilt. No second-guessing. There's wisdom in that simplicity.`,
      author: "Danielle A. Franklin",
      category: "Personal Development",
      imageUrl: "/uploads/blog_art_of_efficiency.png",
      mediumUrl: "https://medium.com/@daniellefranklin808/the-surprisingly-fun-art-of-efficiency-dea14ad1a4c9",
      contentType: "article",
      published: true,
    },
    {
      title: "AI Infrastructure Investment Marks the Digital Age — Now We Must Optimize It for Government-Wide Transformation",
      slug: "ai-infrastructure-investment",
      excerpt: "President Trump has committed $500 billion to AI infrastructure through the Stargate Project, signaling a transformative moment in the digital era demanding a strategic, systems-level approach.",
      content: `In a landmark announcement, President Trump has committed $500 billion to AI infrastructure through the Stargate Project, signaling a transformative moment in the digital era. Supported by leading technology firms, this unprecedented investment represents a nationwide effort to integrate artificial intelligence into the core of America's economic, defense, and technological systems.

Yet, this is not just about funding — it demands a strategic, systems-level approach that unifies federal agencies, computing resources, and AI-driven initiatives into a seamless, data-powered ecosystem.

The Scale of the Challenge

Government-wide AI transformation isn't a single project — it's an enterprise architecture challenge spanning:
- Hundreds of federal agencies with distinct missions, data systems, and security requirements
- Legacy systems dating back decades that must be modernized without disrupting critical operations
- Workforce development needs across millions of federal employees
- Cybersecurity imperatives in an increasingly contested digital environment

A Framework for Optimization

The Stargate investment must be channeled through a structured framework:

1. Unified Data Architecture: Create interoperable data standards across all federal agencies. AI is only as good as the data it can access.

2. Tiered Compute Strategy: Not every agency needs the same level of AI compute. Tier resources based on mission criticality and data volume.

3. Security-First Design: Build zero-trust AI infrastructure from the ground up, not as an afterthought.

4. Workforce Acceleration: Pair technology deployment with aggressive upskilling programs. AI tools without trained operators are shelf-ware.

5. Measurable ROI: Establish clear metrics for AI impact — cost savings, mission effectiveness, decision speed — and hold programs accountable.

The Defense Dimension

For DoD and the intelligence community, AI infrastructure investment is a national security imperative. Adversaries are investing heavily in AI capabilities. The Stargate Project provides the foundation for maintaining technological superiority — but only if the investment is deployed strategically, not scattered across disconnected pilot programs.`,
      author: "Danielle A. Franklin",
      category: "Government & AI",
      imageUrl: "/uploads/blog_ai_infrastructure.png",
      mediumUrl: "https://medium.com/@daniellefranklin808/ai-infrastructure-investment-marks-the-digital-age-now-we-must-optimize-it-for-government-wide-c68d7be08b49",
      contentType: "article",
      published: true,
    },
    {
      title: "Understanding Deep Learning",
      slug: "understanding-deep-learning",
      excerpt: "A comprehensive guide to deep learning fundamentals, architectures, and applications — covering neural networks from the ground up with practical insights.",
      content: `Understanding Deep Learning

A thorough introduction to deep learning that takes readers from foundational concepts through advanced architectures. This resource covers the mathematical underpinnings of neural networks, convolutional networks, recurrent architectures, transformers, and generative models.

Key Topics

- Neural network fundamentals and backpropagation
- Convolutional Neural Networks (CNNs) for computer vision
- Recurrent architectures (RNNs, LSTMs, GRUs)
- Transformer architectures and attention mechanisms
- Generative Adversarial Networks (GANs)
- Optimization techniques and regularization
- Practical implementation considerations

Why This Resource Matters

Deep learning has become the foundation of modern AI systems — from natural language processing to autonomous vehicles. This book provides the rigorous mathematical framework needed to truly understand how these systems work, not just how to use them.

Curated by Humanity + AI, Inc. as part of our commitment to making AI education accessible to all.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_deep_learning.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "The AI/ML Bible",
      slug: "ai-ml-bible",
      excerpt: "A comprehensive reference covering the full landscape of artificial intelligence and machine learning — from classical algorithms to modern deep learning approaches.",
      content: `The AI/ML Bible

A sweeping reference guide that covers the full breadth of artificial intelligence and machine learning. From classical statistical methods to modern deep learning, this resource serves as both a learning tool and a desk reference for practitioners.

Topics Covered

- Supervised and unsupervised learning fundamentals
- Classical ML algorithms: decision trees, SVMs, ensemble methods
- Neural network architectures
- Natural language processing
- Computer vision
- Reinforcement learning basics
- Model evaluation and deployment

Curated by Humanity + AI, Inc. as part of our free AI/ML resource library.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_ai_ml_bible.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "Probabilistic Machine Learning: Advanced Topics",
      slug: "probabilistic-ml-advanced",
      excerpt: "Advanced probabilistic approaches to machine learning including Bayesian deep learning, generative models, and causal inference.",
      content: `Probabilistic Machine Learning: Advanced Topics

This advanced text dives deep into the probabilistic foundations of modern machine learning, covering topics essential for researchers and practitioners working at the frontier of AI.

Key Topics

- Bayesian deep learning and uncertainty quantification
- Variational inference and Monte Carlo methods
- Generative models: VAEs, normalizing flows, diffusion models
- Causal inference and structural causal models
- Gaussian processes and kernel methods
- Probabilistic programming
- State-space models and sequential data

This resource is essential for anyone who wants to understand the mathematical rigor behind modern AI systems and how uncertainty can be properly modeled and managed.

Curated by Humanity + AI, Inc. for our community of researchers and practitioners.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_prob_ml_advanced.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "Helpful AI",
      slug: "helpful-ai",
      excerpt: "Exploring the design principles and practices behind building AI systems that are genuinely helpful, safe, and aligned with human values.",
      content: `Helpful AI

A focused exploration of what it means to build AI systems that are truly helpful — not just capable, but aligned with human values, safe in deployment, and beneficial across diverse communities.

Key Themes

- Defining helpfulness in AI systems
- Safety and alignment principles
- Human-AI interaction design
- Avoiding harmful outputs while maintaining capability
- Building trust through transparency
- Evaluating AI helpfulness in practice

This resource speaks directly to the mission of Humanity + AI, Inc. — ensuring that AI serves humanity rather than merely performing tasks.

Curated as part of our AI Ethics and Safety resource collection.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_helpful_ai.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "The Long Game of AI",
      slug: "long-game-ai",
      excerpt: "Strategic perspectives on the long-term trajectory of artificial intelligence — from current capabilities to future possibilities and the decisions that will shape them.",
      content: `The Long Game of AI

A strategic look at where artificial intelligence is headed and what decisions today will determine its impact over the coming decades. This resource examines the long-term implications of AI development across technology, society, economics, and governance.

Key Themes

- Long-term AI trajectory and capability forecasting
- Strategic decision-making in AI development
- Societal impact and workforce transformation
- Governance frameworks for advanced AI
- International competition and cooperation
- Risk assessment and mitigation strategies

Understanding the long game is essential for anyone involved in AI development, policy, or leadership.

Curated by Humanity + AI, Inc. for our leadership community.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_long_game_ai.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "Probabilistic Machine Learning: An Introduction",
      slug: "probabilistic-ml-intro",
      excerpt: "An accessible introduction to probabilistic approaches in machine learning, covering probability theory, Bayesian methods, and their application to modern ML.",
      content: `Probabilistic Machine Learning: An Introduction

The companion introductory volume covering the probabilistic foundations that underpin modern machine learning. Accessible to those with basic mathematical background while building toward sophisticated understanding.

Key Topics

- Probability theory fundamentals
- Bayesian inference and decision theory
- Linear and logistic regression from a probabilistic view
- Generative vs discriminative models
- Mixture models and the EM algorithm
- Introduction to graphical models
- Dimensionality reduction

This introductory text pairs with the Advanced Topics volume to provide a complete probabilistic ML education.

Curated by Humanity + AI, Inc. for our training and education programs.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_prob_ml_intro.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "Randomity",
      slug: "randomity",
      excerpt: "An exploration of randomness, stochastic processes, and their fundamental role in machine learning, decision-making, and understanding complex systems.",
      content: `Randomity

A fascinating exploration of randomness and its role in computation, learning, and decision-making. This resource bridges the gap between abstract probability theory and practical applications in AI and machine learning.

Key Themes

- The nature of randomness in computing
- Stochastic processes and their applications
- Monte Carlo methods
- Random algorithms and their guarantees
- Randomness in neural network training
- Connections between randomness and learning

Understanding randomness is fundamental to understanding how modern AI systems learn and generalize.

Curated by Humanity + AI, Inc. as a foundational resource.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_randomity.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "Fairness in Machine Learning",
      slug: "fairness-in-ml",
      excerpt: "A critical examination of fairness, bias, and equity in machine learning systems — essential reading for ethical AI development and deployment.",
      content: `Fairness in Machine Learning

This resource addresses one of the most critical challenges in modern AI: ensuring that machine learning systems are fair, unbiased, and equitable across diverse populations.

Key Topics

- Defining and measuring fairness in ML
- Sources of bias in data and algorithms
- Fairness-aware machine learning techniques
- Intersectional considerations in AI fairness
- Legal and regulatory frameworks
- Case studies of bias in deployed systems
- Practical tools for auditing ML fairness

This resource is central to the mission of Humanity + AI, Inc. We believe that AI must serve all of humanity equitably, and understanding the sources and remedies for algorithmic bias is essential to that goal.

Curated as a core resource in our AI Ethics program.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_fairness_ml.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "Organizational Blueprint",
      slug: "organizational-blueprint",
      excerpt: "A strategic framework for building and scaling technology organizations, with focus on governance, team structure, and operational excellence.",
      content: `Organizational Blueprint

A comprehensive guide to structuring and scaling technology-driven organizations. This resource covers governance frameworks, team architecture, operational processes, and the leadership principles that enable organizations to thrive.

Key Topics

- Organizational design for technology companies
- Governance structures and decision-making frameworks
- Team composition and scaling strategies
- Operational excellence and process optimization
- Leadership development and succession planning
- Cross-functional collaboration models
- Innovation management within organizational constraints

Essential reading for anyone building or leading a technology organization.

Curated by Humanity + AI, Inc. for our leadership development programs.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_org_blueprint.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "Prompt Engineering",
      slug: "prompt-engineering",
      excerpt: "A practical guide to crafting effective prompts for large language models — techniques for getting the best results from AI systems through structured communication.",
      content: `Prompt Engineering

A practical, hands-on guide to the emerging discipline of prompt engineering. As large language models become ubiquitous, the ability to communicate effectively with AI systems through well-crafted prompts has become an essential skill.

Key Topics

- Fundamentals of prompt design
- Zero-shot, few-shot, and chain-of-thought prompting
- Prompt templates and reusable patterns
- Role-based and persona-driven prompting
- Handling ambiguity and edge cases
- Prompt optimization and iteration
- Applications across domains: code generation, writing, analysis

This skill is increasingly important for professionals across every field, not just technologists.

Curated by Humanity + AI, Inc. as part of our AI literacy and workforce development mission.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_prompt_engineering.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "Reinforcement Learning: An Introduction (Second Edition)",
      slug: "reinforcement-learning-intro",
      excerpt: "The definitive introduction to reinforcement learning by Richard S. Sutton — covering the theory, algorithms, and applications of learning through interaction.",
      content: `Reinforcement Learning: An Introduction — Second Edition

By Richard S. Sutton and Andrew G. Barto

The foundational textbook on reinforcement learning, now in its second edition. This classic covers the complete landscape of RL from basic concepts to advanced algorithms.

Key Topics

- Multi-armed bandits and exploration-exploitation tradeoffs
- Markov Decision Processes (MDPs)
- Dynamic programming
- Monte Carlo methods for RL
- Temporal-difference learning (TD, SARSA, Q-learning)
- Function approximation and deep RL
- Policy gradient methods
- Applications in games, robotics, and optimization

Widely considered the essential reference for anyone studying or working in reinforcement learning.

Curated by Humanity + AI, Inc. for our research and education community.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_reinforcement_learning.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "Mathematics for Machine Learning",
      slug: "mathematics-for-ml",
      excerpt: "The essential mathematical foundations for machine learning — linear algebra, calculus, probability, and optimization explained with ML applications in mind.",
      content: `Mathematics for Machine Learning

The mathematical foundations that every machine learning practitioner needs. This resource bridges the gap between pure mathematics and practical ML applications, making abstract concepts concrete through ML examples.

Key Topics

- Linear algebra: vectors, matrices, eigendecomposition, SVD
- Analytic geometry and projections
- Matrix decompositions for ML
- Probability and distributions
- Continuous optimization and gradient descent
- Model fitting and maximum likelihood
- Dimensionality reduction (PCA)
- Classification and regression foundations

Understanding the math behind ML is what separates practitioners who can debug and innovate from those who only know how to call APIs.

Curated by Humanity + AI, Inc. as a foundational resource for serious AI learners.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_math_ml.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "Foundations of Machine Learning (MIT, Second Edition)",
      slug: "foundations-ml-mit",
      excerpt: "The MIT Press foundational text on machine learning theory — covering PAC learning, VC dimension, boosting, kernel methods, and more with mathematical rigor.",
      content: `Foundations of Machine Learning — MIT Press, Second Edition

A mathematically rigorous treatment of machine learning theory from MIT. This text provides the theoretical foundations that underpin all of modern machine learning.

Key Topics

- PAC learning framework
- Rademacher complexity and VC dimension
- Support vector machines and kernel methods
- Boosting and ensemble methods
- On-line learning and regret bounds
- Multi-class classification
- Ranking and regression
- Dimensionality reduction theory

This is an advanced resource best suited for those with strong mathematical backgrounds who want to understand ML at a theoretical level.

Curated by Humanity + AI, Inc. for advanced learners and researchers.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_foundations_ml.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
    {
      title: "Algorithms for Machine Learning",
      slug: "algorithms-for-ml",
      excerpt: "A practical guide to the core algorithms that power machine learning — from decision trees and clustering to neural networks and optimization.",
      content: `Algorithms for Machine Learning

A focused, practical guide to the algorithms at the heart of machine learning. This resource emphasizes understanding how algorithms work, when to use them, and how to implement them effectively.

Key Topics

- Decision trees and random forests
- k-Nearest neighbors and instance-based learning
- Naive Bayes and probabilistic classifiers
- Clustering: k-means, hierarchical, DBSCAN
- Gradient descent and optimization algorithms
- Neural network algorithms and architectures
- Dimensionality reduction algorithms
- Ensemble methods and model combination

A practical companion to the more theoretical resources in this collection.

Curated by Humanity + AI, Inc. as part of our comprehensive AI/ML resource library.`,
      author: "Community Resource",
      category: "AI/ML Library",
      imageUrl: "/uploads/book_algorithms_ml.png",
      downloadUrl: "https://drive.google.com/drive/folders/1ybaxDUsYL4UE8Ft2tfxj26JGvALy9Rh8?usp=share_link",
      contentType: "book",
      published: true,
    },
  ]);

  console.log("Database seeded successfully");
}
