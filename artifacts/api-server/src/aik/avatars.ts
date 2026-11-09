/**
 * Kids AI Studio — avatars.
 *
 * Every child has an avatar: the picture next to their nickname on the join
 * screen, the top bar, the Arcade and the facilitator's roster. Two kinds:
 *
 *   1. One of the 68 emoji below. The browser draws these from a 3D picture
 *      set (Microsoft's open-source Fluent Emoji, MIT) so they look the same,
 *      and good, on a Chromebook, a phone and a projector. The stored value is
 *      the emoji character itself, as it always was.
 *
 *   2. One the child made in the Emoji Playground: four taps (who, look, extra,
 *      mood) or a few typed words, screened like any Director's Order, drawn by
 *      the image model, screened again as a picture, shrunk to a sticker and
 *      kept in the media store. The stored value is `img:<id>-<token>`; the
 *      bytes are served by /api/aik/avatars/:id/:token.
 *
 * Nothing about a child is in an avatar: no photos go in, and the prompt is
 * built from the choices (a typed description is screened first).
 */
import { randomBytes } from "node:crypto";

export const AVATARS = [
  "🦊", "🐼", "🐸", "🦄", "🐙", "🦖", "🐧", "🦋", "🐯", "🐢", "🦜", "🐨", "🦁", "🐰", "🐳", "🦔", "🐝", "🦩", "🐲", "🤖",
  "🐱", "🐶", "🐵", "🐮", "🐷", "🐭", "🐹", "🐻", "🦓", "🦒", "🦘", "🦥", "🦦", "🦉", "🦅", "🦚", "🦢", "🐬", "🦈",
  "🐠", "🐡", "🦀", "🐌", "🐞", "🌵", "🌻", "🍄", "🍕", "🍩", "🧁", "🚀", "🛸", "🪐", "⭐", "🌈", "🎸", "🎮", "🧩",
  "👾", "🦸", "🧙", "🧜", "🧚", "🥷", "🏀", "⚽", "🎨", "🎲",
].filter((a, i, arr) => arr.indexOf(a) === i);

/* ------------------------------------------------------------------ *
 * The Emoji Playground's choices. Choices first, typing always allowed:
 * a child taps one from each row (or "Surprise me" taps for them) and can
 * add a few words of their own. Wording is what a seven-year-old reads.
 * ------------------------------------------------------------------ */
export type PlaygroundField = "who" | "look" | "extra" | "mood";

