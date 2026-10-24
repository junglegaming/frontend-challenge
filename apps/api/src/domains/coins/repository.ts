import type { CoinBalanceRecord, CoinTransactionRecord } from "./contracts.js"

export interface ApplyOperation {
  ownerId: string
  direction: "credit" | "debit"
  /** Positive integer; the sign comes from `direction`. */
  amount: number
  /** When set, the same key for the same owner is applied at most once. */
  idempotencyKey?: string | undefined
}

export interface ApplyResult {
  balance: CoinBalanceRecord
  /** `true` when the key had already been applied and nothing new was written. */
  replayed: boolean
}

/**
 * Port of the coins storage. Implementations MUST make `applyOperation` atomic (balance and ledger entry
 * written together or not at all), MUST throw `InsufficientBalanceError` instead of letting a balance go
 * below zero, and `IdempotencyConflictError` when a key is reused for a different operation.
 */
export interface CoinsRepository {
  getBalance(ownerId: string): Promise<CoinBalanceRecord>
  applyOperation(operation: ApplyOperation): Promise<ApplyResult>
  listTransactions(ownerId: string, limit: number): Promise<CoinTransactionRecord[]>
}
