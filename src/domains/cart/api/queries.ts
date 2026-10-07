import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/http'
import { hasSessionToken } from '@/shared/api/session'
import type { AddCartItemRequest, Cart } from '../model/contracts'
import { getOrCreateGuestCartId } from './guest-cart-id'

export const CART_QUERY_KEY = ['cart'] as const

/** Authenticated requests carry the session token (shared/api/http); visitors send their cart id instead. */
function cartHeaders(): Record<string, string> {
  return hasSessionToken() ? {} : { 'X-Guest-Cart': getOrCreateGuestCartId() }
}

export const cartQueries = {
  view: () =>
    queryOptions({
      queryKey: CART_QUERY_KEY,
      queryFn: ({ signal }) => api.get<Cart>('/cart', { headers: cartHeaders(), signal }),
    }),
}

export const addCartItem = (input: AddCartItemRequest) =>
  api.post<Cart>('/cart/items', input, { headers: cartHeaders() })
