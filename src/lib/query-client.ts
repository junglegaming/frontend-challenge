import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Só repete o que pode dar certo na segunda vez (rede, timeout, 5xx). 4xx não.
        retry: (failureCount, error) => error instanceof ApiError && error.isTransient && failureCount < 2,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
      },
      mutations: { retry: false },
    },
  })
}
