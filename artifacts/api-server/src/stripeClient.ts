import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

/**
 * Stripe credentials come from environment variables (Google Cloud Run
 * secrets/env):
 *   STRIPE_SECRET_KEY     — sk_live_... in production, sk_test_... in dev
 *   STRIPE_WEBHOOK_SECRET — whsec_... (optional; auto-managed webhooks fill it)
 *
 * APP_ENV=production marks the live deployment (set on Cloud Run). The
 * live/test guards below are preserved from the original Replit setup:
 * a production deployment must never run on test keys, and a non-production
 * environment must never run on live keys.
 */
function getStripeCredentials(): { secretKey: string; webhookSecret?: string } {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is not set. " +
        "Add it to the service configuration (Cloud Run → Variables & Secrets).",
    );
  }

  const isProduction = process.env.APP_ENV === "production";

  // Safety net: a live deployment must never operate on test keys. Fail loudly
  // instead of silently collecting fake donations.
  if (isProduction && !secretKey.startsWith("sk_live")) {
    throw new Error(
      "APP_ENV=production but STRIPE_SECRET_KEY is not a live key (sk_live_...). " +
        "Refusing to start donation processing with test credentials.",
    );
  }

  // Symmetric guard: development must never operate on live keys, so testing
  // can never create real charges.
  if (!isProduction && secretKey.startsWith("sk_live")) {
    throw new Error(
      "STRIPE_SECRET_KEY is a LIVE key but APP_ENV is not 'production'. " +
        "Refusing to run with live Stripe credentials outside production.",
    );
  }

  return { secretKey, webhookSecret };
}

/**
 * Returns an authenticated Stripe client.
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = getStripeCredentials();
  return new Stripe(secretKey);
}

/**
 * Returns a StripeSync instance for webhook processing and data sync.
 */
export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const { secretKey, webhookSecret } = getStripeCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? "",
  });
}
