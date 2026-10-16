/**
 * Kids AI Studio (AIK) — configuration and feature flag.
 *
 * Everything the Studio needs from the environment is read here, once, so the
 * rest of the module never touches process.env directly. All variables are
 * prefixed AIK_ so they are easy to find in the Container App configuration.
 *
 * ── Core ────────────────────────────────────────────────────────────────
 *   AIK_ENABLED                       "true" to mount the Studio API (default: off)
 *   AIK_BOOTSTRAP_FACILITATOR         "email:password" — creates the first facilitator
 *                                     on startup if no facilitator exists yet
 *   AIK_MOCK_AI                       "true" returns canned results (local testing only)
 *
 * ── Providers by capability (each module says which capability it needs) ─
 *   AIK_TEXT_PROVIDER                 anthropic | azure | oss   (default anthropic if key set)
 *   AIK_OSS_TEXT_PROVIDER             which provider backs modules that ask for an open-source
 *                                     model: oss | anthropic (default oss if configured)
 *   AIK_IMAGE_PROVIDER                azure | fal               (default: whichever is configured)
 *   AIK_VIDEO_PROVIDER                fal | none
 *   AIK_VIDEO_PROVIDER                oss | fal | none
 *   AIK_OSS_VIDEO_BASE_URL            e.g. https://<res>.openai.azure.com/openai/v1
 *   AIK_OSS_VIDEO_API_KEY
 *   AIK_OSS_VIDEO_MODEL               the deployment name, e.g. sora-2
 *   AIK_MUSIC_PROVIDER                elevenlabs | fal | none
 *   AIK_TTS_PROVIDER                  elevenlabs | none
 *
 * ── Anthropic (Claude) ──────────────────────────────────────────────────
 *   AIK_ANTHROPIC_API_KEY             key from the Humanity+AI nonprofit org (Key Vault secretref)
 *   AIK_ANTHROPIC_MODEL               default claude-sonnet-4-5
 *   AIK_ANTHROPIC_FAST_MODEL          default claude-haiku-4-5 (chat turns, homework help)
 *
 * ── Open-source text models through any OpenAI-compatible endpoint ──────
 *   (Azure AI Foundry "Models as a Service", Groq, Together, Fireworks, OpenRouter, or a
 *    self-hosted vLLM container all speak this API.)
 *   AIK_OSS_BASE_URL                  e.g. https://<foundry>.services.ai.azure.com/models  or https://api.groq.com/openai/v1
 *   AIK_OSS_API_KEY
 *   AIK_OSS_MODEL                     e.g. Llama-4-Maverick, Qwen3, gpt-oss-120b, DeepSeek-V3 …
 *
 * ── Azure OpenAI ────────────────────────────────────────────────────────
 *   AIK_AZURE_OPENAI_ENDPOINT, AIK_AZURE_OPENAI_API_KEY, AIK_AZURE_OPENAI_API_VERSION (2024-10-21)
 *   AIK_AZURE_OPENAI_TEXT_DEPLOYMENT, AIK_AZURE_OPENAI_IMAGE_DEPLOYMENT
 *
 * ── fal.ai (hosted open-source image / video / music models) ────────────
 *   AIK_FAL_KEY
 *   AIK_FAL_IMAGE_MODEL               default fal-ai/flux/schnell
 *   AIK_FAL_VIDEO_MODEL               default fal-ai/ltx-video   (open-source text-to-video; ~5 s clips)
 *   AIK_FAL_MUSIC_MODEL               default fal-ai/stable-audio
 *
 * ── ElevenLabs (voice / music) ──────────────────────────────────────────
 *   AIK_ELEVENLABS_API_KEY
 *   AIK_ELEVENLABS_VOICE_ID           a warm, kid-friendly stock voice id
 *
 * ── Azure AI Content Safety (screening; fail closed in production) ──────
 *   AIK_CONTENT_SAFETY_ENDPOINT, AIK_CONTENT_SAFETY_KEY
 *   AIK_REQUIRE_CONTENT_SAFETY        default "true" in production
 *
 * ── Fallback and identity ───────────────────────────────────────────────
 *   AIK_TEXT_FALLBACK_PROVIDER        a second text provider tried when the first one
 *                                     is down or rate-limited (never on a content refusal)
 *   AIK_AZURE_USE_IDENTITY            "true": call Azure OpenAI with the Container App's
 *                                     managed identity instead of AIK_AZURE_OPENAI_API_KEY
 *
 * ── Media store (generated pictures, songs and movies) ──────────────────
 *   AIK_MEDIA_ACCOUNT                 storage account name; blobs are written with the
 *                                     managed identity (Storage Blob Data Contributor)
 *   AIK_MEDIA_CONNECTION_STRING       alternative to the account + identity
 *   AIK_MEDIA_CONTAINER               default "aik-media" (private; served through the API)
 *   Unset: media stays inline in Postgres as before (fine for local work, slow at scale).
 *
 * ── Finished products ───────────────────────────────────────────────────
 *   AIK_BOOK_PAGES                    illustrated pages per storybook (default 6)
 *   AIK_IMAGE_REFERENCE               "true" (default): reuse the cover as a reference
 *                                     image so the hero looks the same on every page
 *   AIK_VIDEO_SHOTS                   Sora shots per movie (default 3, 4 s each)
 *   AIK_VIDEO_SIZE                    default 1280x720
 *   AIK_FFMPEG                        path to ffmpeg (default "ffmpeg" on PATH)
 *   AIK_KIDS_VERIFY_GAMES             "true" (default): children's games are run, checked
 *                                     and repaired before they are handed over
 */

