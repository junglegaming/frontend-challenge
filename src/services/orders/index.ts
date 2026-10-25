import { api } from '@/api/client'
import { orderSchema, type CreateOrderInput, type Order } from '@/schemas/order'
import { quoteSchema, type Quote, type QuoteInput } from '@/schemas/quote'

export const quoteService = {
  async create(input: QuoteInput): Promise<Quote> {
    const { data } = await api.post('/quote', input)
    return quoteSchema.parse(data)
  },
}

export const orderService = {
  async create(input: CreateOrderInput, idempotencyKey: string): Promise<Order> {
    const { data } = await api.post('/orders', input, { headers: { 'Idempotency-Key': idempotencyKey } })
    return orderSchema.parse(data)
  },
  async get(orderId: string, signal?: AbortSignal): Promise<Order> {
    const { data } = await api.get(`/orders/${encodeURIComponent(orderId)}`, { signal })
    return orderSchema.parse(data)
  },
}
