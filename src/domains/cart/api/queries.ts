import { queryOptions } from '@tanstack/react-query'
import type { Network } from '@/domains/wallets'
import { api } from '@/shared/api/http'
import { hasSessionToken } from '@/shared/api/session'
import type { AddCartItemRequest, ApplyCouponRequest, Cart, Quote, UpdateCartItemRequest } from '../model/contracts'
import { getOrCreateGuestCartId } from './guest-cart-id'

export const CART_QUERY_KEY = ['cart'] as const
export const CART_QUOTE_QUERY_KEY = ['cart', 'quote'] as const

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

  /** The cart/checkout summary never computes totals itself — it always reflects this server quote. */
  quote: (network: Network) =>
    queryOptions({
      queryKey: [...CART_QUOTE_QUERY_KEY, network] as const,
      queryFn: ({ signal }) =>
        api.get<Quote>('/cart/quote', { headers: cartHeaders(), params: { network }, signal }),
    }),
}

export const addCartItem = (input: AddCartItemRequest) =>
  api.post<Cart>('/cart/items', input, { headers: cartHeaders() })

export const updateCartItem = ({ itemId, ...body }: UpdateCartItemRequest & { itemId: string }) =>
  api.patch<Cart>(`/cart/items/${itemId}`, body, { headers: cartHeaders() })

export const removeCartItem = (itemId: string) => api.delete<Cart>(`/cart/items/${itemId}`, { headers: cartHeaders() })

export const applyCoupon = (body: ApplyCouponRequest) => api.put<Cart>('/cart/coupon', body, { headers: cartHeaders() })

export const removeCoupon = () => api.delete<Cart>('/cart/coupon', { headers: cartHeaders() })

export const mergeCart = (guestCartId: string) => api.post<Cart>('/cart/merge', { guestCartId })
