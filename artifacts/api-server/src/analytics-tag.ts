// Google tag injection. IDs are runtime env vars, so tracking can be switched
// on or off without rebuilding the site.
const env = (k: string) => (process.env[k] || "").trim();

export function injectAnalytics(html: string): string {
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