const env = process.env;
const isProduction = env.NODE_ENV === "production";

export type TextProviderId = "anthropic" | "azure" | "oss";
export type ImageProviderId = "azure" | "oss" | "fal" | "none";
export type VideoProviderId = "oss" | "fal" | "none";
export type MusicProviderId = "elevenlabs" | "fal" | "none";
export type TtsProviderId = "azure" | "elevenlabs" | "none";

const anthropicKey = env.AIK_ANTHROPIC_API_KEY || "";
const ossConfigured = Boolean(env.AIK_OSS_BASE_URL && env.AIK_OSS_API_KEY && env.AIK_OSS_MODEL);
const azureUseIdentity = env.AIK_AZURE_USE_IDENTITY === "true";
const azureAuthConfigured = Boolean(env.AIK_AZURE_OPENAI_API_KEY) || azureUseIdentity;
const azureTextConfigured = Boolean(env.AIK_AZURE_OPENAI_ENDPOINT && azureAuthConfigured && env.AIK_AZURE_OPENAI_TEXT_DEPLOYMENT);
const azureImageConfigured = Boolean(env.AIK_AZURE_OPENAI_ENDPOINT && azureAuthConfigured && env.AIK_AZURE_OPENAI_IMAGE_DEPLOYMENT);
const ossImageConfigured = Boolean((env.AIK_OSS_IMAGE_BASE_URL || env.AIK_OSS_BASE_URL) && (env.AIK_OSS_IMAGE_API_KEY || env.AIK_OSS_API_KEY) && env.AIK_OSS_IMAGE_MODEL);
const falConfigured = Boolean(env.AIK_FAL_KEY);
const azureSpeechConfigured = Boolean(env.AIK_AZURE_SPEECH_KEY && env.AIK_AZURE_SPEECH_REGION);
const elevenConfigured = Boolean(env.AIK_ELEVENLABS_API_KEY);
const ossVideoConfigured = Boolean(env.AIK_OSS_VIDEO_BASE_URL && env.AIK_OSS_VIDEO_API_KEY && env.AIK_OSS_VIDEO_MODEL);

