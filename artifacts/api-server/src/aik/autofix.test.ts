/**
 * Finish every order: which screening hits are repaired and which stay a
 * hard stop. Run with:  pnpm --filter @workspace/api-server test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { stripPII, stripPIIFromValues, fixable, softenRule, fixNote } from "./autofix";

test("private details come out and the idea stays", () => {
  const r = stripPII("my friend, call 404-555-0123 or email sam@example.com");
  assert.ok(!/404/.test(r.text) && !/example\.com/.test(r.text), r.text);
  assert.match(r.text, /my friend/);
  assert.ok(r.removed.includes("phone") && r.removed.includes("email"));
});

test("a required field that was only private details gets a stand-in", () => {
  const mode = { createFields: [{ key: "hero", label: "Hero", hint: "", required: true }, { key: "place", label: "Place", hint: "", required: false }] } as any;
  const r = stripPIIFromValues(mode, { hero: "555-123-4567", place: "the moon" });
  assert.equal(r.values.hero, "a friend");
  assert.equal(r.values.place, "the moon");
  assert.deepEqual(r.touched, ["Hero"]);
});

test("a care alert is never repaired; with always-finish on, everything else is", () => {
  assert.equal(fixable([{ layer: "output", category: "care_alert" }]), false);
  assert.equal(fixable([{ layer: "prompt_shield", category: "jailbreak" }]), true);
  assert.equal(fixable([{ layer: "blocklist", category: "weapons" }, { layer: "care_alert" as any, category: "care_alert" }]), false);
});

test("private data, the blocklist, Content Safety and output screening are repairable", () => {
  assert.equal(fixable([{ layer: "pii", category: "phone" }]), true);
  assert.equal(fixable([{ layer: "blocklist", category: "weapons", detail: "sword" }]), true);
  assert.equal(fixable([{ layer: "content_safety", category: "Violence", severity: 4 }]), true);
  assert.equal(fixable([{ layer: "output", category: "scary_or_gore" }]), true);
  assert.equal(fixable([{ layer: "content_safety", category: "provider_filter" }]), true);
});

test("a prompt-attack verdict on a child's words is rewritten like any other hit", () => {
  assert.equal(fixable([{ layer: "blocklist", category: "weapons" }, { layer: "prompt_shield", category: "jailbreak" }]), true);
});

test("the gentler instruction names what was flagged and keeps the format", () => {
  const rule = softenRule([{ layer: "output", category: "Violence" }, { layer: "content_safety", category: "provider_filter" }]);
  assert.match(rule, /Violence/);
  assert.doesNotMatch(rule, /provider_filter/);
  assert.match(rule, /same output format/);
});

test("the child's note lists each repair once, as one sentence", () => {
  const note = fixNote(["I swapped the sword for a foam noodle.", "I swapped the sword for a foam noodle.", "I left out some personal details"]);
  assert.equal(note, " I changed a few things to keep it kid-friendly: I swapped the sword for a foam noodle; I left out some personal details.");
  assert.equal(fixNote([]), "");
});
