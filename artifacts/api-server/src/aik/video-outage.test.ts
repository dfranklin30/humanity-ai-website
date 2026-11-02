/**
 * A dead video deployment (retired model, disabled deployment) is recognised
 * on the first failed submit and remembered, so the next orders skip straight
 * to the storyboard instead of burning nine submits and three pictures each.
 * Run with:  pnpm --filter @workspace/api-server test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { isDeploymentDown } from "./ai";
import { noteVideoOutage, videoOutage, clearVideoOutage } from "./config";

test("Foundry's 'Bad request for dependent service' means the deployment is gone", () => {
  const body = '{"error":{"message":"Bad request for dependent service","type":"invalid_request_error","code":"BadRequestForDependentService"}}';
  assert.equal(isDeploymentDown(400, body), true);
});

test("a retired model (410) and a missing deployment are outages too", () => {
  assert.equal(isDeploymentDown(410, "Gone"), true);
  assert.equal(isDeploymentDown(404, '{"error":{"code":"DeploymentNotFound","message":"The API deployment for this resource does not exist."}}'), true);
});

test("an ordinary bad request, a busy 429 and a content refusal are not outages", () => {
  assert.equal(isDeploymentDown(400, '{"error":{"message":"seconds must be one of 4, 8, 12"}}'), false);
  assert.equal(isDeploymentDown(429, "Too many running tasks"), false);
  assert.equal(isDeploymentDown(400, '{"error":{"code":"content_policy_violation"}}'), false);
});

test("an outage is remembered for a while, then forgotten", () => {
  clearVideoOutage();
  assert.equal(videoOutage(), null);
  noteVideoOutage("BadRequestForDependentService", 1_000);
  const o = videoOutage();
  assert.ok(o && /Dependent/.test(o.why));
  noteVideoOutage("still down", -1); // already expired
  assert.equal(videoOutage(), null);
  clearVideoOutage();
});
