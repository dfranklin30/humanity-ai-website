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
