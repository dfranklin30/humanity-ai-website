/**
 * AI Builders Academy (/aiforkids) API routes.
 *
 * Registered from app.ts alongside registerRoutes and healthRouter. Kept in a
 * separate module so the academy can later be lifted into its own service
 * without unpicking the main routes file.
 *
 *   POST /api/aiforkids/enroll    parent-initiated enrollment (+ optional Stripe checkout)
 *   POST /api/aiforkids/inquiry   contact / school meeting / sponsor / volunteer forms
 *   GET  /api/aiforkids/verify    confirm a Stripe checkout by session id
 */
import type { Express } from "express";
import { storage } from "../storage";
import { getUncachableStripeClient } from "../stripeClient";
import {
  REQUIRED_CONSENTS,
  TIER_NAMES,
  TIER_PRICES,
  attachStripeSession,
  createEnrollment,
  getEnrollmentByStripeSession,
  inquiryLabel,
  markEnrollmentPaid,
  newReference,
  sendEnrollmentEmails,
  sendInquiryEmails,
  type EnrollmentInput,
} from "../aiforkids";

const SITE_FALLBACK = "https://humanityplusai.org";

function siteOrigin(req: any): string {
  return (
    process.env.PUBLIC_SITE_URL ||
    (req.headers.origin as string) ||
    SITE_FALLBACK
  ).replace(/\/$/, "");
}

/* --------------------------------------------------------------- *
 * Validation
 *
 * api-server does not depend on zod (only lib/api-zod does), so the
 * handful of fields these endpoints accept are validated by hand
 * rather than adding a dependency to the server bundle.
 * --------------------------------------------------------------- */
class FieldError extends Error {}

const TOO_LONG = "One of your answers is too long.";
const GENERIC = "Please check the form and try again.";

/** Trim and cap free text so a paste-bomb can't fill the database. */
function optText(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") throw new FieldError(GENERIC);
  const s = v.trim();
  if (!s.length) return null;
  if (s.length > max) throw new FieldError(TOO_LONG);
  return s;
}

function reqText(v: unknown, max: number, message: string, min = 1): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (s.length < min) throw new FieldError(message);
  if (s.length > max) throw new FieldError(TOO_LONG);
  return s;
}

function reqEmail(v: unknown): string {
  const s = reqText(v, 200, "Please enter a valid email address.", 3);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) {
    throw new FieldError("Please enter a valid email address.");
  }
  return s;
}

type EnrollBody = {
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string | null;
  relationship: string | null;
  studentFirstName: string;
  studentLastInitial: string | null;
  studentAge: string | null;
  gradeBandId: string;
  schoolName: string | null;
  accommodations: string | null;
  sessionId: string | null;
  tierId: string;
  payChoice: "pay" | "scholarship" | "hold";
  consentVersion: string;
  consents: string[];
};

function parseEnroll(body: any): EnrollBody {
  const b = body && typeof body === "object" ? body : {};
  const payChoice = reqText(b.payChoice, 20, "Please choose how you would like to continue.");
  if (payChoice !== "pay" && payChoice !== "scholarship" && payChoice !== "hold") {
    throw new FieldError("Please choose how you would like to continue.");
  }
  const consents: string[] = Array.isArray(b.consents)
    ? b.consents
        .filter((c: unknown) => typeof c === "string")
        .map((c: string) => c.trim())
        .slice(0, 20)
    : [];
  return {
    guardianName: reqText(b.guardianName, 200, "Please enter your name.", 2),
    guardianEmail: reqEmail(b.guardianEmail),
    guardianPhone: optText(b.guardianPhone, 60),
    relationship: optText(b.relationship, 60),
    studentFirstName: reqText(b.studentFirstName, 80, "Please enter your student's first name."),
    // Deliberately an initial, not a surname - see the privacy note in aiforkids.ts.
    studentLastInitial: optText(b.studentLastInitial, 4),
    studentAge: optText(b.studentAge, 10),
    gradeBandId: reqText(b.gradeBandId, 40, "Please choose a grade band."),
    schoolName: optText(b.schoolName, 200),
    accommodations: optText(b.accommodations, 2000),
    sessionId: optText(b.sessionId, 80),
    tierId: reqText(b.tierId, 40, "Please choose a program option."),
    payChoice,
    consentVersion: reqText(b.consentVersion, 40, GENERIC),
    consents,
  };
}

function parseInquiry(body: any): Record<string, any> {
  const b = body && typeof body === "object" ? body : {};
  const out: Record<string, any> = {
    kind: reqText(b.kind, 40, GENERIC),
    name: reqText(b.name, 200, "Please enter your name.", 2),
    email: reqEmail(b.email),
    message: optText(b.message, 5000) ?? undefined,
  };
  for (const [k, v] of Object.entries(b)) {
    if (k === "kind" || k === "name" || k === "email" || k === "message") continue;
    if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 500);
  }
  return out;
}

