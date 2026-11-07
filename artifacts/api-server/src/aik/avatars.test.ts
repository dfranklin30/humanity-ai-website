import { test } from "node:test";
import assert from "node:assert/strict";
import { AVATARS, PLAYGROUND, avatarPrompt, describePick, surprisePick, customRef, parseCustomRef, isEmojiAvatar, newAvatarToken, MAX_AVATAR_TEXT } from "./avatars";

test("the avatar list has no duplicates and every entry is one emoji", () => {
  assert.equal(new Set(AVATARS).size, AVATARS.length);
  for (const a of AVATARS) assert.ok([...a].length <= 2, `${a} is more than one glyph`);
});

test("every playground row offers at least a dozen choices with kid-readable labels", () => {
  for (const [field, row] of Object.entries(PLAYGROUND)) {
    assert.ok(row.options.length >= 12, `${field} has ${row.options.length}`);
    assert.equal(new Set(row.options.map((o) => o.id)).size, row.options.length, `${field} ids repeat`);
    for (const o of row.options) assert.ok(o.label.length <= 16, `${field}/${o.id} label too long for a chip`);
  }
});

test("the prompt is built from the choices, pins the sticker style, and clips typed text", () => {
  const p = avatarPrompt({ who: "dragon", look: "rainbow", extra: "sunglasses", mood: "silly", text: "x".repeat(200) });
  assert.match(p, /baby dragon/);
  assert.match(p, /rainbow colours/);
  assert.match(p, /sunglasses/);
  assert.match(p, /tongue out/);
  assert.match(p, /white background/);
  assert.match(p, /no text/);
  assert.ok(p.includes("x".repeat(MAX_AVATAR_TEXT)) && !p.includes("x".repeat(MAX_AVATAR_TEXT + 1)));
});

test("unknown ids fall back to a friendly default instead of failing", () => {
  const p = avatarPrompt({ who: "nope", look: "nope", extra: "nope", mood: "nope" });
  assert.match(p, /friendly character/);
  assert.equal(describePick({ who: "nope" }), "character");
});

test("describePick reads like a child's sentence", () => {
  assert.equal(describePick({ who: "fox", look: "gold", extra: "crown", mood: "proud" }), "proud fox with crown in gold");
  assert.equal(describePick({ who: "fox", extra: "none", text: "with a tiny cape" }), "fox — with a tiny cape");
});

test("surprise picks are always valid ids", () => {
  for (let i = 0; i < 20; i++) {
    const s = surprisePick();
    for (const f of ["who", "look", "extra", "mood"] as const) assert.ok(PLAYGROUND[f].options.some((o) => o.id === s[f]));
  }
});

test("custom references round-trip and reject anything else", () => {
  const token = newAvatarToken();
  assert.equal(token.length, 16);
  const ref = customRef(42, token);
  assert.deepEqual(parseCustomRef(ref), { id: 42, token });
  assert.equal(parseCustomRef("img:42-short"), null);
  assert.equal(parseCustomRef("img:42-" + "z".repeat(16)), null);
  assert.equal(parseCustomRef("🦊"), null);
  assert.equal(isEmojiAvatar("🦊"), true);
  assert.equal(isEmojiAvatar(ref), false);
  assert.equal(isEmojiAvatar("💩"), false);
});
