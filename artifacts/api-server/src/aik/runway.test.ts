/**
 * Runway video provider: the small pure pieces. Run with:
 *   pnpm --filter @workspace/api-server test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { runwayDuration, runwayRatio, runwayFailureIsSafety } from "./ai";

test("shot length snaps to what each Runway model accepts", () => {
  assert.equal(runwayDuration("gen4_turbo", 4), 5);
  assert.equal(runwayDuration("gen4_turbo", 8), 10);
  assert.equal(runwayDuration("gen4.5", 8), 8);
  assert.equal(runwayDuration("gen4.5", 12), 10);
  assert.equal(runwayDuration("gen4.5", 1), 2);
  assert.equal(runwayDuration("veo3.1_fast", 5), 6);
  assert.equal(runwayDuration("veo3.1_fast", 12), 8);
});

test("the frame size becomes a Runway ratio", () => {
  assert.equal(runwayRatio("1280x720"), "1280:720");
  assert.equal(runwayRatio("720x1280"), "720:1280");
  assert.equal(runwayRatio(""), "1280:720");
});

test("Runway's safety failures are content refusals; everything else is a plain failure", () => {
  assert.equal(runwayFailureIsSafety("SAFETY.INPUT.TEXT"), true);
  assert.equal(runwayFailureIsSafety("SAFETY.OUTPUT.VIDEO"), true);
  assert.equal(runwayFailureIsSafety("INPUT_PREPROCESSING.SAFETY.TEXT"), true);
  assert.equal(runwayFailureIsSafety("INTERNAL.BAD_OUTPUT.01"), false);
  assert.equal(runwayFailureIsSafety("THIRD_PARTY.UNAVAILABLE"), false);
  assert.equal(runwayFailureIsSafety(undefined), false);
});
