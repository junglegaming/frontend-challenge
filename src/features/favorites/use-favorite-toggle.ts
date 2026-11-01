import { useLocation, useNavigate } from '@tanstack/react-router'

import { getToken } from '@/shared/session'

import { useToggleFavorite } from './api'

/**
 * Ação de favoritar usada pelas telas. Favoritos exigem sessão: o visitante é
 * levado ao login e volta para a mesma página depois.
 *
 * @returns Função `(nftId, favorite) => void` e o estado da mutation.
 * @example
 * const { toggleFavorite } = useFavoriteToggle()
 * toggleFavorite(nft.id, !isFavorite)
 */
export function useFavoriteToggle() {
  const mutation = useToggleFavorite()
  const navigate = useNavigate()
  const location = useLocation()

  function toggleFavorite(nftId: string, favorite: boolean): void {
    if (!getToken()) {
      void navigate({ to: '/login', search: { redirect: location.href } })
      return
    }
    mutation.mutate({ nftId, favorite })
  }

  return { toggleFavorite, isPending: mutation.isPending }
}
