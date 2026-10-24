import { randomUUID } from "node:crypto"
import { z } from "zod"
import { Prisma, type CoinTransaction } from "../../generated/prisma/client.js"
import { prisma } from "../../lib/db.js"
import {
  IdempotencyConflictError,
  InsufficientBalanceError,
  type CoinBalanceRecord,
  type CoinTransactionRecord,
} from "./contracts.js"
import type { ApplyOperation, ApplyResult, CoinsRepository } from "./repository.js"

// Prisma adapter (constitution 1.6.0). Reads use the typed client; the balance change is still ONE raw statement
// that updates the balance and appends the ledger entry together, serialised by the row lock — concurrent writes
// cannot lose an update and a debit can never overdraw (`amount >= $2`). The ORM cannot express that write in one
// statement, and the Neon HTTP adapter has no transactions (research D12). An `Idempotency-Key` is enforced by
// UNIQUE (owner_id, idempotency_key): a second concurrent insert aborts the whole statement, so the effect stays
// single. Prisma types never leave this file: the domain only sees the records from contracts.ts.

// BIGINT arrives as a string and timestamptz as a Date from $queryRaw: coerce at the boundary (Principle II).
const iso = z.coerce.date().transform((date) => date.toISOString())

const balanceRowSchema = z.object({
  owner_id: z.string(),
  amount: z.coerce.number().int().nonnegative(),
  version: z.coerce.number().int().nonnegative(),
  updated_at: iso,
})

type StoredTransaction = CoinTransaction

/** BIGINT columns come back from the typed client as `bigint`; the HTTP contract uses safe integers. */
function toSafeNumber(value: bigint): number {
  const result = Number(value)
  if (!Number.isSafeInteger(result)) throw new RangeError(`Value ${value} is outside the safe integer range.`)
  return result
}

function toTransaction(row: StoredTransaction): CoinTransactionRecord {
  const direction = z.enum(["credit", "debit"]).parse(row.direction)
  return {
    txId: row.txId,
    ownerId: row.ownerId,
    direction,
    amount: toSafeNumber(row.amount),
    resultingBalance: toSafeNumber(row.resultingBalance),
    createdAt: row.createdAt.toISOString(),
  }
}

/**
 * A UNIQUE violation reaches us in two shapes (research D14), both a `PrismaClientKnownRequestError`: `P2002` from
 * the typed client, and the raw SQLSTATE `23505` from `$queryRaw` (observed with `PrismaNeonHttp` 7.10.1: no `meta`,
 * the message names the violated constraint). Recognising only `P2002` turned every losing request of a same-key
 * race into a 500, although the effect stayed single.
 */
function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2002" || err.code === "23505")
}

export class PrismaCoinsRepository implements CoinsRepository {
  async getBalance(ownerId: string): Promise<CoinBalanceRecord> {
    const row = await prisma().balance.findUnique({ where: { ownerId } })
    return row
      ? {
          ownerId: row.ownerId,
          amount: toSafeNumber(row.amount),
          version: toSafeNumber(row.version),
          updatedAt: row.updatedAt.toISOString(),
        }
      : { ownerId, amount: 0, version: 0, updatedAt: new Date(0).toISOString() }
  }

  async applyOperation(operation: ApplyOperation): Promise<ApplyResult> {
    const { ownerId, idempotencyKey } = operation
    if (idempotencyKey === undefined) {
      return { balance: await this.write(operation), replayed: false }
    }

    const stored = await this.findByKey(ownerId, idempotencyKey)
    if (stored) return this.replay(stored, operation)

    try {
      return { balance: await this.write(operation), replayed: false }
    } catch (err) {
      if (!isUniqueViolation(err)) throw err
      // A concurrent request with the same key committed first; this statement rolled back as a whole.
      const winner = await this.findByKey(ownerId, idempotencyKey)
      if (!winner) throw err
      return this.replay(winner, operation)
    }
  }

  async listTransactions(ownerId: string, limit: number): Promise<CoinTransactionRecord[]> {
    const rows = await prisma().coinTransaction.findMany({
      where: { ownerId },
      // `resultingVersion` is bumped under the balance's row lock, so it is the true ledger order; `createdAt` is the
      // statement start time and can interleave under concurrency. The other two keys only make ties impossible.
      orderBy: [{ resultingVersion: "desc" }, { createdAt: "desc" }, { txId: "desc" }],
      take: limit,
    })
    return rows.map(toTransaction)
  }

  private findByKey(ownerId: string, idempotencyKey: string): Promise<StoredTransaction | null> {
    return prisma().coinTransaction.findUnique({ where: { ownerId_idempotencyKey: { ownerId, idempotencyKey } } })
  }

  /** Same key + same operation → the original result, nothing written; same key + different operation → conflict. */
  private replay(stored: StoredTransaction, operation: ApplyOperation): ApplyResult {
    if (stored.direction !== operation.direction || toSafeNumber(stored.amount) !== operation.amount) {
      throw new IdempotencyConflictError()
    }
    return {
      balance: {
        ownerId: stored.ownerId,
        amount: toSafeNumber(stored.resultingBalance),
        version: toSafeNumber(stored.resultingVersion),
        updatedAt: stored.createdAt.toISOString(),
      },
      replayed: true,
    }
  }

  private async write({ ownerId, direction, amount, idempotencyKey }: ApplyOperation): Promise<CoinBalanceRecord> {
    const key = idempotencyKey ?? null
    const txId = randomUUID()
    const rows =
      direction === "credit"
        ? await prisma().$queryRaw<unknown[]>`
            WITH b AS (
              INSERT INTO balances (owner_id, amount, version)
              VALUES (${ownerId}, ${amount}::bigint, 1)
              ON CONFLICT (owner_id) DO UPDATE
                SET amount = balances.amount + EXCLUDED.amount, version = balances.version + 1, updated_at = now()
              RETURNING owner_id, amount, version, updated_at
            ), t AS (
              INSERT INTO transactions (tx_id, owner_id, direction, amount, resulting_balance, resulting_version, idempotency_key, created_at)
              SELECT ${txId}::uuid, owner_id, 'credit', ${amount}::bigint, amount, version, ${key}::text, updated_at FROM b
            )
            SELECT owner_id, amount, version, updated_at FROM b`
        : await prisma().$queryRaw<unknown[]>`
            WITH b AS (
              UPDATE balances
                 SET amount = amount - ${amount}::bigint, version = version + 1, updated_at = now()
               WHERE owner_id = ${ownerId} AND amount >= ${amount}::bigint
              RETURNING owner_id, amount, version, updated_at
            ), t AS (
              INSERT INTO transactions (tx_id, owner_id, direction, amount, resulting_balance, resulting_version, idempotency_key, created_at)
              SELECT ${txId}::uuid, owner_id, 'debit', ${amount}::bigint, amount, version, ${key}::text, updated_at FROM b
            )
            SELECT owner_id, amount, version, updated_at FROM b`

    // The credit upsert always returns one row; a debit returns none when the balance is missing or too low
    // (nothing was written: the statement is atomic).
    const [row] = balanceRowSchema.array().parse(rows)
    if (!row) throw new InsufficientBalanceError()
    return { ownerId: row.owner_id, amount: row.amount, version: row.version, updatedAt: row.updated_at }
  }
}
