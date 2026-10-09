import { afterEach, expect, test } from 'vitest';
import { queryClient } from '@/lib/query/client';
import { keyFactory } from '@/lib/query/keys';
import { applyOrderEvent } from '@/lib/socket/order-cache';
import { cacheOrder } from '@/lib/query/order-cache';
import { orderSchema } from '@/lib/http/schemas';
import { call, login } from './helpers';

afterEach(() => queryClient.clear());

test('order events respect ownership, versions and definitive terminal snapshots', async () => {
  const order = await call(
    'get',
    '/orders/ord_seed_pending',
    orderSchema,
    undefined,
    await login()
  );
  cacheOrder('usr_ana', order);
  const event = {
    type: 'order.updated',
    resourceId: order.id,
    version: order.version + 1,
    ts: '2026-10-09T12:00:00.000Z',
    payload: { status: 'confirmed' },
  };
  expect(applyOrderEvent('usr_bruno', event)).toBeUndefined();
  expect(applyOrderEvent(undefined, event)).toBeUndefined();
  expect(
    queryClient.getQueryData(keyFactory.order('usr_bruno', order.id))
  ).toBeUndefined();
  expect(
    queryClient.getQueryData(keyFactory.order('usr_ana', order.id))
  ).toEqual(order);
  expect(
    applyOrderEvent('usr_ana', { ...event, version: order.version })
  ).toBeUndefined();
  expect(applyOrderEvent('usr_ana', event)).toEqual(event);
  const terminal = queryClient.getQueryData(
    keyFactory.order('usr_ana', order.id)
  );
  expect(applyOrderEvent('usr_ana', event)).toBeUndefined();
  expect(
    applyOrderEvent('usr_ana', {
      ...event,
      version: event.version + 1,
      payload: { status: 'pending' },
    })
  ).toBeUndefined();
  expect(
    cacheOrder('usr_ana', { ...order, version: event.version + 2 })
  ).toEqual(terminal);
});
