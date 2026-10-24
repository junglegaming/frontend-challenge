import { HttpResponse, http } from 'msw'
import { bearerToken } from '../../http/identity'
import { route } from '../../http/route'
import type { AuthService } from '../auth/service'
import type { FavoritesService } from './service'

export function favoritesHandlers(api: string, auth: AuthService, favorites: FavoritesService) {
  return [
    http.get(
      `${api}/favorites`,
      route(({ request }) => HttpResponse.json(favorites.list(auth.authenticate(bearerToken(request)).userId))),
    ),
    http.put<{ nftId: string }>(
      `${api}/favorites/:nftId`,
      route(({ request, params }) =>
        HttpResponse.json(favorites.add(auth.authenticate(bearerToken(request)).userId, params.nftId)),
      ),
    ),
    http.delete<{ nftId: string }>(
      `${api}/favorites/:nftId`,
      route(({ request, params }) =>
        HttpResponse.json(favorites.remove(auth.authenticate(bearerToken(request)).userId, params.nftId)),
      ),
    ),
  ]
}
