import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { pool } from "./db";
import { storage } from "./storage";
import { sendNewAccountNotification } from "./email";
import {
  insertUserSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type PublicUser,
  type User,
} from "@workspace/db";
import { sendPasswordResetEmail } from "./email";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${derivedKey.toString("hex")}.${salt}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  if (hashedBuf.length !== derivedKey.length) return false;
  return timingSafeEqual(hashedBuf, derivedKey);
}

export function toPublicUser(user: User): PublicUser {
  const { password, ...rest } = user;
  return rest;
}

declare global {
  namespace Express {
    interface User extends PublicUser {}
  }
}

export function setupAuth(app: Express) {
  const PgSession = connectPgSimple(session);

  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  app.set("trust proxy", 1);

  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    }),
  );

  passport.use(
    new LocalStrategy(async (usernameOrEmail, password, done) => {
      try {
        const lookup = usernameOrEmail.trim();
        let user = await storage.getUserByUsername(lookup);
        if (!user && lookup.includes("@")) {
          user = await storage.getUserByEmail(lookup);
        }
        if (!user) return done(null, false, { message: "Invalid credentials" });
        const ok = await verifyPassword(password, user.password);
        if (!ok) return done(null, false, { message: "Invalid credentials" });
        return done(null, toPublicUser(user));
      } catch (err) {
        return done(err as Error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as PublicUser).id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(null, false);
      done(null, toPublicUser(user));
    } catch (err) {
      done(err as Error);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      const existingUsername = await storage.getUserByUsername(parsed.username);
      if (existingUsername) {
        return res.status(409).json({ error: "Username already taken" });
      }
      const existingEmail = parsed.email ? await storage.getUserByEmail(parsed.email) : null;
      if (existingEmail) {
        return res.status(409).json({ error: "An account with that email already exists" });
      }
      const passwordHash = await hashPassword(parsed.password);
      const created = await storage.createUser({
        ...parsed,
        password: passwordHash,
      });
      const publicUser = toPublicUser(created);
      sendNewAccountNotification(
        parsed.username,
        parsed.email || null,
        parsed.fullName || null,
      ).catch((e) => console.error("[email] Account notification error:", e));
      req.login(publicUser, (err) => {
        if (err) return next(err);
        res.status(201).json(publicUser);
      });
    } catch (err: any) {
      if (err?.errors) {
        return res.status(400).json({ error: err.errors[0]?.message || "Invalid input", details: err.errors });
      }
      res.status(400).json({ error: err.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (err: any) {
      return res.status(400).json({ error: err?.errors?.[0]?.message || "Invalid input" });
    }
    passport.authenticate("local", (err: Error | null, user: PublicUser | false, info: { message?: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((destroyErr) => {
        if (destroyErr) return next(destroyErr);
        res.clearCookie("connect.sid");
        res.json({ ok: true });
      });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    res.json(req.user);
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(email.trim().toLowerCase());

      // Always respond success to prevent account enumeration.
      const genericResponse = {
        ok: true,
        message: "If an account exists for that email, a reset link has been sent.",
      };

      if (!user) {
        return res.json(genericResponse);
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await storage.createPasswordResetToken(user.id, token, expiresAt);

      const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
      const host = req.get("host");
      const baseUrl = process.env.APP_URL || `${proto}://${host}`;
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      const result = await sendPasswordResetEmail(user.email || email, user.fullName, resetUrl);
      if (!result.sent) {
        console.warn(`[auth] Reset link generated but email not sent for ${user.email}: ${result.reason}`);
      }

      return res.json(genericResponse);
    } catch (err: any) {
      if (err?.errors) {
        return res.status(400).json({ error: err.errors[0]?.message || "Invalid input" });
      }
      console.error("[auth] forgot-password error:", err);
      return res.status(500).json({ error: "Could not process the request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      const record = await storage.getPasswordResetToken(token);
      if (!record) {
        return res.status(400).json({ error: "This reset link is invalid or has already been used." });
      }
      if (record.usedAt) {
        return res.status(400).json({ error: "This reset link has already been used." });
      }
      if (new Date(record.expiresAt) < new Date()) {
        return res.status(400).json({ error: "This reset link has expired. Please request a new one." });
      }

      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(record.userId, passwordHash);
      await storage.markPasswordResetTokenUsed(record.id);

      return res.json({ ok: true, message: "Password updated successfully." });
    } catch (err: any) {
      if (err?.errors) {
        return res.status(400).json({ error: err.errors[0]?.message || "Invalid input" });
      }
      console.error("[auth] reset-password error:", err);
      return res.status(500).json({ error: "Could not reset the password" });
    }
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if ((req.user as PublicUser).role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
