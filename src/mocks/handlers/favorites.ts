import { http, HttpResponse } from 'msw'
import { db } from '../db'
import { findNft } from '../domain'
import { API, apiError, requireUser, route } from '../http'
import { getScenario } from '../scenarios'

function respond(userId: string) {
  return HttpResponse.json({ nftIds: db.state.favorites[userId] ?? [] })
}

export const favoriteHandlers = [
  http.get(
    `${API}/favorites`,
    route(({ request }) => respond(requireUser(request).id)),
  ),

  http.put(
    `${API}/favorites/:nftId`,
    route(({ request, params }) => {
      const user = requireUser(request)
      if (getScenario() === 'favorite-fail') return apiError(500, 'TRANSIENT', 'Não foi possível salvar o favorito')
      const nftId = String(params.nftId)
      findNft(db.state, nftId)
      db.update((state) => {
        const list = state.favorites[user.id] ?? []
        if (!list.includes(nftId)) state.favorites[user.id] = [...list, nftId]
      })
      return respond(user.id)
    }),
  ),

  http.delete(
    `${API}/favorites/:nftId`,
    route(({ request, params }) => {
      const user = requireUser(request)
      if (getScenario() === 'favorite-fail') return apiError(500, 'TRANSIENT', 'Não foi possível remover o favorito')
      db.update((state) => {
        state.favorites[user.id] = (state.favorites[user.id] ?? []).filter((id) => id !== String(params.nftId))
      })
      return respond(user.id)
    }),
  ),
]
