import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api/http-client'

/**
 * Política de cache (documentada em docs/02-DECISOES-TECNICAS.md §5):
 * - leituras: staleTime 15s, refetch on focus;
 * - sem retry para erros 4xx (cliente);
 * - retry limitado (2) para erros transitórios/5xx;
 * - mutations sem retry automático (idempotência trata o pedido).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
