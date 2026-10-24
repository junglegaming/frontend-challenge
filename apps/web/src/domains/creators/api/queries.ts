import { queryOptions } from '@tanstack/react-query'
import type { NftSummary } from '@/domains/catalog'
import { api, isApiError } from '@/shared/api/http'
import type { Creator } from '../model/contracts'

export const creatorQueries = {
  list: () =>
    queryOptions({
      queryKey: ['creators', 'list'] as const,
      queryFn: ({ signal }) => api.get<Creator[]>('/creators', { signal }),
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: ['creators', 'detail', id] as const,
      queryFn: ({ signal }) => api.get<Creator>(`/creators/${id}`, { signal }),
      // NOT_FOUND is terminal for a detail fetch; only transient/network failures deserve a retry.
      retry: (failureCount, error) => isApiError(error) && error.isRetryable && failureCount < 2,
    }),

  nfts: (id: string) =>
    queryOptions({
      queryKey: ['creators', 'detail', id, 'nfts'] as const,
      queryFn: ({ signal }) => api.get<NftSummary[]>(`/creators/${id}/nfts`, { signal }),
    }),
}
