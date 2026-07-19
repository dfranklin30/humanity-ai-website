---
name: Drizzle push vs session table
description: Why drizzle-kit push kept prompting for data loss and how the config prevents it
---

# Drizzle push and non-Drizzle tables

Rules:
- `user_sessions` is created and managed by connect-pg-simple (API server auth), not by the Drizzle schema. `drizzle-kit push` treats unknown tables as deletions and prompts to drop them — accepting would wipe all active login sessions. The config excludes it via `tablesFilter: ["!user_sessions"]`.
- Drizzle matches unique constraints by its own naming convention (`<table>_<column>_unique`). A same-shape constraint under a different name (e.g. Postgres-default `<table>_<column>_key`) is treated as both "missing" and "extra", causing repeated prompts. Fix by renaming/replacing the constraint to the Drizzle name, not by force-pushing.

**Why:** A post-merge `db push` failed on interactive prompts (no TTY) for exactly these two cases; `--force` would have dropped live session data.

**How to apply:** If `pnpm --filter @workspace/db run push` prompts about deleting a table that code still references (grep for the table name first), exclude it in `lib/db/drizzle.config.ts` instead of accepting the drop. Never run push with `--force` to silence prompts.