export function registerAiForKidsRoutes(app: Express): void {
  /* -------------------------------------------------------------- *
   * Enrollment
   * -------------------------------------------------------------- */
  app.post("/api/aiforkids/enroll", async (req, res) => {
    let parsed: EnrollBody;
    try {
      parsed = parseEnroll(req.body);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof FieldError ? error.message : GENERIC,
      });
    }

    // Every required consent must be present. This is the legal record, so it
    // is re-checked here and never trusted from the client alone.
    const missing = REQUIRED_CONSENTS.filter((c) => !parsed.consents.includes(c));
    if (missing.length) {
      return res.status(400).json({
        message: "Please agree to all the required items before submitting.",
      });
    }

    const price = TIER_PRICES[parsed.tierId] ?? null;
    const reference = newReference();

    const input: EnrollmentInput = {
      reference,
      guardianName: parsed.guardianName,
      guardianEmail: parsed.guardianEmail,
      guardianPhone: parsed.guardianPhone,
      relationship: parsed.relationship,
      studentFirstName: parsed.studentFirstName,
      studentLastInitial: parsed.studentLastInitial,
      studentAge: parsed.studentAge,
      gradeBandId: parsed.gradeBandId,
      schoolName: parsed.schoolName,
      accommodations: parsed.accommodations,
      sessionId: parsed.sessionId,
      tierId: parsed.tierId,
      payChoice: parsed.payChoice,
      amount: price,
      consents: parsed.consents,
      consentVersion: parsed.consentVersion,
    };

    try {
      await createEnrollment(input);
    } catch (error) {
      console.error("AI for Kids enroll storage error:", error);
      return res.status(500).json({
        message:
          "We couldn't save that. Please try again, or email danielle@humanityplusai.org and we'll enroll your student by hand.",
      });
    }

    // Payment is attempted only when the parent chose to pay AND the tier has a
    // confirmed price AND Stripe is configured. Any of those missing is not an
    // error — the seat is reserved and we invoice later.
    let checkoutUrl: string | null = null;
    if (parsed.payChoice === "pay" && price != null) {
      try {
        const stripe = await getUncachableStripeClient();
        const origin = siteOrigin(req);
        const tierName = TIER_NAMES[parsed.tierId] || parsed.tierId;
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: parsed.guardianEmail,
          client_reference_id: reference,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: price,
                product_data: {
                  name: `AI Builders Academy — ${tierName}`,
                  description: `Six-week program tuition. Reference ${reference}.`,
                },
              },
            },
          ],
          // "type" is checked by the donation webhook handler, which ignores
          // anything that isn't a donation. Do not change this key.
          metadata: {
            type: "tuition",
            program: "aiforkids",
            reference,
            tierId: parsed.tierId,
            gradeBandId: parsed.gradeBandId,
            cohort: parsed.sessionId || "",
          },
          success_url: `${origin}/aiforkids/enroll/received?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/aiforkids/enroll?tier=${encodeURIComponent(parsed.tierId)}`,
        });
        if (session.url) {
          checkoutUrl = session.url;
          await attachStripeSession(reference, session.id);
        }
      } catch (error) {
        // Stripe not configured, or checkout failed. The enrollment is already
        // stored, so degrade to "seat reserved, we'll invoice you".
        console.error("AI for Kids checkout error:", error);
      }
    }

    sendEnrollmentEmails(input, { willPay: Boolean(checkoutUrl) }).catch((error) => {
      console.error("AI for Kids enrollment email error:", error);
    });

    return res.status(201).json({ reference, checkoutUrl });
  });

  /* -------------------------------------------------------------- *
   * Verify a completed Stripe checkout
   * -------------------------------------------------------------- */
  app.get("/api/aiforkids/verify", async (req, res) => {
    const sessionId = String(req.query.session_id || "");
    if (!sessionId) return res.status(400).json({ message: "Missing session_id" });

    try {
      const existing = await getEnrollmentByStripeSession(sessionId);
      if (existing?.paid) {
        return res.json({ paid: true, reference: existing.reference });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const paid = session.payment_status === "paid";
      if (paid) await markEnrollmentPaid(sessionId);

      return res.json({
        paid,
        reference: existing?.reference ?? session.client_reference_id ?? null,
      });
    } catch (error) {
      console.error("AI for Kids verify error:", error);
      return res.status(500).json({ message: "Could not verify that payment." });
    }
  });

  /* -------------------------------------------------------------- *
   * Inquiries — general, school partnership, meeting request,
   * instructor, volunteer, sponsor, scholarship.
   *
   * These land in contact_submissions so they show up in the same place
   * as every other message from the site, and are emailed to the same
   * mailboxes as sign-ups.
   * -------------------------------------------------------------- */
  app.post("/api/aiforkids/inquiry", async (req, res) => {
    let parsed: Record<string, any>;
    try {
      parsed = parseInquiry(req.body);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof FieldError ? error.message : GENERIC,
      });
    }

    const { kind, name, email, message, ...rest } = parsed as Record<string, any>;
    const extras: Record<string, string> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (typeof v === "string" && v.trim()) extras[k] = v.trim();
    }

    const label = inquiryLabel(kind);
    const nameBits = name.trim().split(/\s+/);
    const firstName = nameBits[0] || name.trim();
    const lastName = nameBits.slice(1).join(" ") || "—";

    const body = [
      `[AI for Kids · ${label}]`,
      ...Object.entries(extras).map(([k, v]) => `${k}: ${v}`),
      "",
      message?.trim() || "(no message)",
    ].join("\n");

    try {
      await storage.createContact({ firstName, lastName, email, message: body } as any);
    } catch (error) {
      // Don't fail the visitor's submission on a storage hiccup — the email
      // below is the copy that actually gets read.
      console.error("AI for Kids inquiry storage error:", error);
    }

    try {
      await sendInquiryEmails({
        kind,
        name: name.trim(),
        email,
        message: message?.trim() || "",
        extras,
      });
    } catch (error) {
      console.error("AI for Kids inquiry email error:", error);
    }

    return res.status(201).json({ ok: true });
  });
}
