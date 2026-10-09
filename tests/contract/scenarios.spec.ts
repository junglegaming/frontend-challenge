import { test, expect } from 'vitest';
import * as s from '@/lib/http/schemas';
import { http } from '@/lib/http/client';
import { getDb } from '@/mocks/db/store';
import { call, error, scenario } from './helpers';
test('all 18 scenarios selectable and reset is deterministic', async () => {
  for (const id of s.SCENARIO_IDS) {
    await scenario(id);
    expect(
      (await call('get', '/_mock/scenario', s.scenarioStateSchema)).id
    ).toBe(id);
  }
  await call('post', '/_mock/reset', s.resetResponseSchema);
  const first = structuredClone(getDb());
  await call('post', '/_mock/emit', s.resetResponseSchema, {
    type: 'nft.updated',
    resourceId: 'golden-signal-160',
    version: 2,
    payload: { price: '2', previousPrice: '0.99', available: 0 },
  });
  await call('post', '/_mock/reset', s.resetResponseSchema);
  expect(getDb()).toEqual(first);
});
test('empty offline and HTTP failures', async () => {
  await scenario('vazio');
  expect((await call('get', '/nfts', s.nftListResponseSchema)).total).toBe(0);
  await scenario('erro-5xx');
  await error('get', '/nfts', 'INTERNAL', 500);
  await scenario('erro-4xx');
  await error('get', '/nfts/golden-signal-160', 'NOT_FOUND', 404);
  await scenario('offline');
  await expect(http.get('http://localhost/api/nfts')).rejects.toMatchObject({
    kind: 'network',
  });
});
