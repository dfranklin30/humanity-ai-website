import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createServer, type Server } from "http";
import { logger } from "./lib/logger";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes/routes";
import { serveStatic } from "./static";
import healthRouter from "./routes/health";
import { registerAiForKidsRoutes } from "./routes/aiforkids";
import { registerAikRoutes } from "./aik/routes";
import { WebhookHandlers } from "./webhookHandlers";
import { handleStripeDonationEvent } from "./donationFulfillment";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
}));

// Health check — mounted first so it is always reachable
app.use("/api", healthRouter);

// Stripe webhook — raw body, must come BEFORE express.json()
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      const event = await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      if (event) {
        const expectLivemode = process.env.APP_ENV === "production";
        if (event.livemode !== expectLivemode) {
          logger.warn({ eventType: event.type, livemode: event.livemode }, "Ignoring Stripe event: livemode mismatch");
        } else {
          try {
            await handleStripeDonationEvent(event);
          } catch (fulfillErr: any) {
            logger.error({ err: fulfillErr }, "Donation fulfillment error");
          }
        }
      }
      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error({ err: error }, "Webhook processing error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup auth middleware (sessions, passport)
setupAuth(app);

// AI Builders Academy (/aiforkids) API. Registered before the SPA
// catch-all in serveStatic so it is never shadowed.
registerAiForKidsRoutes(app);

// Kids AI Studio (/aiforkids/studio, /aiforkids/facilitator) API at /api/aik.
// Mounted only when AIK_ENABLED=true; see src/aik/config.ts for all settings.
registerAikRoutes(app);

// Create http server and register all legacy routes
export const httpServer: Server = createServer(app);

// registerRoutes wires all app routes onto `app` and returns the server.
// After the API routes are in place, serve the built website (SPA) from
// dist/public with a catch-all fallback — this must register AFTER the API
// routes so it never shadows /api/*.
registerRoutes(httpServer, app)
  .then(() => {
    if (process.env.SERVE_STATIC !== "false") {
      serveStatic(app);
    }
  })
  .catch((err) => {
    logger.error({ err }, "Failed to register routes");
    process.exit(1);
  });

export default app;
