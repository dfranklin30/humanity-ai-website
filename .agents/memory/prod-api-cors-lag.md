---
name: Prod API CORS lag
description: Why the mobile dev web preview targets the local dev API instead of production
---

# Production API CORS lag

The deployed production API (https://humanityplusai.org) reflects the codebase at its last publish, not the workspace. Workspace-side fixes (like enabling CORS) do nothing for browser clients until the user republishes — never assume prod behavior matches local code.

**Why it matters:** The Expo web preview runs on a different origin, so it can only fetch APIs that send CORS headers. Native iOS/Android builds are unaffected (no CORS enforcement).

**How to apply:** The mobile app's API base (`artifacts/humanity-ai-mobile/lib/api.ts`) uses the local dev API when `__DEV__ && Platform.OS === "web"` and production otherwise. Once the site is republished with CORS, this override becomes optional but is still the right default (dev preview should test against dev API). When debugging "works native, fails in preview" fetch issues, check prod CORS headers first with a curl `-H "Origin: ..."` probe.
