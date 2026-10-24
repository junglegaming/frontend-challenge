import { z } from "zod"

/** What the API may return about an admin: never the hash. */
export interface AdminPublic {
  id: string
  email: string
  role: "admin"
}

export const loginRequestSchema = z.object({
  email: z.string().trim().max(254).email(),
  password: z.string().min(1).max(256),
})

/** Accepted shape of an owner id in admin URLs: letters, digits, `_`, `.`, `-` (no `/`), up to 128 chars. */
export const ownerIdParamSchema = z.string().regex(/^[A-Za-z0-9_.-]{1,128}$/)
