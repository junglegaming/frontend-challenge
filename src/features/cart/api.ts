import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { getJson, httpClient, postJson } from '@/shared/api/http-client'
import { queryKeys } from '@/shared/api/query-keys'
import {
  type AddCartItemRequest,
  type QuoteRequest,
  type UpdateCartItemRequest,
  cartSchema,
  quoteSchema,
} from '@/shared/contracts'
import { getOwnerKey } from '@/shared/session'

/**
 * Carrinho do dono atual (visitante ou usuário autenticado).
 *
 * @returns Opções do TanStack Query para o carrinho.
 */
export function cartQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.cart.all(getOwnerKey()),
    queryFn: () => getJson(cartSchema, '/cart'),
  })
}

/**
 * Cotação (subtotal, desconto, taxa e total) calculada pela API — a referência
 * para finalizar o pedido.
 *
 * @param request - Itens e cupom opcional.
 * @returns Opções do TanStack Query para a cotação.
 */
export function quoteQueryOptions(request: QuoteRequest) {
  return queryOptions({
    queryKey: [...queryKeys.quote.all, request],
    queryFn: () => postJson(quoteSchema, '/quote', request),
    enabled: request.items.length > 0,
  })
}

function useInvalidateCart() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.all(getOwnerKey()) })
}

/** Adiciona um item ao carrinho. */
export function useAddToCart() {
  const invalidate = useInvalidateCart()
  return useMutation({
    mutationFn: (body: AddCartItemRequest) => httpClient.post('/cart/items', body),
    onSuccess: () => invalidate(),
  })
}

/** Atualiza a quantidade de um item. */
export function useUpdateCartItem() {
  const invalidate = useInvalidateCart()
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      httpClient.patch(`/cart/items/${itemId}`, { quantity } satisfies UpdateCartItemRequest),
    onSuccess: () => invalidate(),
  })
}

/** Remove um item do carrinho. */
export function useRemoveCartItem() {
  const invalidate = useInvalidateCart()
  return useMutation({
    mutationFn: (itemId: string) => httpClient.delete(`/cart/items/${itemId}`),
    onSuccess: () => invalidate(),
  })
}
