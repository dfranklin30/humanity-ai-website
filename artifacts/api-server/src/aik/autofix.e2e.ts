/**
 * Finish every order, end to end against a running kids API in mock mode.
 *
 *   AIK_MOCK_AI=true server (see hold.e2e.ts for the environment), then:
 *   BASE_URL=http://localhost:5055 DATABASE_URL=postgres://aik@127.0.0.1:55432/aik \
 *     pnpm --filter @workspace/api-server exec tsx src/aik/autofix.e2e.ts
 *
 * In mock mode [[unsafe]] stands for a Content Safety hit the rewrite can
 * repair, [[stuck]] for one it cannot, and [[jailbreak]] for Prompt Shields.
 * The script walks: a repaired order → done with a note; private details →
 * taken out, done; a prompt attack → blocked; repairs used up → held; then
 * every studio, twice, from the facilitator's Hub → done.
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

async function waitFor(get: () => Promise<any>, done: (r: any) => boolean, label: string, ms = 120_000) {
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
const settled = (r: any) => ["done", "blocked", "failed", "held"].includes(r.status);

let passed = 0;
function ok(label: string) {
  passed++;
  console.log(`✔ ${label}`);
}

/** A sample order for any studio, built from its own field hints and choices. */
function sampleInput(mode: any): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of mode.createFields ?? []) {
    if (f.choices?.length) values[f.key] = f.choices[0];
    else values[f.key] = String(f.hint ?? f.label).split(",")[0].trim() || f.label;
  }
  return values;
}

