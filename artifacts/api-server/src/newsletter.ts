// Monthly newsletter — assembles an issue from the month's blog articles (with
// their images), the events that happened and are coming up, and community
// activity, then delivers it to every registered user and newsletter subscriber.
//
// Safety model: the scheduler always *builds* the issue automatically. Whether
// it sends on its own is controlled by NEWSLETTER_AUTO_SEND:
//   unset / "false" → the admin gets a preview email with a one-click send link
//   "true"          → the issue mails itself to the full list on schedule
// A `newsletter_issues` row claims each period, so an issue can never go out
// twice even with several Cloud Run instances running at once.

import crypto from "crypto";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import { getTransporter, GMAIL_USER, FROM_EMAIL, ADMIN_EMAIL, ADMIN_NOTIFY } from "./email";

const SITE_URL = (process.env.APP_URL || "https://humanityplusai.org").replace(/\/$/, "");
const AUTO_SEND = String(process.env.NEWSLETTER_AUTO_SEND || "").toLowerCase() === "true";
const SEND_DAY = Number(process.env.NEWSLETTER_SEND_DAY || 1); // day of month
const SEND_HOUR_ET = Number(process.env.NEWSLETTER_SEND_HOUR || 9); // 9am ET
const UNSUB_SECRET =
  process.env.NEWSLETTER_SECRET || process.env.SESSION_SECRET || "humanity-plus-ai-newsletter";

export interface NewsletterIssue {
  period: string; // "2026-07"
  periodLabel: string; // "July 2026"
  subject: string;
  html: string;
  text: string;
  stats: { posts: number; events: number; upcoming: number };
  isEmpty: boolean;
}

