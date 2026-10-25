import { z } from 'zod'
import { editionSchema } from './nft'
import { orderStatusSchema } from './order'

const envelope = {
  eventId: z.string(),
  version: z.number().int(),
  occurredAt: z.string(),
}

export const nftUpdatedEventSchema = z.object({
  ...envelope,
  type: z.literal('nft.updated'),
  resource: z.object({ type: z.literal('nft'), id: z.string() }),
  data: z.object({ editions: z.array(editionSchema) }),
})
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = z.object({
  ...envelope,
  type: z.literal('order.updated'),
  resource: z.object({ type: z.literal('order'), id: z.string() }),
  data: z.object({ status: orderStatusSchema }),
})
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>

export const realtimeEventSchema = z.discriminatedUnion('type', [nftUpdatedEventSchema, orderUpdatedEventSchema])
export type RealtimeEvent = z.infer<typeof realtimeEventSchema>
