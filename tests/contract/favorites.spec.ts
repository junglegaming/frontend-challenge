import { test, expect } from 'vitest';
import * as s from '@/lib/http/schemas';
import { call, error, login } from './helpers';
test('favorites idempotency and user isolation', async () => {
  const ana = await login();
  const bruno = await login('bruno');
  const path = '/favorites/golden-frequency-071';
  const first = await call('put', path, s.favoritesResponseSchema, {}, ana);
  expect(await call('put', path, s.favoritesResponseSchema, {}, ana)).toEqual(
    first
  );
  expect(
    (
      await call(
        'get',
        '/favorites',
        s.favoritesResponseSchema,
        undefined,
        bruno
      )
    ).ids
  ).toEqual([]);
  const removed = await call(
    'delete',
    path,
    s.favoritesResponseSchema,
    undefined,
    ana
  );
  expect(
    await call('delete', path, s.favoritesResponseSchema, undefined, ana)
  ).toEqual(removed);
  await error('put', '/favorites/missing', 'NOT_FOUND', 404, {}, ana);
  await error('get', '/favorites', 'UNAUTHORIZED', 401);
});