function pick<T extends string>(value: string | undefined, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export const aikConfig = {
  enabled: env.AIK_ENABLED === "true",
  isProduction,
  bootstrapFacilitator: env.AIK_BOOTSTRAP_FACILITATOR || "",
  mockAI: env.AIK_MOCK_AI === "true" && !isProduction,

  providers: {
    text: pick<TextProviderId>(env.AIK_TEXT_PROVIDER, ["anthropic", "azure", "oss"], anthropicKey ? "anthropic" : azureTextConfigured ? "azure" : "oss"),
    ossText: pick<TextProviderId>(env.AIK_OSS_TEXT_PROVIDER, ["oss", "anthropic", "azure"], ossConfigured ? "oss" : anthropicKey ? "anthropic" : "azure"),
    image: pick<ImageProviderId>(env.AIK_IMAGE_PROVIDER, ["azure", "oss", "fal", "none"], azureImageConfigured ? "azure" : ossImageConfigured ? "oss" : falConfigured ? "fal" : "none"),
    video: pick<VideoProviderId>(env.AIK_VIDEO_PROVIDER, ["oss", "fal", "none"], ossVideoConfigured ? "oss" : falConfigured ? "fal" : "none"),
    music: pick<MusicProviderId>(env.AIK_MUSIC_PROVIDER, ["elevenlabs", "fal", "none"], elevenConfigured ? "elevenlabs" : falConfigured ? "fal" : "none"),
    tts: pick<TtsProviderId>(env.AIK_TTS_PROVIDER, ["azure", "elevenlabs", "none"], azureSpeechConfigured ? "azure" : elevenConfigured ? "elevenlabs" : "none"),
    /**
     * Second text provider, used only when the first one fails for reasons
     * that are not about content: an outage, a 429, a timeout. A refusal is
     * a screening result and is never retried elsewhere. Defaults to whichever
     * other provider is configured, so Claude falls back to Azure and Azure
     * falls back to Claude without anyone having to set it.
     */
    textFallback: pick<TextProviderId | "none">(env.AIK_TEXT_FALLBACK_PROVIDER, ["anthropic", "azure", "oss", "none"], "none"),
  },

  anthropic: {
    apiKey: anthropicKey,
    model: env.AIK_ANTHROPIC_MODEL || "claude-sonnet-4-5",
    fastModel: env.AIK_ANTHROPIC_FAST_MODEL || "claude-haiku-4-5",
    apiVersion: "2023-06-01",
  },

  oss: {
    videoBaseUrl: env.AIK_OSS_VIDEO_BASE_URL || "",
    videoApiKey: env.AIK_OSS_VIDEO_API_KEY || "",
    videoModel: env.AIK_OSS_VIDEO_MODEL || "",
    baseUrl: (env.AIK_OSS_BASE_URL || "").replace(/\/$/, ""),
    apiKey: env.AIK_OSS_API_KEY || "",
    model: env.AIK_OSS_MODEL || "",
    /** Open-source image model on an OpenAI-compatible endpoint (Azure AI Foundry FLUX, etc.). */
    imageBaseUrl: (env.AIK_OSS_IMAGE_BASE_URL || env.AIK_OSS_BASE_URL || "").replace(/\/$/, ""),
    imageApiKey: env.AIK_OSS_IMAGE_API_KEY || env.AIK_OSS_API_KEY || "",
    imageModel: env.AIK_OSS_IMAGE_MODEL || "",
  },

  /** Azure AI Speech — available on the same multi-service AIServices resource as Content Safety. */
  azureSpeech: {
    key: env.AIK_AZURE_SPEECH_KEY || "",
    region: env.AIK_AZURE_SPEECH_REGION || "",
    voice: env.AIK_AZURE_SPEECH_VOICE || "en-US-AvaMultilingualNeural",
  },

  azureOpenAI: {
    endpoint: env.AIK_AZURE_OPENAI_ENDPOINT || "",
    apiKey: env.AIK_AZURE_OPENAI_API_KEY || "",
    useIdentity: azureUseIdentity,
    apiVersion: env.AIK_AZURE_OPENAI_API_VERSION || "2024-10-21",
    textDeployment: env.AIK_AZURE_OPENAI_TEXT_DEPLOYMENT || "",
    imageDeployment: env.AIK_AZURE_OPENAI_IMAGE_DEPLOYMENT || "",
  },

  fal: {
    key: env.AIK_FAL_KEY || "",
    imageModel: env.AIK_FAL_IMAGE_MODEL || "fal-ai/flux/schnell",
    videoModel: env.AIK_FAL_VIDEO_MODEL || "fal-ai/ltx-video",
    musicModel: env.AIK_FAL_MUSIC_MODEL || "fal-ai/stable-audio",
  },

  elevenlabs: {
    apiKey: env.AIK_ELEVENLABS_API_KEY || "",
    voiceId: env.AIK_ELEVENLABS_VOICE_ID || "",
  },

  contentSafety: {
    endpoint: env.AIK_CONTENT_SAFETY_ENDPOINT || "",
    key: env.AIK_CONTENT_SAFETY_KEY || "",
    /** Fail closed when the screening service is unavailable. */
    required: env.AIK_REQUIRE_CONTENT_SAFETY !== undefined ? env.AIK_REQUIRE_CONTENT_SAFETY === "true" : isProduction,
    /** Severity at or above which a category blocks (0 safe, 2 low, 4 medium, 6 high). */
    blockAtSeverity: 2,
  },

  /** Absolute base URL used in emailed links. */
  publicUrl: (env.AIK_PUBLIC_URL || "https://humanityplusai.org").replace(/\/$/, ""),

  /** Sign in with Google. Both values come from a Google Cloud OAuth client. */
  google: {
    clientId: env.AIK_GOOGLE_CLIENT_ID || "",
    clientSecret: env.AIK_GOOGLE_CLIENT_SECRET || "",
  },

  /** Self-service accounts. */
  signupsOpen: env.AIK_SIGNUPS_OPEN !== "false",
  verifyTokenMinutes: 60 * 24,
  resetTokenMinutes: 60,
  signupsPerHourPerIp: 5,

  /** Child sessions expire after this many minutes regardless of activity. */
  childSessionMinutes: 75,
  /** Facilitator sessions expire after this many minutes of inactivity. */
  facilitatorSessionMinutes: 8 * 60,
  /** Wrong-PIN attempts before a child account locks. */
  maxPinAttempts: 5,
  /** Default Director's Orders (create/change) per child per session. */
  defaultTicketLimit: 2,
  /** Default guided-chat turns per child per session (Homework Help, Robotics Lab, "Ask the helper"). */
  defaultChatTurnLimit: 15,
  /** Turns of conversation history sent back to the model on each chat turn. */
  chatHistoryTurns: 8,
  /** Hard cap on characters in any free-text field of a Director's Order or chat message. */
  maxFieldChars: 160,
  maxChatChars: 300,
  /** Adults working in the Hub are not writing kid-sized orders. */
  staffFieldChars: 1_200,
  staffChatChars: 4_000,
  /** Hard cap on generated game size (characters). */
  maxGameChars: 60_000,
  /* --- Studio pipeline (Hub only) ---------------------------------- *
   * A child's game is small on purpose: easy to read, quick to change.
   * An adult building a demo needs room, so the studio path gets its own
   * budget, still well inside maxGameChars.                            */
  studioGameChars: 28_000,
  /** A child's game, with room for the repair pass to add a guard or two. */
  kidsGameChars: 12_000,
  studioMaxTokens: 16_000,
  /** Requests per minute per child session. */
  childRequestsPerMinute: 8,
  /** Requests per minute per IP on the sign-in endpoints. */
  loginAttemptsPerMinute: 20,
  /** Media generation timeout (video can take a couple of minutes). */
  mediaTimeoutMs: 240_000,

  /* --- Media store ------------------------------------------------- */
  media: {
    account: env.AIK_MEDIA_ACCOUNT || "",
    connectionString: env.AIK_MEDIA_CONNECTION_STRING || "",
    container: env.AIK_MEDIA_CONTAINER || "aik-media",
  },

  /* --- Finished products ------------------------------------------- *
   * A storybook is a cover plus this many illustrated, narrated pages; a
   * movie is this many Sora shots cut together behind a title card. Both
   * are bounded here, not by the model, because each page and each shot is
   * a paid generation and a child is waiting.                           */
  bookPages: Math.min(Math.max(Number(env.AIK_BOOK_PAGES) || 6, 3), 8),
  imageReference: env.AIK_IMAGE_REFERENCE !== "false",
  videoShots: Math.min(Math.max(Number(env.AIK_VIDEO_SHOTS) || 3, 1), 4),
  videoShotSeconds: 4,
  videoSize: env.AIK_VIDEO_SIZE || "1280x720",
  ffmpeg: env.AIK_FFMPEG || "ffmpeg",
  kidsVerifyGames: env.AIK_KIDS_VERIFY_GAMES !== "false",
  /** Characters per narrated page; keeps a six-page book readable aloud in about two minutes. */
  bookPageChars: 420,
} as const;

/* ------------------------------------------------------------------ *
 * Capability checks
 * ------------------------------------------------------------------ */

export function textProviderConfigured(p: TextProviderId): boolean {
  if (aikConfig.mockAI) return true;
  if (p === "anthropic") return Boolean(aikConfig.anthropic.apiKey);
  if (p === "oss") return ossConfigured;
  return azureTextConfigured;
}

export function isTextConfigured(): boolean {
  return textProviderConfigured(aikConfig.providers.text);
}
export function isOssTextConfigured(): boolean {
  return textProviderConfigured(aikConfig.providers.ossText);
}
export function isImageConfigured(): boolean {
  if (aikConfig.mockAI) return true;
  const p = aikConfig.providers.image;
  return (p === "azure" && azureImageConfigured) || (p === "oss" && ossImageConfigured) || (p === "fal" && falConfigured);
}
export function isVideoConfigured(): boolean {
  return (
    aikConfig.mockAI ||
    (aikConfig.providers.video === "fal" && falConfigured) ||
    (aikConfig.providers.video === "oss" && ossVideoConfigured)
  );
}
export function isMusicConfigured(): boolean {
  if (aikConfig.mockAI) return true;
  const p = aikConfig.providers.music;
  return (p === "elevenlabs" && elevenConfigured) || (p === "fal" && falConfigured);
}
export function isTtsConfigured(): boolean {
  if (aikConfig.mockAI) return true;
  const p = aikConfig.providers.tts;
  if (p === "azure") return azureSpeechConfigured;
  return p === "elevenlabs" && elevenConfigured && Boolean(aikConfig.elevenlabs.voiceId);
}
/** True when the Studio can serve the text modes at all. */
export function isAiConfigured(): boolean {
  return isTextConfigured();
}
export function isGoogleConfigured(): boolean {
  return Boolean(aikConfig.google.clientId && aikConfig.google.clientSecret);
}

export function isContentSafetyConfigured(): boolean {
  const c = aikConfig.contentSafety;
  return Boolean(c.endpoint && c.key);
}

/** Which provider stands behind the primary one, if any is configured. */
export function textFallbackProvider(primary: TextProviderId): TextProviderId | null {
  const wanted = aikConfig.providers.textFallback;
  if (wanted !== "none") return wanted !== primary && textProviderConfigured(wanted) ? wanted : null;
  for (const p of ["anthropic", "azure", "oss"] as TextProviderId[]) {
    if (p !== primary && textProviderConfigured(p)) return p;
  }
  return null;
}

export function isMediaStoreConfigured(): boolean {
  return Boolean(aikConfig.media.connectionString || aikConfig.media.account);
}

/** Summary for /api/aik/config and the startup log. */
export function capabilitySummary() {
  return {
    text: { provider: aikConfig.providers.text, ready: isTextConfigured() },
    ossText: { provider: aikConfig.providers.ossText, ready: isOssTextConfigured() },
    image: { provider: aikConfig.providers.image, ready: isImageConfigured() },
    video: { provider: aikConfig.providers.video, ready: isVideoConfigured() },
    music: { provider: aikConfig.providers.music, ready: isMusicConfigured() },
    tts: { provider: aikConfig.providers.tts, ready: isTtsConfigured() },
    screening: { configured: isContentSafetyConfigured(), required: aikConfig.contentSafety.required },
    textFallback: { provider: textFallbackProvider(aikConfig.providers.text) ?? "none", ready: Boolean(textFallbackProvider(aikConfig.providers.text)) },
    mediaStore: { provider: isMediaStoreConfigured() ? "azure-blob" : "inline", ready: true },
    book: { pages: aikConfig.bookPages, illustrated: isImageConfigured(), narrated: isTtsConfigured() },
    movie: { shots: aikConfig.videoShots, ready: isVideoConfigured() },
    google: { configured: isGoogleConfigured(), ready: isGoogleConfigured() },
    mock: aikConfig.mockAI,
  };
}
