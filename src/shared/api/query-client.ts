import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './http'

/**
 * Cache policy (documented in ARCHITECTURE.md):
 * - staleTime 30s: catalog data is also pushed via Socket.IO, so we refetch lazily.
 * - Retries only for retryable errors (network/timeout/5xx), max 2, exponential backoff.
 * - Mutations never retry automatically — idempotent retries are explicit (orders).
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => isApiError(error) && error.isRetryable && failureCount < 2,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
      },
      mutations: { retry: false },
    },
  })
}
