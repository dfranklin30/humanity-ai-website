/**
 * Hub hierarchy and Advanced Special Training (roadmap 4 and 6): which shelf a
 * shared piece lands on, and the shape of the opt-in mode. Run with:
 *   pnpm --filter @workspace/api-server test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { hubShelf, ALL_MODES, ADVANCED_MODE } from "./store";
import { getMode, validateInput, userPrompt, publicModes } from "./modes";

test("a game is always a game: Arcade; everything else is Gallery", () => {
  assert.equal(hubShelf("game"), "arcade");
  for (const k of ["story", "image", "quest", "video", "robot", "audio", "site", "adventure"]) assert.equal(hubShelf(k), "gallery", k);
});

test("Advanced Special Training is a real mode but never in the default list", () => {
  assert.ok(getMode("advanced"));
  assert.equal(ADVANCED_MODE, "advanced");
  assert.ok(!ALL_MODES.includes("advanced"));
  assert.ok(publicModes().some((m) => m.id === "advanced"));
});

test("an advanced order must say what to build, and only the two kinds are allowed", () => {
  const mode = getMode("advanced")!;
  const missing = validateInput(mode, "create", { title: "Axolotls", about: "a page about axolotls" });
  assert.equal(missing.ok, false);
  const wrong = validateInput(mode, "create", { make: "a blog", title: "Axolotls", about: "a page about axolotls" });
  assert.equal(wrong.ok, false);
  const site = validateInput(mode, "create", { make: "one-page website", title: "Axolotls", about: "a page about axolotls" });
  assert.equal(site.ok, true);
  const cyoa = validateInput(mode, "create", { make: "choose-your-own-adventure", title: "The Glow Cave", about: "a cave" });
  assert.equal(cyoa.ok, true);
});

test("editing a website sends the model the HTML path; editing an adventure sends the JSON path", () => {
  const mode = getMode("advanced")!;
  const change = validateInput(mode, "change", { change: "make the header blue" });
  assert.equal(change.ok, true);
  if (!change.ok) return;
  const html = userPrompt(mode, change, "<!DOCTYPE html><html><body>hi</body></html>");
  assert.match(html, /full updated HTML document/);
  const json = userPrompt(mode, change, JSON.stringify({ format: "adventure", pages: [] }));
  assert.match(json, /full updated JSON/);
});
