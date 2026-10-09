import { z } from 'zod';
import {
  createOrderRequestSchema,
  idempotencyKeySchema,
} from '@/lib/http/schemas';
const schema = z.object({
  key: idempotencyKeySchema,
  payloadHash: z.string(),
  orderId: z.string().optional(),
  userId: z.string(),
  payload: createOrderRequestSchema,
});
export type PendingOrder = z.infer<typeof schema>;
export function readPending(userId: string): PendingOrder | null {
  try {
    const value = schema.safeParse(
      JSON.parse(localStorage.getItem('gm_pending_order') ?? 'null')
    );
    if (value.success && value.data.userId === userId) return value.data;
  } catch {
    /* Invalid storage cannot authorize a purchase. */
  }
  localStorage.removeItem('gm_pending_order');
  return null;
}
export function savePending(value: PendingOrder) {
  localStorage.setItem('gm_pending_order', JSON.stringify(schema.parse(value)));
}
export function clearPending() {
  localStorage.removeItem('gm_pending_order');
}