export const PLAYGROUND: Record<PlaygroundField, { label: string; options: { id: string; label: string; emoji: string; prompt: string }[] }> = {
  who: {
    label: "Who is it?",
    options: [
      { id: "dragon", label: "Dragon", emoji: "🐲", prompt: "a baby dragon" },
      { id: "robot", label: "Robot", emoji: "🤖", prompt: "a friendly round robot" },
      { id: "cat", label: "Cat", emoji: "🐱", prompt: "a fluffy cat" },
      { id: "dog", label: "Dog", emoji: "🐶", prompt: "a puppy" },
      { id: "fox", label: "Fox", emoji: "🦊", prompt: "a fox" },
      { id: "panda", label: "Panda", emoji: "🐼", prompt: "a panda" },
      { id: "unicorn", label: "Unicorn", emoji: "🦄", prompt: "a unicorn" },
      { id: "dino", label: "Dinosaur", emoji: "🦖", prompt: "a little T-rex" },
      { id: "octopus", label: "Octopus", emoji: "🐙", prompt: "an octopus" },
      { id: "owl", label: "Owl", emoji: "🦉", prompt: "an owl" },
      { id: "shark", label: "Shark", emoji: "🦈", prompt: "a smiling shark" },
      { id: "bunny", label: "Bunny", emoji: "🐰", prompt: "a bunny" },
      { id: "penguin", label: "Penguin", emoji: "🐧", prompt: "a penguin" },
      { id: "sloth", label: "Sloth", emoji: "🦥", prompt: "a sloth" },
      { id: "astronaut", label: "Astronaut", emoji: "🧑‍🚀", prompt: "an astronaut in a round helmet" },
      { id: "alien", label: "Alien", emoji: "👽", prompt: "a cute alien" },
      { id: "monster", label: "Monster", emoji: "👾", prompt: "a fuzzy friendly monster" },
      { id: "wizard", label: "Wizard", emoji: "🧙", prompt: "a young wizard" },
      { id: "knight", label: "Knight", emoji: "🛡️", prompt: "a knight in shiny armour" },
      { id: "ninja", label: "Ninja", emoji: "🥷", prompt: "a ninja" },
      { id: "mermaid", label: "Mermaid", emoji: "🧜", prompt: "a mermaid" },
      { id: "hero", label: "Superhero", emoji: "🦸", prompt: "a superhero with a mask" },
      { id: "slime", label: "Slime blob", emoji: "🟢", prompt: "a happy slime blob" },
      { id: "cupcake", label: "Cupcake", emoji: "🧁", prompt: "a cupcake with a face" },
      { id: "rocket", label: "Rocket", emoji: "🚀", prompt: "a rocket with a face" },
      { id: "planet", label: "Planet", emoji: "🪐", prompt: "a planet with rings and a face" },
    ],
  },
  look: {
    label: "What colors?",
    options: [
      { id: "rainbow", label: "Rainbow", emoji: "🌈", prompt: "rainbow colours" },
      { id: "gold", label: "Gold", emoji: "✨", prompt: "shiny gold" },
      { id: "neon", label: "Neon green", emoji: "🟢", prompt: "bright neon green" },
      { id: "pink", label: "Hot pink", emoji: "🩷", prompt: "hot pink" },
      { id: "ocean", label: "Ocean blue", emoji: "🌊", prompt: "ocean blue and teal" },
      { id: "lava", label: "Lava red", emoji: "🌋", prompt: "lava red and orange" },
      { id: "galaxy", label: "Purple galaxy", emoji: "🔮", prompt: "purple galaxy with tiny stars" },
      { id: "ice", label: "Ice crystal", emoji: "🧊", prompt: "icy pale blue crystal" },
      { id: "candy", label: "Candy stripes", emoji: "🍬", prompt: "candy stripes in pink and white" },
      { id: "camo", label: "Camo", emoji: "🪖", prompt: "green camouflage pattern" },
      { id: "glitter", label: "Glitter", emoji: "💎", prompt: "sparkly glitter" },
      { id: "pastel", label: "Pastel", emoji: "🎨", prompt: "soft pastel colours" },
      { id: "classic", label: "Natural", emoji: "🍃", prompt: "its natural colours" },
    ],
  },
  extra: {
    label: "Add something?",
    options: [
      { id: "none", label: "Nothing extra", emoji: "🙂", prompt: "" },
      { id: "sunglasses", label: "Sunglasses", emoji: "🕶️", prompt: "wearing cool sunglasses" },
      { id: "crown", label: "Crown", emoji: "👑", prompt: "wearing a gold crown" },
      { id: "wizardhat", label: "Wizard hat", emoji: "🎩", prompt: "wearing a pointy wizard hat with stars" },
      { id: "headphones", label: "Headphones", emoji: "🎧", prompt: "wearing big headphones" },
      { id: "cape", label: "Cape", emoji: "🦸", prompt: "wearing a flowing superhero cape" },
      { id: "bowtie", label: "Bow tie", emoji: "🎀", prompt: "wearing a bow tie" },
      { id: "jetpack", label: "Jetpack", emoji: "🚀", prompt: "wearing a jetpack" },
      { id: "pizza", label: "Pizza slice", emoji: "🍕", prompt: "holding a slice of pizza" },
      { id: "skateboard", label: "Skateboard", emoji: "🛹", prompt: "on a skateboard" },
      { id: "flower", label: "Flower", emoji: "🌸", prompt: "with a flower tucked behind one ear" },
      { id: "partyhat", label: "Party hat", emoji: "🥳", prompt: "wearing a party hat" },
      { id: "goggles", label: "Goggles", emoji: "🥽", prompt: "wearing inventor goggles" },
      { id: "scarf", label: "Scarf", emoji: "🧣", prompt: "wearing a cosy striped scarf" },
    ],
  },
  mood: {
    label: "How does it feel?",
    options: [
      { id: "happy", label: "Happy", emoji: "😄", prompt: "happy, big smile" },
      { id: "silly", label: "Silly", emoji: "🤪", prompt: "silly, tongue out" },
      { id: "sleepy", label: "Sleepy", emoji: "😴", prompt: "sleepy, half-closed eyes" },
      { id: "brave", label: "Brave", emoji: "💪", prompt: "brave and determined" },
      { id: "surprised", label: "Surprised", emoji: "😮", prompt: "surprised, wide eyes" },
      { id: "cool", label: "Cool", emoji: "😎", prompt: "cool and relaxed" },
      { id: "giggly", label: "Giggly", emoji: "😂", prompt: "giggling with eyes squeezed shut" },
      { id: "shy", label: "Shy", emoji: "☺️", prompt: "shy, rosy cheeks" },
      { id: "excited", label: "Excited", emoji: "🤩", prompt: "excited, star eyes" },
      { id: "thinking", label: "Thinking", emoji: "🤔", prompt: "thinking hard, one eyebrow up" },
      { id: "proud", label: "Proud", emoji: "😌", prompt: "proud, chin up" },
      { id: "sneaky", label: "Sneaky", emoji: "😏", prompt: "sneaky little grin" },
    ],
  },
};

