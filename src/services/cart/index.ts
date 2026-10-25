import { api } from '@/api/client'
import { cartSchema, type AddCartItemInput, type Cart } from '@/schemas/cart'

export const cartService = {
  async get(signal?: AbortSignal): Promise<Cart> {
    const { data } = await api.get('/cart', { signal })
    return cartSchema.parse(data)
  },
  async addItem(input: AddCartItemInput): Promise<Cart> {
    const { data } = await api.post('/cart/items', input)
    return cartSchema.parse(data)
  },
  async updateItem(itemId: string, quantity: number): Promise<Cart> {
    const { data } = await api.patch(`/cart/items/${itemId}`, { quantity })
    return cartSchema.parse(data)
  },
  async removeItem(itemId: string): Promise<Cart> {
    const { data } = await api.delete(`/cart/items/${itemId}`)
    return cartSchema.parse(data)
  },
  async applyCoupon(code: string): Promise<Cart> {
    const { data } = await api.put('/cart/coupon', { code })
    return cartSchema.parse(data)
  },
  async removeCoupon(): Promise<Cart> {
    const { data } = await api.delete('/cart/coupon')
    return cartSchema.parse(data)
  },
  async merge(guestCartId: string): Promise<Cart> {
    const { data } = await api.post('/cart/merge', { guestCartId })
    return cartSchema.parse(data)
  },
}
