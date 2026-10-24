// Creates (or re-seeds) an admin in Postgres (Neon). Credentials come from the environment at run time and
// are never read from, or written to, any file in the repository.
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' pnpm seed:admin
//
// Uses apps/api/.env.local for DATABASE_URL (see the "seed:admin" script). Running it again for the
// same e-mail replaces the password hash and keeps the original createdAt.
import { upsertAdmin } from "../src/domains/admin/service.js"

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.")
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (run `vercel env pull .env.local` in apps/api).")
  process.exit(1)
}

const { admin, created } = await upsertAdmin(email, password)
console.log(`${created ? "Created" : "Updated"} admin ${admin.email} (id ${admin.id.slice(0, 12)}…).`)
