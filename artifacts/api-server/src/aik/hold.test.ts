/**
 * Hold-for-facilitator: which screening verdicts wait for an adult and which
 * stay a hard stop. Run with:  pnpm --filter @workspace/api-server test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldHold, wasUnblocked, UNBLOCKED_FLAG } from "./pipeline";

test("a Content Safety text hit holds the order", () => {
  assert.equal(shouldHold([{ layer: "content_safety", category: "Violence", severity: 4 }]), true);
});

test("the video model's own refusal holds the order", () => {
  assert.equal(shouldHold([{ layer: "content_safety", category: "provider_filter", detail: "Sora refused a shot" }]), true);
});

test("output screening holds the order", () => {
  assert.equal(shouldHold([{ layer: "output", category: "Hate", severity: 2 }]), true);
});

test("private data never waits: PII is a hard stop", () => {
  assert.equal(shouldHold([{ layer: "pii", category: "phone" }]), false);
  assert.equal(shouldHold([{ layer: "pii", category: "phone" }, { layer: "content_safety", category: "Violence" }]), false);
});

test("the blocklist and Prompt Shields are hard stops", () => {
  assert.equal(shouldHold([{ layer: "blocklist", category: "weapons" }]), false);
  assert.equal(shouldHold([{ layer: "prompt_shield", category: "jailbreak" }]), false);
});

test("system faults and grown-up redirects are not held", () => {
  assert.equal(shouldHold([{ layer: "system", category: "content_safety_unavailable" }]), false);
  assert.equal(shouldHold([{ layer: "output", category: "redirect" }]), false);
  assert.equal(shouldHold([{ layer: "output", category: "care_alert" }]), false);
});

test("no flags, or only a facilitator flag, is nothing to hold", () => {
  assert.equal(shouldHold([]), false);
  assert.equal(shouldHold(undefined as unknown as unknown[]), false);
  assert.equal(shouldHold([UNBLOCKED_FLAG]), false);
});

test("a second refusal after an unblock holds again, with the facilitator flag along for the ride", () => {
  assert.equal(shouldHold([UNBLOCKED_FLAG, { layer: "content_safety", category: "provider_filter" }]), true);
});

test("wasUnblocked reads the facilitator's decision off the stored flags", () => {
  assert.equal(wasUnblocked({ flags: [UNBLOCKED_FLAG] }), true);
  assert.equal(wasUnblocked({ flags: [{ layer: "content_safety", category: "Violence" }] }), false);
  assert.equal(wasUnblocked({ flags: null }), false);
  assert.equal(wasUnblocked({ flags: "garbage" }), false);
});
