import { orderUpdatedEventSchema } from './events';
import { queryClient } from '@/lib/query/client';
import { keyFactory } from '@/lib/query/keys';
import { cacheOrder } from '@/lib/query/order-cache';
import type { Order } from '@/types/api';
export function applyOrderEvent(userId: string | undefined, raw: unknown) {
  const result = orderUpdatedEventSchema.safeParse(raw);
  if (!userId || !result.success) return;
  const event = result.data;
  const current = queryClient.getQueryData<Order>(
    keyFactory.order(userId, event.resourceId)
  );
  if (
    !current ||
    current.version >= event.version ||
    current.status !== 'pending'
  ) {
    if (import.meta.env.DEV)
      console.debug(
        '[socket] order.updated descartado',
        event.resourceId,
        event.version
      );
    return;
  }
  cacheOrder(userId, {
    ...current,
    ...event.payload,
    version: event.version,
    updatedAt: event.ts,
  });
  return event;
}
