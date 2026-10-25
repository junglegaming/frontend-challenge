import { z } from 'zod'
import { ethSchema, networkSchema } from './common'

export const collectionIdSchema = z.enum([
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'games',
  'subscriptions',
  'utility',
])
export type CollectionId = z.infer<typeof collectionIdSchema>

export const COLLECTION_LABELS: Record<CollectionId, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  games: 'Jogos',
  subscriptions: 'Assinaturas',
  utility: 'Utilidade',
}

export const editionIdSchema = z.enum(['1/1', '1/10', '1/50', 'open'])
export type EditionId = z.infer<typeof editionIdSchema>

export const EDITION_LABELS: Record<EditionId, string> = {
  '1/1': '1/1',
  '1/10': '1/10',
  '1/50': '1/50',
  open: 'Aberta',
}

export const editionSchema = z.object({
  id: editionIdSchema,
  price: ethSchema,
  available: z.number().int().nonnegative(),
})
export type Edition = z.infer<typeof editionSchema>

/** Chave da imagem em /public/nfts/<image>-<640|1080>.webp */
export const nftImageSchema = z.enum(['emerald-ape', 'sage-nomad', 'golden-beat', 'ivory-baron'])
export type NftImage = z.infer<typeof nftImageSchema>

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  image: nftImageSchema,
  collection: collectionIdSchema,
  network: networkSchema,
  /** Menor preço entre as edições disponíveis */
  price: ethSchema,
  compareAtPrice: ethSchema.nullable(),
  badge: z.enum(['RARO']).nullable(),
  available: z.number().int().nonnegative(),
  version: z.number().int(),
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftSchema = nftSummarySchema.extend({
  description: z.string(),
  details: z.string(),
  tokenId: z.string(),
  collectionName: z.string(),
  attributes: z.array(z.string()),
  rating: z.number(),
  reviewsCount: z.number().int(),
  royalty: z.string(),
  contract: z.string(),
  gallery: z.array(nftImageSchema),
  editions: z.array(editionSchema),
})
export type Nft = z.infer<typeof nftSchema>

export const nftTabSchema = z.enum(['all', 'new', 'trending'])
export const nftSortSchema = z.enum(['recent', 'price-asc', 'price-desc', 'name'])
export type NftTab = z.infer<typeof nftTabSchema>
export type NftSort = z.infer<typeof nftSortSchema>

export const NFT_SORT_LABELS: Record<NftSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  name: 'Nome (A-Z)',
}

/** Search params da rota `/` e query da API. Valores inválidos caem no default. */
export const nftListParamsSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  collections: z.array(collectionIdSchema).optional().catch(undefined),
  networks: z.array(networkSchema).optional().catch(undefined),
  minPrice: ethSchema.optional().catch(undefined),
  maxPrice: ethSchema.optional().catch(undefined),
  tab: nftTabSchema.optional().catch(undefined),
  sort: nftSortSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  pageSize: z.coerce.number().int().min(1).max(24).optional().catch(undefined),
})
export type NftListParams = z.infer<typeof nftListParamsSchema>

const facetSchema = z.object({ id: z.string(), label: z.string(), count: z.number().int() })

export const nftListResponseSchema = z.object({
  items: z.array(nftSummarySchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  facets: z.object({
    collections: z.array(facetSchema),
    networks: z.array(facetSchema),
    priceRange: z.object({ min: ethSchema, max: ethSchema }),
  }),
})
export type NftListResponse = z.infer<typeof nftListResponseSchema>
