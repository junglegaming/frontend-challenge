import { z } from 'zod'

import { ethSchema, idSchema } from './common'

export const cartItemSchema = z.object({
  id: idSchema,
  nftId: idSchema,
  editionId: idSchema,
  /** Nome da edição (ex.: "1/50", "ABERTA"). */
  editionName: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  quantity: z.number().int().min(1),
  /** Preço unitário atual em ETH (string decimal), vindo do catálogo. */
  priceEth: ethSchema,
  /** Preço quando o item entrou no carrinho: diferente de `priceEth` = preço mudou. */
  addedPriceEth: ethSchema,
  available: z.number().int().min(0),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  version: z.number().int().min(0),
})
export type Cart = z.infer<typeof cartSchema>

export const couponTypeSchema = z.enum(['percent', 'fixed'])
export type CouponType = z.infer<typeof couponTypeSchema>

export const couponSchema = z.object({
  code: z.string(),
  type: couponTypeSchema,
  /** percent em string decimal (ex.: "10" = 10%) ou valor fixo em ETH. */
  value: ethSchema,
})
export type Coupon = z.infer<typeof couponSchema>

/** Resumo de valores calculado pela API (referência para finalizar o pedido). */
export const cartSummarySchema = z.object({
  subtotalEth: ethSchema,
  discountEth: ethSchema,
  networkFeeEth: ethSchema,
  totalEth: ethSchema,
})
export type CartSummary = z.infer<typeof cartSummarySchema>

export const quoteRequestSchema = z.object({
  items: z.array(
    z.object({
      nftId: idSchema,
      editionId: idSchema,
      quantity: z.number().int().min(1),
    }),
  ),
  couponCode: z.string().optional(),
})
export type QuoteRequest = z.infer<typeof quoteRequestSchema>

export const quoteSchema = cartSummarySchema.extend({
  version: z.number().int().min(0),
})
export type Quote = z.infer<typeof quoteSchema>

export const addCartItemRequestSchema = z.object({
  nftId: idSchema,
  editionId: idSchema,
  quantity: z.number().int().min(1),
})
export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>

export const updateCartItemRequestSchema = z.object({
  quantity: z.number().int().min(1),
})
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>
