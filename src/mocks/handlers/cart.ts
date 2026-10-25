import { http, HttpResponse } from 'msw'
import { addCartItemInputSchema, couponInputSchema, mergeCartInputSchema, updateCartItemInputSchema } from '@/schemas/cart'
import { db } from '../db'
import { cartView, DomainError, ensureCart, mergeCarts, setCartQuantity, validateCoupon } from '../domain'
import { triggerCartScenario } from '../effects'
import { API, apiError, cartOwner, parseBody, requireUser, route } from '../http'

function respond(owner: string) {
  const cart = db.update((state) => cartView(state, ensureCart(state, owner)))
  return HttpResponse.json(cart)
}

export const cartHandlers = [
  http.get(
    `${API}/cart`,
    route(({ request }) => {
      const owner = cartOwner(request)
      const response = respond(owner)
      const cart = cartView(db.state, ensureCart(db.state, owner))
      triggerCartScenario(cart.items[0])
      return response
    }),
  ),

  http.post(
    `${API}/cart/items`,
    route(async ({ request }) => {
      const owner = cartOwner(request)
      const input = await parseBody(request, addCartItemInputSchema)
      db.update((state) => {
        const cart = ensureCart(state, owner)
        const existing = cart.items.find((item) => item.nftId === input.nftId && item.editionId === input.editionId)
        setCartQuantity(state, cart, input.nftId, input.editionId, (existing?.quantity ?? 0) + input.quantity)
      })
      return respond(owner)
    }),
  ),

  http.patch(
    `${API}/cart/items/:itemId`,
    route(async ({ request, params }) => {
      const owner = cartOwner(request)
      const input = await parseBody(request, updateCartItemInputSchema)
      db.update((state) => {
        const cart = ensureCart(state, owner)
        const item = cart.items.find((row) => row.id === params.itemId)
        if (!item) throw new DomainError(404, 'NOT_FOUND', 'Item não está no carrinho')
        setCartQuantity(state, cart, item.nftId, item.editionId, input.quantity)
      })
      return respond(owner)
    }),
  ),

  http.delete(
    `${API}/cart/items/:itemId`,
    route(({ request, params }) => {
      const owner = cartOwner(request)
      db.update((state) => {
        const cart = ensureCart(state, owner)
        cart.items = cart.items.filter((item) => item.id !== params.itemId)
        cart.version += 1
      })
      return respond(owner)
    }),
  ),

  http.put(
    `${API}/cart/coupon`,
    route(async ({ request }) => {
      const owner = cartOwner(request)
      const { code } = await parseBody(request, couponInputSchema)
      const coupon = validateCoupon(code)
      db.update((state) => {
        const cart = ensureCart(state, owner)
        cart.coupon = coupon.code
        cart.version += 1
      })
      return respond(owner)
    }),
  ),

  http.delete(
    `${API}/cart/coupon`,
    route(({ request }) => {
      const owner = cartOwner(request)
      db.update((state) => {
        const cart = ensureCart(state, owner)
        cart.coupon = null
        cart.version += 1
      })
      return respond(owner)
    }),
  ),

  http.post(
    `${API}/cart/merge`,
    route(async ({ request }) => {
      const user = requireUser(request)
      const { guestCartId } = await parseBody(request, mergeCartInputSchema)
      if (!/^[a-z0-9-]{8,64}$/i.test(guestCartId)) return apiError(422, 'VALIDATION_ERROR', 'Carrinho de visitante inválido')
      db.update((state) => {
        const guest = state.carts.find((cart) => cart.owner === `guest:${guestCartId}`)
        if (guest) mergeCarts(state, guest, ensureCart(state, `user:${user.id}`))
      })
      return respond(`user:${user.id}`)
    }),
  ),
]
