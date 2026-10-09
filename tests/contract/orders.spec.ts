import { test, expect } from 'vitest';
import * as s from '@/lib/http/schemas';
import { call, error, login, orderBody, orderKey, scenario } from './helpers';
test('idempotent order replay, divergent payload and immutable snapshot', async () => {
  const headers = { ...(await login()), 'Idempotency-Key': orderKey };
  const data = await orderBody(headers);
  const first = await call(
    'post',
    '/orders',
    s.orderSchema,
    data,
    headers,
    201
  );
  const replay = await call('post', '/orders', s.orderSchema, data, headers);
  expect(replay).toEqual(first);
  await error(
    'post',
    '/orders',
    'IDEMPOTENCY_CONFLICT',
    409,
    { ...data, coupon: 'GREEN5' },
    headers
  );
  await call('post', '/_mock/emit', s.resetResponseSchema, {
    type: 'nft.updated',
    resourceId: 'golden-signal-160',
    version: 2,
    payload: { price: '2', previousPrice: '0.99', available: 8 },
  });
  const receipt = await call(
    'get',
    `/orders/${first.id}`,
    s.orderSchema,
    undefined,
    headers
  );
  expect(receipt.items).toEqual(first.items);
});
test('order ownership, missing resource, stale quote and depleted stock', async () => {
  const headers = { ...(await login()), 'Idempotency-Key': orderKey };
  const data = await orderBody(headers);
  await call(
    'patch',
    '/cart/items/golden-signal-160',
    s.cartSchema,
    { qty: 2 },
    headers
  );
  await error('post', '/orders', 'QUOTE_STALE', 409, data, headers);
  await scenario('estoque-esgotado');
  await error('post', '/orders', 'INSUFFICIENT_STOCK', 409, data, headers);
  await error('get', '/orders/absent', 'NOT_FOUND', 404, undefined, headers);
  await error(
    'get',
    '/orders/ord_seed_confirmed',
    'FORBIDDEN',
    403,
    undefined,
    await login('bruno')
  );
});
test('payment simulation confirms and preserves quantities added after purchase', async () => {
  const headers = { ...(await login()), 'Idempotency-Key': orderKey };
  const first = await call(
    'post',
    '/orders',
    s.orderSchema,
    await orderBody(headers),
    headers,
    201
  );
  await call(
    'post',
    '/cart/items',
    s.cartSchema,
    { nftId: 'golden-signal-160', qty: 1 },
    headers,
    201
  );
  await new Promise((resolve) => setTimeout(resolve, 3100));
  const order = await call(
    'get',
    `/orders/${first.id}`,
    s.orderSchema,
    undefined,
    headers
  );
  expect(order.status).toBe('confirmed');
  expect(order.txHash).toBeTruthy();
  expect(
    (await call('get', '/cart', s.cartSchema, undefined, headers)).items[0].qty
  ).toBe(1);
});
test('declined payment preserves cart', async () => {
  await scenario('pagamento-recusado');
  const headers = { ...(await login()), 'Idempotency-Key': orderKey };
  const first = await call(
    'post',
    '/orders',
    s.orderSchema,
    await orderBody(headers),
    headers,
    201
  );
  await new Promise((resolve) => setTimeout(resolve, 3100));
  expect(
    (
      await call(
        'get',
        `/orders/${first.id}`,
        s.orderSchema,
        undefined,
        headers
      )
    ).status
  ).toBe('declined');
  expect(
    (await call('get', '/cart', s.cartSchema, undefined, headers)).items
  ).toHaveLength(2);
});

test('timeout after creation recovers same order by replay', async () => {
  await scenario('timeout-pedido');
  const headers = { ...(await login()), 'Idempotency-Key': orderKey };
  const data = await orderBody(headers);
  const { http } = await import('@/lib/http/client');
  await expect(
    http.post('http://localhost/api/orders', data, { headers, timeout: 800 })
  ).rejects.toMatchObject({ kind: 'network' });
  const recovered = await call('post', '/orders', s.orderSchema, data, headers);
  expect(recovered.id).toBe('ord_1');
  expect((await call('post', '/orders', s.orderSchema, data, headers)).id).toBe(
    recovered.id
  );
});

test('price timer invalidates quote and updates catalog/cart', async () => {
  await scenario('preco-muda');
  const headers = { ...(await login()), 'Idempotency-Key': orderKey };
  const data = await orderBody(headers);
  await new Promise((resolve) => setTimeout(resolve, 6100));
  expect(
    (await call('get', '/nfts/golden-signal-160', s.nftSchema)).price
  ).toBe('1.19');
  expect(
    (await call('get', '/cart', s.cartSchema, undefined, headers)).items[0]
      .price
  ).toBe('1.19');
  await error('post', '/orders', 'QUOTE_STALE', 409, data, headers);
});
