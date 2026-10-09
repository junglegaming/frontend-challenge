import * as s from '@/lib/http/schemas';
import { cmpEth } from '@/lib/money';
import { NFT_CATEGORIES } from '../fixtures/nfts';
import { getDb } from '../db/store';
import { route, parse, reply, fail, user } from './runtime';
export const nftHandlers = [
  route('get', '/nfts', 'list', (request) => {
    const params = new URL(request.url).searchParams;
    const raw: Record<string, unknown> = Object.fromEntries(params);
    if (params.has('categories')) raw.categories = params.getAll('categories');
    if (params.has('networks')) raw.networks = params.getAll('networks');
    const q = parse(s.nftListQuerySchema, raw);
    const favoriteIds = q.favoritesOnly
      ? (getDb().favorites[`user:${user(request).id}`] ?? [])
      : undefined;
    if (q.minPrice && q.maxPrice && cmpEth(q.minPrice, q.maxPrice) > 0)
      fail(422, 'VALIDATION_ERROR', 'Intervalo inválido', {
        minPrice: ['Maior que maxPrice'],
      });
    const all = getDb().flags.forceEmptyCatalog ? [] : getDb().nfts;
    const facets = {
      categories: NFT_CATEGORIES.map((id) => ({
        id,
        count: all.filter((n) => n.categories.includes(id)).length,
      })),
      networks: s.catalogNetworkSchema.options.map((id) => ({
        id,
        count: all.filter((n) => n.network === id).length,
      })),
    };
    let items = all.filter(
      (n) =>
        (!favoriteIds || favoriteIds.includes(n.id)) &&
        (!q.q ||
          `${n.name} ${n.collection} ${n.creator.name}`
            .toLowerCase()
            .includes(q.q.toLowerCase())) &&
        (!q.categories ||
          q.categories.every((c) => n.categories.includes(c))) &&
        (!q.networks || q.networks.includes(n.network)) &&
        (!q.minPrice || cmpEth(n.price, q.minPrice) >= 0) &&
        (!q.maxPrice || cmpEth(n.price, q.maxPrice) <= 0)
    );
    items = [...items].sort((a, b) =>
      q.sort === 'price_asc'
        ? cmpEth(a.price, b.price)
        : q.sort === 'price_desc'
          ? cmpEth(b.price, a.price)
          : q.sort === 'popular'
            ? b.favoritesCount - a.favoritesCount
            : q.sort === 'recent'
              ? b.createdAt.localeCompare(a.createdAt)
              : 0
    );
    return reply(s.nftListResponseSchema, {
      items: items.slice((q.page - 1) * q.pageSize, q.page * q.pageSize),
      total: items.length,
      facets,
      page: q.page,
      pageSize: q.pageSize,
    });
  }),
  route('get', '/nfts/:id', 'detail', (_, params) => {
    const nft = getDb().nfts.find((n) => n.id === params.id);
    if (!nft) fail(404, 'NOT_FOUND', 'NFT não encontrado');
    return reply(s.nftSchema, nft);
  }),
];
