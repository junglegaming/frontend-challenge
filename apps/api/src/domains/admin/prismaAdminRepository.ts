import { prisma } from "../../lib/db.js"
import type { AdminRecord, AdminRepository, OwnersPage } from "./repository.js"

// Prisma adapter. `passwordHash` leaves this file only through `findByEmail`.
export class PrismaAdminRepository implements AdminRepository {
  async findByEmail(email: string): Promise<AdminRecord | null> {
    const row = await prisma().admin.findUnique({ where: { email } })
    return row ? { id: row.id, email: row.email, passwordHash: row.passwordHash } : null
  }

  async upsert({ id, email, passwordHash }: AdminRecord): Promise<{ created: boolean }> {
    // Single writer (only the seed script calls this): the lookup just before the upsert decides `created`.
    // `update` touches only the hash, so `createdAt` is preserved on re-seed.
    const existing = await prisma().admin.findUnique({ where: { id }, select: { id: true } })
    await prisma().admin.upsert({
      where: { id },
      create: { id, email, role: "admin", passwordHash },
      update: { passwordHash },
    })
    return { created: existing === null }
  }

  async listOwners(limit: number, cursor?: string): Promise<OwnersPage> {
    const after = cursor ? Buffer.from(cursor, "base64url").toString("utf8") : ""
    const rows = await prisma().balance.findMany({
      where: { ownerId: { gt: after } },
      orderBy: { ownerId: "asc" },
      take: limit + 1,
      select: { ownerId: true, updatedAt: true },
    })
    const page = rows.slice(0, limit)
    const last = page.at(-1)
    return {
      owners: page.map((row) => ({ ownerId: row.ownerId, updatedAt: row.updatedAt.toISOString() })),
      cursor: rows.length > limit && last ? Buffer.from(last.ownerId, "utf8").toString("base64url") : undefined,
    }
  }
}
