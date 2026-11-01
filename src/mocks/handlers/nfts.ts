import { http } from 'msw/core/http'

import {
  type Nft,
  type NftFacets,
  type NftListQuery,
  networkSchema,
  nftListQuerySchema,
} from '@/shared/contracts'
import { compare } from '@/shared/lib/money'

import { getDb } from '../db'
import { COLLECTIONS, reviewsFor } from '../fixtures'
import { json } from '../http'
import { simulateNetwork } from '../scenarios'
import { errorResponse } from '../utils'

/**
 * Aplica busca e filtros da listagem a um NFT.
 *
 * @param ignore - Filtro a desconsiderar (cálculo da faceta correspondente).
 */
function matchesQuery(nft: Nft, query: NftListQuery, ignore?: 'collection' | 'network'): boolean {
  if (query.q) {
    const q = query.q.toLowerCase()
    if (!nft.name.toLowerCase().includes(q) && !nft.collection.toLowerCase().includes(q)) {
      return false
    }
  }
  if (ignore !== 'collection' && query.collection && nft.collection !== query.collection) {
    return false
  }
  if (ignore !== 'network' && query.network && nft.network !== query.network) return false
  if (query.priceMin && compare(nft.priceEth, query.priceMin) < 0) return false
  if (query.priceMax && compare(nft.priceEth, query.priceMax) > 0) return false
  return true
}

export const nftHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    const url = new URL(request.url)

    const cleanParam = (v: string | null) => {
      if (!v) return undefined
      const s = v.replace(/^"|"$/g, '').trim()
      if (s === '' || s === 'undefined' || s === 'null') return undefined
      return s
    }

    const rawQuery = {
      q: cleanParam(url.searchParams.get('q')),
      collection: cleanParam(url.searchParams.get('collection')),
      network: cleanParam(url.searchParams.get('network')),
      priceMin: cleanParam(url.searchParams.get('priceMin')),
      priceMax: cleanParam(url.searchParams.get('priceMax')),
      sort: cleanParam(url.searchParams.get('sort')),
      page: cleanParam(url.searchParams.get('page')),
      pageSize: cleanParam(url.searchParams.get('pageSize')),
    }

    const parsedQuery = nftListQuerySchema.safeParse(rawQuery)
    const query = parsedQuery.success
      ? parsedQuery.data
      : {
          q: typeof rawQuery.q === 'string' ? rawQuery.q : undefined,
          collection: typeof rawQuery.collection === 'string' ? rawQuery.collection : undefined,
          network: undefined,
          priceMin: undefined,
          priceMax: undefined,
          sort: undefined,
          page: 1,
          pageSize: 9,
        }

    const catalog = getDb().nfts
    let items = catalog.filter((nft) => matchesQuery(nft, query))

    if (query.sort === 'price_asc') items.sort((a, b) => compare(a.priceEth, b.priceEth))
    if (query.sort === 'price_desc') items.sort((a, b) => compare(b.priceEth, a.priceEth))
    if (query.sort === 'newest') items = [...items].reverse()

    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
    const start = (query.page - 1) * query.pageSize
    const pageItems = items.slice(start, start + query.pageSize)

    // Facetas: cada contagem considera os demais filtros ativos, não o próprio.
    const facets: NftFacets = {
      collections: COLLECTIONS.map((value) => ({
        value,
        count: catalog.filter(
          (nft) => nft.collection === value && matchesQuery(nft, query, 'collection'),
        ).length,
      })),
      networks: networkSchema.options.map((value) => ({
        value,
        count: catalog.filter((nft) => nft.network === value && matchesQuery(nft, query, 'network'))
          .length,
      })),
    }

    return json({
      items: pageItems,
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages },
      facets,
    })
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const nft = getDb().nfts.find((n) => n.id === params.id)
    if (!nft) return errorResponse('NOT_FOUND', 'NFT não encontrado', 404)
    return json(nft)
  }),

  http.get('/api/nfts/:id/reviews', async ({ params }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const nftId = String(params.id)
    if (!getDb().nfts.some((n) => n.id === nftId)) {
      return errorResponse('NOT_FOUND', 'NFT não encontrado', 404)
    }
    return json(reviewsFor(nftId))
  }),
]
