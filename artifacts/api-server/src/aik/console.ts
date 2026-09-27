/**
 * artifacts/api-server/src/aik/console.ts
 *
 * Fits the real module: imports screenInput/screenOutputText from ./safety,
 * completeText from ./ai, and takes routes.ts's middleware as arguments so
 * there is no circular import.
 *
 * Register from routes.ts, after the middleware functions are defined:
 *
 *   import { registerConsoleRoutes } from "./console";
 *   registerConsoleRoutes(app, base, { requireFacilitator, requireAdmin, requireChild });
 */

import type { Express, Request, Response, NextFunction } from "express";
import { completeText, type ChatTurn } from "./ai";
import { screenInput, screenOutputText } from "./safety";
import { classify, route, assertLegalRoute, providerReport } from "./router";

type Mw = (req: Request, res: Response, next: NextFunction) => any;

/* ---------- model registry (staff picker) ---------- */
type Tier = "frontier" | "balanced" | "fast";
type ModelSpec = { id: string; label: string; blurb: string; tier: Tier; maxTokens: number; outPerMTok: number; roles: string[]; note?: string };

export const MODELS: ModelSpec[] = [
  { id: "claude-opus-5-5", label: "Opus 5.5", blurb: "Deepest reasoning. Curriculum design, safety judgement, long documents.", tier: "frontier", maxTokens: 32000, outPerMTok: 75, roles: ["admin", "facilitator"] },
  { id: "claude-opus-5", label: "Opus 5", blurb: "Previous frontier model.", tier: "frontier", maxTokens: 32000, outPerMTok: 75, roles: ["admin", "facilitator"] },
  { id: "claude-fable-5-1", label: "Fable 5.1", blurb: "Mythos-tier with extra safeguards. Best writing.", tier: "frontier", maxTokens: 32000, outPerMTok: 75, roles: ["admin"], note: "Some queries are rerouted to Opus 5 by Anthropic's safeguards." },
  { id: "claude-sonnet-5", label: "Sonnet 5", blurb: "The default. Session plans, game code, family letters.", tier: "balanced", maxTokens: 16000, outPerMTok: 15, roles: ["admin", "facilitator", "member"] },
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5", blurb: "Fast and cheap.", tier: "fast", maxTokens: 8000, outPerMTok: 5, roles: ["admin", "facilitator", "member"] },
  { id: "gpt-4o", label: "gpt-4o (Azure)", blurb: "In tenant. Used automatically when no Anthropic key is configured.", tier: "balanced", maxTokens: 8000, outPerMTok: 10, roles: ["admin", "facilitator", "member"] },
];
const ANTHROPIC_ON = Boolean(process.env.AIK_ANTHROPIC_API_KEY);
const DEFAULT_MODEL = ANTHROPIC_ON ? process.env.AIK_MODEL_DEFAULT ?? "claude-sonnet-5" : "gpt-4o";
const modelsFor = (role: string) => MODELS.filter((m) => m.roles.includes(role) && (ANTHROPIC_ON || m.id === "gpt-4o"));

/* ---------- ceilings ---------- */
const CEIL = {
  userDaily: Number(process.env.AIK_CEILING_USER_DAILY ?? 5),
  orgMonthly: Number(process.env.AIK_CEILING_ORG_MONTHLY ?? 150),
};
const spend = new Map<string, { amount: number; resetAt: number }>();
function bucket(k: string, win: number) {
  const now = Date.now(); const c = spend.get(k);
  if (!c || now > c.resetAt) { const f = { amount: 0, resetAt: now + win }; spend.set(k, f); return f; }
  return c;
}
const DAY = 86_400_000, MONTH = 30 * DAY;
const est = (m: ModelSpec, outTok: number) => (outTok / 1e6) * m.outPerMTok;

const hits = new Map<string, number[]>();
function limited(k: string, perMin: number) {
  const now = Date.now(); const a = (hits.get(k) ?? []).filter((t) => now - t < 60_000); a.push(now); hits.set(k, a);
  return a.length > perMin;
}

