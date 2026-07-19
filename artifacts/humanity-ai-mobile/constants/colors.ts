/**
 * Semantic design tokens for the Humanity + AI mobile app.
 *
 * Mirrors the web artifact's editorial dark-forest identity:
 * deep greens (#0a2117 / #081c14), warm cream (#FAF9F6),
 * gold primary (#f0c674) and mint accent (#6ee7b7).
 *
 * The brand is dark-first: both light and dark schemes resolve to the
 * same dark editorial palette so the app always matches the website.
 */

const palette = {
  // Legacy aliases (kept for backward compatibility)
  text: "#FAF9F6",
  tint: "#f0c674",

  // Core surfaces
  background: "#0a2117",
  foreground: "#FAF9F6",

  // Cards / elevated surfaces
  card: "#0e2b1d",
  cardForeground: "#FAF9F6",

  // Primary action color (buttons, links, active states)
  primary: "#f0c674",
  primaryForeground: "#081c14",

  // Secondary / less-emphasis interactive surfaces
  secondary: "#123527",
  secondaryForeground: "#FAF9F6",

  // Muted / subdued elements (dividers, timestamps, placeholders)
  muted: "#10281c",
  mutedForeground: "#9db3a7",

  // Accent highlights (badges, selected items, focus rings)
  accent: "#6ee7b7",
  accentForeground: "#081c14",

  // Destructive actions (delete, error states)
  destructive: "#ef4444",
  destructiveForeground: "#FAF9F6",

  // Borders and input outlines
  border: "#1d3a2b",
  input: "#1d3a2b",

  // Brand extras
  backgroundDeep: "#081c14",
  gold: "#f0c674",
  mint: "#6ee7b7",
  cream: "#FAF9F6",
  emerald: "#26b07c",
};

const colors = {
  light: palette,
  dark: palette,

  // Border radius (in px). The web artifact uses generous rounded shapes.
  radius: 16,
};

export default colors;
