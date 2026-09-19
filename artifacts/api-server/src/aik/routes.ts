/**
 * Kids AI Studio — HTTP API. Mounted at /api/aik when AIK_ENABLED=true.
 *
 * Two audiences, two session shapes, kept strictly apart:
 *   req.session.aikFacilitator  — { id, at }      facilitator dashboard
 *   req.session.aikChild        — { id, classId, at }  child workspace
 * Both ride on the site's existing express-session (Postgres-backed,
 * httpOnly, secure in production). Expiry is enforced here per audience.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { randomBytes, createHash } from "node:crypto";
import { aikConfig, isAiConfigured, isContentSafetyConfigured, isImageConfigured, isTtsConfigured, isGoogleConfigured, capabilitySummary } from "./config";
import { sendVerification, sendReset } from "./mail";
import { speak } from "./ai";
import * as store from "./store";
import { hashPassword, verifyPassword } from "../auth";
import { logger } from "../lib/logger";
import { publicModes, getMode } from "./modes";
import { runRequest, subscribe, publish, toPublicRequest, toChildRequest, toPublicClass } from "./pipeline";
import { KID_MESSAGES } from "./safety";

declare module "express-session" {
  interface SessionData {
    aikFacilitator?: { id: number; at: number };
    aikChild?: { id: number; classId: number; at: number };
  }
}

const AVATARS = ["🦊", "🐼", "🐸", "🦄", "🐙", "🦖", "🐧", "🦋", "🐯", "🐢", "🦜", "🐨", "🦁", "🐰", "🐳", "🦔", "🐝", "🦩", "🐲", "🤖"];

/* ------------------------------------------------------------------ *
 * Tiny in-memory rate limiter (per key, sliding minute)
 * ------------------------------------------------------------------ */
const buckets = new Map<string, number[]>();
function allow(key: string, perMinute: number): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < 60_000);
  if (arr.length >= perMinute) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of buckets) {
    const kept = arr.filter((t) => now - t < 60_000);
    if (kept.length) buckets.set(k, kept);
    else buckets.delete(k);
  }
}, 60_000).unref();

function ip(req: Request): string {
  return (req.ip || req.socket.remoteAddress || "unknown").toString();
}

/* ------------------------------------------------------------------ *
 * Auth middleware
 * ------------------------------------------------------------------ */

type FReq = Request & { facilitator: store.Facilitator };
type CReq = Request & { child: store.ChildRow; klass: store.ClassRow };

async function requireFacilitator(req: Request, res: Response, next: NextFunction) {
  const s = req.session.aikFacilitator;
  if (!s || Date.now() - s.at > aikConfig.facilitatorSessionMinutes * 60_000) {
    delete req.session.aikFacilitator;
    return void res.status(401).json({ error: "Please sign in." });
  }
  const f = await store.getFacilitator(s.id);
  if (!f) return void res.status(401).json({ error: "Please sign in." });
  s.at = Date.now();
  (req as FReq).facilitator = f;
  next();
}

/**
 * Anything that touches a class, a child or consent. Signing up does not get
 * you here — an admin has to grant the facilitator role first.
 */
async function requireRunClasses(req: Request, res: Response, next: NextFunction) {
  await requireFacilitator(req, res, () => {
    const f = (req as FReq).facilitator;
    if (!store.canRunClasses(f)) {
      return void res.status(403).json({
        error: "Your account can use the Hub tools, but running a class needs facilitator access. Ask a Humanity + AI admin to grant it.",
      });
    }
    next();
  });
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireFacilitator(req, res, () => {
    if (!store.isAdminRole((req as FReq).facilitator)) return void res.status(403).json({ error: "Admins only." });
    next();
  });
}

async function requireChild(req: Request, res: Response, next: NextFunction) {
  const s = req.session.aikChild;
  if (!s || Date.now() - s.at > aikConfig.childSessionMinutes * 60_000) {
    delete req.session.aikChild;
    return void res.status(401).json({ error: "Time to sign in again!" });
  }
  const child = await store.getChild(s.id);
  const klass = child ? await store.getClass(child.class_id) : null;
  if (!child || !klass || child.class_id !== s.classId || !child.consent_recorded || child.pin_locked) {
    delete req.session.aikChild;
    return void res.status(401).json({ error: "Time to sign in again!" });
  }
  (req as CReq).child = child;
  (req as CReq).klass = klass;
  next();
}

/** A facilitator may act on a class only if they own it (admins: any class). */
async function ownedClass(req: Request, res: Response): Promise<store.ClassRow | null> {
  const id = Number(req.params.id);
  const klass = Number.isInteger(id) ? await store.getClass(id) : null;
  const f = (req as FReq).facilitator;
  if (!klass || (klass.facilitator_id !== f.id && !f.is_admin)) {
    res.status(404).json({ error: "Class not found." });
    return null;
  }
  return klass;
}

const wrap = (fn: (req: Request, res: Response) => Promise<any>) => (req: Request, res: Response) =>
  fn(req, res).catch((err) => {
    logger.error({ err, url: req.originalUrl }, "[aik] route error");
    if (!res.headersSent) res.status(500).json({ error: "Something went wrong." });
  });

/* ------------------------------------------------------------------ *
 * Bootstrap
 * ------------------------------------------------------------------ */

/**
 * AIK_BOOTSTRAP_FACILITATOR = "email:password".
 *
 * Creates that facilitator when they do not exist, and **resets their
 * password when they do**. The reset matters because the password is set
 * through a shell, where a stray `$`, `!` or quote silently changes it — and
 * without a reset the account is then unreachable forever.
 *
 * This makes the variable a standing password reset for as long as it is set,
 * which is why it is logged loudly and must be removed after first sign-in.
 */
async function bootstrap(): Promise<void> {
  await store.ensureTables();
  const raw = aikConfig.bootstrapFacilitator;
  const idx = raw.indexOf(":");
  const email = idx === -1 ? "" : raw.slice(0, idx).trim();
  const password = idx === -1 ? "" : raw.slice(idx + 1);
  if (email && password) {
    const existing = await store.getFacilitatorByEmail(email);
    if (existing) {
      await store.updateFacilitatorPassword(existing.id, await hashPassword(password));
      logger.warn({ email }, "[aik] bootstrap facilitator password RESET — remove AIK_BOOTSTRAP_FACILITATOR now");
    } else {
      await store.createFacilitator(email, await hashPassword(password), "Facilitator", true);
      logger.info({ email }, "[aik] bootstrap facilitator created");
    }
  }
  logger.info(capabilitySummary(), "[aik] Kids AI Studio API mounted at /api/aik");
}

