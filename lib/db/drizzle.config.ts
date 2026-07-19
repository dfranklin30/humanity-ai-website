import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // user_sessions is created and managed by connect-pg-simple (see
  // api-server auth setup), not by Drizzle. Without this filter,
  // `drizzle-kit push` proposes dropping it — which would wipe all
  // active login sessions.
  tablesFilter: ["!user_sessions"],
});
