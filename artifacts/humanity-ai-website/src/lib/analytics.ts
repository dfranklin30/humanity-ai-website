// Conversion tracking. Fires a GA4 event and, when a conversion label is
// configured, a Google Ads conversion. Never throws: analytics must not be
// able to break a donation or enrolment flow.
export type ConversionKind = "donation" | "event_registration" | "academy_enrollment";

interface AnalyticsConfig {
  ga?: string;
  aw?: string;
  labels?: Partial<Record<ConversionKind, string>>;
}

export function trackConversion(
  kind: ConversionKind,
  params: { value?: number; currency?: string; id?: string } = {},
): void {
  try {
    const w = window as unknown as {
      __HAI_ANALYTICS__?: AnalyticsConfig;
      gtag?: (...args: unknown[]) => void;
    };
    const cfg = w.__HAI_ANALYTICS__;
    if (!cfg || typeof w.gtag !== "function") return;

    const payload: Record<string, unknown> = { currency: params.currency || "USD" };
    if (typeof params.value === "number") payload.value = params.value;
    if (params.id) payload.transaction_id = params.id;

    if (cfg.ga) w.gtag("event", kind, { ...payload, send_to: cfg.ga });
    const label = cfg.labels ? cfg.labels[kind] : undefined;
    if (cfg.aw && label) {
      w.gtag("event", "conversion", { ...payload, send_to: cfg.aw + "/" + label });
    }
  } catch {
    /* analytics failures are always silent */
  }
}

// The server-injected Google tag sends a page_view for the page the visitor
// lands on. This is a single-page app, so later navigation never reloads the
// page; report each route change here so URL-based Google Ads conversions
// (e.g. "visits a page starting with /about") count in-app navigation too.
// No-op when the tag isn't on the page (not configured, or the visitor
// landed on an /aiforkids page, which the server deliberately leaves untagged).
let lastPath: string | null = null;

export function trackPageView(path: string): void {
  const first = lastPath === null;
  if (path === lastPath) return;
  lastPath = path;
  if (first || path.startsWith("/aiforkids")) return;
  try {
    const w = window as unknown as {
      __HAI_ANALYTICS__?: AnalyticsConfig;
      gtag?: (...args: unknown[]) => void;
    };
    const cfg = w.__HAI_ANALYTICS__;
    if (!cfg || typeof w.gtag !== "function") return;
    const params = {
      page_location: window.location.href,
      page_path: path,
      page_title: document.title,
    };
    if (cfg.ga) w.gtag("event", "page_view", { ...params, send_to: cfg.ga });
    if (cfg.aw) w.gtag("event", "page_view", { ...params, send_to: cfg.aw });
  } catch {
    // Analytics must never break navigation.
  }
}
