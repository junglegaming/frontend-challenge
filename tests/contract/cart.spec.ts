import { test, expect } from 'vitest';
import * as s from '@/lib/http/schemas';
import { call, error, anon } from './helpers';
test('cart CRUD and anonymous isolation', async () => {
  await call(
    'post',
    '/cart/items',
    s.cartSchema,
    { nftId: 'golden-signal-160', qty: 2 },
    anon,
    201
  );
  expect(
    (
      await call(
        'patch',
        '/cart/items/golden-signal-160',
        s.cartSchema,
        { qty: 3 },
        anon
      )
    ).subtotal
  ).toBe('2.97');
  const other = { 'X-Anonymous-Id': '22222222-2222-4222-8222-222222222222' };
  expect(
    (await call('get', '/cart', s.cartSchema, undefined, other)).items
  ).toEqual([]);
  await error(
    'post',
    '/cart/items',
    'INSUFFICIENT_STOCK',
    409,
    { nftId: 'golden-signal-160', qty: 99 },
    anon
  );
  await error(
    'post',
    '/cart/items',
    'VALIDATION_ERROR',
    422,
    { nftId: 'golden-signal-160', qty: 1.5 },
    anon
  );
  expect(
    (
      await call(
        'delete',
        '/cart/items/golden-signal-160',
        s.cartSchema,
        undefined,
        anon
      )
    ).subtotal
  ).toBe('0');
  await error(
    'patch',
    '/cart/items/missing',
    'NOT_FOUND',
    404,
    { qty: 1 },
    anon
  );
});
test('login moves visitor cart and caps summed stock', async () => {
  await call(
    'post',
    '/cart/items',
    s.cartSchema,
    { nftId: 'golden-signal-160', qty: 8 },
    anon,
    201
  );
  const session = await call('post', '/auth/login', s.sessionSchema, {
    email: 'ana@nft-marketplace.test',
    password: 'Ana12345',
    anonymousId: anon['X-Anonymous-Id'],
  });
  const cart = await call('get', '/cart', s.cartSchema, undefined, {
    Authorization: `Bearer ${session.token}`,
  });
  expect(cart.items[0].qty).toBe(8);
  expect(cart.subtotal).toBe('7.96');
  expect(
    (await call('get', '/cart', s.cartSchema, undefined, anon)).items
  ).toEqual([]);
});
