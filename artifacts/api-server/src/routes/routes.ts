import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../auth";
import { avatarUpload, postImageUpload, publicUrlForUpload, processAndSaveImage } from "../upload";
import {
  insertContactSchema,
  insertNewsletterSchema,
  insertEventSignupSchema,
  createPostSchema,
  updateProfileSchema,
  type PublicUser,
} from "@workspace/db";
import { sendEventSignupEmails, sendNewsletterNotification, sendDonationNotification } from "../email";
import { getUncachableStripeClient } from "../stripeClient";
import { recordDonation } from "../donationFulfillment";
import { getCommunityFeed } from "../slack";
import { getAggregatedNews } from "../news";
import {
  buildIssue,
  sendIssue,
  runMonthlyCycle,
  getRecipients,
  listIssues,
  findIssueByToken,
  addOptOut,
  unsubscribeToken,
  previousPeriod,
  currentPeriod,
  newsletterConfig,
} from "../newsletter";
import OpenAI from "openai";

function getOpenAIClient() {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  if (!apiKey || !baseURL) {
    return null;
  }
  return new OpenAI({ apiKey, baseURL });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

async function generateUniqueSlug(base: string, excludeId?: number): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let n = 2;
  while (await storage.isSlugTaken(candidate, excludeId)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}

function publicProfile(user: { id: string; username: string; displayName?: string | null; fullName?: string | null; bio?: string | null; title?: string | null; organization?: string | null; avatarUrl?: string | null; role: string; createdAt: Date | string }) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    fullName: user.fullName ?? null,
    bio: user.bio ?? null,
    title: user.title ?? null,
    organization: user.organization ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    createdAt: user.createdAt,
  };
}

