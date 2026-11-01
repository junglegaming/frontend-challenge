import { http } from 'msw/core/http'

import type { Favorite } from '@/shared/contracts'

import { getDb, persist } from '../db'
import { json } from '../http'
import { isFavoriteError, simulateNetwork } from '../scenarios'
import { errorResponse, getAuthenticatedUser, unauthorized } from '../utils'

/** Favoritos pertencem ao usuário autenticado (persistem entre sessões). */
export const favoritesHandlers = [
  http.get('/api/favorites', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorized()

    const ids = getDb().favorites[user.id] ?? []
    const items: Favorite[] = ids.map((nftId) => ({
      nftId,
      addedAt: new Date().toISOString(),
    }))
    return json({ items })
  }),

  http.post('/api/favorites/:nftId', ({ request, params }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorized()
    if (isFavoriteError()) {
      return errorResponse('INTERNAL_ERROR', 'Não foi possível salvar o favorito', 503)
    }

    const db = getDb()
    const nft = db.nfts.find((n) => n.id === params.nftId)
    if (!nft) return errorResponse('NOT_FOUND', 'NFT não encontrado', 404)

    const ids = db.favorites[user.id] ?? []
    if (!ids.includes(nft.id)) {
      ids.push(nft.id)
      db.favorites[user.id] = ids
      persist()
    }

    const favorite: Favorite = { nftId: nft.id, addedAt: new Date().toISOString() }
    return json(favorite)
  }),

  http.delete('/api/favorites/:nftId', ({ request, params }) => {
    const user = getAuthenticatedUser(request)
    if (!user) return unauthorized()
    if (isFavoriteError()) {
      return errorResponse('INTERNAL_ERROR', 'Não foi possível remover o favorito', 503)
    }

    const db = getDb()
    const ids = db.favorites[user.id]
    if (ids) {
      db.favorites[user.id] = ids.filter((id) => id !== params.nftId)
      persist()
    }
    return new Response(null, { status: 204 })
  }),
]
