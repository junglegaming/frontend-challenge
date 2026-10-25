import { http, HttpResponse } from 'msw'
import { nftListParamsSchema } from '@/schemas/nft'
import { db } from '../db'
import { findNft, listNfts, toNft } from '../domain'
import { API, apiError, route } from '../http'
import { catalogLatencyMs, getScenario, shouldFailCatalog } from '../scenarios'

export const nftHandlers = [
  http.get(
    `${API}/nfts`,
    route(
      ({ request }) => {
        if (shouldFailCatalog()) return apiError(503, 'TRANSIENT', 'Catálogo temporariamente indisponível')
        const url = new URL(request.url)
        const all = (key: string) => {
          const values = url.searchParams.getAll(key)
          return values.length > 0 ? values : undefined
        }
        const params = nftListParamsSchema.parse({
          q: url.searchParams.get('q') ?? undefined,
          collections: all('collections'),
          networks: all('networks'),
          minPrice: url.searchParams.get('minPrice') ?? undefined,
          maxPrice: url.searchParams.get('maxPrice') ?? undefined,
          tab: url.searchParams.get('tab') ?? undefined,
          sort: url.searchParams.get('sort') ?? undefined,
          page: url.searchParams.get('page') ?? undefined,
          pageSize: url.searchParams.get('pageSize') ?? undefined,
        })
        const state = getScenario() === 'empty' ? { ...db.state, nfts: [] } : db.state
        if (state.nfts.length === 0) {
          return HttpResponse.json({
            items: [],
            page: 1,
            pageSize: params.pageSize ?? 9,
            total: 0,
            totalPages: 1,
            facets: { collections: [], networks: [], priceRange: { min: '0.00', max: '0.00' } },
          })
        }
        return HttpResponse.json(listNfts(state, params))
      },
      { latency: catalogLatencyMs },
    ),
  ),

  http.get(
    `${API}/nfts/:nftId`,
    route(({ params }) => HttpResponse.json(toNft(findNft(db.state, String(params.nftId))))),
  ),
]
