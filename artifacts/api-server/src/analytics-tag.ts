// Google tag injection. IDs are runtime env vars, so tracking can be switched
// on or off without rebuilding the site.
const env = (k: string) => (process.env[k] || "").trim();

// Child-directed pages (AI for Kids) are never tagged: ad measurement there
// would collect persistent identifiers from children (COPPA).
const UNTAGGED_PREFIXES = ["/aiforkids"];

export function injectAnalytics(html: string, urlPath = "/"): string {
  const pathname = urlPath.split("?")[0];
  if (UNTAGGED_PREFIXES.some((p) => pathname.startsWith(p))) return html;
  const ga = env("GA_MEASUREMENT_ID");
  const aw = env("ADS_CONVERSION_ID");
  if (!ga && !aw) return html;
  const cfg = JSON.stringify({
    ga,
    aw,
    labels: {
      donation: env("ADS_LABEL_DONATION"),
      event_registration: env("ADS_LABEL_EVENT"),
      academy_enrollment: env("ADS_LABEL_ENROLLMENT"),
    },
  });
  const tag = [
    '<script async src="https://www.googletagmanager.com/gtag/js?id=' + (ga || aw) + '"></script>',
    "<script>",
    "window.dataLayer=window.dataLayer||[];",
    "function gtag(){dataLayer.push(arguments);}",
    "gtag('js',new Date());",
    ga ? "gtag('config','" + ga + "');" : "",
    aw ? "gtag('config','" + aw + "');" : "",
    "window.__HAI_ANALYTICS__=" + cfg + ";",
    "</script>",
  ].filter(Boolean).join("\n");
  return html.replace("</head>", tag + "\n</head>");
}
