import { Helmet } from "react-helmet-async";

const SITE_URL = "https://humanityplusai.org";
const SITE_NAME = "Humanity + AI, Inc.";
const DEFAULT_DESCRIPTION =
  "Humanity + AI, Inc. is a nonprofit dedicated to ethical AI development, education, and community building. Founded by Danielle A. Franklin.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

interface PageMetaProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
  ogImageAlt?: string;
  noIndex?: boolean;
}

function resolveUrl(url: string | undefined, base: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${base}${url}`;
}

export function PageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogType = "website",
  ogImage = DEFAULT_IMAGE,
  ogImageAlt,
  noIndex = false,
}: PageMetaProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | Bridging Humanity and Artificial Intelligence`;
  const canonicalUrl = resolveUrl(canonical, SITE_URL);
  const imageUrl = resolveUrl(ogImage, SITE_URL) ?? DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={imageUrl} />
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {ogImageAlt && <meta name="twitter:image:alt" content={ogImageAlt} />}
    </Helmet>
  );
}
