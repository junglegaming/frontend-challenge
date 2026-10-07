import type { EthAmount } from '@/shared/lib/eth'

export const NFT_CATEGORIES = [
  'art',
  'collectibles',
  'music',
  'photography',
  'video',
  'utility',
  'sport',
  'virtual-worlds',
] as const
export type NftCategory = (typeof NFT_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<NftCategory, string> = {
  art: 'Arte',
  collectibles: 'Colecionáveis',
  music: 'Música',
  photography: 'Fotografia',
  video: 'Vídeo',
  utility: 'Utilidade',
  sport: 'Esporte',
  'virtual-worlds': 'Mundos virtuais',
}

export const CATALOG_SORTS = ['recent', 'price_asc', 'price_desc', 'name_asc'] as const
export type CatalogSort = (typeof CATALOG_SORTS)[number]

export const SORT_LABELS: Record<CatalogSort, string> = {
  recent: 'Mais recentes',
  price_asc: 'Menor preço',
  price_desc: 'Maior preço',
  name_asc: 'Nome (A–Z)',
}

export const AVAILABILITY_FILTERS = ['all', 'available'] as const
export type AvailabilityFilter = (typeof AVAILABILITY_FILTERS)[number]

export interface NftImage {
  src: string
  alt: string
  width: number
  height: number
}

export interface Artist {
  id: string
  name: string
  avatarUrl: string
}

export type EditionStatus = 'available' | 'sold_out' | 'unavailable'

export interface NftEdition {
  id: string
  name: string
  price: EthAmount
  supply: number
  available: number
  /** Max units a single order may contain for this edition. */
  maxPerOrder: number
  status: EditionStatus
}

export interface NftSummary {
  id: string
  name: string
  artist: Artist
  category: NftCategory
  image: NftImage
  /** Lowest price among purchasable editions (or lowest overall if none is purchasable). */
  priceFrom: EthAmount
  totalAvailable: number
  featured: boolean
  createdAt: string
  /** Monotonic version, bumped on every price/availability change (matches `nft.updated`). */
  version: number
}

export interface Nft extends NftSummary {
  description: string
  collection: string
  tags: string[]
  gallery: NftImage[]
  editions: NftEdition[]
}

/** Query parameters accepted by `GET /api/nfts`. Mirrors the URL search state of the home page. */
export interface CatalogQuery {
  q?: string
  category?: NftCategory[]
  availability?: AvailabilityFilter
  minPrice?: string
  maxPrice?: string
  sort?: CatalogSort
  page?: number
  pageSize?: number
}

/** Payload of the `nft.updated` realtime event. */
export interface NftUpdatedPayload {
  nftId: string
  priceFrom: EthAmount
  totalAvailable: number
  editions: Array<Pick<NftEdition, 'id' | 'price' | 'available' | 'status'>>
}

declare module '@/shared/realtime/contracts' {
  interface RealtimeEventMap {
    'nft.updated': NftUpdatedPayload
  }
}
