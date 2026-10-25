import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useSyncExternalStore } from 'react'
import { pendingOrderStore, type PendingOrder } from '@/lib/storage'
import type { CreateOrderInput, Order } from '@/schemas/order'
import type { QuoteInput } from '@/schemas/quote'
import { orderService, quoteService } from '@/services/orders'
import { queryKeys } from './query-keys'
import { useSession } from './useSession'

export function useCreateQuote() {
  return useMutation({ mutationFn: (input: QuoteInput) => quoteService.create(input) })
}

/**
 * Envio idempotente do pedido. Uma chave por cotação, persistida antes do envio:
 * clique repetido, timeout ou refresh reenviam a MESMA chave e recuperam o mesmo pedido.
 */
export function usePlaceOrder() {
  const { user } = useSession()
  const queryClient = useQueryClient()
  const store = useMemo(() => pendingOrderStore(user?.id ?? 'anon'), [user?.id])
  const raw = useSyncExternalStore(store.subscribe, store.snapshot)
  const attempt = useMemo<PendingOrder | null>(() => (raw ? store.get() : null), [raw, store])

  const mutation = useMutation({
    mutationFn: async (input: CreateOrderInput): Promise<Order> => {
      const current = store.get()
      const next: PendingOrder =
        current && current.quoteId === input.quoteId
          ? { ...current, input }
          : { quoteId: input.quoteId, idempotencyKey: crypto.randomUUID(), orderId: null, input }
      store.set(next)
      const order = await orderService.create(next.input, next.idempotencyKey)
      const saved = { ...next, orderId: order.id }
      store.set(saved)
      return order
    },
    onSuccess: (order) => {
      if (user) queryClient.setQueryData(queryKeys.order(user.id, order.id), order)
    },
  })

  return {
    placeOrder: mutation.mutateAsync,
    /** Reenvia a tentativa salva (mesma chave, mesmo corpo). */
    retry: () => (attempt ? mutation.mutateAsync(attempt.input) : Promise.reject(new Error('Nenhuma tentativa pendente'))),
    status: mutation.status,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
    attempt,
    clearAttempt: () => store.set(null),
  }
}

export function useOrder(orderId: string) {
  const { user } = useSession()
  return useQuery({
    queryKey: queryKeys.order(user?.id ?? 'anon', orderId),
    queryFn: ({ signal }) => orderService.get(orderId, signal),
    enabled: Boolean(user),
    staleTime: 0,
  })
}
