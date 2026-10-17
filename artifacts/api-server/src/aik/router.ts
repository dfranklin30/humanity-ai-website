/**
 * artifacts/api-server/src/aik/router.ts
 *
 * One question decides everything: could this text have come from a child?
 *
 *   YES -> in-tenant providers only. Never leaves Humanity+AI's Azure subscription.
 *   NO  -> free external tiers are fair game, cheapest capable one wins.
 *
 * The boundary is enforced here, server-side, by construction: a provider marked
 * `trainsOnData` or `externalRetention` is filtered out of the candidate list for
 * child-class traffic before any selection happens. There is no flag, config value
 * or request parameter that moves a child's words onto a free tier.
 *
 * Why this matters more than the money: the Family Letter tells parents the Studio
 * "never uses children's work to train AI." That is a written representation to a
 * parent about their child. A free tier that trains on inputs turns that sentence
 * into a false statement, and $30 a month of savings does not cover that.
 */

import type { ChatTurn } from "./ai";

/* ================================================================== */
/* 1. Data classes                                                     */
/* ================================================================== */

export type DataClass =
  /** A child typed it, or it is a child's work, nickname, class roster or portfolio. */
  | "child"
  /** Adult-authored org content: lesson plans, grant drafts, internal notes. */
  | "staff"
  /** No org data at all. General knowledge, public curriculum questions. */
  | "public";

export type Task =
  | "studio-generate"   // a child's Director's Order
  | "child-helper"      // the bounded ask-the-helper chat
  | "vision"            // homework photo, parts photo, a card photographed
  | "staff-chat"        // the Hub console
  | "long-document"     // read a 40-page RFP, a whole curriculum, a transcript
  | "code"              // game code, micro:bit code, prompt engineering
  | "bulk-draft"        // high volume, low stakes: examples, variations
  | "screening";        // safety checks — always in tenant, never negotiable

/* ================================================================== */
/* 2. The provider registry                                            */
/* ================================================================== */

export type Provider = {
  id: string;
  label: string;
  /** In Humanity+AI's own Azure subscription, covered by the existing DPA. */
  inTenant: boolean;
  /** Provider's terms permit training on submitted data. Disqualifying for child data. */
  trainsOnData: boolean;
  /** Provider retains inputs for abuse review or any other purpose beyond the call. */
  externalRetention: boolean;
  modalities: Array<"text" | "image-in" | "image-out" | "audio" | "video">;
  contextTokens: number;
  strengths: Task[];
  costPerMTokOut: number;      // 0 = free tier
  freeTierCaveat?: string;
  envPrefix: string;
  /**
   * COMPLIANCE ARTIFACT. Re-read the provider's terms at the start of every
   * programme cycle and update this date. An undated claim about a vendor's
   * training policy is worth nothing in a school agreement.
   */
  termsVerified: string | null;
};

export const PROVIDERS: Provider[] = [
  /* ---------- in tenant: the only things a child's words may touch ---------- */
  {
    id: "azure-gpt4o",
    label: "Azure OpenAI gpt-4o",
    inTenant: true,
    trainsOnData: false,
    externalRetention: false,
    modalities: ["text", "image-in"],
    contextTokens: 128_000,
    strengths: ["studio-generate", "child-helper", "vision", "code"],
    costPerMTokOut: 10,
    envPrefix: "AIK_AZURE_OPENAI",
    termsVerified: "2026-09-19",
  },
  {
    id: "foundry-oss",
    label: "Azure AI Foundry (Llama / Qwen / gpt-oss / Mistral)",
    inTenant: true,
    trainsOnData: false,
    externalRetention: false,
    modalities: ["text", "image-in"],
    contextTokens: 128_000,
    strengths: ["bulk-draft", "child-helper", "studio-generate"],
    costPerMTokOut: 0.6,
    envPrefix: "AIK_OSS",
    termsVerified: "2026-09-19",
  },
  {
    id: "azure-content-safety",
    label: "Azure AI Content Safety",
    inTenant: true,
    trainsOnData: false,
    externalRetention: false,
    modalities: ["text", "image-in"],
    contextTokens: 10_000,
    strengths: ["screening"],
    costPerMTokOut: 0,
    freeTierCaveat: "5,000 text + 5,000 image records a month free; enough for this programme.",
    envPrefix: "AIK_CONTENT_SAFETY",
    termsVerified: "2026-09-19",
  },

  /* ---------- free external tiers: staff and public work only ---------- */
  {
    id: "groq",
    label: "Groq",
    inTenant: false,
    trainsOnData: false,
    externalRetention: true,
    modalities: ["text"],
    contextTokens: 128_000,
    strengths: ["staff-chat", "bulk-draft"],
    costPerMTokOut: 0,
    freeTierCaveat: "Fastest tokens per second of anything here. Free tier is rate limited per minute and per day.",
    envPrefix: "AIK_GROQ",
    termsVerified: null,
  },
  {
    id: "gemini",
    label: "Google Gemini (free tier)",
    inTenant: false,
    trainsOnData: true,
    externalRetention: true,
    modalities: ["text", "image-in", "audio", "video"],
    contextTokens: 1_000_000,
    strengths: ["long-document"],
    costPerMTokOut: 0,
    freeTierCaveat:
      "Google's free tier states that it MAY use submitted data to improve products. Disqualified for anything a child touched. " +
      "The key already in the Container App is the website's — do not point it at the Studio.",
    envPrefix: "AIK_GEMINI",
    termsVerified: null,
  },
  {
    id: "github-models",
    label: "GitHub Models",
    inTenant: false,
    trainsOnData: false,
    externalRetention: true,
    modalities: ["text"],
    contextTokens: 128_000,
    strengths: ["code", "bulk-draft"],
    costPerMTokOut: 0,
    freeTierCaveat: "Tied to the org's GitHub plan; low daily limits. Good for prototyping studio prompts, not for a live class.",
    envPrefix: "AIK_GHMODELS",
    termsVerified: null,
  },
  {
    id: "openrouter",
    label: "OpenRouter (:free models)",
    inTenant: false,
    trainsOnData: true,
    externalRetention: true,
    modalities: ["text", "image-in"],
    contextTokens: 128_000,
    strengths: ["bulk-draft", "staff-chat"],
    costPerMTokOut: 0,
    freeTierCaveat:
      "Free models on OpenRouter are free BECAUSE the upstream provider may train on the prompts. It is the clearest example " +
      "of why 'free' and 'children' do not belong in the same sentence.",
    envPrefix: "AIK_OPENROUTER",
    termsVerified: null,
  },
];

