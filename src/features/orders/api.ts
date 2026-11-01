import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiError, getJson, postJson } from '@/shared/api/http-client'
import { queryKeys } from '@/shared/api/query-keys'
import { type CreateOrderRequest, orderSchema } from '@/shared/contracts'
import { getOwnerKey } from '@/shared/session'

/**
 * Estado e recibo de um pedido.
 *
 * @param id - Identificador do pedido.
 * @returns Opções do TanStack Query para o pedido.
 */
export function orderQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.orders.detail(getOwnerKey(), id),
    queryFn: () => getJson(orderSchema, `/orders/${id}`),
  })
}

const MAX_ORDER_RETRIES = 2
const ORDER_RETRY_DELAY_MS = 500

/**
 * Cria um pedido idempotente. A mesma `Idempotency-Key` recupera o mesmo pedido
 * em caso de timeout/reenvio.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: CreateOrderRequest; idempotencyKey: string }) =>
      postJson(orderSchema, '/orders', body, {
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
    // Timeout/falha de rede: reenvia a MESMA tentativa (mesma chave). Se o pedido
    // já foi criado, a API devolve o mesmo pedido — recuperação sem duplicar.
    retry: (failureCount, error) =>
      error instanceof ApiError && error.retryable && failureCount < MAX_ORDER_RETRIES,
    retryDelay: ORDER_RETRY_DELAY_MS,
    // Semeia o cache: o `order.updated` deste pedido já é reconhecido como da sessão.
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(getOwnerKey(), order.id), order)
    },
  })
}
