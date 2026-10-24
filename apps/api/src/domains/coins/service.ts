import { InsufficientBalanceError, type CoinBalanceRecord, type CoinTransactionRecord } from "./contracts.js"
import { PrismaCoinsRepository } from "./prismaCoinsRepository.js"
import type { CoinsRepository } from "./repository.js"

// The service depends on the `CoinsRepository` port only; atomicity and idempotency live in the adapter.
export function createCoinsService(repository: CoinsRepository) {
  return {
    getBalance: (ownerId: string): Promise<CoinBalanceRecord> => repository.getBalance(ownerId),

    async topUp(ownerId: string, amount: number, idempotencyKey?: string): Promise<CoinBalanceRecord> {
      const { balance } = await repository.applyOperation({ ownerId, direction: "credit", amount, idempotencyKey })
      return balance
    },

    async debit(ownerId: string, amount: number, idempotencyKey?: string): Promise<CoinBalanceRecord> {
      const { balance } = await repository.applyOperation({ ownerId, direction: "debit", amount, idempotencyKey })
      return balance
    },

    listTransactions: (ownerId: string, limit: number): Promise<CoinTransactionRecord[]> =>
      repository.listTransactions(ownerId, limit),
  }
}

// The database client is created lazily on the first query, so building the default service is free.
export const { getBalance, topUp, debit, listTransactions } = createCoinsService(new PrismaCoinsRepository())

export { InsufficientBalanceError }
