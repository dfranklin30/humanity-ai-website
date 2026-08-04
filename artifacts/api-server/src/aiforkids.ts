/**
 * AI Builders Academy (/aiforkids) — data + notification layer.
 *
 * Storage follows the same lazy-DDL pattern already used by newsletter.ts:
 * the table is created on first use with CREATE TABLE IF NOT EXISTS, so no
 * separate migration step is needed at deploy time. The DDL is additive only —
 * it never drops or alters an existing table.
 *
 * PRIVACY NOTE (COPPA): we deliberately store the student's FIRST NAME and
 * LAST INITIAL only. No full name, no birth date, no address, no photograph.
 * The enrolling adult's contact details are the record of who to reach.
 */
import crypto from "crypto";
import { sql } from "drizzle-orm";
import { db } from "./db";
import {
  FROM_EMAIL,
  ADMIN_NOTIFY,
  getTransporter,
  isEmailConfigured,
} from "./email";

/* ------------------------------------------------------------------ *
 * Tier prices (cents).
 *
 * KEEP IN SYNC with artifacts/humanity-ai-website/src/aiforkids/content/program.ts
 * A null price means "not announced yet" — the server will refuse to start a
 * checkout for that tier and will fall back to reserving a seat instead.
 * ------------------------------------------------------------------ */
export const TIER_PRICES: Record<string, number | null> = {
  explorer: null, // NEEDS_REVIEW: set once Humanity + AI confirms the Explorer price
  creator: 39_900, // $399.00
};

export const TIER_NAMES: Record<string, string> = {
  explorer: "Explorer",
  creator: "Creator",
};

/** Consents that must be accepted before an enrollment is valid. */
export const REQUIRED_CONSENTS = ["guardian", "ai_tools", "privacy", "waiver"];

export type EnrollmentInput = {
  reference: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone?: string | null;
  relationship?: string | null;
  studentFirstName: string;
  studentLastInitial?: string | null;
  studentAge?: string | null;
  gradeBandId: string;
  schoolName?: string | null;
  accommodations?: string | null;
  sessionId?: string | null;
  tierId: string;
  payChoice: string;
  amount: number | null;
  consents: string[];
  consentVersion: string;
};

export type EnrollmentRow = {
  id: number;
  reference: string;
  guardian_name: string;
  guardian_email: string;
  student_first_name: string;
  student_last_initial: string | null;
  grade_band_id: string;
  tier_id: string;
  pay_choice: string;
  amount: number | null;
  paid: boolean;
  stripe_session_id: string | null;
};

let tablesReady: Promise<void> | null = null;

/**
 * Create the academy tables if they do not exist. Idempotent, additive only.
 */
