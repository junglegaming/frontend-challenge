import { z } from 'zod'
import { ethSchema, summarySchema } from './common'
import { editionIdSchema, nftImageSchema } from './nft'

export const cartItemSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: editionIdSchema,
  name: z.string(),
  image: nftImageSchema,
  tokenId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: ethSchema,
  lineTotal: ethSchema,
  available: z.number().int().nonnegative(),
  /** Preço mudou desde que o item entrou no carrinho */
  priceChanged: z.boolean(),
  previousUnitPrice: ethSchema.nullable(),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
  coupon: z.object({ code: z.string(), percent: z.number() }).nullable(),
  summary: summarySchema,
  itemCount: z.number().int(),
  version: z.number().int(),
})
export type Cart = z.infer<typeof cartSchema>

export const addCartItemInputSchema = z.object({
  nftId: z.string(),
  editionId: editionIdSchema,
  quantity: z.number().int().positive(),
})
export type AddCartItemInput = z.infer<typeof addCartItemInputSchema>

export const updateCartItemInputSchema = z.object({ quantity: z.number().int().positive() })
export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>

export const couponInputSchema = z.object({
  code: z.string().trim().min(1, 'Informe o código').max(32).toUpperCase(),
})
export type CouponInput = z.infer<typeof couponInputSchema>

export const mergeCartInputSchema = z.object({ guestCartId: z.string() })
