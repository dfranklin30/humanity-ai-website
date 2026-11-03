/**
 * Export: every kind of piece becomes one file, and the ZIP writer produces an
 * archive another tool can open. Run with:  pnpm --filter @workspace/api-server test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { crc32 } from "node:zlib";
import { exportArtifact, exportBundle, zipStore, safeFileName } from "./export";

const row = (kind: string, content: string, extra: Partial<any> = {}): any => ({
  id: 1, class_id: 1, child_id: 1, kind, title: "Star Catcher", content, mime: "application/json", summary: null,
  approved: true, published: false, version: 1, parent_artifact_id: null, created_at: "2026-11-02T10:00:00.000Z", ...extra,
});

test("file names are safe and never empty", () => {
  assert.equal(safeFileName("Pim's <Big> Day / 2"), "Pims Big Day 2");
  assert.equal(safeFileName("!!!"), "my-project");
});

test("a game exports as the HTML itself", async () => {
  const f = await exportArtifact(row("game", "<!doctype html><title>x</title>", { mime: "text/html" }));
  assert.equal(f.name, "Star Catcher.html");
  assert.match(f.mime, /text\/html/);
});

test("a quest exports as a printable sheet with an answer key", async () => {
  const f = await exportArtifact(row("quest", JSON.stringify({ title: "Moon Quiz", items: [{ text: "How far is the moon?", answer: "About 384,000 km", sourceHint: "an encyclopedia" }] })));
  assert.equal(f.name, "Star Catcher - sheet.html");
  const html = f.bytes.toString("utf8");
  assert.match(html, /How far is the moon\?/);
  assert.match(html, /answer key/);
  assert.match(html, /384,000 km/);
});

test("a robot exports as a build sheet with the code", async () => {
  const f = await exportArtifact(row("robot", JSON.stringify({ name: "Snack Scout", job: "Finds snacks", parts: ["micro:bit"], steps: ["Tape it"], code: "basic.showIcon(IconNames.Heart)", safetyNote: "Batteries only." })));
  assert.match(f.bytes.toString("utf8"), /basic\.showIcon/);
  assert.match(f.bytes.toString("utf8"), /Batteries only/);
});

test("a storyboard with no clips exports as a printable storyboard; a chat as text", async () => {
  const v = await exportArtifact(row("video", JSON.stringify({ format: "movie", title: "Robot Gardener", style: "cartoon", shots: [{ shot: 1, description: "A robot waters flowers." }], madeWith: {} })));
  assert.equal(v.name, "Star Catcher - storyboard.html");
  assert.match(v.bytes.toString("utf8"), /waters flowers/);
  const c = await exportArtifact(row("chat", JSON.stringify({ turns: [{ role: "user", text: "How do fractions work?" }] }), { mime: "application/json" }));
  assert.equal(c.name, "Star Catcher.txt");
});

test("the ZIP has a readable central directory and correct CRCs", async () => {
  const a = Buffer.from("hello zip", "utf8");
  const zip = zipStore([{ name: "one.txt", bytes: a }, { name: "two/two.txt", bytes: Buffer.alloc(0) }]);
  assert.equal(zip.readUInt32LE(0), 0x04034b50, "local header signature");
  const eocd = zip.length - 22;
  assert.equal(zip.readUInt32LE(eocd), 0x06054b50, "end of central directory");
  assert.equal(zip.readUInt16LE(eocd + 10), 2, "two entries");
  const cdOffset = zip.readUInt32LE(eocd + 16);
  assert.equal(zip.readUInt32LE(cdOffset), 0x02014b50, "central directory signature");
  assert.equal(zip.readUInt32LE(cdOffset + 16), crc32(a) >>> 0, "crc of the first entry");
  assert.equal(zip.subarray(cdOffset + 46, cdOffset + 46 + 7).toString("utf8"), "one.txt");
});

test("a bundle has an index and numbers duplicate names", async () => {
  const zip = await exportBundle([row("game", "<html>", { title: "Same" }), row("game", "<html>", { title: "Same" })], () => "TestFox");
  const text = zip.toString("latin1");
  assert.match(text, /index\.txt/);
  assert.match(text, /TestFox\/Same\.html/);
  assert.match(text, /TestFox\/Same \(2\)\.html/);
});
