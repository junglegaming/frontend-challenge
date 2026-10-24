import { z } from 'zod'

// Mirrors what `apps/api` returns for the admin routes (apps/api/src/routes/admin.ts; constitution 1.4.0:
// read-only) and the form limits of the service. External data is validated at the boundary (Principle II).
// See specs/012-coins-admin/data-model.md.

/** Same limits as the service: e-mail up to 254 characters, password 1 to 256. */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail.')
    .max(254, 'O e-mail pode ter no máximo 254 caracteres.')
    .email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.').max(256, 'A senha pode ter no máximo 256 caracteres.'),
})
export type LoginFormValues = z.infer<typeof loginFormSchema>

export const loginResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string(),
  admin: z.object({ id: z.string(), email: z.string() }),
})
export type LoginResponse = z.infer<typeof loginResponseSchema>

export const ownersPageSchema = z.object({
  owners: z.array(z.object({ ownerId: z.string(), updatedAt: z.string() })),
  cursor: z.string().optional(),
})
export type OwnersPage = z.infer<typeof ownersPageSchema>

const balanceSchema = z.object({
  ownerId: z.string(),
  amount: z.number().int().nonnegative(),
  version: z.number().int().nonnegative(),
  updatedAt: z.string(),
})

const transactionSchema = z.object({
  txId: z.string(),
  ownerId: z.string(),
  direction: z.enum(['credit', 'debit']),
  amount: z.number().int().positive(),
  resultingBalance: z.number().int().nonnegative(),
  createdAt: z.string(),
})
export type OwnerTransaction = z.infer<typeof transactionSchema>

export const ownerDetailSchema = z.object({
  balance: balanceSchema,
  transactions: z.array(transactionSchema),
})
export type OwnerDetail = z.infer<typeof ownerDetailSchema>

export const errorBodySchema = z.object({ error: z.object({ code: z.string(), message: z.string() }) })

/**
 * Cursor stack of the owners list in the URL: each cursor is opaque, 1 to 2048 characters, at most 50 of them.
 * Optional: the first page has no `cursors` in its address (a default would be written back into the URL).
 */
export const MAX_CURSORS = 50
export const ownersSearchSchema = z.object({
  cursors: z.array(z.string().min(1).max(2048)).max(MAX_CURSORS).optional(),
})

/** Owner id accepted by the service: [A-Za-z0-9_.-], at most 128 characters. */
export const ownerIdSchema = z.string().regex(/^[A-Za-z0-9_.-]{1,128}$/)

export const OWNERS_PAGE_SIZE = 20
export const OWNER_TRANSACTIONS_SHOWN = 50
