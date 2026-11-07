/**
 * The idea banks: every free-text field in every room has enough ideas to
 * tap, and none of them trips the local screens a child's order goes through.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODES, IDEAS } from "./modes";
import { screenBlocklist, screenPII } from "./safety";

test("every free-text field in a form room has at least 12 ideas", () => {
  for (const mode of Object.values(MODES)) {
    if (mode.interaction === "chat") continue;
    for (const f of mode.createFields) {
      if (f.choices) continue;
      assert.ok((f.ideas?.length ?? 0) >= 12, `${mode.id}.${f.key} has ${f.ideas?.length ?? 0} ideas`);
      assert.equal(new Set(f.ideas).size, f.ideas!.length, `${mode.id}.${f.key} repeats an idea`);
    }
  }
});

test("every idea passes the PII and blocklist screens and fits the field", () => {
  for (const mode of Object.values(MODES)) {
    for (const f of mode.createFields) {
      for (const idea of f.ideas ?? []) {
        const flags = [...screenPII(idea), ...screenBlocklist(idea, "input")];
        assert.equal(flags.length, 0, `${mode.id}.${f.key} "${idea}": ${JSON.stringify(flags)}`);
        assert.ok(idea.length <= (f.maxChars ?? 120), `${mode.id}.${f.key} "${idea}" is too long`);
      }
    }
  }
});

test("IDEAS only names fields that exist", () => {
  for (const [modeId, bank] of Object.entries(IDEAS)) {
    const mode = MODES[modeId as keyof typeof MODES];
    assert.ok(mode, modeId);
    for (const key of Object.keys(bank!)) assert.ok(mode.createFields.some((f) => f.key === key), `${modeId}.${key}`);
  }
});