/* ------------------------------------------------------------------ *
 * Routes
 * ------------------------------------------------------------------ */

export function registerAikRoutes(app: Express): void {
  if (!aikConfig.enabled) {
    logger.info("[aik] AIK_ENABLED is not true — Kids AI Studio API not mounted");
    return;
  }
  bootstrap().catch((err) => logger.error({ err }, "[aik] bootstrap failed"));

  const base = "/api/aik";

  // Public: feature status + mode definitions for the forms.
  app.get(`${base}/config`, (_req, res) => {
    res.json({
      enabled: true,
      aiReady: isAiConfigured(),
      imagesReady: isImageConfigured(),
      ttsReady: isTtsConfigured(),
      capabilities: capabilitySummary(),
      screeningReady: isContentSafetyConfigured() || !aikConfig.contentSafety.required,
      modes: publicModes(),
      avatars: AVATARS,
      googleReady: isGoogleConfigured(),
      signupsOpen: aikConfig.signupsOpen,
      maxFieldChars: aikConfig.maxFieldChars,
      maxChatChars: aikConfig.maxChatChars,
    });
  });


  /* ================================================================== *
   * Accounts — sign up, confirm, reset, Google
   *
   * Signing up gets you a MEMBER account: your own Hub workspace and
   * projects, and nothing else. No class, no child, no other person's work
   * is reachable. Children's records are behind the facilitator role, which
   * only an admin grants. That split is the whole safety story here.
   *
   * Two habits worth keeping: no endpoint reveals whether an address has an
   * account, and tokens are stored only as SHA-256 hashes.
   * ================================================================== */

  function tokenPair(): { token: string; hash: string } {
    const token = randomBytes(32).toString("base64url");
    return { token, hash: createHash("sha256").update(token).digest("hex") };
  }

  const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

  app.post(
    `${base}/auth/signup`,
    wrap(async (req, res) => {
      if (!aikConfig.signupsOpen) return void res.status(403).json({ error: "New accounts are closed right now." });
      if (!allow(`signup:${ip(req)}`, aikConfig.signupsPerHourPerIp)) return void res.status(429).json({ error: "Too many sign-ups from here. Try again later." });
      const body = z
        .object({
          email: z.string().email().max(200),
          password: z.string().min(10).max(200),
          displayName: z.string().trim().min(2).max(80),
        })
        .safeParse(req.body);
      if (!body.success) {
        return void res.status(400).json({ error: "Name, a valid email and a password of at least 10 characters, please." });
      }
      const email = body.data.email.toLowerCase().trim();
      const existing = await store.getFacilitatorByEmail(email);

      if (existing) {
        // Never confirm that an address is taken. If it is genuinely theirs
        // and unconfirmed, quietly re-send the confirmation.
        if (!existing.email_verified) {
          const { token, hash } = tokenPair();
          await store.createToken(existing.id, "verify", hash, aikConfig.verifyTokenMinutes);
          await sendVerification(existing.email, existing.display_name, token);
        }
        return void res.json({ ok: true, check: "email" });
      }

      const account = await store.createFacilitator(email, await hashPassword(body.data.password), body.data.displayName, false, {
        role: "member",
        emailVerified: false,
      });
      const { token, hash } = tokenPair();
      await store.createToken(account.id, "verify", hash, aikConfig.verifyTokenMinutes);
      await sendVerification(account.email, account.display_name, token);
      await store.audit(null, "system", account.id, "account_signup", { email });
      res.json({ ok: true, check: "email" });
    }),
  );

  app.post(
    `${base}/auth/verify`,
    wrap(async (req, res) => {
      const token = String(req.body?.token ?? "");
      if (!token) return void res.status(400).json({ error: "Missing token." });
      const account = await store.consumeToken("verify", hashToken(token));
      if (!account) return void res.status(400).json({ error: "That link has expired or was already used. Ask for a new one." });
      await store.markEmailVerified(account.id);
      delete req.session.aikChild;
      req.session.aikFacilitator = { id: account.id, at: Date.now() };
      await store.audit(null, "facilitator", account.id, "email_verified");
      res.json({ facilitator: publicFacilitator({ ...account, email_verified: true }) });
    }),
  );

  app.post(
    `${base}/auth/forgot`,
    wrap(async (req, res) => {
      if (!allow(`forgot:${ip(req)}`, 5)) return void res.status(429).json({ error: "Too many requests. Wait a minute." });
      const body = z.object({ email: z.string().email().max(200) }).safeParse(req.body);
      // Same answer whether or not the account exists.
      if (body.success) {
        const account = await store.getFacilitatorByEmail(body.data.email);
        if (account) {
          const { token, hash } = tokenPair();
          await store.createToken(account.id, "reset", hash, aikConfig.resetTokenMinutes);
          await sendReset(account.email, account.display_name, token);
          await store.audit(null, "system", account.id, "password_reset_requested", { ip: ip(req) });
        }
      }
      res.json({ ok: true });
    }),
  );

  app.post(
    `${base}/auth/reset`,
    wrap(async (req, res) => {
      const body = z.object({ token: z.string().min(1), password: z.string().min(10).max(200) }).safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Pick a password of at least 10 characters." });
      const account = await store.consumeToken("reset", hashToken(body.data.token));
      if (!account) return void res.status(400).json({ error: "That link has expired or was already used. Ask for a new one." });
      await store.updateFacilitatorPassword(account.id, await hashPassword(body.data.password));
      // A successful reset proves control of the inbox.
      if (!account.email_verified) await store.markEmailVerified(account.id);
      delete req.session.aikChild;
      req.session.aikFacilitator = { id: account.id, at: Date.now() };
      await store.audit(null, "facilitator", account.id, "password_reset_completed");
      res.json({ facilitator: publicFacilitator({ ...account, email_verified: true }) });
    }),
  );

  /* ---------------- Sign in with Google ---------------- */

  app.get(
    `${base}/auth/google/start`,
    wrap(async (req, res) => {
      if (!isGoogleConfigured()) return void res.status(503).send("Google sign-in isn't configured.");
      const state = randomBytes(16).toString("base64url");
      (req.session as any).aikOauthState = state;
      const params = new URLSearchParams({
        client_id: aikConfig.google.clientId,
        redirect_uri: `${aikConfig.publicUrl}/api/aik/auth/google/callback`,
        response_type: "code",
        scope: "openid email profile",
        state,
        prompt: "select_account",
      });
      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    }),
  );

  app.get(
    `${base}/auth/google/callback`,
    wrap(async (req, res) => {
      const fail = (why: string) => res.redirect(`/aiforkids/hub?error=${encodeURIComponent(why)}`);
      if (!isGoogleConfigured()) return void fail("Google sign-in isn't configured.");
      const expected = (req.session as any).aikOauthState;
      delete (req.session as any).aikOauthState;
      if (!expected || req.query.state !== expected) return void fail("That sign-in attempt expired. Try again.");
      const code = String(req.query.code ?? "");
      if (!code) return void fail("Google didn't return a sign-in code.");

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: aikConfig.google.clientId,
          client_secret: aikConfig.google.clientSecret,
          redirect_uri: `${aikConfig.publicUrl}/api/aik/auth/google/callback`,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) {
        logger.error({ status: tokenRes.status }, "[aik] google token exchange failed");
        return void fail("Google sign-in failed. Try again.");
      }
      const tokens: any = await tokenRes.json();
      // The id_token came straight from Google over TLS in exchange for our
      // client secret, so the payload is trustworthy without re-verifying
      // the signature.
      const payloadPart = String(tokens.id_token ?? "").split(".")[1];
      if (!payloadPart) return void fail("Google sign-in failed. Try again.");
      let claims: any;
      try {
        claims = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
      } catch {
        return void fail("Google sign-in failed. Try again.");
      }
      const sub = String(claims.sub ?? "");
      const email = String(claims.email ?? "").toLowerCase().trim();
      const emailVerified = claims.email_verified === true || claims.email_verified === "true";
      const name = String(claims.name ?? "").trim() || email.split("@")[0];
      if (!sub || !email) return void fail("Google didn't share an email address.");
      if (!emailVerified) return void fail("That Google account has an unconfirmed email address.");

      let account = await store.getFacilitatorByGoogleSub(sub);
      if (!account) {
        const byEmail = await store.getFacilitatorByEmail(email);
        if (byEmail) {
          // Same person arriving by a different door: link, don't duplicate.
          await store.linkGoogleSub(byEmail.id, sub);
          account = { ...byEmail, google_sub: sub, email_verified: true };
        } else {
          if (!aikConfig.signupsOpen) return void fail("New accounts are closed right now.");
          account = await store.createFacilitator(email, "", name, false, { role: "member", emailVerified: true, googleSub: sub });
          await store.audit(null, "system", account.id, "account_signup", { email, via: "google" });
        }
      }
      delete req.session.aikChild;
      req.session.aikFacilitator = { id: account.id, at: Date.now() };
      await store.audit(null, "facilitator", account.id, "login", { via: "google" });
      res.redirect("/aiforkids/hub");
    }),
  );

  /* ---------------- Admin: who is in, and what they may do ---------------- */

  app.get(
    `${base}/admin/accounts`,
    requireAdmin,
    wrap(async (_req, res) => {
      const accounts = await store.listAccounts();
      res.json({ accounts: accounts.map(publicFacilitator) });
    }),
  );

  app.patch(
    `${base}/admin/accounts/:id`,
    requireAdmin,
    wrap(async (req, res) => {
      const me = (req as FReq).facilitator;
      const id = Number(req.params.id);
      const body = z.object({ role: z.enum(["member", "facilitator", "admin"]) }).safeParse(req.body);
      if (!body.success || !Number.isInteger(id)) return void res.status(400).json({ error: "Pick a role." });
      if (id === me.id && body.data.role !== "admin") {
        return void res.status(400).json({ error: "Don't remove your own admin access — you'd lock yourself out." });
      }
      const updated = await store.setRole(id, body.data.role);
      if (!updated) return void res.status(404).json({ error: "No such account." });
      await store.audit(null, "facilitator", me.id, "role_changed", { target: id, role: body.data.role });
      res.json({ account: publicFacilitator(updated) });
    }),
  );

  /* ---------------- Facilitator: auth ---------------- */

  app.post(
    `${base}/facilitator/login`,
    wrap(async (req, res) => {
      if (!allow(`flogin:${ip(req)}`, aikConfig.loginAttemptsPerMinute)) return void res.status(429).json({ error: "Too many attempts. Wait a minute." });
      const body = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) }).safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Email and password are required." });
      const f = await store.getFacilitatorByEmail(body.data.email);
      if (!f || !f.password_hash || !(await verifyPassword(body.data.password, f.password_hash))) {
        await store.audit(null, "system", null, "facilitator_login_failed", { email: body.data.email.toLowerCase(), ip: ip(req) });
        return void res.status(401).json({ error: "That email or password isn't right." });
      }
      if (!f.email_verified) {
        return void res.status(403).json({ error: "Check your email and click the link to confirm your address first.", needsVerification: true });
      }
      delete req.session.aikChild;
      req.session.aikFacilitator = { id: f.id, at: Date.now() };
      await store.audit(null, "facilitator", f.id, "login");
      res.json({ facilitator: publicFacilitator(f) });
    }),
  );

  app.post(`${base}/facilitator/logout`, (req, res) => {
    delete req.session.aikFacilitator;
    res.json({ ok: true });
  });

  app.get(`${base}/facilitator/me`, requireFacilitator, (req, res) => {
    res.json({ facilitator: publicFacilitator((req as FReq).facilitator) });
  });

  app.post(
    `${base}/facilitator/password`,
    requireFacilitator,
    wrap(async (req, res) => {
      const f = (req as FReq).facilitator;
      const body = z.object({ current: z.string().min(1), next: z.string().min(12).max(200) }).safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "New password must be at least 12 characters." });
      if (!(await verifyPassword(body.data.current, f.password_hash))) return void res.status(401).json({ error: "Current password isn't right." });
      await store.updateFacilitatorPassword(f.id, await hashPassword(body.data.next));
      await store.audit(null, "facilitator", f.id, "password_changed");
      res.json({ ok: true });
    }),
  );

  // Admin: add another facilitator.
  app.post(
    `${base}/facilitator/facilitators`,
    requireAdmin,
    wrap(async (req, res) => {
      const f = (req as FReq).facilitator;
      if (!f.is_admin) return void res.status(403).json({ error: "Admins only." });
      const body = z.object({ email: z.string().email().max(200), password: z.string().min(12).max(200), displayName: z.string().min(1).max(80), isAdmin: z.boolean().optional() }).safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Email, display name and a 12+ character password are required." });
      if (await store.getFacilitatorByEmail(body.data.email)) return void res.status(409).json({ error: "That email already has an account." });
      const created = await store.createFacilitator(body.data.email, await hashPassword(body.data.password), body.data.displayName, Boolean(body.data.isAdmin));
      await store.audit(null, "facilitator", f.id, "facilitator_created", { id: created.id, email: created.email });
      res.json({ facilitator: publicFacilitator(created) });
    }),
  );

  /* ---------------- Facilitator: classes ---------------- */

  app.get(
    `${base}/facilitator/classes`,
    requireRunClasses,
    wrap(async (req, res) => {
      const f = (req as FReq).facilitator;
      const classes = await store.listClasses(f.id, f.is_admin);
      res.json({ classes: classes.map(toPublicClass) });
    }),
  );

  app.post(
    `${base}/facilitator/classes`,
    requireRunClasses,
    wrap(async (req, res) => {
      const f = (req as FReq).facilitator;
      const body = z.object({ name: z.string().min(1).max(80) }).safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Give the class a name." });
      const klass = await store.createClass(f.id, body.data.name.trim(), aikConfig.defaultTicketLimit);
      await store.audit(klass.id, "facilitator", f.id, "class_created", { name: klass.name });
      res.json({ class: toPublicClass(klass) });
    }),
  );

  app.get(
    `${base}/facilitator/classes/:id`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      const [children, requests, approvals] = await Promise.all([
        store.listChildren(klass.id),
        store.listRecentRequestsForClass(klass.id),
        store.listPendingApprovals(klass.id),
      ]);
      const ticketCounts: Record<number, number> = {};
      const chatCounts: Record<number, number> = {};
      for (const c of children) {
        ticketCounts[c.id] = await store.countTicketsThisSession(c.id, klass.id);
        chatCounts[c.id] = await store.countChatTurnsThisSession(c.id, klass.id);
      }
      res.json({
        class: toPublicClass(klass),
        children: children.map((c) => publicChild(c, ticketCounts[c.id] ?? 0, chatCounts[c.id] ?? 0)),
        requests: requests.map(toPublicRequest),
        approvals,
      });
    }),
  );

  app.patch(
    `${base}/facilitator/classes/:id`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      const body = z
        .object({
          name: z.string().min(1).max(80).optional(),
          modes: z.array(z.enum(["game", "story", "prompt", "music", "quest", "video", "robot", "homework"])).optional(),
          ticketLimit: z.number().int().min(0).max(20).optional(),
          chatTurnLimit: z.number().int().min(0).max(60).optional(),
          paused: z.boolean().optional(),
          locked: z.boolean().optional(),
          soundEnabled: z.boolean().optional(),
        })
        .safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Invalid settings." });
      const patch: any = {};
      if (body.data.name !== undefined) patch.name = body.data.name.trim();
      if (body.data.modes !== undefined) patch.modes = body.data.modes.join(",");
      if (body.data.ticketLimit !== undefined) patch.ticket_limit = body.data.ticketLimit;
      if (body.data.chatTurnLimit !== undefined) patch.chat_turn_limit = body.data.chatTurnLimit;
      if (body.data.paused !== undefined) patch.paused = body.data.paused;
      if (body.data.locked !== undefined) patch.locked = body.data.locked;
      if (body.data.soundEnabled !== undefined) patch.sound_enabled = body.data.soundEnabled;
      const updated = await store.updateClass(klass.id, patch);
      if (!updated) return void res.status(404).json({ error: "Class not found." });
      await store.audit(klass.id, "facilitator", (req as FReq).facilitator.id, "class_updated", body.data);
      publish(klass.id, { type: "class", klass: toPublicClass(updated) });
      res.json({ class: toPublicClass(updated) });
    }),
  );

  app.post(
    `${base}/facilitator/classes/:id/new-session`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      const updated = await store.startNewSession(klass.id);
      await store.audit(klass.id, "facilitator", (req as FReq).facilitator.id, "session_started");
      if (updated) publish(klass.id, { type: "class", klass: toPublicClass(updated) });
      res.json({ class: updated ? toPublicClass(updated) : null });
    }),
  );

  app.post(
    `${base}/facilitator/classes/:id/rotate-code`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      const updated = await store.rotateClassCode(klass.id);
      await store.audit(klass.id, "facilitator", (req as FReq).facilitator.id, "code_rotated");
      res.json({ class: updated ? toPublicClass(updated) : null });
    }),
  );

  app.get(
    `${base}/facilitator/classes/:id/export`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      const data = await store.exportClass(klass.id);
      await store.audit(klass.id, "facilitator", (req as FReq).facilitator.id, "class_exported");
      res.setHeader("Content-Disposition", `attachment; filename="aik-class-${klass.id}-export.json"`);
      res.json(data);
    }),
  );

  app.delete(
    `${base}/facilitator/classes/:id`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      const body = z.object({ confirmName: z.string() }).safeParse(req.body);
      if (!body.success || body.data.confirmName.trim() !== klass.name) return void res.status(400).json({ error: "Type the class name exactly to confirm deletion." });
      await store.audit(null, "facilitator", (req as FReq).facilitator.id, "class_deleted", { classId: klass.id, name: klass.name });
      await store.deleteClass(klass.id);
      res.json({ ok: true });
    }),
  );

  /* ---------------- Facilitator: children ---------------- */

  app.post(
    `${base}/facilitator/classes/:id/children`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      const body = z
        .object({
          nickname: z.string().min(2).max(20).regex(/^[A-Za-z0-9 _-]+$/, "Letters and numbers only"),
          avatar: z.string().min(1).max(4),
          pin: z.string().regex(/^\d{4}$/, "4 digits"),
          consentRecorded: z.boolean().optional(),
        })
        .safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Nickname (letters/numbers), an avatar and a 4-digit PIN are required." });
      if (!AVATARS.includes(body.data.avatar)) return void res.status(400).json({ error: "Pick an avatar from the list." });
      const existing = await store.listChildren(klass.id);
      if (existing.some((c) => c.nickname.toLowerCase() === body.data.nickname.trim().toLowerCase())) return void res.status(409).json({ error: "That nickname is already in this class." });
      let child = await store.createChild(klass.id, body.data.nickname.trim(), body.data.avatar, await hashPassword(body.data.pin));
      if (body.data.consentRecorded) child = (await store.updateChild(child.id, { consent_recorded: true, consent_recorded_by: (req as FReq).facilitator.id })) ?? child;
      await store.audit(klass.id, "facilitator", (req as FReq).facilitator.id, "child_created", { childId: child.id, consent: child.consent_recorded });
      res.json({ child: publicChild(child, 0) });
    }),
  );

  app.patch(
    `${base}/facilitator/classes/:id/children/:cid`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      const child = await store.getChild(Number(req.params.cid));
      if (!child || child.class_id !== klass.id) return void res.status(404).json({ error: "Child not found." });
      const body = z
        .object({
          nickname: z.string().min(2).max(20).regex(/^[A-Za-z0-9 _-]+$/).optional(),
          avatar: z.string().min(1).max(4).optional(),
          pin: z.string().regex(/^\d{4}$/).optional(),
          consentRecorded: z.boolean().optional(),
          muted: z.boolean().optional(),
          unlock: z.boolean().optional(),
        })
        .safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Invalid update." });
      const patch: any = {};
      if (body.data.nickname) patch.nickname = body.data.nickname.trim();
      if (body.data.avatar) {
        if (!AVATARS.includes(body.data.avatar)) return void res.status(400).json({ error: "Pick an avatar from the list." });
        patch.avatar = body.data.avatar;
      }
      if (body.data.pin) {
        patch.pin_hash = await hashPassword(body.data.pin);
        patch.pin_attempts = 0;
        patch.pin_locked = false;
      }
      if (body.data.consentRecorded !== undefined) {
        patch.consent_recorded = body.data.consentRecorded;
        patch.consent_recorded_by = body.data.consentRecorded ? (req as FReq).facilitator.id : null;
      }
      if (body.data.muted !== undefined) patch.muted = body.data.muted;
      if (body.data.unlock) {
        patch.pin_attempts = 0;
        patch.pin_locked = false;
      }
      const updated = await store.updateChild(child.id, patch);
      await store.audit(klass.id, "facilitator", (req as FReq).facilitator.id, "child_updated", { childId: child.id, fields: Object.keys(body.data) });
      res.json({ child: publicChild(updated ?? child, await store.countTicketsThisSession(child.id, klass.id)) });
    }),
  );

  app.delete(
    `${base}/facilitator/classes/:id/children/:cid`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      const child = await store.getChild(Number(req.params.cid));
      if (!child || child.class_id !== klass.id) return void res.status(404).json({ error: "Child not found." });
      await store.deleteChild(child.id);
      await store.audit(klass.id, "facilitator", (req as FReq).facilitator.id, "child_deleted", { childId: child.id });
      res.json({ ok: true });
    }),
  );

  /* ---------------- Facilitator: live feed, approvals, projector ---------------- */

  app.get(
    `${base}/facilitator/classes/:id/feed`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      const send = (ev: any) => res.write(`data: ${JSON.stringify(ev)}\n\n`);
      send({ type: "ping" });
      const unsub = subscribe(klass.id, send);
      const ping = setInterval(() => send({ type: "ping" }), 25_000);
      req.on("close", () => {
        clearInterval(ping);
        unsub();
      });
    }),
  );

  app.get(
    `${base}/facilitator/classes/:id/requests`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      const after = Number(req.query.after ?? 0) || 0;
      const requests = await store.listRequestsForClass(klass.id, after);
      res.json({ requests: requests.map(toPublicRequest) });
    }),
  );

  app.post(
    `${base}/facilitator/artifacts/:aid/approve`,
    requireRunClasses,
    wrap(async (req, res) => {
      const a = await store.getArtifact(Number(req.params.aid));
      if (!a) return void res.status(404).json({ error: "Not found." });
      const klass = await store.getClass(a.class_id);
      const f = (req as FReq).facilitator;
      if (!klass || (klass.facilitator_id !== f.id && !f.is_admin)) return void res.status(404).json({ error: "Not found." });
      const approve = Boolean(req.body?.approve);
      if (approve) await store.setArtifactApproved(a.id, true);
      else {
        // Rejected images are removed entirely; the child sees "your facilitator picked a different idea".
        await store.setArtifactApproved(a.id, false);
        await store.setArtifactPublished(a.id, false);
      }
      await store.audit(a.class_id, "facilitator", f.id, approve ? "artifact_approved" : "artifact_rejected", { artifactId: a.id });
      const { content, ...meta } = { ...a, approved: approve };
      publish(a.class_id, { type: "approval", artifact: meta });
      res.json({ ok: true });
    }),
  );

  // Projector mode: the facilitator runs any mode from the front of the room, no child account.
  app.post(
    `${base}/facilitator/classes/:id/projector`,
    requireRunClasses,
    wrap(async (req, res) => {
      const klass = await ownedClass(req, res);
      if (!klass) return;
      const body = z.object({ mode: z.enum(["game", "story", "prompt", "music", "quest", "video", "robot", "homework"]), kind: z.enum(["create", "change", "chat"]), projectArtifactId: z.number().int().optional(), input: z.record(z.any()) }).safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Invalid order." });
      const request = await store.createRequest({ classId: klass.id, childId: null, mode: body.data.mode, kind: body.data.kind, projectArtifactId: body.data.projectArtifactId ?? null, input: body.data.input });
      publish(klass.id, { type: "request", request: toPublicRequest(request) });
      void runRequest(request.id);
      res.json({ request: toPublicRequest(request) });
    }),
  );

  app.get(
    `${base}/facilitator/requests/:rid`,
    requireRunClasses,
    wrap(async (req, res) => {
      const r = await store.getRequest(Number(req.params.rid));
      const klass = r ? await store.getClass(r.class_id) : null;
      const f = (req as FReq).facilitator;
      if (!r || !klass || (klass.facilitator_id !== f.id && !f.is_admin)) return void res.status(404).json({ error: "Not found." });
      res.json({ request: toPublicRequest(r) });
    }),
  );

  /* ---------------- Child: sign-in ---------------- */

  // Step 1: class code → roster (nicknames + avatars only). Only consented, unlocked children are listed.
  app.post(
    `${base}/child/class`,
    wrap(async (req, res) => {
      if (!allow(`ccode:${ip(req)}`, aikConfig.loginAttemptsPerMinute)) return void res.status(429).json({ error: "Slow down a little and try again." });
      const code = store.normalizeCode(String(req.body?.code ?? ""));
      const klass = code.length === 6 ? await store.getClassByCode(code) : null;
      if (!klass) return void res.status(404).json({ error: "That class code isn't right. Check the board!" });
      const children = (await store.listChildren(klass.id)).filter((c) => c.consent_recorded && !c.pin_locked);
      res.json({ className: klass.name, children: children.map((c) => ({ id: c.id, nickname: c.nickname, avatar: c.avatar })) });
    }),
  );

  // Step 2: pick yourself, type PIN.
  app.post(
    `${base}/child/login`,
    wrap(async (req, res) => {
      if (!allow(`clogin:${ip(req)}`, aikConfig.loginAttemptsPerMinute)) return void res.status(429).json({ error: "Slow down a little and try again." });
      const body = z.object({ code: z.string(), childId: z.number().int(), pin: z.string().regex(/^\d{4}$/) }).safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Type your 4-digit PIN." });
      const klass = await store.getClassByCode(body.data.code);
      const child = await store.getChild(body.data.childId);
      if (!klass || !child || child.class_id !== klass.id) return void res.status(404).json({ error: "Hmm, that didn't match. Ask your facilitator." });
      if (!child.consent_recorded) return void res.status(403).json({ error: "Your account isn't unlocked yet. Ask your facilitator." });
      if (child.pin_locked) return void res.status(423).json({ error: "Your PIN is locked. Ask your facilitator to reset it." });
      if (!(await verifyPassword(body.data.pin, child.pin_hash))) {
        const attempts = child.pin_attempts + 1;
        const locked = attempts >= aikConfig.maxPinAttempts;
        await store.updateChild(child.id, { pin_attempts: attempts, pin_locked: locked });
        await store.audit(klass.id, "child", child.id, "pin_failed", { attempts, locked });
        return void res.status(401).json({ error: locked ? "Your PIN is locked. Ask your facilitator to reset it." : `That PIN isn't right. ${aikConfig.maxPinAttempts - attempts} tries left.` });
      }
      await store.updateChild(child.id, { pin_attempts: 0 });
      delete req.session.aikFacilitator;
      req.session.aikChild = { id: child.id, classId: klass.id, at: Date.now() };
      await store.audit(klass.id, "child", child.id, "login");
      res.json({ ok: true });
    }),
  );

  app.post(`${base}/child/logout`, (req, res) => {
    delete req.session.aikChild;
    res.json({ ok: true });
  });

  /* ---------------- Child: workspace ---------------- */

  app.get(
    `${base}/child/me`,
    requireChild,
    wrap(async (req, res) => {
      const { child, klass } = req as CReq;
      const [tickets, chatTurns, requests, portfolio] = await Promise.all([
        store.countTicketsThisSession(child.id, klass.id),
        store.countChatTurnsThisSession(child.id, klass.id),
        store.listRequestsForChild(child.id),
        store.listPortfolio(child.id),
      ]);
      res.json({
        child: { id: child.id, nickname: child.nickname, avatar: child.avatar, muted: child.muted },
        class: { id: klass.id, name: klass.name, modes: store.parseModes(klass.modes), paused: klass.paused, locked: klass.locked, ticketLimit: klass.ticket_limit, chatTurnLimit: klass.chat_turn_limit },
        ticketsUsed: tickets,
        chatTurnsUsed: chatTurns,
        requests: requests.map(toChildRequest),
        portfolio: portfolio.filter((a) => a.approved),
        sessionExpiresAt: (req.session.aikChild?.at ?? Date.now()) + aikConfig.childSessionMinutes * 60_000,
      });
    }),
  );

  app.post(
    `${base}/child/requests`,
    requireChild,
    wrap(async (req, res) => {
      const { child, klass } = req as CReq;
      if (!allow(`creq:${child.id}`, aikConfig.childRequestsPerMinute)) return void res.status(429).json({ error: "Whoa, fast fingers! Wait a moment and try again." });
      const body = z.object({ mode: z.enum(["game", "story", "prompt", "music", "quest", "video", "robot", "homework"]), kind: z.enum(["create", "change", "chat"]), projectArtifactId: z.number().int().optional(), input: z.record(z.any()) }).safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "That order didn't look right." });

      if (klass.paused) return void res.status(423).json({ error: KID_MESSAGES.paused });
      if (klass.locked) return void res.status(423).json({ error: "Your portfolio is locked for the Expo. Nice work!" });
      if (child.muted) return void res.status(423).json({ error: "Your facilitator paused your orders. Look up front!" });
      if (!store.parseModes(klass.modes).includes(body.data.mode) || !getMode(body.data.mode)) return void res.status(423).json({ error: "That mode isn't unlocked today." });
      const mode = getMode(body.data.mode)!;
      let used: number;
      if (body.data.kind === "chat") {
        if (mode.interaction === "form") return void res.status(400).json({ error: "This module doesn't have a chat helper." });
        used = await store.countChatTurnsThisSession(child.id, klass.id);
        if (used >= klass.chat_turn_limit) return void res.status(429).json({ error: "You've used all your helper chats for today. Try making something!" });
      } else {
        if (mode.interaction === "chat") return void res.status(400).json({ error: "This module is chat only." });
        used = await store.countTicketsThisSession(child.id, klass.id);
        if (used >= klass.ticket_limit) return void res.status(429).json({ error: KID_MESSAGES.tickets });
      }
      if (body.data.kind === "change" || (body.data.kind === "chat" && body.data.projectArtifactId)) {
        const a = body.data.projectArtifactId ? await store.getArtifact(body.data.projectArtifactId) : null;
        if (!a || a.child_id !== child.id) return void res.status(404).json({ error: "Pick one of your own projects." });
      }

      // Keep only known fields; the pipeline validates values.
      const input: Record<string, string> = {};
      if (body.data.kind === "change") input.change = String(body.data.input.change ?? "").slice(0, aikConfig.maxFieldChars);
      else if (body.data.kind === "chat") input.message = String(body.data.input.message ?? "").slice(0, aikConfig.maxChatChars);
      else for (const f of mode.createFields) if (body.data.input[f.key] !== undefined) input[f.key] = String(body.data.input[f.key]).slice(0, f.maxChars ?? aikConfig.maxFieldChars);

      const request = await store.createRequest({ classId: klass.id, childId: child.id, mode: body.data.mode, kind: body.data.kind, projectArtifactId: body.data.projectArtifactId ?? null, input });
      publish(klass.id, { type: "request", request: toPublicRequest(request) });
      void runRequest(request.id);
      res.json({ request: toChildRequest(request), used: used + 1 });
    }),
  );

  app.get(
    `${base}/child/requests/:rid`,
    requireChild,
    wrap(async (req, res) => {
      const { child } = req as CReq;
      const r = await store.getRequest(Number(req.params.rid));
      if (!r || r.child_id !== child.id) return void res.status(404).json({ error: "Not found." });
      res.json({ request: toChildRequest(r) });
    }),
  );

  app.get(
    `${base}/child/arcade`,
    requireChild,
    wrap(async (req, res) => {
      const { klass } = req as CReq;
      res.json({ items: await store.listArcade(klass.id) });
    }),
  );

  app.post(
    `${base}/child/artifacts/:aid/publish`,
    requireChild,
    wrap(async (req, res) => {
      const { child, klass } = req as CReq;
      const a = await store.getArtifact(Number(req.params.aid));
      if (!a || a.child_id !== child.id) return void res.status(404).json({ error: "Not found." });
      if (!a.approved) return void res.status(423).json({ error: "Waiting for your facilitator." });
      const publishIt = Boolean(req.body?.publish);
      await store.setArtifactPublished(a.id, publishIt);
      await store.audit(klass.id, "child", child.id, publishIt ? "artifact_published" : "artifact_unpublished", { artifactId: a.id });
      res.json({ ok: true });
    }),
  );

  /* ---------------- Read aloud (ElevenLabs TTS of an approved text artifact) ---------------- */

  app.post(
    `${base}/child/artifacts/:aid/speak`,
    requireChild,
    wrap(async (req, res) => {
      const { child } = req as CReq;
      if (!isTtsConfigured()) return void res.status(503).json({ error: "Read-aloud isn't switched on for this class." });
      if (!allow(`tts:${child.id}`, 4)) return void res.status(429).json({ error: "Give the reader a moment to breathe!" });
      const a = await store.getArtifact(Number(req.params.aid));
      if (!a || a.child_id !== child.id || !a.approved) return void res.status(404).json({ error: "Not found." });
      let text = "";
      try {
        const j = JSON.parse(a.content);
        if (a.kind === "story") text = [j.title, ...(j.panels ?? []).map((p: any) => `${p.narration} ${p.dialogue}`)].join(". ");
        else if (a.kind === "quest") text = [j.title, ...(j.items ?? []).map((i: any) => i.text)].join(". ");
        else if (a.kind === "robot") text = [j.name, j.job, ...(j.steps ?? [])].join(". ");
        else if (a.kind === "chat") text = (j.turns ?? []).slice(-1).map((t: any) => t.text).join(" ");
      } catch {
        text = a.summary ?? "";
      }
      if (!text) return void res.status(400).json({ error: "Nothing to read here." });
      const audio = await speak(text);
      await store.audit(a.class_id, "child", child.id, "read_aloud", { artifactId: a.id });
      res.json({ audio: audio.base64, mime: audio.mime });
    }),
  );


  /* ================================================================== *
   * The Hub — /aiforkids/hub
   *
   * One signed-in place where Humanity + AI staff do their own AI work and
   * see every project. It runs on the same screened pipeline as the kids'
   * Studio: a workspace is just a class row with no children, so Content
   * Safety, prompt shields, output screening and the audit log all apply.
   * What differs is the limits — no ticket meter, every module unlocked,
   * and media approved on arrival because the adult here is the approver.
   * ================================================================== */

  /** The facilitator's own workspace, created on first visit. */
  async function workspaceFor(req: Request): Promise<store.ClassRow> {
    const f = (req as FReq).facilitator;
    return store.ensureWorkspace(f.id, f.display_name);
  }

  app.get(
    `${base}/hub`,
    requireFacilitator,
    wrap(async (req, res) => {
      const f = (req as FReq).facilitator;
      const workspace = await workspaceFor(req);
      const [projects, recent, classes] = await Promise.all([
        store.listProjects(f.id),
        store.listWorkspaceArtifacts(workspace.id, null, 24),
        store.listClasses(f.id, f.is_admin),
      ]);
      res.json({
        facilitator: publicFacilitator(f),
        workspaceId: workspace.id,
        capabilities: capabilitySummary(),
        tools: publicModes(),
        projects,
        recent,
        classes: classes.map(toPublicClass),
      });
    }),
  );

  app.post(
    `${base}/hub/projects`,
    requireFacilitator,
    wrap(async (req, res) => {
      const f = (req as FReq).facilitator;
      const body = z
        .object({
          name: z.string().trim().min(1).max(80),
          summary: z.string().trim().max(400).optional(),
          kind: z.enum(["org", "program", "class"]).optional(),
          week: z.number().int().min(1).max(8).nullable().optional(),
        })
        .safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Give the project a name." });
      const workspace = await workspaceFor(req);
      const project = await store.createProject({
        facilitatorId: f.id,
        classId: workspace.id,
        name: body.data.name,
        summary: body.data.summary ?? "",
        kind: body.data.kind ?? "org",
        week: body.data.week ?? null,
      });
      await store.audit(workspace.id, "facilitator", f.id, "project_created", { projectId: project.id, name: project.name });
      res.json({ project });
    }),
  );

  /** A project the signed-in facilitator owns. */
  async function ownedProject(req: Request, res: Response): Promise<store.ProjectRow | null> {
    const f = (req as FReq).facilitator;
    const id = Number(req.params.pid);
    const p = Number.isInteger(id) ? await store.getProject(id) : null;
    if (!p || (p.facilitator_id !== f.id && !f.is_admin)) {
      res.status(404).json({ error: "Project not found." });
      return null;
    }
    return p;
  }

  app.get(
    `${base}/hub/projects/:pid`,
    requireFacilitator,
    wrap(async (req, res) => {
      const p = await ownedProject(req, res);
      if (!p) return;
      const workspace = await workspaceFor(req);
      res.json({ project: p, artifacts: await store.listWorkspaceArtifacts(workspace.id, p.id, 100) });
    }),
  );

  app.patch(
    `${base}/hub/projects/:pid`,
    requireFacilitator,
    wrap(async (req, res) => {
      const p = await ownedProject(req, res);
      if (!p) return;
      const body = z
        .object({
          name: z.string().trim().min(1).max(80).optional(),
          summary: z.string().trim().max(400).optional(),
          archived: z.boolean().optional(),
        })
        .safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "That change didn't look right." });
      res.json({ project: await store.updateProject(p.id, body.data) });
    }),
  );

  app.delete(
    `${base}/hub/projects/:pid`,
    requireFacilitator,
    wrap(async (req, res) => {
      const f = (req as FReq).facilitator;
      const p = await ownedProject(req, res);
      if (!p) return;
      await store.deleteProject(p.id);
      await store.audit(p.class_id, "facilitator", f.id, "project_deleted", { projectId: p.id, name: p.name });
      res.json({ ok: true });
    }),
  );

  /** File a finished piece of work under a project (or clear it). */
  app.patch(
    `${base}/hub/artifacts/:aid/project`,
    requireFacilitator,
    wrap(async (req, res) => {
      const f = (req as FReq).facilitator;
      const workspace = await workspaceFor(req);
      const a = await store.getArtifact(Number(req.params.aid));
      if (!a || a.class_id !== workspace.id) return void res.status(404).json({ error: "Not found." });
      const projectId = req.body?.projectId === null ? null : Number(req.body?.projectId);
      if (projectId !== null) {
        const p = await store.getProject(projectId);
        if (!p || (p.facilitator_id !== f.id && !f.is_admin)) return void res.status(404).json({ error: "Project not found." });
      }
      await store.setArtifactProject(a.id, projectId);
      res.json({ ok: true });
    }),
  );

  /** Run any tool. Same pipeline, same screening, adult-sized limits. */
  app.post(
    `${base}/hub/requests`,
    requireFacilitator,
    wrap(async (req, res) => {
      const f = (req as FReq).facilitator;
      if (!allow(`hreq:${f.id}`, 30)) return void res.status(429).json({ error: "Slow down a moment and try again." });
      const body = z
        .object({
          mode: z.enum(["game", "story", "prompt", "music", "quest", "video", "robot", "homework"]),
          kind: z.enum(["create", "change", "chat"]),
          projectArtifactId: z.number().int().optional(),
          projectId: z.number().int().nullable().optional(),
          quality: z.enum(["fast", "studio"]).optional(),
          input: z.record(z.any()),
        })
        .safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "That request didn't look right." });
      const mode = getMode(body.data.mode);
      if (!mode) return void res.status(400).json({ error: "Unknown tool." });

      const workspace = await workspaceFor(req);
      if (body.data.kind === "change" || (body.data.kind === "chat" && body.data.projectArtifactId)) {
        const a = body.data.projectArtifactId ? await store.getArtifact(body.data.projectArtifactId) : null;
        if (!a || a.class_id !== workspace.id) return void res.status(404).json({ error: "Pick one of your own pieces." });
      }

      const cap = aikConfig.staffFieldChars;
      const input: Record<string, string> = {};
      if (body.data.kind === "change") input.change = String(body.data.input.change ?? "").slice(0, cap);
      else if (body.data.kind === "chat") input.message = String(body.data.input.message ?? "").slice(0, aikConfig.staffChatChars);
      else for (const fd of mode.createFields) if (body.data.input[fd.key] !== undefined) input[fd.key] = String(body.data.input[fd.key]).slice(0, cap);

      const request = await store.createRequest({
        classId: workspace.id,
        childId: null,
        mode: body.data.mode,
        kind: body.data.kind,
        projectArtifactId: body.data.projectArtifactId ?? null,
        input,
        // The Hub defaults to the full pipeline; a change request stays fast
        // so iterating on something you already have remains quick.
        quality: body.data.quality ?? (body.data.kind === "create" ? "studio" : "fast"),
      });
      await store.audit(workspace.id, "facilitator", f.id, "hub_request", { requestId: request.id, mode: body.data.mode, kind: body.data.kind });
      void runRequest(request.id);
      res.json({ request: toPublicRequest(request), projectId: body.data.projectId ?? null });
    }),
  );

  app.get(
    `${base}/hub/requests/:rid`,
    requireFacilitator,
    wrap(async (req, res) => {
      const workspace = await workspaceFor(req);
      const r = await store.getRequest(Number(req.params.rid));
      if (!r || r.class_id !== workspace.id) return void res.status(404).json({ error: "Not found." });
      res.json({ request: toPublicRequest(r) });
    }),
  );

  app.post(
    `${base}/hub/artifacts/:aid/speak`,
    requireFacilitator,
    wrap(async (req, res) => {
      if (!isTtsConfigured()) return void res.status(503).json({ error: "Read-aloud isn't configured." });
      const workspace = await workspaceFor(req);
      const a = await store.getArtifact(Number(req.params.aid));
      if (!a || a.class_id !== workspace.id) return void res.status(404).json({ error: "Not found." });
      const text = a.summary || a.title;
      const audio = await speak(text);
      res.json({ audio: audio.base64, mime: audio.mime });
    }),
  );

  /* ---------------- Artifact content (child in class, or owning facilitator) ---------------- */

  app.get(
    `${base}/artifacts/:aid`,
    wrap(async (req, res) => {
      const a = await store.getArtifact(Number(req.params.aid));
      if (!a) return void res.status(404).json({ error: "Not found." });

      let allowed = false;
      const cs = req.session.aikChild;
      if (cs && Date.now() - cs.at <= aikConfig.childSessionMinutes * 60_000 && cs.classId === a.class_id) {
        allowed = a.child_id === cs.id || (a.published && a.approved);
      }
      const fs = req.session.aikFacilitator;
      if (!allowed && fs) {
        const f = await store.getFacilitator(fs.id);
        const klass = await store.getClass(a.class_id);
        allowed = Boolean(f && klass && (klass.facilitator_id === f.id || f.is_admin));
      }
      if (!allowed) return void res.status(404).json({ error: "Not found." });
      if (!a.approved && !fs) return void res.status(423).json({ error: "Waiting for your facilitator." });

      const { content, ...meta } = a;
      // Games are always delivered as text inside JSON for the sandboxed srcdoc iframe — never as a top-level page.
      res.setHeader("Cache-Control", "private, no-store");
      res.json({ artifact: { ...meta, content } });
    }),
  );
}

/* ------------------------------------------------------------------ *
 * Public shapes
 * ------------------------------------------------------------------ */

function publicFacilitator(f: store.Facilitator) {
  return {
    id: f.id,
    email: f.email,
    displayName: f.display_name,
    isAdmin: store.isAdminRole(f),
    role: f.role,
    emailVerified: f.email_verified,
    canRunClasses: store.canRunClasses(f),
    hasPassword: Boolean(f.password_hash),
    usesGoogle: Boolean(f.google_sub),
    createdAt: f.created_at,
  };
}

function publicChild(c: store.ChildRow, ticketsUsed: number, chatTurnsUsed = 0) {
  return {
    id: c.id,
    nickname: c.nickname,
    avatar: c.avatar,
    consentRecorded: c.consent_recorded,
    consentRecordedAt: c.consent_recorded_at,
    muted: c.muted,
    pinLocked: c.pin_locked,
    ticketsUsed,
    chatTurnsUsed,
    createdAt: c.created_at,
  };
}
