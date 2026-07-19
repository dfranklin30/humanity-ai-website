---
name: Mobile App Store compliance
description: iOS app rules for the Humanity + AI mobile artifact — payments, pricing display, browser modules
---

# App Store compliance decisions (Humanity + AI iOS app)

Rules:
- No in-app payment processing. Donations open https://humanityplusai.org/donate via `Linking.openURL` behind a DonationService abstraction (guideline 3.2.2 nonprofit exemption covers donations).
- Membership tiers are shown WITHOUT prices in-app and framed as recurring donations. Do not re-add "$X/mo" labels.
- No WebViews and no expo-web-browser anywhere in the mobile app; external links use `Linking.openURL` only. The expo-web-browser package was removed entirely because Expo autolinks native modules into the binary even when unused in JS.

**Why:** Guideline 3.1.1 treats paid memberships with digital perks as digital subscriptions; showing prices alongside an external purchase link is a known rejection trigger (flagged by architect review). WebView-wrapped sites are also a rejection risk for a content app.

**How to apply:** Any future change to the Donate tab, membership content, or external-link handling in `artifacts/humanity-ai-mobile` must preserve these constraints.

Also: splash background is intentionally #131313 (not brand green) to match the logo PNG's opaque background — keep them in sync if the logo changes.