const STAFF_SYSTEM = `You are Claude, working inside the Humanity+AI staff Hub for AI Explorers, an after-school AI making club for children in grades 3-5 in Montgomery County, Maryland, run by Humanity+AI, Inc., a 501(c)(3).
The person talking to you is an adult: a facilitator, volunteer, or staff. Help with real work: planning 75-minute sessions, adapting the 8-week curriculum, family notes, prompts for the studios, a child's project, sessions that went sideways, grant language.
Children never use open-ended AI; they use bounded Studio modes watched live by a facilitator, and every image or video is held for approval. Children are the directors.
If asked for child-facing text, say a facilitator should read it before it reaches a child. If asked anything touching child safety, privacy law or consent, give your best thinking and say clearly it needs counsel.`;

const CHILD_HELPER_SYSTEM = `You are the helper inside AI Explorers, for a child aged 8 to 12. A facilitator reads everything you write.
You are NOT a general chatbot. You only help with the piece the child is making right now, described below. For anything else reply with exactly REDIRECT: followed by one kind sentence pointing them to their facilitator.
G-rated and kind. Original characters only. No links, emails, phone numbers, or anything identifying a real child, school or address. No medical, legal, safety or personal advice. Short sentences, a bit silly. You suggest and ask; the child decides. Under 60 words.`;

