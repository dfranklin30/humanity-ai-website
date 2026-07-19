import type Stripe from "stripe";
import { getStripeSync } from "./stripeClient";

export class WebhookHandlers {
  /**
   * Verifies + syncs the Stripe webhook via stripe-replit-sync, then returns the
   * verified event so callers can run business-side fulfillment. Returns null if
   * the verified payload could not be parsed.
   */
  static async processWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<Stripe.Event | null> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
          "Received type: " +
          typeof payload +
          ". " +
          "This usually means express.json() parsed the body before reaching this handler. " +
          "FIX: Ensure webhook route is registered BEFORE app.use(express.json()).",
      );
    }

    const sync = await getStripeSync();
    // Throws if the signature is invalid -- after this succeeds the payload is trusted.
    await sync.processWebhook(payload, signature);

    try {
      return JSON.parse(payload.toString("utf8")) as Stripe.Event;
    } catch {
      return null;
    }
  }
}
