import { queryOptions } from '@tanstack/react-query';
import { http } from '@/lib/http/client';
import { endpoints } from '@/lib/http/endpoints';
import { orderSchema } from '@/lib/http/schemas';
import { keyFactory } from '@/lib/query/keys';
import { queryClient } from '@/lib/query/client';
import { getStoredSession } from '@/lib/session/storage';
import { newestOrder, cacheOrder } from '@/lib/query/order-cache';
import type { AppError } from '@/types/api';
import type { PendingOrder } from './pending';
export const orderOptions = (userId: string, id: string) =>
  queryOptions({
    queryKey: keyFactory.order(userId, id),
    queryFn: async ({ signal }) =>
      newestOrder(
        queryClient.getQueryData(keyFactory.order(userId, id)),
        orderSchema.parse(
          (await http.get(endpoints.order(id), { signal })).data
        )
      ),
    staleTime: (query) =>
      query.state.data?.status === 'pending'
        ? 0
        : query.state.data
          ? Infinity
          : 0,
    gcTime: 600_000,
    retry: (attempt, error) => {
      const failure = error as unknown as AppError;
      if (failure.kind === 'http' && failure.status < 500) return false;
      const current = queryClient.getQueryData(keyFactory.order(userId, id)) as
        { status?: string } | undefined;
      return attempt < (current && current.status !== 'pending' ? 1 : 2);
    },
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? 3000 : false,
    refetchOnWindowFocus: (query) => query.state.data?.status === 'pending',
  });
export async function recoverOrder(attempt: PendingOrder) {
  const token = getStoredSession()?.token;
  const response = attempt.orderId
    ? await http.get(endpoints.order(attempt.orderId))
    : await http.post(endpoints.orders, attempt.payload, {
        headers: { 'Idempotency-Key': attempt.key },
      });
  const order = orderSchema.parse(response.data);
  if (!token || getStoredSession()?.token !== token)
    throw new Error('Sessão alterada');
  return cacheOrder(attempt.userId, order);
}
