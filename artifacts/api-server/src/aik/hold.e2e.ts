/**
 * Hold-for-facilitator, end to end against a running kids API in mock mode.
 *
 *   AIK_MOCK_AI=true server (see .claude/launch.json "kids-api-mock"), then:
 *   BASE_URL=http://localhost:5055 DATABASE_URL=postgres://aik@127.0.0.1:55432/aik \
 *     pnpm --filter @workspace/api-server exec tsx src/aik/hold.e2e.ts
 *
 * In mock mode the token [[unsafe]] stands in for a Content Safety hit and
 * [[jailbreak]] for Prompt Shields (safety.ts). The script signs up a
 * facilitator (verifying the address directly in the database, since no mail
 * is configured locally), opens a class, joins it as a child, and walks every
 * branch: held → unblocked with edits → done; held → unblocked as written →
 * done; held → kept blocked; PII → blocked outright; jailbreak → blocked
 * outright; a child cannot call the facilitator routes; a done order cannot
 * be unblocked.
 */
import assert from "node:assert/strict";
import pg from "pg";

const BASE = (process.env.BASE_URL ?? "http://localhost:5055").replace(/\/$/, "");
const API = `${BASE}/api/aik`;
const DB = process.env.DATABASE_URL ?? "postgres://aik@127.0.0.1:55432/aik";
const stamp = Date.now().toString(36);

class Jar {
  cookie = "";
  async call<T = any>(method: string, path: string, body?: unknown, expect?: number): Promise<{ status: number; json: T }> {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { "content-type": "application/json", ...(this.cookie ? { cookie: this.cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get("set-cookie");
    if (set) this.cookie = set.split(";")[0];
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 200) };
    }
    if (expect !== undefined) assert.equal(res.status, expect, `${method} ${path} → ${res.status} ${text.slice(0, 200)}`);
    return { status: res.status, json };
  }
}

