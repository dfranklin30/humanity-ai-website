/**
 * Brand typography.
 *
 * The website pairs Plus Jakarta Sans (body) with Space Grotesk
 * (display / "editorial serif" role). Font families are loaded in
 * app/_layout.tsx via @expo-google-fonts packages.
 */

export const fonts = {
  body: "PlusJakartaSans_400Regular",
  bodyMedium: "PlusJakartaSans_500Medium",
  bodySemiBold: "PlusJakartaSans_600SemiBold",
  bodyBold: "PlusJakartaSans_700Bold",
  displayMedium: "SpaceGrotesk_500Medium",
  displaySemiBold: "SpaceGrotesk_600SemiBold",
  display: "SpaceGrotesk_700Bold",
} as const;

/** The website's signature multi-color gradient accent. */
export const brandGradient = [
  "#ff5d5d",
  "#f0c674",
  "#6ee7b7",
  "#38bdf8",
  "#a78bfa",
] as const;