export type PlaygroundPick = Partial<Record<PlaygroundField, string>> & { text?: string };

export const MAX_AVATAR_TEXT = 80;

function option(field: PlaygroundField, id: string | undefined) {
  if (!id) return null;
  return PLAYGROUND[field].options.find((o) => o.id === id) ?? null;
}

/** What the child picked, in words — shown back to them and kept with the avatar. */
export function describePick(pick: PlaygroundPick): string {
  const who = option("who", pick.who);
  const look = option("look", pick.look);
  const extra = option("extra", pick.extra);
  const mood = option("mood", pick.mood);
  const parts = [mood?.label.toLowerCase(), who?.label.toLowerCase() ?? "character", extra && extra.id !== "none" ? `with ${extra.label.toLowerCase()}` : "", look ? `in ${look.label.toLowerCase()}` : ""].filter(Boolean);
  const text = (pick.text ?? "").trim();
  return text ? `${parts.join(" ")} — ${text}` : parts.join(" ");
}

/**
 * The prompt for the image model. The style is fixed and the subject comes
 * from the choices; a typed description is added as "details" after the
 * caller has screened it. Whatever the words, the picture is one glossy
 * sticker on a plain background, which is what makes it read as an emoji.
 */
export function avatarPrompt(pick: PlaygroundPick): string {
  const who = option("who", pick.who)?.prompt ?? "a friendly character";
  const look = option("look", pick.look)?.prompt ?? "bright cheerful colours";
  const extra = option("extra", pick.extra)?.prompt ?? "";
  const mood = option("mood", pick.mood)?.prompt ?? "happy";
  const text = (pick.text ?? "").trim().slice(0, MAX_AVATAR_TEXT);
  return [
    `A single emoji sticker of ${who}, ${mood}, ${look}${extra ? `, ${extra}` : ""}.`,
    text ? `Details: ${text}.` : "",
    "Style: glossy 3D emoji like a phone emoji, soft studio lighting, rounded friendly shapes, big expressive eyes, head and shoulders, centred and facing forward, filling the frame.",
    "Plain pure white background, no text, no letters, no logos, no watermark, no border. Suitable for a seven-year-old.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Random picks for "Surprise me". */
export function surprisePick(): Required<Omit<PlaygroundPick, "text">> {
  const r = (f: PlaygroundField) => PLAYGROUND[f].options[Math.floor(Math.random() * PLAYGROUND[f].options.length)].id;
  return { who: r("who"), look: r("look"), extra: r("extra"), mood: r("mood") };
}

/* ------------------------------------------------------------------ *
 * Stored references
 * ------------------------------------------------------------------ */
const CUSTOM_RE = /^img:(\d+)-([a-f0-9]{16})$/;

export function newAvatarToken(): string {
  return randomBytes(8).toString("hex");
}

export function customRef(id: number, token: string): string {
  return `img:${id}-${token}`;
}

/** `{ id, token }` for a custom reference, null for an emoji (or garbage). */
export function parseCustomRef(value: string): { id: number; token: string } | null {
  const m = CUSTOM_RE.exec(value);
  return m ? { id: Number(m[1]), token: m[2] } : null;
}

export function isEmojiAvatar(value: string): boolean {
  return AVATARS.includes(value);
}

/** Validation bound for the avatar field: an emoji (≤ 4 code units) or `img:<id>-<16 hex>`. */
export const MAX_AVATAR_VALUE = 40;
