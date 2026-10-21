import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/http'
import type { CreateOrderRequest, Order } from '../model/contracts'

export const createOrder = (body: CreateOrderRequest & { idempotencyKey: string }) => {
  const { idempotencyKey, ...payload } = body
  return api.post<Order, CreateOrderRequest>('/orders', payload, { headers: { 'Idempotency-Key': idempotencyKey } })
}

export const orderKeys = {
  detail: (orderId: string) => ['orders', orderId] as const,
}

export const getOrder = (orderId: string, signal?: AbortSignal) => api.get<Order>(`/orders/${orderId}`, { signal })

export const orderQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
    retry: false,
    // Realtime (`order.updated`) is the primary path; this poll is the REST fallback while the
    // order hasn't settled yet, so the page still resolves even if the socket never connects.
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2000 : false),
  })
