import { httpServer } from "./app";
import { logger } from "./lib/logger";
import { seedDatabase } from "./seed";
import { startNewsletterScheduler } from "./newsletter";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("Stripe init skipped: DATABASE_URL not set");
    return;
  }
  try {
    const { runMigrations } = await import("stripe-replit-sync");
    const { getStripeSync } = await import("./stripeClient");

    await runMigrations({ databaseUrl, schema: "stripe" });
    const stripeSync = await getStripeSync();

    const webhookBaseUrl = process.env.APP_URL || undefined;
    if (webhookBaseUrl) {
      const webhookResult = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`,
      );
      logger.info({ url: webhookResult?.webhook?.url || "configured" }, "Stripe webhook ready");
    }

    stripeSync
      .syncBackfill()
      .then(() => logger.info("Stripe data synced"))
      .catch((err: any) => logger.error({ err }, "Stripe syncBackfill error"));
  } catch (error: any) {
    logger.error({ err: error }, "Stripe init failed (site continues without Stripe sync)");
  }
}

// Bind port first so health checks pass, then run background work
httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");

  seedDatabase().catch((err) => {
    logger.error({ err }, "Seed error");
  });

  initStripe().catch((err) => {
    logger.error({ err }, "initStripe error");
  });

  try {
    startNewsletterScheduler();
  } catch (err) {
    logger.error({ err }, "Newsletter scheduler failed to start");
  }
});
