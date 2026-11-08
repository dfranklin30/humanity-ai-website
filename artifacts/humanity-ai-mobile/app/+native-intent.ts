/**
 * Links into the app.
 *
 * Android hands the app any https://aiforkids.humanityplusai.org/aiforkids/…
 * link a person taps (the class-code links on flyers and in emails, a
 * facilitator's dashboard bookmark). Those paths are not routes in the app,
 * so this maps them onto the Kids tab: /aiforkids/hub → the Hub panel, and
 * any deeper page (a /week/3 page, a studio room) is loaded inside the
 * panel it belongs to. Everything else goes through untouched.
 */
// Kept free of app imports so it can be tested in plain node.
const KIDS_ORIGIN = "https://aiforkids.humanityplusai.org";

const KIDS = /^\/aiforkids\/(studio|hub|facilitator|week)(\/|$)/;

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const u = new URL(path, KIDS_ORIGIN);
    const m = KIDS.exec(u.pathname);
    if (!m) return path;
    const room = m[1] === "week" ? "hub" : m[1];
    const exact = `/aiforkids/${room}`;
    const bare = u.pathname === exact || u.pathname === `${exact}/`;
    const deeper = bare && !u.search ? "" : u.pathname + u.search;
    const q = new URLSearchParams({ room });
    if (deeper) q.set("url", `${KIDS_ORIGIN}${deeper}`);
    return `/studio?${q.toString()}`;
  } catch {
    return path;
  }
}