export function ensureAcademyTables(): Promise<void> {
  if (!tablesReady) {
    tablesReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS academy_enrollments (
          id serial PRIMARY KEY,
          reference text NOT NULL UNIQUE,
          guardian_name text NOT NULL,
          guardian_email text NOT NULL,
          guardian_phone text,
          relationship text,
          student_first_name text NOT NULL,
          student_last_initial text,
          student_age text,
          grade_band_id text NOT NULL,
          school_name text,
          accommodations text,
          session_id text,
          tier_id text NOT NULL,
          pay_choice text NOT NULL,
          amount integer,
          consents text NOT NULL,
          consent_version text NOT NULL,
          consented_at timestamptz NOT NULL DEFAULT now(),
          stripe_session_id text UNIQUE,
          paid boolean NOT NULL DEFAULT false,
          paid_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS academy_enrollments_email_idx
          ON academy_enrollments (guardian_email)
      `);
    })().catch((err) => {
      tablesReady = null;
      throw err;
    });
  }
  return tablesReady;
}

/** Human-friendly, non-sequential reference the parent can quote back to us. */
export function newReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return `AIK-${out}`;
}

export async function createEnrollment(input: EnrollmentInput): Promise<void> {
  await ensureAcademyTables();
  await db.execute(sql`
    INSERT INTO academy_enrollments (
      reference, guardian_name, guardian_email, guardian_phone, relationship,
      student_first_name, student_last_initial, student_age, grade_band_id,
      school_name, accommodations, session_id, tier_id, pay_choice, amount,
      consents, consent_version
    ) VALUES (
      ${input.reference}, ${input.guardianName}, ${input.guardianEmail},
      ${input.guardianPhone || null}, ${input.relationship || null},
      ${input.studentFirstName}, ${input.studentLastInitial || null},
      ${input.studentAge || null}, ${input.gradeBandId},
      ${input.schoolName || null}, ${input.accommodations || null},
      ${input.sessionId || null}, ${input.tierId}, ${input.payChoice},
      ${input.amount}, ${input.consents.join(",")}, ${input.consentVersion}
    )
  `);
}

export async function attachStripeSession(
  reference: string,
  stripeSessionId: string,
): Promise<void> {
  await ensureAcademyTables();
  await db.execute(sql`
    UPDATE academy_enrollments
       SET stripe_session_id = ${stripeSessionId}
     WHERE reference = ${reference}
  `);
}

export async function getEnrollmentByStripeSession(
  stripeSessionId: string,
): Promise<EnrollmentRow | null> {
  await ensureAcademyTables();
  const result: any = await db.execute(sql`
    SELECT * FROM academy_enrollments
     WHERE stripe_session_id = ${stripeSessionId}
     LIMIT 1
  `);
  const rows = result?.rows ?? result ?? [];
  return rows.length ? (rows[0] as EnrollmentRow) : null;
}

export async function markEnrollmentPaid(stripeSessionId: string): Promise<void> {
  await ensureAcademyTables();
  await db.execute(sql`
    UPDATE academy_enrollments
       SET paid = true, paid_at = now()
     WHERE stripe_session_id = ${stripeSessionId}
  `);
}

/* ------------------------------------------------------------------ *
 * Notifications — best effort. A failed email must never fail the
 * request, because the enrollment row is already safely stored.
 * ------------------------------------------------------------------ */

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function send(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!isEmailConfigured()) return { sent: false, reason: "email not configured" };
  const transporter = getTransporter();
  if (!transporter) return { sent: false, reason: "no transporter" };
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendEnrollmentEmails(
  input: EnrollmentInput,
  opts: { willPay: boolean },
): Promise<void> {
  const tierName = TIER_NAMES[input.tierId] || input.tierId;
  const amountLabel =
    input.amount != null ? `$${(input.amount / 100).toFixed(2)}` : "not set";

  // Admin copy — goes to the same mailboxes as every other site notification.
  await send({
    to: ADMIN_NOTIFY,
    replyTo: input.guardianEmail,
    subject: `AI Builders Academy enrollment — ${input.reference} (${esc(input.studentFirstName)})`,
    html: `
      <h2>New AI Builders Academy enrollment</h2>
      <p><strong>Reference:</strong> ${esc(input.reference)}</p>
      <h3>Parent / guardian</h3>
      <ul>
        <li>${esc(input.guardianName)} (${esc(input.relationship || "Parent")})</li>
        <li>${esc(input.guardianEmail)}</li>
        <li>${esc(input.guardianPhone || "no phone given")}</li>
      </ul>
      <h3>Student</h3>
      <ul>
        <li>${esc(input.studentFirstName)} ${esc(input.studentLastInitial || "")}.</li>
        <li>Age: ${esc(input.studentAge || "not given")}</li>
        <li>Grade band: ${esc(input.gradeBandId)}</li>
        <li>School: ${esc(input.schoolName || "not given")}</li>
        <li>Accommodations / medical: ${esc(input.accommodations || "none noted")}</li>
      </ul>
      <h3>Program</h3>
      <ul>
        <li>Tier: ${esc(tierName)} (${amountLabel})</li>
        <li>Cohort: ${esc(input.sessionId || "none selected")}</li>
        <li>Payment choice: ${esc(input.payChoice)}${opts.willPay ? " — sent to Stripe checkout" : ""}</li>
      </ul>
      <h3>Consents</h3>
      <p>Version ${esc(input.consentVersion)} — accepted: ${esc(input.consents.join(", "))}</p>
    `,
  });

  // Parent copy.
  await send({
    to: input.guardianEmail,
    replyTo: ADMIN_NOTIFY,
    subject: `We've got ${esc(input.studentFirstName)}'s AI Builders Academy enrollment`,
    html: `
      <h2>Thank you — we have the enrollment.</h2>
      <p>Reference <strong>${esc(input.reference)}</strong>. Keep this for your records.</p>
      <p>
        ${esc(input.studentFirstName)} is signed up for the six-week AI Builders
        Academy${opts.willPay ? "" : " — no payment has been taken"}.
      </p>
      <h3>What happens next</h3>
      <ol>
        <li>We'll email your cohort's dates, location and the exact AI tool list before Week 1.</li>
        <li>Week 6 is the family showcase — put it on your calendar as soon as we send dates.</li>
        <li>Reply to this email any time with questions, or to change or cancel.</li>
      </ol>
      <p>
        You accepted consent version ${esc(input.consentVersion)}:
        ${esc(input.consents.join(", "))}. You can withdraw any optional consent,
        or ask us to delete your family's information, by replying to this email.
      </p>
      <p>— Humanity + AI</p>
    `,
  });
}

const INQUIRY_LABELS: Record<string, string> = {
  general: "General inquiry",
  school_partnership: "School partnership",
  school_meeting: "Schedule a meeting (school)",
  instructor: "Instructor application",
  volunteer: "Volunteer",
  sponsor: "Sponsor",
  scholarship: "Scholarship question",
};

export function inquiryLabel(kind: string): string {
  return INQUIRY_LABELS[kind] || "Inquiry";
}

export async function sendInquiryEmails(payload: {
  kind: string;
  name: string;
  email: string;
  message: string;
  extras: Record<string, string>;
}): Promise<void> {
  const label = inquiryLabel(payload.kind);
  const extraRows = Object.entries(payload.extras)
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(String(v))}</li>`)
    .join("");

  await send({
    to: ADMIN_NOTIFY,
    replyTo: payload.email,
    subject: `AI for Kids — ${label} from ${esc(payload.name)}`,
    html: `
      <h2>${esc(label)}</h2>
      <p>Received from the AI Builders Academy site (/aiforkids).</p>
      <ul>
        <li><strong>Name:</strong> ${esc(payload.name)}</li>
        <li><strong>Email:</strong> ${esc(payload.email)}</li>
        ${extraRows}
      </ul>
      <h3>Message</h3>
      <p>${esc(payload.message || "(no message)").replace(/\n/g, "<br>")}</p>
    `,
  });

  await send({
    to: payload.email,
    replyTo: ADMIN_NOTIFY,
    subject: "Thanks — we've got your message",
    html: `
      <h2>Thank you for reaching out.</h2>
      <p>
        We've received your message about AI Builders Academy and someone from
        Humanity + AI will reply within two business days.
      </p>
      <p>— Humanity + AI</p>
    `,
  });
}
