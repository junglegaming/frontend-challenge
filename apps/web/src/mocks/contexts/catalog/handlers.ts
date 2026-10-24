import { HttpResponse, http } from 'msw'
import {
  AVAILABILITY_FILTERS,
  CATALOG_SORTS,
  NFT_CATEGORIES,
  type AvailabilityFilter,
  type CatalogSort,
  type NftCategory,
} from '@/domains/catalog'
import { errors } from '../../http/errors'
import { route } from '../../http/route'
import { collect } from '../auth/validation'
import type { CatalogService } from './service'

const DECIMAL = /^\d+(\.\d{1,18})?$/
const includes = <T extends string>(list: readonly T[], value: string): value is T => (list as readonly string[]).includes(value)

function parseQuery(url: URL) {
  const params = url.searchParams
  const page = Number(params.get('page') ?? '1')
  const pageSize = Number(params.get('pageSize') ?? '12')
  const sort = params.get('sort') ?? 'recent'
  const availability = params.get('availability') ?? 'all'
  const category = (params.get('category') ?? '').split(',').filter(Boolean)
  const minPrice = params.get('minPrice') ?? undefined
  const maxPrice = params.get('maxPrice') ?? undefined

  const fields = collect({
    page: Number.isInteger(page) && page >= 1 ? null : 'Página inválida.',
    pageSize: Number.isInteger(pageSize) && pageSize >= 1 && pageSize <= 48 ? null : 'Tamanho de página inválido.',
    sort: includes(CATALOG_SORTS, sort) ? null : 'Ordenação inválida.',
    availability: includes(AVAILABILITY_FILTERS, availability) ? null : 'Filtro de disponibilidade inválido.',
    category: category.every((c) => includes(NFT_CATEGORIES, c)) ? null : 'Categoria inválida.',
    minPrice: minPrice === undefined || DECIMAL.test(minPrice) ? null : 'Preço mínimo inválido.',
    maxPrice: maxPrice === undefined || DECIMAL.test(maxPrice) ? null : 'Preço máximo inválido.',
  })
  if (Object.keys(fields).length > 0) throw errors.validation(fields, 'Parâmetros de busca inválidos.')

  return {
    q: params.get('q') ?? undefined,
    page,
    pageSize,
    sort: sort as CatalogSort,
    availability: availability as AvailabilityFilter,
    category: category as NftCategory[],
    minPrice,
    maxPrice,
  }
}

export function catalogHandlers(api: string, catalog: CatalogService) {
  return [
    http.get(
      `${api}/nfts/featured`,
      route(() => HttpResponse.json(catalog.featured())),
    ),
    http.get(
      `${api}/nfts`,
      route(({ request }) => HttpResponse.json(catalog.search(parseQuery(new URL(request.url))))),
    ),
    http.get<{ nftId: string }>(
      `${api}/nfts/:nftId`,
      route(({ params }) => HttpResponse.json(catalog.detail(params.nftId))),
    ),
  ]
}
