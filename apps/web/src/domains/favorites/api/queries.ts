import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/http'
import type { FavoritesResponse } from '../model/contracts'

export const FAVORITES_QUERY_KEY = ['favorites'] as const

export const favoritesQueries = {
  list: () =>
    queryOptions({
      queryKey: FAVORITES_QUERY_KEY,
      queryFn: ({ signal }) => api.get<FavoritesResponse>('/favorites', { signal }),
    }),
}

export const addFavorite = (nftId: string) => api.put<FavoritesResponse>(`/favorites/${nftId}`)
export const removeFavorite = (nftId: string) => api.delete<FavoritesResponse>(`/favorites/${nftId}`)
