import { defineConfig } from "prisma/config"

// Prisma CLI configuration (generate, migrate). The runtime client does not read this file: it connects through
// the Neon HTTP adapter with DATABASE_URL (src/lib/db.ts).
//
// `.env.local` is loaded when present (local development); on Vercel and in CI the variables come from the
// environment. `process.env` is read directly instead of the `env()` helper so `prisma generate`, which needs no
// database, also works with no variables set (the `postinstall` on Vercel).
try {
  process.loadEnvFile(".env.local")
} catch {
  // No .env.local: rely on the environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Migrate needs a direct (non-pooled) connection: it takes an advisory lock.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED ?? "" },
})
