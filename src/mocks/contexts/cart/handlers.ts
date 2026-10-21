import { HttpResponse, http } from 'msw'
import { NETWORKS, type Network } from '@/domains/wallets'
import { errors } from '../../http/errors'
import { bearerToken, guestCartId } from '../../http/identity'
import { field, readJson, route } from '../../http/route'
import type { AuthService } from '../auth/service'
import { guestCartIdOf, userCartId, type CartService } from './service'

export function cartHandlers(api: string, auth: AuthService, cart: CartService) {
  /** Authenticated requests use the user's cart; visitors use the `X-Guest-Cart` id. */
  const ownerOf = (request: Request) => {
    const token = bearerToken(request)
    if (token) return userCartId(auth.authenticate(token).userId)
    const guestId = guestCartId(request)
    if (!guestId) throw errors.validation({ cart: 'Cabeçalho X-Guest-Cart ausente ou inválido.' })
    return guestCartIdOf(guestId)
  }

  return [
    http.get(`${api}/cart`, route(({ request }) => HttpResponse.json(cart.view(ownerOf(request))))),

    http.post(
      `${api}/cart/items`,
      route(async ({ request }) => {
        const body = await readJson(request)
        return HttpResponse.json(
          cart.addItem(ownerOf(request), {
            nftId: field.string(body, 'nftId'),
            editionId: field.string(body, 'editionId'),
            quantity: field.number(body, 'quantity'),
          }),
          { status: 201 },
        )
      }),
    ),

    http.patch<{ itemId: string }>(
      `${api}/cart/items/:itemId`,
      route(async ({ request, params }) => {
        const body = await readJson(request)
        return HttpResponse.json(
          cart.updateItem(ownerOf(request), params.itemId, {
            quantity: body.quantity === undefined ? undefined : field.number(body, 'quantity'),
            acknowledgePrice: body.acknowledgePrice === true,
          }),
        )
      }),
    ),

    http.delete<{ itemId: string }>(
      `${api}/cart/items/:itemId`,
      route(({ request, params }) => HttpResponse.json(cart.removeItem(ownerOf(request), params.itemId))),
    ),

    http.put(
      `${api}/cart/coupon`,
      route(async ({ request }) => {
        const body = await readJson(request)
        return HttpResponse.json(cart.applyCoupon(ownerOf(request), field.string(body, 'code')))
      }),
    ),

    http.delete(`${api}/cart/coupon`, route(({ request }) => HttpResponse.json(cart.removeCoupon(ownerOf(request))))),

    http.get(
      `${api}/cart/quote`,
      route(({ request }) => {
        const network = new URL(request.url).searchParams.get('network') ?? 'ethereum'
        if (!(NETWORKS as readonly string[]).includes(network)) throw errors.validation({ network: 'Rede inválida.' })
        return HttpResponse.json(cart.quote(ownerOf(request), network as Network))
      }),
    ),

    http.post(
      `${api}/cart/merge`,
      route(async ({ request }) => {
        const { userId } = auth.authenticate(bearerToken(request))
        const body = await readJson(request)
        const guestId = field.string(body, 'guestCartId')
        if (!guestId) throw errors.validation({ guestCartId: 'Informe o carrinho do visitante.' })
        return HttpResponse.json(cart.merge(guestId, userId))
      }),
    ),
  ]
}
