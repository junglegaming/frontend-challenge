import { createHash } from "node:crypto"
import { getDummyHash, hashPassword, verifyPassword } from "../../lib/password.js"
import type { AdminPublic } from "./contracts.js"
import { PrismaAdminRepository } from "./prismaAdminRepository.js"
import type { AdminRepository, OwnersPage } from "./repository.js"

const MIN_PASSWORD_LENGTH = 8

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** sha256 of the normalised e-mail: stable id and the `sub` claim of the admin's tokens. */
export function adminIdFor(email: string): string {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex")
}

// The service depends on the `AdminRepository` port only.
export function createAdminService(repository: AdminRepository) {
  return {
    /** Creates the admin, or replaces its password if the e-mail already exists (used by the seed script). */
    async upsertAdmin(email: string, password: string): Promise<{ admin: AdminPublic; created: boolean }> {
      if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Admin password must have at least ${MIN_PASSWORD_LENGTH} characters.`)
      }
      const normalized = normalizeEmail(email)
      const id = adminIdFor(normalized)
      const { created } = await repository.upsert({
        id,
        email: normalized,
        passwordHash: await hashPassword(password),
      })
      return { admin: { id, email: normalized, role: "admin" }, created }
    },

    /**
     * Returns the admin when the credentials are valid, otherwise `null` — never says *which* part was
     * wrong. A hash is verified even for an unknown e-mail so both failures take the same time.
     */
    async authenticateAdmin(email: string, password: string): Promise<AdminPublic | null> {
      const user = await repository.findByEmail(normalizeEmail(email))
      const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()))
      return user && valid ? { id: user.id, email: user.email, role: "admin" } : null
    },

    listOwners: (limit: number, cursor?: string): Promise<OwnersPage> => repository.listOwners(limit, cursor),
  }
}

export const { upsertAdmin, authenticateAdmin, listOwners } = createAdminService(new PrismaAdminRepository())
