import { z } from 'zod';
import { ethSchema, isoDateSchema, orderStatusSchema } from '../http/schemas';

export const nftUpdatedEventSchema = z.object({
  type: z.literal('nft.updated'),
  resourceId: z.string(),
  version: z.number().int(),
  ts: isoDateSchema,
  payload: z.object({
    price: ethSchema,
    available: z.number().int(),
    previousPrice: ethSchema,
  }),
});

export const orderUpdatedEventSchema = z.object({
  type: z.literal('order.updated'),
  resourceId: z.string(),
  version: z.number().int(),
  ts: isoDateSchema,
  payload: z.object({
    status: orderStatusSchema,
    txHash: z.string().optional(),
    explorerUrl: z.string().optional(),
    declineReason: z.string().optional(),
  }),
});

export const nftUpdatedRequestSchema = nftUpdatedEventSchema.omit({ ts: true });

export const orderUpdatedRequestSchema = orderUpdatedEventSchema.omit({
  ts: true,
});

export const emitRequestSchema = z.discriminatedUnion('type', [
  nftUpdatedRequestSchema,
  orderUpdatedRequestSchema,
]);

export const socketEventSchema = z.discriminatedUnion('type', [
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
]);

export type NftUpdated = z.infer<typeof nftUpdatedEventSchema>;

export type OrderUpdated = z.infer<typeof orderUpdatedEventSchema>;

export type NftUpdatedRequest = z.infer<typeof nftUpdatedRequestSchema>;

export type OrderUpdatedRequest = z.infer<typeof orderUpdatedRequestSchema>;

export type EmitRequest = z.infer<typeof emitRequestSchema>;

export type SocketEvent = z.infer<typeof socketEventSchema>;
