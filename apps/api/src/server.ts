// Optional local dev convenience: a plain `app.listen`, run via `pnpm dev:local`.
// This is NOT how the app runs in production (Vercel invokes `api/index.ts`
// directly, per-request, with no persistent listener) and MUST NOT be used to
// validate local/production parity (SC-002) — use `pnpm dev` (`vercel dev`) for
// that (research.md D8).
import app from "./app.js"

const REQUIRED_ENV_VARS = ["DATABASE_URL", "AUTH_JWT_SECRET"] as const

const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name])
if (missing.length > 0) {
  console.error(
    `[apps/api] Missing required environment variable(s): ${missing.join(", ")}. ` +
      "Run `vercel env pull .env.local` in apps/api (DATABASE_URL) and set AUTH_JWT_SECRET (see .env.example).",
  )
  process.exit(1)
}

// 4000 belongs to server/ (006) and to apps/web's coins client default.
const port = Number(process.env.PORT ?? 4001)

app.listen(port, () => {
  console.log(`[apps/api] listening on http://localhost:${port} (plain Express, not vercel dev)`)
})