const SYSTEM_PROMPT = `You are the AI assistant for Humanity + AI, Inc., a nonprofit organization founded in August 2024 by Danielle A. Franklin. Your role is to help visitors learn about the organization, its mission, programs, and how they can get involved.

Key information about Humanity + AI, Inc.:
- Mission: Bridging the gap between humanity and artificial intelligence through ethical AI development, education, and community building
- Founded: August 2024 by Danielle A. Franklin
- Danielle is a distinguished engineer and technologist with a celebrated career in U.S. defense and aerospace sectors
- She was recognized by Marquis Who's Who in November 2025 for excellence in technology, defense, and nonprofit services
- Website: techleadershipcommunity.com
- Contact: danielle@humanityplusai.org, Phone: 808-652-2090

Programs and Initiatives:
1. Tech Leadership Community - Mentoring emerging leaders in technology
2. Project ROSIE - Integrating AI, frequency analysis, and behavioral science for interspecies communication
3. AI Ethics & Governance - Advocating for responsible AI development
4. "A Science of the Canine Mind" book series - Two volumes on canine communication
5. Community workshops and events on AI literacy

Focus Areas:
- AI Ethics and responsible technology
- Digital transformation and leadership
- Interspecies communication research
- Defense and aerospace technology
- Community education and mentorship

You should be helpful, knowledgeable, and encourage visitors to get involved through donations, volunteering, or attending events. Always be warm, professional, and passionate about the intersection of humanity and AI.`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const ALLOWED_SERVE_EXT = /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i;

  app.use("/uploads/avatars", (req, res, next) => {
    if (!ALLOWED_SERVE_EXT.test(req.path)) return res.status(404).send("Not found");
    if (/\.svg$/i.test(req.path)) {
      res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    }
    next();
  }, express.static(path.resolve(process.cwd(), "uploads", "avatars")));

  app.use("/uploads/posts", (req, res, next) => {
    if (!ALLOWED_SERVE_EXT.test(req.path)) return res.status(404).send("Not found");
    if (/\.svg$/i.test(req.path)) {
      res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    }
    next();
  }, express.static(path.resolve(process.cwd(), "uploads", "posts")));

  app.use("/uploads", (req, res, next) => {
    if (!/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(req.path)) {
      return res.status(404).send("Not found");
    }
    next();
  }, express.static(path.resolve(process.cwd(), "attached_assets")));

  const CANONICAL_DOMAIN = "https://humanityplusai.org";

  const BOARD_MEMBER_SLUGS = [
    "danielle-franklin",
    "jofia-jose-prakash",
    "william-kreitzer",
    "nirmal-jingar",
    "mike-klyce",
    "david-wood",
    "vasu-raj-jain",
    "vina-torossian",
    "william-zhu",
  ];

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const [posts, publicAuthors] = await Promise.all([
        storage.getBlogPosts(),
        storage.getPublicAuthors(),
      ]);

      const staticRoutes = [
        { url: "/", priority: "1.0", changefreq: "weekly" },
        { url: "/about", priority: "0.9", changefreq: "monthly" },
        { url: "/programs", priority: "0.9", changefreq: "monthly" },
        { url: "/training", priority: "0.8", changefreq: "weekly" },
        { url: "/blog", priority: "0.9", changefreq: "daily" },
        { url: "/events", priority: "0.8", changefreq: "daily" },
        { url: "/ai-hub", priority: "0.7", changefreq: "monthly" },
        { url: "/contact", priority: "0.6", changefreq: "yearly" },
        { url: "/donate", priority: "0.7", changefreq: "monthly" },
      ];

      const boardUrls = BOARD_MEMBER_SLUGS.map(slug => ({
        url: `/about/board/${slug}`,
        priority: "0.7",
        changefreq: "monthly",
      }));

      const blogUrls = posts
        .filter(p => p.status === "published" || p.published)
        .map(p => ({
          url: `/blog/${p.slug}`,
          priority: "0.7",
          changefreq: "monthly",
          lastmod: p.publishedAt ? new Date(p.publishedAt).toISOString().split("T")[0] : undefined,
        }));

      const profileUrls = publicAuthors.map(u => ({
        url: `/profile/${u.username}`,
        priority: "0.6",
        changefreq: "monthly",
      }));

      const allUrls = [...staticRoutes, ...boardUrls, ...blogUrls, ...profileUrls];

      const urlEntries = allUrls.map(({ url, priority, changefreq, lastmod }: { url: string; priority: string; changefreq: string; lastmod?: string }) => {
        const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
        return `  <url>\n    <loc>${CANONICAL_DOMAIN}${url}</loc>${lastmodTag}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
      }).join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;

      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      res.status(500).send("Failed to generate sitemap");
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const parsed = insertContactSchema.parse(req.body);
      const submission = await storage.createContact(parsed);
      res.status(201).json(submission);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid submission" });
    }
  });

  // NOTE: Donations are only recorded through the Stripe-verified flow below
  // (POST /api/donations/checkout -> Stripe Checkout -> webhook/verify). There is
  // intentionally no public endpoint to insert a donation directly, so records
  // always correspond to a real, paid Stripe transaction.

  app.get("/api/donations/stats", async (_req, res) => {
    try {
      const allDonations = await storage.getDonations();
      const total = allDonations.reduce((sum, d) => sum + d.amount, 0);
      res.json({ total, count: allDonations.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to get donation stats" });
    }
  });

  // Fundraising campaigns with live progress (raised computed from attributed donations).
  app.get("/api/campaigns", async (_req, res) => {
    try {
      const [list, totals] = await Promise.all([
        storage.getCampaigns(),
        storage.getRaisedByCampaign(),
      ]);
      const result = list.map((c) => ({
        ...c,
        raisedCents: totals[c.slug]?.raisedCents ?? 0,
        donorCount: totals[c.slug]?.donorCount ?? 0,
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaigns" });
    }
  });

  // Create a Stripe Checkout session for a donation (one-time or monthly recurring)
  app.post("/api/donations/checkout", async (req, res) => {
    try {
      const { donorName, donorEmail, amount, message, isRecurring, membership, membershipTier, campaignSlug } = req.body ?? {};

      const isMembership = membership === true || membership === "true";

      // Membership support tiers — fixed monthly prices; never trust a client amount.
      const MEMBERSHIP_TIERS: Record<string, { name: string; price: number; blurb: string }> = {
        supporter: { name: "Supporter", price: 10, blurb: "Exclusive webinars, podcast recordings, and AI resources." },
        professional: { name: "Professional", price: 25, blurb: "Networking events, AI toolkits, and certification discounts." },
        executive: { name: "Executive", price: 99, blurb: "Leadership roundtables, private discussions, and speaker access." },
      };
      const tierKey = typeof membershipTier === "string" ? membershipTier : "";
      const tier = isMembership ? MEMBERSHIP_TIERS[tierKey] : undefined;
      if (isMembership && !tier) {
        return res.status(400).json({ error: "Please choose a valid membership tier." });
      }

      // Attribute the gift to a fundraising campaign when a valid slug is provided.
      let validCampaignSlug = "";
      if (!isMembership && typeof campaignSlug === "string" && campaignSlug) {
        const campaign = await storage.getCampaignBySlug(campaignSlug);
        if (campaign && campaign.active) validCampaignSlug = campaign.slug;
      }

      const dollars = isMembership ? tier!.price : Number(amount);
      if (!isMembership && (!Number.isFinite(dollars) || dollars < 1)) {
        return res.status(400).json({ error: "Amount must be at least $1" });
      }
      if (!donorName || typeof donorName !== "string") {
        return res.status(400).json({ error: "Name is required" });
      }
      if (!donorEmail || typeof donorEmail !== "string" || !donorEmail.includes("@")) {
        return res.status(400).json({ error: "A valid email is required" });
      }

      const recurring = isMembership ? true : Boolean(isRecurring);
      const unitAmount = Math.round(dollars * 100);
      const noteMessage = isMembership
        ? `${tier!.name} Membership ($${tier!.price}/month)`
        : (message || "").slice(0, 500);
      const productName = isMembership
        ? `${tier!.name} Membership — Humanity + AI, Inc.`
        : recurring
          ? "Monthly Donation — Humanity + AI, Inc."
          : "Donation — Humanity + AI, Inc.";
      const productDescription = isMembership
        ? `${tier!.name} membership billed $${tier!.price} monthly. ${tier!.blurb} Cancel anytime.`
        : "Supporting AI ethics research, education, and community programs.";

      const origin =
        req.headers.origin ||
        process.env.APP_URL ||
        `${req.protocol}://${req.get("host")}`;

      const stripe = await getUncachableStripeClient();

      const session = await stripe.checkout.sessions.create({
        mode: recurring ? "subscription" : "payment",
        customer_email: donorEmail,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: unitAmount,
              product_data: {
                name: productName,
                description: productDescription,
              },
              ...(recurring ? { recurring: { interval: "month" as const } } : {}),
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: "donation",
          kind: isMembership ? "membership" : "donation",
          donorName,
          donorEmail,
          message: noteMessage,
          isRecurring: recurring ? "true" : "false",
          campaignSlug: validCampaignSlug,
          membershipTier: isMembership ? tierKey : "",
        },
        ...(recurring
          ? {
              subscription_data: {
                metadata: {
                  type: "donation",
                  kind: isMembership ? "membership" : "donation",
                  donorName,
                  donorEmail,
                  message: noteMessage,
                  campaignSlug: validCampaignSlug,
                  membershipTier: isMembership ? tierKey : "",
                },
              },
            }
          : {}),
        success_url: `${origin}/donate?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/donate?canceled=1`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ error: error.message || "Failed to start checkout" });
    }
  });

  // Verify a completed Checkout session and record the donation (idempotent)
  app.get("/api/donations/verify", async (req, res) => {
    try {
      const sessionId = String(req.query.session_id || "");
      if (!sessionId) {
        return res.status(400).json({ error: "Missing session_id" });
      }

      const existing = await storage.getDonationByStripeSessionId(sessionId);
      if (existing) {
        return res.json({ recorded: true, donation: existing });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Only accept genuine donation sessions created by this app.
      if (session.metadata?.type !== "donation") {
        return res.status(400).json({ error: "Not a donation session" });
      }

      // Recurring gifts are recorded by the invoice.paid webhook (covers renewals);
      // here we just confirm the subscription is active for instant UX.
      if (session.mode === "subscription") {
        return res.json({ recorded: true, recurring: true });
      }

      if (session.payment_status !== "paid") {
        return res.status(202).json({ recorded: false, status: session.payment_status });
      }

      const meta = session.metadata || {};
      const donation = await recordDonation({
        reference: session.id,
        amountCents: session.amount_total ?? 0,
        donorName: meta.donorName || session.customer_details?.name || "Anonymous",
        donorEmail: meta.donorEmail || session.customer_details?.email || "",
        message: meta.message || null,
        isRecurring: false,
        campaignSlug: meta.campaignSlug || null,
      });

      res.json({ recorded: Boolean(donation), donation });
    } catch (error: any) {
      console.error("Stripe verify error:", error);
      res.status(500).json({ error: error.message || "Failed to verify donation" });
    }
  });

  app.post("/api/newsletter", async (req, res) => {
    try {
      const parsed = insertNewsletterSchema.parse(req.body);
      const subscriber = await storage.createNewsletterSubscriber(parsed);
      const emailResult = await sendNewsletterNotification(parsed.email);
      res.status(201).json({ ...subscriber, emailSent: emailResult.sent });
    } catch (error: any) {
      if (error.message?.includes("unique")) {
        res.status(409).json({ error: "Email already subscribed" });
      } else {
        res.status(400).json({ error: error.message || "Invalid email" });
      }
    }
  });

  // ---------------------------------------------------------------- newsletter
  // The monthly issue builds itself on a schedule; these endpoints let an admin
  // preview it, release it, and let any recipient opt out.

  const periodParam = (req: any): string => {
    const p = String(req.query.period || "");
    return /^\d{4}-\d{2}$/.test(p) ? p : previousPeriod();
  };

  const notice = (title: string, body: string) => `<!doctype html><html><head><meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head>
    <body style="margin:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:520px;margin:60px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center;">
      <h1 style="font-size:22px;color:#1e3a8a;margin:0 0 12px 0;">${title}</h1>
      <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 22px 0;">${body}</p>
      <a href="/" style="background:#3b82f6;color:#fff;padding:11px 22px;border-radius:7px;text-decoration:none;font-weight:600;">Back to humanityplusai.org</a>
    </div></body></html>`;

  // Admin: render the issue exactly as subscribers would see it.
  app.get("/api/newsletter/preview", requireAdmin, async (req, res) => {
    try {
      const issue = await buildIssue(periodParam(req));
      res.set("Content-Type", "text/html; charset=utf-8");
      res.send(issue.html.split("{{UNSUBSCRIBE_URL}}").join("#"));
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to build newsletter" });
    }
  });

  // Admin: schedule config, list size, and the history of issues.
  app.get("/api/newsletter/status", requireAdmin, async (_req, res) => {
    try {
      const [recipients, issues] = await Promise.all([getRecipients(), listIssues()]);
      res.json({
        config: newsletterConfig,
        mode: newsletterConfig.AUTO_SEND ? "auto-send" : "admin-approval",
        recipientCount: recipients.length,
        nextPeriod: previousPeriod(),
        thisMonth: currentPeriod(),
        issues,
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to load newsletter status" });
    }
  });

  // Admin: build the issue now (sends or routes to approval per config).
  app.post("/api/newsletter/run", requireAdmin, async (req, res) => {
    try {
      const period = /^\d{4}-\d{2}$/.test(String(req.body?.period || ""))
        ? String(req.body.period)
        : previousPeriod();
      const result = await runMonthlyCycle(period, { force: Boolean(req.body?.force) });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to run newsletter cycle" });
    }
  });

  // Admin: send immediately to the whole list, skipping the approval step.
  app.post("/api/newsletter/send", requireAdmin, async (req, res) => {
    try {
      const period = /^\d{4}-\d{2}$/.test(String(req.body?.period || ""))
        ? String(req.body.period)
        : previousPeriod();
      const issue = await buildIssue(period);
      const result = await sendIssue(issue);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to send newsletter" });
    }
  });

  // One-click release from the admin preview email.
  app.get("/api/newsletter/approve/:token", async (req, res) => {
    try {
      const record = await findIssueByToken(String(req.params.token || ""));
      if (!record) {
        return res.status(404).send(notice("Link not recognized", "This approval link is no longer valid."));
      }
      if (record.sent_at) {
        return res.send(
          notice(
            "Already sent",
            `The ${record.period} issue went out to ${record.recipient_count} recipients.`,
          ),
        );
      }
      const issue = await buildIssue(String(record.period));
      const result = await sendIssue(issue);
      res.send(
        notice(
          "Newsletter sent",
          `${issue.subject} went out to ${result.sent} of ${result.recipients} recipients${result.failed ? ` (${result.failed} failed)` : ""}.`,
        ),
      );
    } catch (error: any) {
      res.status(500).send(notice("Something went wrong", error?.message || "The newsletter could not be sent."));
    }
  });

  app.get("/api/newsletter/unsubscribe", async (req, res) => {
    try {
      const email = String(req.query.email || "").trim().toLowerCase();
      const token = String(req.query.t || "");
      if (!email || token !== unsubscribeToken(email)) {
        return res.status(400).send(notice("Link not recognized", "This unsubscribe link is not valid."));
      }
      await addOptOut(email);
      res.send(notice("You're unsubscribed", `${email} will no longer receive the Humanity + AI newsletter.`));
    } catch (error: any) {
      res.status(500).send(notice("Something went wrong", "We couldn't update your preferences. Please email us."));
    }
  });

  app.get("/api/blog", async (_req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  // Aggregated AI news + arXiv research for the homepage "AI News" ticker and the
  // "Latest AI Research & Models" feed. Cached server-side; free sources only.
  app.get("/api/news", async (_req, res) => {
    try {
      const data = await getAggregatedNews();
      res.set("Cache-Control", "public, max-age=300");
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news", ticker: [], arxiv: [] });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) return res.status(404).json({ error: "Post not found" });
      const isPublished = post.status === "published" || post.published === true;
      if (!isPublished) {
        const viewer = req.user as PublicUser | undefined;
        const isOwner = !!viewer && post.authorId === viewer.id;
        const isAdmin = !!viewer && viewer.role === "admin";
        if (!isOwner && !isAdmin) {
          return res.status(404).json({ error: "Post not found" });
        }
      }
      let author = null;
      if (post.authorId) {
        const u = await storage.getUser(post.authorId);
        if (u) author = publicProfile(u);
      }
      res.json({ ...post, authorProfile: author });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // ---------- Profile / Author APIs ----------

  app.get("/api/profile/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) return res.status(404).json({ error: "Profile not found" });
      const posts = await storage.getPostsByAuthor(user.id);
      res.json({ profile: publicProfile(user), posts });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const parsed = updateProfileSchema.parse(req.body);
      const user = req.user as PublicUser;
      const updated = await storage.updateUserProfile(user.id, parsed);
      if (!updated) return res.status(404).json({ error: "User not found" });
      const { password: _pw, ...rest } = updated;
      res.json(rest);
    } catch (err: any) {
      if (err?.errors) return res.status(400).json({ error: err.errors[0]?.message || "Invalid input" });
      res.status(400).json({ error: err.message || "Failed to update profile" });
    }
  });

  app.post("/api/profile/avatar", requireAuth, (req, res) => {
    avatarUpload.single("avatar")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message || "Upload failed" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      try {
        const user = req.user as PublicUser;
        const url = await processAndSaveImage(req.file, "avatars");
        if (user.avatarUrl && user.avatarUrl.startsWith("/uploads/avatars/")) {
          const old = path.resolve(process.cwd(), user.avatarUrl.replace(/^\//, ""));
          fs.promises.unlink(old).catch(() => {});
        }
        const updated = await storage.updateUserProfile(user.id, { avatarUrl: url });
        if (!updated) return res.status(404).json({ error: "User not found" });
        const { password: _pw, ...rest } = updated;
        res.json(rest);
      } catch (e: any) {
        res.status(500).json({ error: e.message || "Failed to set avatar" });
      }
    });
  });

  // ---------- Author Posts API ----------

  app.get("/api/me/posts", requireAuth, async (req, res) => {
    try {
      const user = req.user as PublicUser;
      const posts = await storage.getPostsByAuthor(user.id, { includeDrafts: true });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/me/posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
      const post = await storage.getBlogPostById(id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      const user = req.user as PublicUser;
      if (post.authorId !== user.id && user.role !== "admin") {
        return res.status(403).json({ error: "You don't have permission to edit this post" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  app.post("/api/me/posts", requireAuth, async (req, res) => {
    try {
      const parsed = createPostSchema.parse(req.body);
      const user = req.user as PublicUser;
      const slug = await generateUniqueSlug(parsed.slug || parsed.title);
      const isPublished = parsed.status === "published";
      const post = await storage.createBlogPost({
        title: parsed.title,
        subtitle: parsed.subtitle ?? null,
        slug,
        excerpt: parsed.excerpt,
        content: parsed.content,
        author: user.displayName || user.fullName || user.username,
        authorId: user.id,
        category: parsed.category,
        tags: parsed.tags ?? [],
        featuredImageUrl: parsed.featuredImageUrl ?? null,
        imageUrl: parsed.featuredImageUrl ?? null,
        noImage: parsed.noImage ?? false,
        contentType: "article",
        status: parsed.status,
        published: isPublished,
        seoTitle: parsed.seoTitle ?? null,
        seoDescription: parsed.seoDescription ?? null,
        publishedAt: isPublished ? new Date() : null,
      });
      res.status(201).json(post);
    } catch (err: any) {
      if (err?.errors) return res.status(400).json({ error: err.errors[0]?.message || "Invalid input" });
      res.status(400).json({ error: err.message || "Failed to create post" });
    }
  });

  app.patch("/api/me/posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
      const existing = await storage.getBlogPostById(id);
      if (!existing) return res.status(404).json({ error: "Post not found" });
      const user = req.user as PublicUser;
      if (existing.authorId !== user.id && user.role !== "admin") {
        return res.status(403).json({ error: "You don't have permission to edit this post" });
      }
      const parsed = createPostSchema.partial().parse(req.body);
      const updates: Record<string, unknown> = {};
      if (parsed.title !== undefined) updates.title = parsed.title;
      if (parsed.subtitle !== undefined) updates.subtitle = parsed.subtitle;
      if (parsed.excerpt !== undefined) updates.excerpt = parsed.excerpt;
      if (parsed.content !== undefined) updates.content = parsed.content;
      if (parsed.category !== undefined) updates.category = parsed.category;
      if (parsed.tags !== undefined) updates.tags = parsed.tags;
      if (parsed.featuredImageUrl !== undefined) {
        updates.featuredImageUrl = parsed.featuredImageUrl;
        updates.imageUrl = parsed.featuredImageUrl;
      }
      if (parsed.noImage !== undefined) updates.noImage = parsed.noImage;
      if (parsed.seoTitle !== undefined) updates.seoTitle = parsed.seoTitle;
      if (parsed.seoDescription !== undefined) updates.seoDescription = parsed.seoDescription;
      if (parsed.slug !== undefined && parsed.slug !== existing.slug) {
        updates.slug = await generateUniqueSlug(parsed.slug, id);
      }
      if (parsed.status !== undefined) {
        updates.status = parsed.status;
        updates.published = parsed.status === "published";
        if (parsed.status === "published" && !existing.publishedAt) {
          updates.publishedAt = new Date();
        }
        if (parsed.status === "draft") {
          updates.publishedAt = null;
        }
      }
      const updated = await storage.updateBlogPost(id, updates as any);
      res.json(updated);
    } catch (err: any) {
      if (err?.errors) return res.status(400).json({ error: err.errors[0]?.message || "Invalid input" });
      res.status(400).json({ error: err.message || "Failed to update post" });
    }
  });

  app.delete("/api/me/posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
      const existing = await storage.getBlogPostById(id);
      if (!existing) return res.status(404).json({ error: "Post not found" });
      const user = req.user as PublicUser;
      if (existing.authorId !== user.id && user.role !== "admin") {
        return res.status(403).json({ error: "You don't have permission to delete this post" });
      }
      await storage.deleteBlogPost(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.post("/api/me/posts/upload-image", requireAuth, (req, res) => {
    postImageUpload.single("image")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message || "Upload failed" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      try {
        const url = await processAndSaveImage(req.file, "posts");
        res.json({ url });
      } catch (e: any) {
        res.status(500).json({ error: e.message || "Failed to process image" });
      }
    });
  });

  const aiImageRateLimit = new Map<string, number[]>();
  app.post("/api/me/posts/generate-image", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as PublicUser).id;
      const now = Date.now();
      const userCalls = (aiImageRateLimit.get(userId) || []).filter(t => now - t < 60_000);
      if (userCalls.length >= 5) {
        return res.status(429).json({ error: "Too many image generation requests. Please wait a minute before trying again." });
      }
      userCalls.push(now);
      aiImageRateLimit.set(userId, userCalls);

      const { title, excerpt, category } = req.body;
      if (!title) return res.status(400).json({ error: "Title is required" });

      const client = getOpenAIClient();
      if (!client) return res.status(500).json({ error: "AI image generation is not configured" });

      const imagePrompt = `Create a professional, abstract, symbolic illustration for a nonprofit blog article. The article is titled "${title}" in the category "${category || 'Technology'}". Summary: ${excerpt || title}. The image should be purely visual with NO text, NO words, NO letters, NO logos, NO captions. Use abstract concepts related to: AI, technology, humanity, ethics, education, community, nature, or futuristic imagery. Style: modern, clean, professional, high quality, suitable for a nonprofit website. Color palette: blues, teals, warm neutrals, with subtle gradients.`;

      const response = await client.images.generate({
        model: process.env.AI_IMAGE_MODEL || "gemini-2.5-flash-image",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
      });

      const base64 = response.data[0]?.b64_json;
      if (!base64) return res.status(500).json({ error: "No image was generated" });

      const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      const uploadDir = path.join(process.cwd(), "uploads", "posts");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, Buffer.from(base64, "base64"));

      const url = publicUrlForUpload("posts", filename);
      res.json({ url });
    } catch (error: any) {
      console.error("AI image generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // ---------- Existing endpoints below ----------

  app.get("/api/community/slack", async (_req, res) => {
    try {
      const feed = await getCommunityFeed(12);
      res.json(feed);
    } catch (error) {
      res.status(200).json({ connected: false, channelName: null, messages: [] });
    }
  });

  app.get("/api/events", async (_req, res) => {
    try {
      const eventList = await storage.getEvents();
      res.json(eventList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/events/:id/signup", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEventById(eventId);
      if (!event) return res.status(404).json({ error: "Event not found" });

      const parsed = insertEventSignupSchema.parse({ ...req.body, eventId });
      const signup = await storage.createEventSignup(parsed);
      const emailResult = await sendEventSignupEmails(signup, event);

      res.status(201).json({
        signup,
        emailSent: emailResult.sent,
        message: emailResult.sent
          ? "You're signed up — check your email for confirmation."
          : "You're signed up. We'll be in touch with details shortly.",
      });
    } catch (error: any) {
      console.error("Event signup error:", error);
      res.status(400).json({ error: error.message || "Invalid signup" });
    }
  });

  app.get("/api/conversations", async (_req, res) => {
    try {
      const convs = await storage.getAllConversations();
      res.json(convs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const { title } = req.body;
      const conv = await storage.createConversation(title || "New Chat");
      res.status(201).json(conv);
    } catch (error) {
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      await storage.deleteConversation(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conv = await storage.getConversation(id);
      if (!conv) return res.status(404).json({ error: "Conversation not found" });
      const msgs = await storage.getMessagesByConversation(id);
      res.json({ ...conv, messages: msgs });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      await storage.createMessage(conversationId, "user", content);

      const existingMessages = await storage.getMessagesByConversation(conversationId);
      const chatMessages: any[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...existingMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const openai = getOpenAIClient();
      if (!openai) {
        const fallback = "I'm sorry, the AI service is currently unavailable. Please try again later or contact us directly at danielle@humanityplusai.org.";
        await storage.createMessage(conversationId, "assistant", fallback);
        res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      const stream = await openai.chat.completions.create({
        model: process.env.AI_CHAT_MODEL || "gemini-2.5-flash",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      await storage.createMessage(conversationId, "assistant", fullResponse);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Chat error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  app.post("/api/ai/summarize", async (req, res) => {
    try {
      const { text } = req.body;
      const openai = getOpenAIClient();
      if (!openai) {
        return res.status(503).json({ error: "AI service is currently unavailable" });
      }
      const response = await openai.chat.completions.create({
        model: process.env.AI_CHAT_MODEL || "gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful assistant that provides concise summaries." },
          { role: "user", content: `Please summarize: ${text}` },
        ],
        max_completion_tokens: 512,
      });
      res.json({ summary: response.choices[0]?.message?.content || "" });
    } catch (error) {
      res.status(500).json({ error: "Failed to summarize" });
    }
  });

  return httpServer;
}