async function waitFor(get: () => Promise<any>, done: (r: any) => boolean, label: string, ms = 60_000) {
  const until = Date.now() + ms;
  let last: any;
  while (Date.now() < until) {
    last = await get();
    if (done(last)) return last;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${label}: timed out; last = ${JSON.stringify(last).slice(0, 300)}`);
}

const ORDER = { title: "Hero Saves the Day", what: "a tall strong hero", action: "rescues people from a storm", where: "a sunny cartoon city", style: "cartoon" };

let passed = 0;
function ok(label: string) {
  passed++;
  console.log(`✔ ${label}`);
}

async function main() {
  const db = new pg.Client({ connectionString: DB });
  await db.connect();

  /* ---- facilitator account, class, child ---- */
  const fac = new Jar();
  const email = `hold-e2e-${stamp}@example.test`;
  const password = "correct-horse-battery-staple";
  await fac.call("POST", "/auth/signup", { email, password, displayName: "E2E Facilitator" }, 200);
  // No mail locally, and new accounts are Hub members until an admin grants facilitator access: do both in the database.
  await db.query("UPDATE aik_facilitators SET email_verified = true, role = 'facilitator' WHERE email = $1", [email]);
  await fac.call("POST", "/facilitator/login", { email, password }, 200);
  const klass = (await fac.call("POST", "/facilitator/classes", { name: `Hold E2E ${stamp}` }, 200)).json.class;
  assert.ok(klass?.id && klass?.code, "class has id and code");
  ok("facilitator signed up, verified, logged in, class created");

  const kid = new Jar();
  await kid.call("POST", "/child/class", { code: klass.code }, 200);
  await kid.call("POST", "/child/join", { code: klass.code, nickname: "TestFox", avatar: "🦊" }, 200);
  const me = (await kid.call("GET", "/child/me", undefined, 200)).json;
  assert.equal(me.child.nickname, "TestFox");
  ok("child joined the class");

  const kidReq = (id: number) => kid.call("GET", `/child/requests/${id}`, undefined, 200).then((r) => r.json.request);
  const facReq = (id: number) => fac.call("GET", `/facilitator/requests/${id}`, undefined, 200).then((r) => r.json.request);
  const settled = (r: any) => ["done", "blocked", "failed", "held"].includes(r.status);

  /* ---- 1. a judgment-call hit is HELD, not blocked ---- */
  let r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "a tall strong hero [[unsafe]]" } }, 200)).json.request;
  let s = await waitFor(() => kidReq(r.id), settled, "order 1 settles");
  assert.equal(s.status, "held", `expected held, got ${s.status}: ${s.message}`);
  assert.match(s.message, /facilitator is coming/i);
  assert.equal(s.flags, undefined, "child view hides flags");
  const f1 = await facReq(r.id);
  assert.equal(f1.status, "held");
  assert.ok(f1.flags.some((f: any) => f.layer === "content_safety"), "facilitator sees the content_safety flag");
  const audit = await db.query("SELECT action FROM aik_audit WHERE class_id = $1 AND detail->>'requestId' = $2 ORDER BY id", [klass.id, String(r.id)]);
  assert.ok(audit.rows.some((x) => x.action === "request_held"), "request_held audited");
  ok("Content Safety hit → held, child told the facilitator is coming, flag visible to facilitator, audited");

  /* ---- 2. unblock WITH EDITS → runs → done, flag carried ---- */
  await fac.call("POST", `/facilitator/requests/${r.id}/unblock`, { input: { what: "a tall strong hero in a red cape" } }, 200);
  s = await waitFor(() => kidReq(r.id), (x) => x.status !== "held" && settled(x), "order 1 re-runs", 120_000);
  assert.equal(s.status, "done", `after unblock with edits: ${s.status} ${s.message}`);
  assert.ok(s.resultArtifactId, "has a result artifact");
  assert.equal(s.input.what, "a tall strong hero in a red cape", "edited words were used");
  const f2 = await facReq(r.id);
  assert.ok(f2.flags.some((f: any) => f.layer === "facilitator" && f.category === "unblocked"), "facilitator:unblocked flag on the record");
  assert.match(f2.flags.find((f: any) => f.layer === "facilitator").detail, /edited/);
  ok("unblock with edited words → done, edits used, decision on the record");

  /* ---- 3. unblock AS WRITTEN → runs past Content Safety's verdict → done ---- */
  r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "a tall strong hero [[unsafe]]" } }, 200)).json.request;
  s = await waitFor(() => kidReq(r.id), settled, "order 2 settles");
  assert.equal(s.status, "held");
  await fac.call("POST", `/facilitator/requests/${r.id}/unblock`, {}, 200);
  s = await waitFor(() => kidReq(r.id), (x) => x.status !== "held" && settled(x), "order 2 re-runs", 120_000);
  assert.equal(s.status, "done", `after unblock as written: ${s.status} ${s.message}`);
  const f3 = await facReq(r.id);
  assert.match(f3.flags.find((f: any) => f.layer === "facilitator").detail, /as the child wrote it/);
  ok("unblock as written → done (Content Safety's text verdict skipped, everything else ran)");

  /* ---- 4. keep blocked ---- */
  r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "a tall strong hero [[unsafe]]" } }, 200)).json.request;
  s = await waitFor(() => kidReq(r.id), settled, "order 3 settles");
  assert.equal(s.status, "held");
  await fac.call("POST", `/facilitator/requests/${r.id}/keep-blocked`, {}, 200);
  s = await kidReq(r.id);
  assert.equal(s.status, "blocked");
  assert.ok(s.message && !/facilitator is coming/i.test(s.message), "child gets the gentle 'try another way' message");
  const kept = await db.query("SELECT 1 FROM aik_audit WHERE action = 'request_kept_blocked' AND detail->>'requestId' = $1", [String(r.id)]);
  assert.equal(kept.rowCount, 1, "request_kept_blocked audited");
  ok("keep blocked → blocked, audited");

  /* ---- 5. keep-blocked and unblock refuse the wrong states ---- */
  await fac.call("POST", `/facilitator/requests/${r.id}/keep-blocked`, {}, 409); // already blocked
  const doneId = f2.id;
  await fac.call("POST", `/facilitator/requests/${doneId}/unblock`, {}, 409); // done
  ok("state checks: cannot keep-block a blocked order or unblock a done one");

  /* ---- 6. a blocked order CAN be unblocked (an earlier hard no is never final without an adult) ---- */
  await fac.call("POST", `/facilitator/requests/${r.id}/unblock`, { input: { what: "a brave gardener" } }, 200);
  s = await waitFor(() => kidReq(r.id), (x) => x.status !== "blocked" && settled(x), "order 3 re-runs", 120_000);
  assert.equal(s.status, "done", `blocked → unblocked: ${s.status} ${s.message}`);
  ok("a kept-blocked order can still be unblocked later and finishes");

  /* ---- 7. hard stops stay hard: PII and prompt attacks block outright ---- */
  r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "my friend, call 404-555-0123" } }, 200)).json.request;
  s = await waitFor(() => kidReq(r.id), settled, "PII order settles");
  assert.equal(s.status, "blocked", `PII should block, got ${s.status}`);
  assert.match(s.message, /names, phone numbers/i);
  r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "a hero [[jailbreak]]" } }, 200)).json.request;
  s = await waitFor(() => kidReq(r.id), settled, "jailbreak order settles");
  assert.equal(s.status, "blocked", `Prompt Shields should block, got ${s.status}`);
  ok("PII and Prompt Shields still block immediately (never held)");

  /* ---- 8. a clean order is untouched by all this ---- */
  r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: ORDER }, 200)).json.request;
  s = await waitFor(() => kidReq(r.id), settled, "clean order settles", 120_000);
  assert.equal(s.status, "done", `clean order: ${s.status} ${s.message}`);
  ok("a clean order still goes straight through");

  /* ---- 9. authorization: children and strangers cannot decide ---- */
  const heldAgain = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "a hero [[unsafe]]" } }, 200)).json.request;
  await waitFor(() => kidReq(heldAgain.id), settled, "order 4 settles");
  const anon = new Jar();
  const a1 = await anon.call("POST", `/facilitator/requests/${heldAgain.id}/unblock`, {});
  assert.ok([401, 403].includes(a1.status), `anonymous unblock should be refused, got ${a1.status}`);
  const k1 = await kid.call("POST", `/facilitator/requests/${heldAgain.id}/unblock`, {});
  assert.ok([401, 403].includes(k1.status), `child unblock should be refused, got ${k1.status}`);
  const other = new Jar();
  const email2 = `hold-e2e-other-${stamp}@example.test`;
  await other.call("POST", "/auth/signup", { email: email2, password, displayName: "Other Facilitator" }, 200);
  await db.query("UPDATE aik_facilitators SET email_verified = true, role = 'facilitator' WHERE email = $1", [email2]);
  await other.call("POST", "/facilitator/login", { email: email2, password }, 200);
  const o1 = await other.call("POST", `/facilitator/requests/${heldAgain.id}/unblock`, {});
  assert.equal(o1.status, 404, "another facilitator cannot touch this class's order");
  const o2 = await other.call("POST", `/facilitator/requests/${heldAgain.id}/keep-blocked`, {});
  assert.equal(o2.status, 404);
  ok("only the class's own facilitator can unblock or keep blocked");

  /* ---- 10. bad edits are rejected, the order stays held ---- */
  const bad = await fac.call("POST", `/facilitator/requests/${heldAgain.id}/unblock`, { input: { what: 12345 } });
  assert.equal(bad.status, 400);
  assert.equal((await kidReq(heldAgain.id)).status, "held");
  ok("malformed edits → 400, order still held");

  await db.end();
  console.log(`\n${passed} checks passed`);
}

main().catch((err) => {
  console.error("✖", err?.message ?? err);
  process.exit(1);
});
