import { PrismaNeonHttp } from "@prisma/adapter-neon"
import { PrismaClient } from "../generated/prisma/client.js"
import { internal } from "./errors.js"

let client: PrismaClient | undefined

/**
 * Lazily-created Prisma client (one per function instance) over Neon's HTTP driver: no socket or pool to exhaust,
 * no handshake per cold start. HTTP mode has no transactions (interactive or batch), so any write that must be
 * atomic has to be a single statement (see coins/prismaCoinsRepository.ts). Fails with a structured 500 if
 * unconfigured; the URL is never logged.
 */
export function prisma(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw internal(
      "missing_database_url",
      "DATABASE_URL is not configured. Run `vercel env pull .env.local` in apps/api (see .env.example).",
    )
  }
  client ??= new PrismaClient({ adapter: new PrismaNeonHttp(url, {}) })
  return client
}
