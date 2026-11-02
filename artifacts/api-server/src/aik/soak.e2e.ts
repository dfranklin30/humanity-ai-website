/**
 * Soak: does every studio produce a product, time and again, on a real
 * deployment? Places orders from a facilitator's Hub (the same pipeline the
 * children use, with real models and real screening) and reports what came
 * back. Read-only on the deployment except for the orders it places.
 *
 *   FACILITATOR_EMAIL=you@example.org FACILITATOR_PASSWORD='…' \
 *   BASE_URL=https://aiforkids.humanityplusai.org MODES=game,story,quest ROUNDS=3 \
 *     pnpm --filter @workspace/api-server exec tsx src/aik/soak.e2e.ts
 *
 * MODES defaults to every studio; ROUNDS to 1; TIMEOUT_MS (per order) to 20 min.
 * Media studios cost real generations (pictures, songs, Sora shots): keep
 * ROUNDS small for video, story and music. Exit code 1 if any order did not
 * end in "done". The password is read from the environment and never printed.
 */
const BASE = (process.env.BASE_URL ?? "https://aiforkids.humanityplusai.org").replace(/\/$/, "");
const API = `${BASE}/api/aik`;
const EMAIL = process.env.FACILITATOR_EMAIL ?? "";
const PASSWORD = process.env.FACILITATOR_PASSWORD ?? "";
const ROUNDS = Math.max(1, Number(process.env.ROUNDS) || 1);
const TIMEOUT = Math.max(30_000, Number(process.env.TIMEOUT_MS) || 20 * 60_000);
const ONLY = (process.env.MODES ?? "").split(",").map((s) => s.trim()).filter(Boolean);

let cookie = "";
async function call(method: string, path: string, body?: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

function sampleInput(mode: any, round: number): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of mode.createFields ?? []) {
    if (f.choices?.length) values[f.key] = f.choices[round % f.choices.length];
    else {
      const options = String(f.hint ?? f.label).split(",").map((s) => s.trim()).filter(Boolean);
      values[f.key] = options[round % options.length] || f.label;
    }
  }
  return values;
}

async function main() {
  if (!EMAIL || !PASSWORD) throw new Error("Set FACILITATOR_EMAIL and FACILITATOR_PASSWORD (a facilitator account on the deployment).");
  const config = (await call("GET", "/config")).json;
  if (!config?.enabled) throw new Error("The Studio is not enabled on this deployment.");
  console.log(`Studio at ${BASE}: autofix ${config.capabilities?.autofix?.enabled ? "on" : "off"}, mock ${config.capabilities?.mock ? "on" : "off"}`);

  const login = await call("POST", "/facilitator/login", { email: EMAIL, password: PASSWORD });
  if (login.status !== 200) throw new Error(`Login failed (${login.status}): ${login.json?.error ?? ""}`);
  console.log(`Signed in as ${login.json.facilitator?.displayName ?? EMAIL}\n`);

  const modes = (config.modes as any[]).filter((m) => !ONLY.length || ONLY.includes(m.id));
  const rows: { mode: string; round: number; status: string; seconds: number; note: string; repairs: string }[] = [];
  for (const mode of modes) {
    for (let round = 1; round <= ROUNDS; round++) {
      const body = mode.interaction === "chat" ? { mode: mode.id, kind: "chat", input: { message: "How do I add two fractions with different bottoms?" } } : { mode: mode.id, kind: "create", input: sampleInput(mode, round) };
      const started = Date.now();
      const placed = await call("POST", "/hub/requests", body);
      if (placed.status !== 200) {
        rows.push({ mode: mode.id, round, status: `refused (${placed.status})`, seconds: 0, note: placed.json?.error ?? "", repairs: "" });
        continue;
      }
      const id = placed.json.request?.id ?? placed.json.id;
      let last: any = null;
      const until = Date.now() + TIMEOUT;
      while (Date.now() < until) {
        last = (await call("GET", `/hub/requests/${id}`)).json;
        last = last?.request ?? last;
        if (["done", "blocked", "failed", "held"].includes(last?.status)) break;
        await new Promise((r) => setTimeout(r, 3000));
      }
      const repairs = (last?.flags ?? []).filter((f: any) => f.layer === "autofix").map((f: any) => f.category).join(", ");
      rows.push({ mode: mode.id, round, status: last?.status ?? "timeout", seconds: Math.round((Date.now() - started) / 1000), note: String(last?.message ?? "").slice(0, 80), repairs });
      console.log(`${mode.id.padEnd(9)} #${round}  ${String(rows[rows.length - 1].status).padEnd(8)} ${String(rows[rows.length - 1].seconds).padStart(5)}s  ${repairs ? `repairs: ${repairs}` : ""}`);
    }
  }

  const bad = rows.filter((r) => r.status !== "done");
  console.log(`\n${rows.length - bad.length} of ${rows.length} orders ended in a product.`);
  if (bad.length) {
    console.log("Not done:");
    for (const b of bad) console.log(`  ${b.mode} #${b.round}: ${b.status} — ${b.note}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\n✖ ${err?.message ?? err}`);
  process.exit(1);
});
