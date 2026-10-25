import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Favorites } from '@/schemas/favorite'
import { favoriteService } from '@/services/favorites'
import { queryKeys } from './query-keys'
import { useSession } from './useSession'

export function useFavorites() {
  const { user } = useSession()
  const query = useQuery({
    queryKey: queryKeys.favorites(user?.id ?? 'anon'),
    queryFn: ({ signal }) => favoriteService.list(signal),
    enabled: Boolean(user),
  })
  const ids = query.data?.nftIds ?? []
  return { ...query, ids, isFavorite: (nftId: string) => ids.includes(nftId) }
}

/** Atualização otimista com rollback: o coração muda na hora e volta se a API falhar. */
export function useToggleFavorite() {
  const { user } = useSession()
  const queryClient = useQueryClient()
  const key = queryKeys.favorites(user?.id ?? 'anon')

  return useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      favorite ? favoriteService.add(nftId) : favoriteService.remove(nftId),
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Favorites>(key)
      const ids = previous?.nftIds ?? []
      queryClient.setQueryData<Favorites>(key, { nftIds: favorite ? [...new Set([...ids, nftId])] : ids.filter((id) => id !== nftId) })
      return { previous }
    },
    onError: (_error, { favorite }, context) => {
      queryClient.setQueryData(key, context?.previous)
      toast.error(favorite ? 'Não foi possível favoritar. Tente novamente.' : 'Não foi possível remover dos favoritos.')
    },
    onSuccess: (_data, { favorite }) => {
      toast.success(favorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