async function main() {
  const db = new pg.Client({ connectionString: DB });
  await db.connect();
  const config = (await (await fetch(`${API}/config`)).json()) as any;
  assert.equal(config.capabilities?.autofix?.enabled, true, "autofix is on");

  /* ---- facilitator, class, child ---- */
  const fac = new Jar();
  const email = `autofix-e2e-${stamp}@example.test`;
  const password = "correct-horse-battery-staple";
  await fac.call("POST", "/auth/signup", { email, password, displayName: "Autofix E2E" }, 200);
  await db.query("UPDATE aik_facilitators SET email_verified = true, role = 'facilitator' WHERE email = $1", [email]);
  await fac.call("POST", "/facilitator/login", { email, password }, 200);
  const klass = (await fac.call("POST", "/facilitator/classes", { name: `Autofix E2E ${stamp}` }, 200)).json.class;
  const kid = new Jar();
  await kid.call("POST", "/child/class", { code: klass.code }, 200);
  await kid.call("POST", "/child/join", { code: klass.code, nickname: "TestOwl", avatar: "🦉" }, 200);
  ok("facilitator, class and child ready");

  const kidReq = (id: number) => kid.call("GET", `/child/requests/${id}`, undefined, 200).then((r) => r.json.request);
  const facReq = (id: number) => fac.call("GET", `/facilitator/requests/${id}`, undefined, 200).then((r) => r.json.request);
  const audited = async (id: number, action: string) =>
    (await db.query("SELECT 1 FROM aik_audit WHERE action = $1 AND detail->>'requestId' = $2", [action, String(id)])).rowCount === 1;

  /* ---- 1. a repairable hit is rewritten and the order finishes ---- */
  let r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "a tall strong hero [[unsafe]]" } }, 200)).json.request;
  let s = await waitFor(() => kidReq(r.id), settled, "repaired order settles");
  assert.equal(s.status, "done", `expected done, got ${s.status}: ${s.message}`);
  assert.match(s.message ?? "", /kid-friendly/i, "the child is told what changed");
  assert.ok(s.resultArtifactId, "a product was made");
  let f = await facReq(r.id);
  assert.ok(f.flags.some((x: any) => x.layer === "content_safety"), "the original hit stays on the record");
  assert.ok(f.flags.some((x: any) => x.layer === "autofix" && x.category === "order_rewritten"), "the repair is on the record");
  assert.ok(await audited(r.id, "request_autofixed"), "request_autofixed audited");
  ok("Content Safety hit → order rewritten → done, child told, repair on the record, audited");

  /* ---- 2. private details are taken out and the order finishes ---- */
  r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "my friend, call 404-555-0123" } }, 200)).json.request;
  s = await waitFor(() => kidReq(r.id), settled, "PII order settles");
  assert.equal(s.status, "done", `expected done, got ${s.status}: ${s.message}`);
  assert.match(s.message ?? "", /personal details/i);
  f = await facReq(r.id);
  assert.ok(f.flags.some((x: any) => x.layer === "autofix" && x.category === "pii_removed"));
  ok("private details → taken out → done");

  const always = Boolean(config.capabilities?.autofix?.alwaysFinish);

  /* ---- 3. a prompt-attack verdict on a child's words: rewritten (always-finish) or a hard stop ---- */
  r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "a hero [[jailbreak]]" } }, 200)).json.request;
  s = await waitFor(() => kidReq(r.id), settled, "jailbreak order settles");
  if (always) {
    assert.equal(s.status, "done", `expected done, got ${s.status}: ${s.message}`);
    f = await facReq(r.id);
    assert.ok(f.flags.some((x: any) => x.layer === "prompt_shield"), "the verdict stays on the record");
    assert.ok(f.flags.some((x: any) => x.layer === "autofix" && x.category === "safe_take"), "the safe take is on the record");
    ok("prompt-attack verdict → gentle rewrites, then a safe take → done, all on the record");
  } else {
    assert.equal(s.status, "blocked", `Prompt Shields should block, got ${s.status}`);
    ok("prompt attack → blocked, never repaired");
  }

  /* ---- 4. when the gentle repairs run out: a safe take finishes it (always-finish) or it waits ---- */
  r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "a hero [[stuck]]" } }, 200)).json.request;
  s = await waitFor(() => kidReq(r.id), settled, "stuck order settles");
  f = await facReq(r.id);
  if (always) {
    assert.equal(s.status, "done", `expected done, got ${s.status}: ${s.message}`);
    assert.ok(f.flags.some((x: any) => x.layer === "autofix" && x.category === "safe_take"), "safe_take flag on the record");
    assert.match(s.message ?? "", /kid-friendly/i);
    ok("gentle repairs used up → safe take → done, child told");
  } else {
    assert.equal(s.status, "held", `expected held, got ${s.status}: ${s.message}`);
    assert.ok(f.flags.some((x: any) => x.layer === "autofix" && x.category === "exhausted"), "exhausted flag on the record");
    assert.ok(await audited(r.id, "request_held"), "request_held audited");
    ok("repairs used up → held for the facilitator (not blocked), audited");
  }

  /* ---- 4b. screening unreachable: retried, then skipped with a flag (always-finish) or held ---- */
  if (config.capabilities?.screening?.required) {
    r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "a hero [[screening-down]]" } }, 200)).json.request;
    s = await waitFor(() => kidReq(r.id), settled, "screening-down order settles", 180_000);
    assert.doesNotMatch(s.message ?? "", /taking a break/i);
    f = await facReq(r.id);
    if (always) {
      assert.equal(s.status, "done", `expected done, got ${s.status}: ${s.message}`);
      assert.ok(f.flags.some((x: any) => x.layer === "system" && x.category === "content_safety_skipped"), "the skip is on the record");
      ok("screening unreachable → retried, then skipped with a flag → done");
    } else {
      assert.equal(s.status, "held", `expected held, got ${s.status}: ${s.message}`);
      assert.ok(f.flags.some((x: any) => x.layer === "system" && x.category === "content_safety_unavailable"), "facilitator sees why");
      ok("screening unreachable → held, with the reason on the record");
    }
  }

  /* ---- 5. a clean order is untouched ---- */
  r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: ORDER }, 200)).json.request;
  s = await waitFor(() => kidReq(r.id), settled, "clean order settles");
  assert.equal(s.status, "done");
  f = await facReq(r.id);
  assert.ok(!f.flags.some((x: any) => x.layer === "autofix"), "no repair flags on a clean order");
  ok("a clean order goes straight through with no repair");

  /* ---- 6. every studio, twice, from the Hub: a product every time ---- */
  const hubReq = (id: number) => fac.call("GET", `/hub/requests/${id}`, undefined, 200).then((r) => r.json.request ?? r.json);
  const results: string[] = [];
  for (const mode of config.modes) {
    for (let round = 1; round <= 2; round++) {
      const body = mode.interaction === "chat" ? { mode: mode.id, kind: "chat", input: { message: "How do I add two fractions?" } } : { mode: mode.id, kind: "create", input: sampleInput(mode) };
      const started = Date.now();
      const placed = await fac.call("POST", "/hub/requests", body, 200);
      const id = placed.json.request?.id ?? placed.json.id;
      const done = await waitFor(() => hubReq(id), settled, `${mode.id} #${round} settles`, 180_000);
      results.push(`${mode.id} #${round}: ${done.status} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
      assert.equal(done.status, "done", `${mode.id} #${round}: ${done.status} ${done.message}`);
    }
  }
  console.log(results.map((x) => `    ${x}`).join("\n"));
  ok(`every studio made a product twice (${config.modes.length} studios)`);

  /* ---- 7. everything is exportable: one file per piece, and a ZIP of all of it ---- */
  const mine = (await kid.call("GET", "/child/me", undefined, 200)).json.portfolio as any[];
  assert.ok(mine.length >= 1, "the child has pieces to export");
  for (const piece of mine) {
    const res = await fetch(`${API}/artifacts/${piece.id}/export`, { headers: { cookie: kid.cookie } });
    assert.equal(res.status, 200, `export of ${piece.kind} #${piece.id} → ${res.status}`);
    assert.match(res.headers.get("content-disposition") ?? "", /attachment/);
    assert.ok((await res.arrayBuffer()).byteLength > 0, `${piece.kind} export is not empty`);
  }
  const zipRes = await fetch(`${API}/child/export.zip`, { headers: { cookie: kid.cookie } });
  assert.equal(zipRes.status, 200);
  const zipBytes = Buffer.from(await zipRes.arrayBuffer());
  assert.equal(zipBytes.readUInt32LE(0), 0x04034b50, "a real ZIP");
  const hubZip = await fetch(`${API}/hub/export.zip`, { headers: { cookie: fac.cookie } });
  assert.equal(hubZip.status, 200);
  ok(`every piece exports as a file (${mine.length} checked) and the portfolio and Hub export as ZIPs`);

  await db.end();
  console.log(`\n${passed} checks passed`);
}

main().catch((err) => {
  console.error(`\n✖ ${err?.message ?? err}`);
  process.exit(1);
});
