/**
 * Which half of the site this process is.
 *
 * One image, two jobs. The public website and the Kids AI Studio used to be
 * one container, which meant an events edit restarted the children's
 * platform, Google Ads loaded on a page a nine-year-old was typing into, and
 * a bug in either took down both.
 *
 *   APP_ROLE=site   humanityplusai.org: the website, blog, donations, events.
 *                   The Studio API is not mounted; the Studio pages redirect
 *                   to the kids host.
 *   APP_ROLE=kids   aiforkids.humanityplusai.org: the Studio, the Hub and the
 *                   facilitator dashboard only. No ad tags, no Stripe, no
 *                   newsletter, no seeding. The marketing pages under
 *                   /aiforkids still render (same bundle), without tracking.
 *   APP_ROLE=all    the old single-container layout; still the default so
 *                   nothing changes until the second app exists.
 */
export type AppRole = "site" | "kids" | "all";

const raw = (process.env.APP_ROLE || "all").toLowerCase();
export const APP_ROLE: AppRole = raw === "site" || raw === "kids" ? raw : "all";

/** Where the Studio lives when this process is the public site. */
export const KIDS_ORIGIN = (process.env.KIDS_ORIGIN || "https://aiforkids.humanityplusai.org").replace(/\/$/, "");

/** Pages that belong to the kids platform rather than the marketing site. */
const KIDS_PATHS = /^\/aiforkids\/(studio|hub|facilitator|week)(\/|$)/;

export function isKidsPath(pathname: string): boolean {
  return KIDS_PATHS.test(pathname);
}

/** Pages on which no third-party tag may ever load, whatever the role. */
export function isChildFacingPath(pathname: string): boolean {
  return pathname.startsWith("/aiforkids");
}
