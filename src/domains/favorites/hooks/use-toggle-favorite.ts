import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { FavoritesResponse } from '../model/contracts'
import { FAVORITES_QUERY_KEY, addFavorite, removeFavorite } from '../api/queries'
import { useFavorites } from './use-favorites'

/**
 * Reference optimistic interaction of the project: the heart toggles immediately and rolls back
 * on failure, restoring exactly the previous list (documented in docs/TEAMS.md).
 */
export function useToggleFavorite(nftId: string) {
  const queryClient = useQueryClient()
  const favorites = useFavorites()
  const isFavorite = favorites.data?.nftIds.includes(nftId) ?? false

  const mutation = useMutation({
    mutationFn: () => (isFavorite ? removeFavorite(nftId) : addFavorite(nftId)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY })
      const previous = queryClient.getQueryData<FavoritesResponse>(FAVORITES_QUERY_KEY)
      queryClient.setQueryData<FavoritesResponse>(FAVORITES_QUERY_KEY, (current) => {
        const ids = current?.nftIds ?? []
        return { nftIds: isFavorite ? ids.filter((id) => id !== nftId) : [...ids, nftId] }
      })
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous)
      toast.error('Não foi possível atualizar seus favoritos. Tente novamente.')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY })
    },
  })

  return { isFavorite, toggle: () => mutation.mutate(), isPending: mutation.isPending }
}
