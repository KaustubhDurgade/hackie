// Prisma config — uses direct Supabase connection for migrations,
// pooler connection for runtime (see lib/db/prisma.ts).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prefer the direct connection URL for migrations (bypasses pgbouncer).
    // Falls back to DATABASE_URL if DATABASE_URL_DIRECT is not set.
    url: process.env["DATABASE_URL_DIRECT"] ?? process.env["DATABASE_URL"],
  },
});
