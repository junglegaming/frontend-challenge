import { queryOptions } from '@tanstack/react-query'
import type { Page } from '@/shared/api/contracts'
import { api, isApiError } from '@/shared/api/http'
import type { CatalogQuery, Nft, NftSummary } from '../model/contracts'

const DEFAULT_PAGE_SIZE = 12

/** Builds the exact query-string shape the mock API expects (category as a single comma-joined value). */
function toSearchParams(query: CatalogQuery): Record<string, string> {
  const params: Record<string, string> = {
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? DEFAULT_PAGE_SIZE),
  }
  if (query.q) params.q = query.q
  if (query.category?.length) params.category = query.category.join(',')
  if (query.availability) params.availability = query.availability
  if (query.minPrice) params.minPrice = query.minPrice
  if (query.maxPrice) params.maxPrice = query.maxPrice
  if (query.sort) params.sort = query.sort
  return params
}

export const catalogQueries = {
  featured: () =>
    queryOptions({
      queryKey: ['catalog', 'featured'] as const,
      queryFn: ({ signal }) => api.get<NftSummary[]>('/nfts/featured', { signal }),
    }),

  search: (query: CatalogQuery) =>
    queryOptions({
      queryKey: ['catalog', 'search', query] as const,
      queryFn: ({ signal }) => api.get<Page<NftSummary>>('/nfts', { params: toSearchParams(query), signal }),
      placeholderData: (previous) => previous,
    }),

  detail: (nftId: string) =>
    queryOptions({
      queryKey: ['catalog', 'detail', nftId] as const,
      queryFn: ({ signal }) => api.get<Nft>(`/nfts/${nftId}`, { signal }),
      // NOT_FOUND is terminal for a detail fetch; only transient/network failures deserve a retry.
      retry: (failureCount, error) => isApiError(error) && error.isRetryable && failureCount < 2,
    }),
}
