export interface AdminRecord {
  id: string
  email: string
  passwordHash: string
}

export interface OwnersPage {
  owners: { ownerId: string; updatedAt: string }[]
  cursor: string | undefined
}

/** Port of the admin storage. The password hash never leaves this layer except to `authenticateAdmin`. */
export interface AdminRepository {
  findByEmail(email: string): Promise<AdminRecord | null>
  /** Inserts the admin or replaces its hash, keeping the original `created_at`. */
  upsert(admin: AdminRecord): Promise<{ created: boolean }>
  /** One page of owners that have a balance, ordered by id; `cursor` is the last `ownerId` of the previous page. */
  listOwners(limit: number, cursor?: string): Promise<OwnersPage>
}
