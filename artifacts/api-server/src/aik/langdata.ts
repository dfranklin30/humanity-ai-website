/**
 * Language Passport data with no imports: the languages, the topics, and the
 * mock replies. Kept apart from language.ts so modes.ts and ai.ts can read it
 * without an import cycle at startup.
 */
export type LangDef = {
  /** The label children pick on the form. */
  label: string;
  /** ISO 639-1. */
  code: "es" | "fr" | "zh" | "sw" | "ar" | "hi" | "ja";
  flag: string;
  /** Hello, in the language: the stamp's greeting. */
  hello: string;
  /** Non-Latin script: each word also carries a romanization. */
  romanize: string | null;
  rtl: boolean;
  /** ElevenLabs model that enforces this language for a single word. */
  elevenModel: "eleven_flash_v2_5" | "eleven_v3";
  /** Azure neural voice, the fallback when ElevenLabs is not configured. */
  azureVoice: string;
  azureLang: string;
  /** Guidance the writer gets for this language. */
  note: string;
};

export const LANGUAGES: LangDef[] = [
  { label: "Spanish", code: "es", flag: "🇪🇸", hello: "¡Hola!", romanize: null, rtl: false, elevenModel: "eleven_flash_v2_5", azureVoice: "es-MX-DaliaNeural", azureLang: "es-MX", note: "Use everyday Latin American Spanish. Include accents and ¡ ¿ correctly. Give nouns with their article (el / la) when it helps." },
  { label: "French", code: "fr", flag: "🇫🇷", hello: "Bonjour !", romanize: null, rtl: false, elevenModel: "eleven_flash_v2_5", azureVoice: "fr-FR-DeniseNeural", azureLang: "fr-FR", note: "Use standard French with correct accents. Give nouns with their article (le / la / l') when it helps." },
  { label: "Mandarin Chinese", code: "zh", flag: "🇨🇳", hello: "你好!", romanize: "pinyin with tone marks (e.g. píngguǒ)", rtl: false, elevenModel: "eleven_flash_v2_5", azureVoice: "zh-CN-XiaoxiaoNeural", azureLang: "zh-CN", note: "Use Simplified Chinese characters. Every word also gets pinyin with tone marks." },
  { label: "Swahili", code: "sw", flag: "🇰🇪", hello: "Jambo!", romanize: null, rtl: false, elevenModel: "eleven_v3", azureVoice: "sw-KE-ZuriNeural", azureLang: "sw-KE", note: "Use standard Kiswahili as taught in Kenyan and Tanzanian schools." },
  { label: "Arabic", code: "ar", flag: "🌍", hello: "مرحبا!", romanize: "a simple Latin transliteration (e.g. tuffaha)", rtl: true, elevenModel: "eleven_flash_v2_5", azureVoice: "ar-EG-SalmaNeural", azureLang: "ar-EG", note: "Use Modern Standard Arabic in Arabic script, without full vowel marks. Every word also gets a simple transliteration." },
  { label: "Hindi", code: "hi", flag: "🇮🇳", hello: "नमस्ते!", romanize: "a simple Latin transliteration (e.g. seb)", rtl: false, elevenModel: "eleven_flash_v2_5", azureVoice: "hi-IN-SwaraNeural", azureLang: "hi-IN", note: "Use Hindi in Devanagari script. Every word also gets a simple transliteration." },
  { label: "Japanese", code: "ja", flag: "🇯🇵", hello: "こんにちは!", romanize: "Hepburn romaji (e.g. ringo)", rtl: false, elevenModel: "eleven_flash_v2_5", azureVoice: "ja-JP-NanamiNeural", azureLang: "ja-JP", note: "Use kana for words a young learner meets first; use kanji only for very common words and still give romaji." },
];

export const LANGUAGE_LABELS = LANGUAGES.map((l) => l.label);
export const LANGUAGE_TOPICS = ["Food", "Animals", "Colors", "Numbers", "Greetings", "Family", "Weather", "Clothes", "Toys and games", "At school"];

/* ------------------------------------------------------------------ *
 * Mock replies (AIK_MOCK_AI=true, non-production only)
 * ------------------------------------------------------------------ */

export function mockLanguageBook(): string {
  return JSON.stringify({
    title: "Pim and the Red Manzana",
    hero: { name: "Pim", look: "a small round mint-green dragon with a striped yellow scarf, big friendly eyes, tiny wings and a curly tail; always carries a little woven basket" },
    style: "bright watercolor",
    coverScene: "Pim standing at a busy fruit stall, holding a little basket, smiling.",
    pages: [
      { text: "Pim woke up hungry. \"I want a red [[manzana|apple]],\" she said, and grabbed her basket.", scene: "Pim stretching in bed, her empty basket beside her." },
      { text: "At the stall there were piles of fruit. \"[[Hola|Hello]]!\" said Pim. The seller smiled and pointed at a yellow [[plátano|banana]].", scene: "Pim waving at a friendly fruit seller beside a pile of bananas." },
      { text: "\"No, gracias,\" said Pim. \"I want a [[manzana|apple]].\" But every [[manzana|apple]] was green!", scene: "Pim looking puzzled at a heap of green apples." },
      { text: "Pim tried an [[naranja|orange]] instead. Too sour! Her face went all scrunchy.", scene: "Pim with a scrunched-up face holding a half-peeled orange." },
      { text: "Then the seller lifted a box. Inside was one shiny red [[manzana|apple]] and two sweet [[fresas|strawberries]].", scene: "The seller opening a box to show a red apple and strawberries." },
      { text: "\"[[Gracias|Thank you]]!\" said Pim. She shared her [[fresas|strawberries]] with the seller, and they both laughed.", scene: "Pim and the seller sharing strawberries and laughing." },
    ],
    theEnd: "Adiós, Pim! See you tomorrow.",
    words: [
      { word: "manzana", english: "apple", say: "mahn-SAH-nah", emoji: "🍎" },
      { word: "Hola", english: "Hello", say: "OH-lah", emoji: "👋" },
      { word: "plátano", english: "banana", say: "PLAH-tah-noh", emoji: "🍌" },
      { word: "naranja", english: "orange", say: "nah-RAHN-hah", emoji: "🍊" },
      { word: "fresas", english: "strawberries", say: "FREH-sahs", emoji: "🍓" },
      { word: "Gracias", english: "Thank you", say: "GRAH-see-ahs", emoji: "🙏" },
    ],
    phrase: { text: "¿Me das una manzana, por favor?", english: "Can I have an apple, please?", say: "meh DAHS OO-nah mahn-SAH-nah, por fah-VOR" },
  });
}

export function mockLanguageCheck(user: string): string {
  try {
    const j = JSON.parse(user);
    return JSON.stringify({ words: j.words.map((w: any) => ({ word: w.word, ok: true, fix: null })), phrase: { ok: true, fix: null } });
  } catch {
    return "{}";
  }
}
