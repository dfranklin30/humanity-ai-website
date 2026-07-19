# Memory Index

- [Mobile App Store compliance](mobile-app-store-compliance.md) — never show membership/subscription prices next to external purchase links in the iOS app; donations stay web-only.
- [Prod API CORS lag](prod-api-cors-lag.md) — deployed API can lag workspace config; mobile dev-web preview must target the local dev API until a republish ships CORS headers.
- [Drizzle push vs session table](drizzle-push-session-table.md) — never force-push past drizzle prompts; user_sessions is connect-pg-simple's table and is excluded via tablesFilter.
