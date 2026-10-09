import { queryClient } from './client';
import { keyFactory } from './keys';
import type { Order } from '@/types/api';
export function newestOrder(
  current: Order | undefined,
  incoming: Order
): Order {
  return current &&
    (current.version >= incoming.version || current.status !== 'pending')
    ? current
    : incoming;
}
export function cacheOrder(userId: string, incoming: Order) {
  return queryClient.setQueryData<Order>(
    keyFactory.order(userId, incoming.id),
    (current) => newestOrder(current, incoming)
  )!;
}
