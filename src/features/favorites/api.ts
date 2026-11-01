import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'
import { z } from 'zod'

import { getJson, httpClient } from '@/shared/api/http-client'
import { queryKeys } from '@/shared/api/query-keys'
import { favoriteSchema } from '@/shared/contracts'
import { getOwnerKey, getToken } from '@/shared/session'

export const favoritesResponseSchema = z.object({ items: z.array(favoriteSchema) })
export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>

/**
 * Lista de favoritos do usuário autenticado. Fica desabilitada para visitantes
 * (favoritos exigem sessão).
 *
 * @returns Opções do TanStack Query para favoritos.
 */
export function favoritesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.favorites.all(getOwnerKey()),
    queryFn: () => getJson(favoritesResponseSchema, '/favorites'),
    enabled: Boolean(getToken()),
  })
}

type ToggleFavoriteVariables = { nftId: string; favorite: boolean }

/**
 * Alterna um favorito com atualização otimista e rollback em caso de falha.
 * Em sucesso, invalida a query para reconciliar com o servidor.
 *
 * @returns Mutation para alternar favoritos.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.favorites.all(getOwnerKey())

  return useMutation({
    mutationFn: async ({ nftId, favorite }: ToggleFavoriteVariables) => {
      if (favorite) await httpClient.post(`/favorites/${nftId}`)
      else await httpClient.delete(`/favorites/${nftId}`)
    },
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<FavoritesResponse>(queryKey)

      queryClient.setQueryData<FavoritesResponse>(queryKey, (old) => {
        const items = old?.items ?? []
        if (favorite) {
          if (items.some((item) => item.nftId === nftId)) return { items }
          return { items: [...items, { nftId, addedAt: new Date().toISOString() }] }
        }
        return { items: items.filter((item) => item.nftId !== nftId) }
      })

      return { previous }
    },
    onError: (_error, { favorite }, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
      toast.error(
        favorite
          ? 'Não foi possível adicionar aos favoritos. Tente novamente.'
          : 'Não foi possível remover dos favoritos. Tente novamente.',
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}
