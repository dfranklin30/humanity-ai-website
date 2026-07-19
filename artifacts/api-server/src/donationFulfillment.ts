import type Stripe from "stripe";
import { storage } from "./storage";
import { sendDonationNotification } from "./email";
import { getUncachableStripeClient } from "./stripeClient";

/**
 * Records a paid donation idempotently (keyed by a unique Stripe reference --
 * a checkout session id for one-time gifts, or an invoice id for recurring ones)
 * and sends the notification email exactly once.
 */
export async function recordDonation(params: {
  reference: string;
  amountCents: number;
  donorName: string;
  donorEmail: string;
  message: string | null;
  isRecurring: boolean;
  campaignSlug?: string | null;
}) {
  const { reference, amountCents } = params;
  if (!reference || !Number.isFinite(amountCents) || amountCents <= 0) {
    return null;
  }

  const existing = await storage.getDonationByStripeSessionId(reference);
  if (existing) return existing;

  try {
    const donation = await storage.createDonation({
      donorName: params.donorName,
      donorEmail: params.donorEmail,
      amount: amountCents,
      message: params.message,
      isRecurring: params.isRecurring,
      stripeSessionId: reference,
      campaignSlug: params.campaignSlug || null,
    });
    await sendDonationNotification(
      amountCents,
      params.donorName,
      params.donorEmail,
      params.message,
    );
    return donation;
  } catch (err) {
    // Likely a unique-constraint race -- another handler already recorded it.
    const again = await storage.getDonationByStripeSessionId(reference);
    if (again) return again;
    throw err;
  }
}

/**
 * Webhook-driven fulfillment. The event payload has already been
 * signature-verified by stripe-replit-sync before this runs.
 *
 * - One-time gifts are recorded on `checkout.session.completed` (mode=payment).
 * - Recurring gifts are recorded on each `invoice.paid` (covers the first charge
 *   and every monthly renewal); the subscription's checkout.session is skipped
 *   to avoid double counting.
 */
export async function handleStripeDonationEvent(event: Stripe.Event): Promise<void> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.type !== "donation") return;
    if (session.mode !== "payment") return; // recurring handled via invoice.paid
    if (session.payment_status !== "paid") return;

    await recordDonation({
      reference: session.id,
      amountCents: session.amount_total ?? 0,
      donorName: session.metadata.donorName || session.customer_details?.name || "Anonymous",
      donorEmail: session.metadata.donorEmail || session.customer_details?.email || "",
      message: session.metadata.message || null,
      isRecurring: false,
      campaignSlug: session.metadata.campaignSlug || null,
    });
    return;
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    if (invoice.status !== "paid") return;
    const subscriptionId =
      typeof (invoice as any).subscription === "string"
        ? (invoice as any).subscription
        : (invoice as any).subscription?.id;
    if (!subscriptionId) return; // not a subscription invoice

    let meta: Record<string, string> = {};
    try {
      const stripe = await getUncachableStripeClient();
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      meta = (sub.metadata as Record<string, string>) || {};
    } catch {
      return;
    }
    if (meta.type !== "donation") return;

    await recordDonation({
      reference: invoice.id ?? `invoice_${(invoice as any).id}`,
      amountCents: invoice.amount_paid ?? 0,
      donorName: meta.donorName || invoice.customer_name || "Anonymous",
      donorEmail: meta.donorEmail || invoice.customer_email || "",
      message: meta.message || null,
      isRecurring: true,
      campaignSlug: meta.campaignSlug || null,
    });
  }
}