// ---------------------------------------------------------------- utilities

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(s: string): string {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absolute(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** The month immediately before `ref` — the period a run on the 1st reports on. */
export function previousPeriod(ref: Date = new Date()): string {
  const y = ref.getUTCFullYear();
  const m = ref.getUTCMonth(); // 0-based
  const d = new Date(Date.UTC(y, m - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function currentPeriod(ref: Date = new Date()): string {
  return `${ref.getUTCFullYear()}-${String(ref.getUTCMonth() + 1).padStart(2, "0")}`;
}

function periodRange(period: string): { start: Date; end: Date; label: string } {
  const [ys, ms] = period.split("-");
  const y = Number(ys);
  const m = Number(ms) - 1;
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
  const label = start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { start, end, label };
}

export function unsubscribeToken(email: string): string {
  return crypto
    .createHmac("sha256", UNSUB_SECRET)
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

// ------------------------------------------------------- side tables (no migration)

let tablesReady: Promise<void> | null = null;

/** Creates the newsletter bookkeeping tables if they don't exist yet. */
function ensureTables(): Promise<void> {
  if (!tablesReady) {
    tablesReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS newsletter_issues (
          period text PRIMARY KEY,
          subject text NOT NULL DEFAULT '',
          approve_token text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now(),
          sent_at timestamptz,
          recipient_count integer NOT NULL DEFAULT 0,
          status text NOT NULL DEFAULT 'pending'
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS newsletter_optouts (
          email text PRIMARY KEY,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
    })().catch((err) => {
      tablesReady = null;
      throw err;
    });
  }
  return tablesReady;
}

/**
 * Claims a period so exactly one process builds/sends it. Returns the approval
 * token when this caller won the claim, or null if the period was already taken.
 */
async function claimPeriod(period: string, subject: string): Promise<string | null> {
  await ensureTables();
  const token = crypto.randomBytes(24).toString("hex");
  const result: any = await db.execute(sql`
    INSERT INTO newsletter_issues (period, subject, approve_token, status)
    VALUES (${period}, ${subject}, ${token}, 'pending')
    ON CONFLICT (period) DO NOTHING
    RETURNING approve_token
  `);
  const rows = result?.rows ?? result ?? [];
  return rows.length ? String(rows[0].approve_token) : null;
}

async function markSent(period: string, recipientCount: number): Promise<void> {
  await ensureTables();
  await db.execute(sql`
    UPDATE newsletter_issues
       SET sent_at = now(), recipient_count = ${recipientCount}, status = 'sent'
     WHERE period = ${period}
  `);
}

export async function getIssueRecord(period: string): Promise<any | null> {
  await ensureTables();
  const result: any = await db.execute(
    sql`SELECT * FROM newsletter_issues WHERE period = ${period}`,
  );
  const rows = result?.rows ?? result ?? [];
  return rows.length ? rows[0] : null;
}

export async function listIssues(): Promise<any[]> {
  await ensureTables();
  const result: any = await db.execute(
    sql`SELECT period, subject, created_at, sent_at, recipient_count, status
          FROM newsletter_issues ORDER BY period DESC LIMIT 24`,
  );
  return result?.rows ?? result ?? [];
}

export async function findIssueByToken(token: string): Promise<any | null> {
  await ensureTables();
  if (!token || token.length < 16) return null;
  const result: any = await db.execute(
    sql`SELECT * FROM newsletter_issues WHERE approve_token = ${token}`,
  );
  const rows = result?.rows ?? result ?? [];
  return rows.length ? rows[0] : null;
}

export async function addOptOut(email: string): Promise<void> {
  await ensureTables();
  await db.execute(sql`
    INSERT INTO newsletter_optouts (email) VALUES (${email.trim().toLowerCase()})
    ON CONFLICT (email) DO NOTHING
  `);
}

async function getOptOuts(): Promise<Set<string>> {
  await ensureTables();
  const result: any = await db.execute(sql`SELECT email FROM newsletter_optouts`);
  const rows = result?.rows ?? result ?? [];
  return new Set(rows.map((r: any) => String(r.email).toLowerCase()));
}

// ------------------------------------------------------------------ recipients

/** Every registered user with an email, plus every newsletter subscriber, minus opt-outs. */
export async function getRecipients(): Promise<string[]> {
  const [userRows, subRows, optOuts] = await Promise.all([
    db.execute(sql`SELECT email FROM users WHERE email IS NOT NULL AND email <> ''`),
    db.execute(sql`SELECT email FROM newsletter_subscribers`).catch(() => ({ rows: [] }) as any),
    getOptOuts(),
  ]);
  const pull = (r: any) => (r?.rows ?? r ?? []).map((x: any) => String(x.email || "").toLowerCase());
  const all = [...pull(userRows), ...pull(subRows)];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of all) {
    if (!e || !e.includes("@")) continue;
    if (optOuts.has(e)) continue;
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }
  return out;
}

// -------------------------------------------------------------------- building

function postDate(p: any): Date {
  return new Date(p.publishedAt || p.createdAt || p.updatedAt || 0);
}

export async function buildIssue(period: string): Promise<NewsletterIssue> {
  const { start, end, label } = periodRange(period);
  const now = new Date();

  const [allPosts, allEvents] = await Promise.all([
    storage.getBlogPosts().catch(() => [] as any[]),
    storage.getEvents().catch(() => [] as any[]),
  ]);

  const posts = (allPosts || [])
    .filter((p: any) => p.published !== false && p.status !== "draft")
    .filter((p: any) => {
      const d = postDate(p);
      return d >= start && d < end;
    })
    .sort((a: any, b: any) => postDate(b).getTime() - postDate(a).getTime());

  // Fall back to the most recent articles if the month itself was quiet, so an
  // issue is never an empty shell.
  const featured = posts.length
    ? posts
    : (allPosts || [])
        .filter((p: any) => p.published !== false && p.status !== "draft")
        .sort((a: any, b: any) => postDate(b).getTime() - postDate(a).getTime())
        .slice(0, 3);

  const eventsInMonth = (allEvents || []).filter((e: any) => {
    const d = new Date(`${e.date}T00:00:00Z`);
    return !isNaN(d.getTime()) && d >= start && d < end;
  });
  const upcoming = (allEvents || [])
    .filter((e: any) => {
      const d = new Date(`${e.date}T00:00:00Z`);
      return !isNaN(d.getTime()) && d >= now;
    })
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const stats = { posts: posts.length, events: eventsInMonth.length, upcoming: upcoming.length };
  const isEmpty = posts.length === 0 && eventsInMonth.length === 0 && upcoming.length === 0;

  const subject = `Humanity + AI — ${label} Newsletter`;

  const postCards = featured
    .map((p: any) => {
      const img = absolute(p.featuredImageUrl || p.imageUrl);
      const url = `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`;
      const blurb = stripHtml(p.excerpt || p.content || "").slice(0, 220);
      return `
      <tr><td style="padding:0 0 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#ffffff;">
          ${
            img && !p.noImage
              ? `<tr><td><a href="${esc(url)}"><img src="${esc(img)}" alt="${esc(p.title)}" width="600" style="width:100%;max-width:600px;display:block;border:0;" /></a></td></tr>`
              : ""
          }
          <tr><td style="padding:20px 24px;">
            <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#3b82f6;font-weight:700;margin-bottom:6px;">${esc(p.category || "Article")}</div>
            <h3 style="margin:0 0 8px 0;font-size:19px;line-height:1.35;color:#111827;">
              <a href="${esc(url)}" style="color:#111827;text-decoration:none;">${esc(p.title)}</a>
            </h3>
            ${p.subtitle ? `<div style="font-size:14px;color:#6b7280;margin-bottom:8px;">${esc(p.subtitle)}</div>` : ""}
            <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#374151;">${esc(blurb)}${blurb.length >= 220 ? "…" : ""}</p>
            <a href="${esc(url)}" style="background:#3b82f6;color:#ffffff;padding:9px 18px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">Read the article</a>
            <div style="font-size:12px;color:#9ca3af;margin-top:12px;">By ${esc(p.author || "Humanity + AI")}${
              p.publishedAt
                ? ` · ${new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : ""
            }</div>
          </td></tr>
        </table>
      </td></tr>`;
    })
    .join("");

  const eventRow = (e: any, cta: string) => {
    const img = absolute(e.imageUrl);
    const when = new Date(`${e.date}T00:00:00Z`).toLocaleDateString("en-US", {
      weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    });
    return `
      <tr><td style="padding:0 0 16px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
          <tr>
            ${img ? `<td width="120" valign="top" style="padding:14px 0 14px 14px;"><img src="${esc(img)}" alt="" width="110" style="width:110px;border-radius:8px;display:block;border:0;" /></td>` : ""}
            <td valign="top" style="padding:14px 18px;">
              <div style="font-size:12px;color:#3b82f6;font-weight:700;">${esc(when)} · ${esc(e.time || "")}</div>
              <div style="font-size:16px;font-weight:600;color:#111827;margin:4px 0;">${esc(e.title)}</div>
              <div style="font-size:13px;color:#6b7280;">${esc(e.location || "")}</div>
              <p style="margin:8px 0 0 0;font-size:14px;line-height:1.55;color:#374151;">${esc(stripHtml(e.description || "").slice(0, 160))}</p>
              ${e.link || e.recordingUrl ? `<div style="margin-top:10px;"><a href="${esc(e.link || e.recordingUrl)}" style="color:#3b82f6;font-weight:600;font-size:14px;text-decoration:none;">${esc(cta)} →</a></div>` : ""}
            </td>
          </tr>
        </table>
      </td></tr>`;
  };

  const recapSection = eventsInMonth.length
    ? `<tr><td style="padding:8px 0 6px 0;"><h2 style="font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#1e3a8a;margin:0 0 14px 0;">What happened in ${esc(label)}</h2></td></tr>
       ${eventsInMonth.map((e: any) => eventRow(e, e.recordingUrl ? "Watch the recording" : "Event details")).join("")}`
    : "";

  const upcomingSection = upcoming.length
    ? `<tr><td style="padding:16px 0 6px 0;"><h2 style="font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#1e3a8a;margin:0 0 14px 0;">Coming up</h2></td></tr>
       ${upcoming.map((e: any) => eventRow(e, "Save your spot")).join("")}`
    : "";

  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <tr><td style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);padding:34px 28px;border-radius:12px 12px 0 0;text-align:center;">
      <div style="color:#bfdbfe;font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;">Humanity + AI, Inc.</div>
      <h1 style="color:#ffffff;margin:8px 0 0 0;font-size:26px;">${esc(label)} Newsletter</h1>
      <div style="color:#dbeafe;font-size:14px;margin-top:8px;">${stats.posts} new article${stats.posts === 1 ? "" : "s"} · ${stats.events} event${stats.events === 1 ? "" : "s"} · ${stats.upcoming} coming up</div>
    </td></tr>
    <tr><td style="background:#ffffff;padding:28px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <p style="font-size:16px;line-height:1.65;color:#374151;margin:0 0 24px 0;">
        Here's what our community built, wrote, and gathered around this month at the intersection of humanity and artificial intelligence.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 6px 0;"><h2 style="font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#1e3a8a;margin:0 0 14px 0;">${posts.length ? "From the blog" : "Worth revisiting"}</h2></td></tr>
        ${postCards || `<tr><td style="padding-bottom:20px;color:#6b7280;font-size:15px;">No new articles this month — more on the way.</td></tr>`}
        ${recapSection}
        ${upcomingSection}
      </table>
      <div style="text-align:center;margin:28px 0 6px 0;">
        <a href="${SITE_URL}" style="background:#1e3a8a;color:#ffffff;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Visit humanityplusai.org</a>
      </div>
    </td></tr>
    <tr><td style="background:#ffffff;padding:20px 28px 26px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;text-align:center;">
      <p style="font-size:13px;color:#6b7280;margin:0 0 6px 0;">Humanity + AI, Inc. · <a href="mailto:${FROM_EMAIL}" style="color:#3b82f6;">${FROM_EMAIL}</a></p>
      <p style="font-size:12px;color:#9ca3af;margin:0;">You're receiving this because you have an account or subscribed at humanityplusai.org.<br/>
        <a href="{{UNSUBSCRIBE_URL}}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a></p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    `Humanity + AI — ${label} Newsletter`,
    "",
    ...featured.map((p: any) => `• ${p.title} — ${SITE_URL}/blog/${p.slug}`),
    ...(upcoming.length ? ["", "Coming up:"] : []),
    ...upcoming.map((e: any) => `• ${e.date} — ${e.title} (${e.location || ""})`),
    "",
    SITE_URL,
    "Unsubscribe: {{UNSUBSCRIBE_URL}}",
  ].join("\n");

  return { period, periodLabel: label, subject, html, text, stats, isEmpty };
}

// --------------------------------------------------------------------- sending

function personalize(body: string, email: string): string {
  const url = `${SITE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
  return body.split("{{UNSUBSCRIBE_URL}}").join(url);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SendResult {
  sent: number;
  failed: number;
  recipients: number;
  period: string;
  reason?: string;
}

/** Mails an issue to the full list, in polite batches. */
export async function sendIssue(issue: NewsletterIssue): Promise<SendResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: 0, failed: 0, recipients: 0, period: issue.period, reason: "Email service not configured" };
  }
  const recipients = await getRecipients();
  let sent = 0;
  let failed = 0;

  const BATCH = 8;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((to) =>
        transporter.sendMail({
          from: `"Humanity + AI, Inc." <${GMAIL_USER}>`,
          replyTo: FROM_EMAIL,
          to,
          subject: issue.subject,
          html: personalize(issue.html, to),
          text: personalize(issue.text, to),
          headers: {
            "List-Unsubscribe": `<${SITE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(to)}&t=${unsubscribeToken(to)}>`,
          },
        }),
      ),
    );
    for (const r of results) r.status === "fulfilled" ? sent++ : failed++;
    if (i + BATCH < recipients.length) await sleep(1200); // stay well inside Gmail's limits
  }

  await markSent(issue.period, sent).catch(() => {});
  console.log(`[newsletter] ${issue.period}: sent ${sent}, failed ${failed}, list ${recipients.length}`);
  return { sent, failed, recipients: recipients.length, period: issue.period };
}

/** Emails the admin a copy of what just went out, after an automatic send. */
async function sendAdminReceipt(issue: NewsletterIssue, result: SendResult): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;
  const banner = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto 18px auto;padding:18px 20px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;">
      <div style="font-weight:700;color:#065f46;margin-bottom:6px;">Sent automatically — ${esc(issue.periodLabel)}</div>
      <div style="font-size:14px;color:#065f46;line-height:1.6;">
        Delivered to <strong>${result.sent}</strong> of ${result.recipients} recipient${result.recipients === 1 ? "" : "s"}${result.failed ? ` · <strong>${result.failed}</strong> failed` : ""}.
        Contents: ${issue.stats.posts} article${issue.stats.posts === 1 ? "" : "s"}, ${issue.stats.events} event${issue.stats.events === 1 ? "" : "s"}, ${issue.stats.upcoming} upcoming.
      </div>
      <div style="font-size:12px;color:#047857;margin-top:10px;">Your copy of the issue follows.</div>
    </div>`;
  await transporter
    .sendMail({
      from: `"Humanity + AI Newsletter" <${GMAIL_USER}>`,
      to: ADMIN_NOTIFY,
      replyTo: FROM_EMAIL,
      subject: `[Sent] ${issue.subject} — ${result.sent} delivered`,
      html: banner + personalize(issue.html, ADMIN_EMAIL),
    })
    .catch((err: any) => console.error("[newsletter] receipt failed:", err?.message || err));
}

/** Emails the admin a full preview plus a one-click link that releases the issue. */
async function sendAdminPreview(
  issue: NewsletterIssue,
  approveToken: string,
  heldReason?: string,
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;
  const recipients = await getRecipients();
  const approveUrl = `${SITE_URL}/api/newsletter/approve/${approveToken}`;
  const banner = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto 18px auto;padding:18px 20px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;">
      <div style="font-weight:700;color:#92400e;margin-bottom:6px;">Draft ready — ${esc(issue.periodLabel)}</div>
      <div style="font-size:14px;color:#78350f;line-height:1.6;">
        ${heldReason ? `${esc(heldReason)}<br/>` : ""}
        This issue is queued but <strong>has not been sent</strong>. It will go to <strong>${recipients.length}</strong> recipient${recipients.length === 1 ? "" : "s"}
        (${issue.stats.posts} article${issue.stats.posts === 1 ? "" : "s"}, ${issue.stats.events} event${issue.stats.events === 1 ? "" : "s"}, ${issue.stats.upcoming} upcoming).
      </div>
      <div style="margin-top:14px;">
        <a href="${esc(approveUrl)}" style="background:#b45309;color:#fff;padding:11px 22px;border-radius:7px;text-decoration:none;font-weight:700;display:inline-block;">Send it to everyone</a>
      </div>
      <div style="font-size:12px;color:#92400e;margin-top:10px;">Preview of the exact email follows.</div>
    </div>`;
  await transporter.sendMail({
    from: `"Humanity + AI Newsletter" <${GMAIL_USER}>`,
    to: ADMIN_NOTIFY,
    replyTo: FROM_EMAIL,
    subject: `[Approve] ${issue.subject} — ${recipients.length} recipients`,
    html: banner + personalize(issue.html, ADMIN_EMAIL),
  });
  console.log(`[newsletter] ${issue.period}: approval preview sent to ${ADMIN_EMAIL}`);
}

/**
 * Runs one monthly cycle: claims the period, builds the issue, then either
 * sends it (NEWSLETTER_AUTO_SEND=true) or routes it to the admin for approval.
 */
export async function runMonthlyCycle(
  period: string,
  opts: { force?: boolean } = {},
): Promise<{ status: string; period: string; detail?: any }> {
  const issue = await buildIssue(period);
  const token = await claimPeriod(period, issue.subject);
  if (!token && !opts.force) {
    return { status: "already-claimed", period };
  }
  const fallbackToken = token || (await getIssueRecord(period))?.approve_token || "";

  if (AUTO_SEND) {
    // Guardrail: a month with nothing new doesn't auto-blast the list. It still
    // gets built and offered to the admin, who can release it with one click.
    if (issue.isEmpty && !opts.force) {
      await sendAdminPreview(
        issue,
        fallbackToken,
        "Auto-send was held back because no new articles or events landed this month.",
      );
      return { status: "held-empty", period, detail: issue.stats };
    }
    const result = await sendIssue(issue);
    await sendAdminReceipt(issue, result);
    return { status: "sent", period, detail: result };
  }
  await sendAdminPreview(issue, fallbackToken);
  return { status: "pending-approval", period, detail: issue.stats };
}

// ------------------------------------------------------------------ scheduler

let timer: NodeJS.Timeout | null = null;

function etParts(d: Date): { day: number; hour: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    day: "numeric",
    hour: "numeric",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return { day: Number(parts.day), hour: Number(parts.hour) };
}

async function tick(): Promise<void> {
  try {
    const now = new Date();
    const { day, hour } = etParts(now);
    if (day !== SEND_DAY || hour < SEND_HOUR_ET) return;
    const period = previousPeriod(now);
    const existing = await getIssueRecord(period);
    if (existing) return; // already built (and possibly sent) this period
    const result = await runMonthlyCycle(period);
    console.log(`[newsletter] monthly cycle for ${period}: ${result.status}`);
  } catch (err: any) {
    console.error("[newsletter] scheduler error:", err?.message || err);
  }
}

/** Starts the hourly check that fires the monthly issue. Safe to call once at boot. */
export function startNewsletterScheduler(): void {
  if (timer) return;
  console.log(
    `[newsletter] scheduler on — day ${SEND_DAY} of each month, ${SEND_HOUR_ET}:00 ET, mode=${AUTO_SEND ? "auto-send" : "admin-approval"}`,
  );
  // First check shortly after boot, then hourly.
  setTimeout(() => void tick(), 60_000);
  timer = setInterval(() => void tick(), 60 * 60 * 1000);
}

export const newsletterConfig = { AUTO_SEND, SEND_DAY, SEND_HOUR_ET, SITE_URL };