/* ---------- routes ---------- */
export function registerConsoleRoutes(
  app: Express,
  base: string,
  mw: { requireFacilitator: Mw; requireAdmin: Mw; requireChild: Mw },
) {
  const sess = (req: Request): any => { const r = req as any; const f = r.facilitator, c = r.child, k = r.klass; if (f) return { role: f.is_admin || f.role === "admin" ? "admin" : (f.role ?? "facilitator"), userId: String(f.id), id: String(f.id) }; if (c) return { role: "child", childId: String(c.id), id: String(c.id), class: k ? { ...k, consoleHelperEnabled: !!k.console_helper_enabled, paused: !!k.paused } : undefined }; return r.aikSession ?? r.aik ?? r.session?.aik ?? {}; };

  app.get(`${base}/console/models`, mw.requireFacilitator, (req, res) => {
    const s = sess(req); const role = s.role ?? "facilitator";
    res.json({
      models: modelsFor(role).map(({ id, label, blurb, tier, maxTokens, note }) => ({ id, label, blurb, tier, maxTokens, note })),
      defaultModel: DEFAULT_MODEL,
      anthropicConfigured: ANTHROPIC_ON,
      providers: providerReport(),
      budget: { usedToday: +bucket(`u:${s.userId ?? s.id}`, DAY).amount.toFixed(3), dailyCeiling: CEIL.userDaily, orgUsedThisMonth: +bucket("org", MONTH).amount.toFixed(2), orgCeiling: CEIL.orgMonthly },
    });
  });

  /* staff console */
  app.post(`${base}/console`, mw.requireFacilitator, async (req, res) => {
    const s = sess(req); const role = s.role ?? "facilitator"; const uid = s.userId ?? s.id ?? "unknown";
    const { turns, model } = req.body as { turns: ChatTurn[]; model?: string };
    if (!Array.isArray(turns) || !turns.length) return void res.status(400).json({ error: "no turns" });
    if (turns.length > 60) return void res.json({ blocked: true, message: "This conversation is long. Start a new one." });
    const last = turns[turns.length - 1];
    if (last.role !== "user" || last.content.length > 8000) return void res.status(400).json({ error: "bad turn" });
    if (limited(`rl:${uid}`, 20)) return void res.json({ blocked: true, message: "Too many at once. Wait a few seconds." });

    const allowed = modelsFor(role);
    let spec = allowed.find((m) => m.id === model) ?? allowed.find((m) => m.id === DEFAULT_MODEL) ?? allowed[allowed.length - 1];

    const u = bucket(`u:${uid}`, DAY), o = bucket("org", MONTH);
    if (o.amount + est(spec, spec.maxTokens) > CEIL.orgMonthly) return void res.json({ blocked: true, message: "Monthly model budget reached. An admin can raise it." });
    if (u.amount + est(spec, spec.maxTokens) > CEIL.userDaily) return void res.json({ blocked: true, message: "Today's model budget reached. It resets tomorrow." });
    let degraded = false;
    if (spec.tier === "frontier" && (u.amount > CEIL.userDaily * 0.8 || o.amount > CEIL.orgMonthly * 0.8)) {
      spec = allowed.find((m) => m.tier === "fast") ?? spec; degraded = true;
    }

    const inScreen = await screenInput(last.content);
    if (!inScreen.ok) return void res.json({ blocked: true, message: "Let's try that a different way.", flags: inScreen.flags });

    const dataClass = classify({ sessionRole: role, task: "staff-chat" });
    const r = route({ dataClass, task: "staff-chat" });
    assertLegalRoute(dataClass, r.provider);

    try {
      const text = await completeText({
        system: STAFF_SYSTEM, turns, maxTokens: spec.maxTokens, temperature: 0.7,
        tier: spec.tier === "fast" ? "fast" : "default",
        ...(spec.id !== "gpt-4o" ? { model: spec.id, provider: "anthropic" as const } : {}),
      } as any);
      const outScreen = await screenOutputText(text);
      if (!outScreen.ok) return void res.json({ blocked: true, message: "Let's try that a different way.", flags: outScreen.flags });
      const cost = est(spec, text.length / 3.6); u.amount += cost; o.amount += cost;
      res.json({ text, model: spec.label, degraded, provider: r.provider.id, cost: +cost.toFixed(4) });
    } catch (e: any) {
      res.status(502).json({ blocked: true, message: e?.message?.includes("not configured") ? "That model is not configured yet." : "Let's try that a different way." });
    }
  });

  /* bounded child helper */
  app.post(`${base}/console/helper`, mw.requireChild, async (req, res) => {
    const s = sess(req);
    if (!s.class?.consoleHelperEnabled) return void res.status(403).json({ blocked: true, message: "The helper is switched off for this class." });
    if (s.class?.paused) return void res.json({ blocked: true, message: "Your facilitator paused the Studio for a minute." });
    const { turns, projectContext } = req.body as { turns: ChatTurn[]; projectContext?: string };
    if (!projectContext) return void res.status(400).json({ blocked: true, message: "The helper only works on a piece you are making." });
    if (!Array.isArray(turns) || !turns.length || turns.length > 12) return void res.json({ blocked: true, message: "That is enough questions for now. Time to make something!" });
    const last = turns[turns.length - 1];
    if (last.role !== "user" || last.content.length > 300) return void res.status(400).json({ error: "bad turn" });
    if (limited(`rl:${s.childId ?? s.id}`, 6)) return void res.json({ blocked: true, message: "Too many at once. Wait a few seconds." });

    const inScreen = await screenInput(last.content);
    if (!inScreen.ok) return void res.json({ blocked: true, message: inScreen.kidMessage });

    const dataClass = classify({ sessionRole: "child", task: "child-helper" });
    const r = route({ dataClass, task: "child-helper" });
    assertLegalRoute(dataClass, r.provider); // throws if anything but in-tenant

    try {
      const text = await completeText({ system: `${CHILD_HELPER_SYSTEM}\n\nThe piece the child is making:\n${projectContext}`, turns, maxTokens: 400, temperature: 0.6, tier: "fast" });
      if (/^\s*REDIRECT\s*:/i.test(text)) return void res.json({ redirect: true, message: text.replace(/^\s*REDIRECT\s*:\s*/i, "").trim() });
      const outScreen = await screenOutputText(text);
      if (!outScreen.ok) return void res.json({ blocked: true, message: outScreen.kidMessage });
      res.json({ text });
    } catch {
      res.json({ blocked: true, message: "Let's try that a different way." });
    }
  });

  /* cascade */
  app.put(`${base}/console/settings`, mw.requireFacilitator, async (req, res) => {
    const s = sess(req);
    const { helperEnabled, scope } = req.body as { helperEnabled: boolean; scope: "all" | string[] };
    if (scope === "all" && s.role !== "admin") return void res.status(403).json({ error: "admins only" });
    // TODO(store.ts): set console_helper_enabled on aik_classes for scope; write an audit row.
    res.json({ ok: true, helperEnabled: !!helperEnabled, scope });
  });
}
