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

  /* ---- 3. a prompt attack is still a hard stop ---- */
  r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "a hero [[jailbreak]]" } }, 200)).json.request;
  s = await waitFor(() => kidReq(r.id), settled, "jailbreak order settles");
  assert.equal(s.status, "blocked", `Prompt Shields should block, got ${s.status}`);
  ok("prompt attack → blocked, never repaired");

  /* ---- 4. when the repairs run out the order waits for the facilitator ---- */
  r = (await kid.call("POST", "/child/requests", { mode: "video", kind: "create", input: { ...ORDER, what: "a hero [[stuck]]" } }, 200)).json.request;
  s = await waitFor(() => kidReq(r.id), settled, "stuck order settles");
  assert.equal(s.status, "held", `expected held, got ${s.status}: ${s.message}`);
  f = await facReq(r.id);
  assert.ok(f.flags.some((x: any) => x.layer === "autofix" && x.category === "exhausted"), "exhausted flag on the record");
  assert.ok(await audited(r.id, "request_held"), "request_held audited");
  ok("repairs used up → held for the facilitator (not blocked), audited");

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

  await db.end();
  console.log(`\n${passed} checks passed`);
}

main().catch((err) => {
  console.error(`\n✖ ${err?.message ?? err}`);
  process.exit(1);
});