/* ================================================================== */
/* 3. Classification                                                   */
/* ================================================================== */

/**
 * Fail dangerous-side-closed: anything we cannot positively establish as
 * adult-authored is treated as child data. A wrong guess toward "child" costs
 * a fraction of a cent. A wrong guess the other way is a broken promise to a parent.
 */
export function classify(input: {
  sessionRole?: "admin" | "facilitator" | "member" | "child";
  task: Task;
  containsChildWork?: boolean;
  containsRoster?: boolean;
}): DataClass {
  if (input.sessionRole === "child") return "child";
  if (input.containsChildWork || input.containsRoster) return "child";
  if (input.task === "studio-generate" || input.task === "child-helper") return "child";
  if (input.task === "screening") return "child"; // screening sees the raw text by definition
  if (input.task === "vision") return "child";    // a photo is the highest-risk input in the product
  if (!input.sessionRole) return "child";
  return "staff";
}

/* ================================================================== */
/* 4. Routing                                                          */
/* ================================================================== */

export type Route = {
  provider: Provider;
  reason: string;
  /** Providers rejected, and why — written to the audit log, not shown to a child. */
  rejected: Array<{ id: string; why: string }>;
};

export function route(opts: {
  dataClass: DataClass;
  task: Task;
  needs?: Array<"image-in" | "image-out" | "audio" | "video">;
  minContextTokens?: number;
  /** Set false to keep everything in tenant regardless — the panic switch. */
  allowExternal?: boolean;
}): Route {
  const rejected: Array<{ id: string; why: string }> = [];
  const allowExternal = opts.allowExternal ?? process.env.AIK_ALLOW_EXTERNAL_FREE_TIERS === "1";

  let candidates = PROVIDERS.filter((p) => {
    /* --- THE WALL --- */
    if (opts.dataClass === "child" && !p.inTenant) {
      rejected.push({ id: p.id, why: "child data never leaves the tenant" });
      return false;
    }
    if (opts.dataClass !== "child" && !p.inTenant) {
      if (!allowExternal) {
        rejected.push({ id: p.id, why: "external free tiers are switched off" });
        return false;
      }
      if (p.termsVerified === null) {
        rejected.push({ id: p.id, why: "terms not verified this cycle" });
        return false;
      }
    }
    /* --- capability --- */
    for (const need of opts.needs ?? []) {
      if (!p.modalities.includes(need)) {
        rejected.push({ id: p.id, why: `cannot do ${need}` });
        return false;
      }
    }
    if (opts.minContextTokens && p.contextTokens < opts.minContextTokens) {
      rejected.push({ id: p.id, why: "context window too small" });
      return false;
    }
    return true;
  });

  /* Prefer a provider that names this task as a strength, then the cheapest. */
  const strong = candidates.filter((p) => p.strengths.includes(opts.task));
  if (strong.length) candidates = strong;
  candidates.sort((a, b) => a.costPerMTokOut - b.costPerMTokOut);

  const provider = candidates[0];
  if (!provider) {
    throw new Error(
      `No provider can serve task=${opts.task} dataClass=${opts.dataClass}. ` +
        `Rejected: ${rejected.map((r) => `${r.id} (${r.why})`).join(", ")}`,
    );
  }

  return {
    provider,
    reason:
      opts.dataClass === "child"
        ? `in-tenant only (child data), cheapest capable: ${provider.label}`
        : `${provider.label} — strongest for ${opts.task}${provider.costPerMTokOut === 0 ? ", free tier" : ""}`,
    rejected,
  };
}

/* ================================================================== */
/* 5. The guard                                                        */
/* ================================================================== */

/**
 * Call this immediately before dispatch, every time. It is the last line of
 * defence and it throws rather than degrades — a routing bug should take the
 * request down loudly, not quietly send a child's story to a free tier.
 */
export function assertLegalRoute(dataClass: DataClass, provider: Provider): void {
  if (dataClass === "child" && !provider.inTenant) {
    throw new Error(`REFUSED: child data cannot be sent to ${provider.id} (external provider)`);
  }
  if (dataClass === "child" && (provider.trainsOnData || provider.externalRetention)) {
    throw new Error(`REFUSED: ${provider.id} trains on or retains inputs; child data is never eligible`);
  }
  if (!provider.inTenant && provider.termsVerified === null) {
    throw new Error(`REFUSED: ${provider.id} has no verified terms date; re-verify before use`);
  }
}

/** For the Hub's settings page: what is on, what is off, and why. */
export function providerReport() {
  return PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    scope: p.inTenant ? "any data, including children's" : "staff and public work only",
    free: p.costPerMTokOut === 0,
    blockedForChildren: !p.inTenant,
    reason: !p.inTenant
      ? p.trainsOnData
        ? "provider may train on submitted data"
        : "outside the tenant and the existing DPA"
      : null,
    caveat: p.freeTierCaveat ?? null,
    termsVerified: p.termsVerified ?? "NOT VERIFIED — unusable until checked",
  }));
}
