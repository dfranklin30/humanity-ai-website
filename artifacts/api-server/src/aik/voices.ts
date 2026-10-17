/**
 * Voices a hero can have.
 *
 * ElevenLabs is the first choice: the account's own voice library, read from
 * the API so a voice added there appears here without a deploy. Azure neural
 * voices are always offered alongside, because they run in our own tenant and
 * keep working when the ElevenLabs key or quota does not.
 */
import { aikConfig, isAzureSpeechConfigured, isElevenLabsConfigured } from "./config";
import { logger } from "../lib/logger";

export type VoiceOption = {
  provider: "elevenlabs" | "azure";
  id: string;
  name: string;
  /** Short description: accent, age, feel. */
  description: string;
};

/** Hand-picked Azure voices that read well to children. */
const AZURE_VOICES: VoiceOption[] = [
  { provider: "azure", id: "en-US-AvaMultilingualNeural", name: "Ava", description: "warm, friendly storyteller" },
  { provider: "azure", id: "en-US-AndrewMultilingualNeural", name: "Andrew", description: "calm, kind narrator" },
  { provider: "azure", id: "en-US-EmmaMultilingualNeural", name: "Emma", description: "bright and cheerful" },
  { provider: "azure", id: "en-US-BrianMultilingualNeural", name: "Brian", description: "relaxed, easy-going" },
  { provider: "azure", id: "en-US-AnaNeural", name: "Ana", description: "a young child's voice" },
  { provider: "azure", id: "en-US-JennyNeural", name: "Jenny", description: "clear and gentle" },
  { provider: "azure", id: "en-US-GuyNeural", name: "Guy", description: "upbeat announcer" },
  { provider: "azure", id: "en-US-AriaNeural", name: "Aria", description: "expressive and lively" },
  { provider: "azure", id: "en-GB-SoniaNeural", name: "Sonia", description: "British, warm" },
  { provider: "azure", id: "en-GB-RyanNeural", name: "Ryan", description: "British, playful" },
  { provider: "azure", id: "en-AU-NatashaNeural", name: "Natasha", description: "Australian, sunny" },
  { provider: "azure", id: "en-IN-NeerjaNeural", name: "Neerja", description: "Indian English, kind" },
];

let elevenCache: { at: number; voices: VoiceOption[] } | null = null;

async function elevenVoices(): Promise<VoiceOption[]> {
  if (!isElevenLabsConfigured()) return [];
  if (elevenCache && Date.now() - elevenCache.at < 60 * 60_000) return elevenCache.voices;
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": aikConfig.elevenlabs.apiKey }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      logger.warn({ status: res.status, body: (await res.text().catch(() => "")).slice(0, 200) }, "[aik] ElevenLabs voice list failed");
      return [];
    }
    const j: any = await res.json();
    const voices: VoiceOption[] = (Array.isArray(j?.voices) ? j.voices : [])
      .filter((v: any) => typeof v?.voice_id === "string" && typeof v?.name === "string")
      .slice(0, 80)
      .map((v: any) => {
        const l = v.labels ?? {};
        const description = [l.description, l.accent, l.age, l.use_case].filter((x: unknown) => typeof x === "string" && x).join(", ");
        return { provider: "elevenlabs" as const, id: String(v.voice_id), name: String(v.name).slice(0, 40), description: description.slice(0, 80) || "ElevenLabs voice" };
      });
    elevenCache = { at: Date.now(), voices };
    return voices;
  } catch (err) {
    logger.warn({ err: String((err as Error)?.message ?? err) }, "[aik] ElevenLabs voice list unreachable");
    return [];
  }
}

export async function listVoices(): Promise<{ voices: VoiceOption[]; elevenlabs: boolean; azure: boolean }> {
  const eleven = await elevenVoices();
  const azure = isAzureSpeechConfigured() ? AZURE_VOICES : [];
  return { voices: [...eleven, ...azure], elevenlabs: eleven.length > 0, azure: azure.length > 0 };
}

/** A voice the catalog actually offers, or null. Never trust a voice id from the browser on its own. */
export async function findVoice(provider: string, id: string): Promise<VoiceOption | null> {
  const { voices } = await listVoices();
  return voices.find((v) => v.provider === provider && v.id === id) ?? null;
}
