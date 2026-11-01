/**
 * The video lane gate: never more than `limit` Sora jobs in flight, the rest
 * wait their turn in order, and a failing job frees its lane.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Gate } from "./ai";

const tick = () => new Promise((r) => setTimeout(r, 5));

test("never runs more than the limit at once, and runs everything", async () => {
  const gate = new Gate(2);
  let running = 0;
  let peak = 0;
  const finished: number[] = [];
  await Promise.all(
    [1, 2, 3, 4, 5].map((n) =>
      gate.run(async () => {
        running++;
        peak = Math.max(peak, running);
        await tick();
        await tick();
        running--;
        finished.push(n);
      }),
    ),
  );
  assert.equal(peak, 2);
  assert.equal(finished.length, 5);
  assert.deepEqual([...finished].sort(), [1, 2, 3, 4, 5]);
});

test("reports how many are waiting", async () => {
  const gate = new Gate(1);
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  const first = gate.run(() => held);
  const second = gate.run(async () => "second");
  const third = gate.run(async () => "third");
  await tick();
  assert.equal(gate.queued, 2);
  release();
  assert.equal(await second, "second");
  assert.equal(await third, "third");
  await first;
  assert.equal(gate.queued, 0);
});

test("a job that throws frees its lane for the next one", async () => {
  const gate = new Gate(1);
  await assert.rejects(gate.run(async () => {
    throw new Error("boom");
  }));
  assert.equal(await gate.run(async () => "after"), "after");
});

test("returns each job's own result", async () => {
  const gate = new Gate(3);
  const results = await Promise.all([1, 2, 3, 4].map((n) => gate.run(async () => n * 10)));
  assert.deepEqual(results, [10, 20, 30, 40]);
});
