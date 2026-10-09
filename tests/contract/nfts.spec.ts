import { test, expect } from 'vitest';
import * as s from '@/lib/http/schemas';
import { call, error, scenario, login } from './helpers';
import { cmpEth } from '@/lib/money';
import { clearDb, getDb } from '@/mocks/db/store';
import { DB_STORAGE_KEY, safeStorage } from '@/mocks/db/persist';
test('favorites filter is authenticated, paginated and isolated by user', async () => {
  await error('get', '/nfts?favoritesOnly=true', 'UNAUTHORIZED', 401);
  await error('get', '/nfts?favoritesOnly=invalid', 'VALIDATION_ERROR', 422);
  const ana = await login();
  const ids = getDb()
    .nfts.slice(0, 11)
    .map((nft) => nft.id);
  for (const id of ids)
    await call(
      'put',
      `/favorites/${id}`,
      s.favoritesResponseSchema,
      undefined,
      ana
    );
  const first = await call(
    'get',
    '/nfts?favoritesOnly=true&pageSize=9',
    s.nftListResponseSchema,
    undefined,
    ana
  );
  const second = await call(
    'get',
    '/nfts?favoritesOnly=true&pageSize=9&page=2',
    s.nftListResponseSchema,
    undefined,
    ana
  );
  expect(first.total).toBe(11);
  expect([...first.items, ...second.items].map((nft) => nft.id)).toEqual(ids);
  const combined = await call(
    'get',
    '/nfts?favoritesOnly=true&q=Golden&sort=price_asc',
    s.nftListResponseSchema,
    undefined,
    ana
  );
  expect(
    combined.items.every(
      (nft) =>
        ids.includes(nft.id) &&
        `${nft.name} ${nft.collection} ${nft.creator.name}`.includes('Golden')
    )
  ).toBe(true);
  const bruno = await login('bruno');
  expect(
    (
      await call(
        'get',
        '/nfts?favoritesOnly=true',
        s.nftListResponseSchema,
        undefined,
        bruno
      )
    ).total
  ).toBe(0);
  expect(
    (await call('get', '/nfts?favoritesOnly=false', s.nftListResponseSchema))
      .total
  ).toBe(65);
});
test('catalog pagination and combined filters reflect request', async () => {
  const list = await call('get', '/nfts', s.nftListResponseSchema);
  expect(list.total).toBe(65);
  expect(list.items).toHaveLength(12);
  const filtered = await call(
    'get',
    '/nfts?categories=Arte%20digital&categories=Arte%203D&minPrice=0.02&maxPrice=2&sort=price_desc&pageSize=48',
    s.nftListResponseSchema
  );
  expect(filtered.items.length).toBeGreaterThan(0);
  for (const nft of filtered.items) {
    expect(nft.categories).toEqual(
      expect.arrayContaining(['Arte digital', 'Arte 3D'])
    );
    expect(cmpEth(nft.price, '2')).toBeLessThanOrEqual(0);
  }
  for (let i = 1; i < filtered.items.length; i++)
    expect(
      cmpEth(filtered.items[i - 1].price, filtered.items[i].price)
    ).toBeGreaterThanOrEqual(0);
  expect(
    (await call('get', '/nfts?page=999', s.nftListResponseSchema)).items
  ).toEqual([]);
  expect(
    (await call('get', '/nfts?q=absent', s.nftListResponseSchema)).total
  ).toBe(0);
});
test('detail, 404 and invalid filters', async () => {
  await call('get', '/nfts/golden-signal-160', s.nftSchema);
  await error('get', '/nfts/absent', 'NOT_FOUND', 404);
  for (const query of ['page=0', 'pageSize=49', 'minPrice=2&maxPrice=1'])
    await error('get', `/nfts?${query}`, 'VALIDATION_ERROR', 422);
});

test('network filtering uses OR, combines with categories and has global facets', async () => {
  const all = await call('get', '/nfts?pageSize=48', s.nftListResponseSchema);
  expect(all.facets.categories).toHaveLength(9);
  expect(all.facets.categories.every((facet) => facet.count > 0)).toBe(true);
  expect(
    all.facets.networks.map((facet) => facet.count).reduce((a, b) => a + b, 0)
  ).toBe(all.total);
  const filtered = await call(
    'get',
    '/nfts?networks=ethereum&networks=polygon&categories=Arte%20digital&minPrice=0.02&maxPrice=12.30&pageSize=48',
    s.nftListResponseSchema
  );
  expect(filtered.items.length).toBeGreaterThan(0);
  expect(filtered.facets).toEqual(all.facets);
  for (const nft of filtered.items) {
    expect(['ethereum', 'polygon']).toContain(nft.network);
    expect(nft.categories).toContain('Arte digital');
  }
  expect(
    (await call('get', '/nfts?page=999&q=absent', s.nftListResponseSchema))
      .facets
  ).toEqual(all.facets);
  await error('get', '/nfts?networks=sepolia', 'VALIDATION_ERROR', 422);
  await error(
    'get',
    '/nfts?networks=ethereum&networks=invalid',
    'VALIDATION_ERROR',
    422
  );
});

test('empty catalog returns all facets with zero counts', async () => {
  await scenario('vazio');
  const list = await call('get', '/nfts', s.nftListResponseSchema);
  expect(list.facets.categories).toHaveLength(9);
  expect(list.facets.networks).toHaveLength(3);
  expect(
    [...list.facets.categories, ...list.facets.networks].every(
      (facet) => facet.count === 0
    )
  ).toBe(true);
});

test('persisted legacy catalogs are upgraded without losing user or NFT state', async () => {
  const current = structuredClone(getDb());
  current.nfts[0].price = '1.234';
  current.nfts[0].version = 7;
  current.favorites['anon:legacy'] = [current.nfts[0].id];
  const legacy = {
    ...current,
    nfts: current.nfts.map((nft) => {
      const record: Partial<s.Nft> = { ...nft };
      delete record.network;
      return record;
    }),
  };
  clearDb();
  safeStorage().setItem(DB_STORAGE_KEY, JSON.stringify(legacy));
  const list = await call('get', '/nfts', s.nftListResponseSchema);
  expect(list.total).toBe(65);
  expect(
    list.facets.networks.reduce((sum, facet) => sum + facet.count, 0)
  ).toBe(65);
  expect(list.facets.categories.every((facet) => facet.count > 0)).toBe(true);
  expect(getDb().nfts[0]).toMatchObject({ price: '1.234', version: 7 });
  expect(getDb().favorites['anon:legacy']).toEqual([current.nfts[0].id]);
  const persisted = JSON.parse(safeStorage().getItem(DB_STORAGE_KEY)!);
  expect(
    persisted.nfts.every(
      (nft: s.Nft) => s.catalogNetworkSchema.safeParse(nft.network).success
    )
  ).toBe(true);
});

test('catalog search normalizes collection selection from legacy URLs', async () => {
  const { parseCatalogSearch } =
    await import('@/features/catalog/search-params');
  expect(
    parseCatalogSearch({ categories: ['Arte digital', 'Música'] }).categories
  ).toEqual(['Arte digital']);
  expect(
    parseCatalogSearch({ categories: ['', 'Fotografia', 'Música'] }).categories
  ).toEqual(['Fotografia']);
  expect(parseCatalogSearch({ categories: [] }).categories).toBeUndefined();
});
