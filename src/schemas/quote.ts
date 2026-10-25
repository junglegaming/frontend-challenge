import { z } from 'zod'
import { networkSchema, summarySchema } from './common'
import { lineItemSchema } from './line-item'

export const quoteInputSchema = z.object({
  network: networkSchema,
  walletId: z.string(),
})
export type QuoteInput = z.infer<typeof quoteInputSchema>

export const quoteSchema = summarySchema.extend({
  id: z.string(),
  items: z.array(lineItemSchema),
  coupon: z.object({ code: z.string(), percent: z.number() }).nullable(),
  network: networkSchema,
  walletId: z.string(),
  expiresAt: z.string(),
})
export type Quote = z.infer<typeof quoteSchema>
