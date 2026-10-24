import { z } from 'zod'

// Mirrors specs/007-monorepo-vercel-blob/contracts/api-routes.md. External data is validated at the
// boundary (constitution, Principle II), so these schemas are the source of truth for the types.

export const ledgerBalanceSchema = z.object({
  ownerId: z.string(),
  amount: z.number().int().nonnegative(),
  version: z.number().int().nonnegative(),
  updatedAt: z.string(),
})
export type LedgerBalance = z.infer<typeof ledgerBalanceSchema>

export const ledgerTransactionSchema = z.object({
  txId: z.string(),
  ownerId: z.string(),
  direction: z.enum(['credit', 'debit']),
  amount: z.number().int().positive(),
  resultingBalance: z.number().int().nonnegative(),
  createdAt: z.string(),
})
export type LedgerTransaction = z.infer<typeof ledgerTransactionSchema>

export const ledgerTransactionsSchema = z.object({
  ownerId: z.string(),
  transactions: z.array(ledgerTransactionSchema),
})

export const ledgerTokenSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string(),
})
export type LedgerToken = z.infer<typeof ledgerTokenSchema>

export const ledgerErrorBodySchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
})

/** Page size bounds accepted by `GET /coins/transactions` (contract: default 50, max 200). */
export const LEDGER_TRANSACTIONS_DEFAULT_LIMIT = 50
export const LEDGER_TRANSACTIONS_MAX_LIMIT = 200
