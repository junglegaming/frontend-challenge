import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useSession } from '@/domains/auth'
import {
  LEDGER_TRANSACTIONS_DEFAULT_LIMIT,
  ledgerBalanceSchema,
  ledgerTransactionsSchema,
  type LedgerBalance,
} from '../model/contracts'
import { LedgerError, ledgerRequest } from './client'

// Query keys are isolated per user (and per page size), so one account's data is never served to another.
export const ledgerKeys = {
  balance: (userId: string | undefined) => ['ledger', 'balance', userId] as const,
  transactions: (userId: string | undefined, limit: number) => ['ledger', 'transactions', userId, limit] as const,
  allTransactions: (userId: string | undefined) => ['ledger', 'transactions', userId] as const,
}

/** 4xx answers are final; only network/timeout/5xx failures are worth another attempt. */
const retryTransient = (failureCount: number, error: unknown) =>
  error instanceof LedgerError && error.isRetryable && failureCount < 2

function useLedgerUserId() {
  const session = useSession()
  return session.data?.user.id
}

export function useLedgerBalance() {
  const userId = useLedgerUserId()

  return useQuery({
    queryKey: ledgerKeys.balance(userId),
    // `signal` lets TanStack Query cancel a stale request (constitution, Principle III).
    queryFn: ({ signal }) =>
      ledgerRequest(userId as string, { method: 'GET', url: '/coins/balance', signal }, ledgerBalanceSchema),
    enabled: userId !== undefined,
    retry: retryTransient,
  })
}

export function useLedgerTransactions(limit: number = LEDGER_TRANSACTIONS_DEFAULT_LIMIT) {
  const userId = useLedgerUserId()

  return useQuery({
    queryKey: ledgerKeys.transactions(userId, limit),
    queryFn: ({ signal }) =>
      ledgerRequest(
        userId as string,
        { method: 'GET', url: '/coins/transactions', params: { limit }, signal },
        ledgerTransactionsSchema,
      ).then((r) => r.transactions),
    enabled: userId !== undefined,
    retry: retryTransient,
  })
}

const unauthenticated = () =>
  new LedgerError({ status: 401, code: 'UNAUTHENTICATED', message: 'Faça login para continuar.' })

export interface LedgerWrite {
  amount: number
  /** Required: the same key never applies twice, so retrying after a timeout is safe (spec FR-004). */
  idempotencyKey: string
}

/**
 * Top-up with an optimistic balance (constitution, Principle III): the new balance shows at once and is
 * rolled back if the write fails; the API's answer then replaces the guess.
 */
export function useLedgerTopUp() {
  const userId = useLedgerUserId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ amount, idempotencyKey }: LedgerWrite) => {
      // Never mint a token for an unknown owner: a write without a signed-in user is a caller bug.
      if (!userId) return Promise.reject(unauthenticated())
      return ledgerRequest(
        userId,
        { method: 'POST', url: '/coins/topup', data: { amount } },
        ledgerBalanceSchema,
        idempotencyKey,
      )
    },
    onMutate: async ({ amount }) => {
      const key = ledgerKeys.balance(userId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<LedgerBalance>(key)
      if (previous) queryClient.setQueryData<LedgerBalance>(key, { ...previous, amount: previous.amount + amount })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(ledgerKeys.balance(userId), context.previous)
    },
    onSuccess: (balance: LedgerBalance) => {
      queryClient.setQueryData(ledgerKeys.balance(userId), balance)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ledgerKeys.allTransactions(userId) })
    },
  })
}

// Imperative writes for the checkout, which sequences debit -> order -> refund itself and decides from each
// result what to do next (specs/011-web-coins-real-api/data-model.md, "Estados do pagamento com moedas").

/** Rejects with a `LedgerError` whose `isInsufficientBalance` is true when the balance is too low (402). */
export function ledgerDebit(ownerId: string, amount: number, idempotencyKey: string): Promise<LedgerBalance> {
  return ledgerRequest(ownerId, { method: 'POST', url: '/coins/debit', data: { amount } }, ledgerBalanceSchema, idempotencyKey)
}

/** A credit, used by the checkout to give the coins back when an order is definitely rejected. */
export function ledgerCredit(ownerId: string, amount: number, idempotencyKey: string): Promise<LedgerBalance> {
  return ledgerRequest(ownerId, { method: 'POST', url: '/coins/topup', data: { amount } }, ledgerBalanceSchema, idempotencyKey)
}

/** Refreshes the cached balance and history of one owner after an imperative write. */
export function invalidateLedger(queryClient: QueryClient, ownerId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ledgerKeys.balance(ownerId) }),
    queryClient.invalidateQueries({ queryKey: ledgerKeys.allTransactions(ownerId) }),
  ])
}
