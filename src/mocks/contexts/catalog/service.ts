import Decimal from 'decimal.js'
import type { CatalogQuery, Nft, NftSummary } from '@/domains/catalog'
import type { Page } from '@/shared/api/contracts'
import type { EthAmount } from '@/shared/lib/eth'
import { errors } from '../../http/errors'
import { createEvent, type EventPublisher } from '../../realtime/publisher'
import type { CatalogRepository } from './repository'

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export const toSummary = (nft: Nft): NftSummary => ({
  id: nft.id,
  name: nft.name,
  artist: nft.artist,
  category: nft.category,
  image: nft.image,
  priceFrom: nft.priceFrom,
  totalAvailable: nft.totalAvailable,
  featured: nft.featured,
  createdAt: nft.createdAt,
  version: nft.version,
})

export interface EditionChange {
  price?: EthAmount
  available?: number
}

export class CatalogService {
  private readonly repository: CatalogRepository
  private readonly publisher: EventPublisher
  private readonly isCatalogEmpty: () => boolean

  constructor(repository: CatalogRepository, publisher: EventPublisher, isCatalogEmpty: () => boolean) {
    this.repository = repository
    this.publisher = publisher
    this.isCatalogEmpty = isCatalogEmpty
  }

  search(query: Required<Pick<CatalogQuery, 'page' | 'pageSize' | 'sort' | 'availability'>> & CatalogQuery): Page<NftSummary> {
    const all = this.isCatalogEmpty() ? [] : this.repository.all()
    const term = query.q ? normalize(query.q.trim()) : ''
    const categories = new Set(query.category ?? [])
    const min = query.minPrice ? new Decimal(query.minPrice) : null
    const max = query.maxPrice ? new Decimal(query.maxPrice) : null

    const filtered = all.filter((nft) => {
      if (term) {
        const haystack = normalize([nft.name, nft.artist.name, nft.collection, ...nft.tags].join(' '))
        if (!haystack.includes(term)) return false
      }
      if (categories.size > 0 && !categories.has(nft.category)) return false
      if (query.availability === 'available' && nft.totalAvailable === 0) return false
      if (min && new Decimal(nft.priceFrom).lessThan(min)) return false
      if (max && new Decimal(nft.priceFrom).greaterThan(max)) return false
      return true
    })

    const sorted = [...filtered].sort((a, b) => {
      switch (query.sort) {
        case 'price_asc':
          return new Decimal(a.priceFrom).comparedTo(b.priceFrom) || a.id.localeCompare(b.id)
        case 'price_desc':
          return new Decimal(b.priceFrom).comparedTo(a.priceFrom) || a.id.localeCompare(b.id)
        case 'name_asc':
          return a.name.localeCompare(b.name, 'pt-BR')
        case 'recent':
        default:
          return b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)
      }
    })

    const total = sorted.length
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
    const start = (query.page - 1) * query.pageSize
    return {
      items: sorted.slice(start, start + query.pageSize).map(toSummary),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
    }
  }

  featured(): NftSummary[] {
    if (this.isCatalogEmpty()) return []
    return this.repository.all().filter((n) => n.featured).map(toSummary)
  }

  detail(id: string): Nft {
    const nft = this.repository.findById(id)
    if (!nft) throw errors.notFound('NFT')
    return nft
  }

  /** Changes price/stock of an edition and broadcasts `nft.updated` (REST and events stay in sync). */
  changeEdition(nftId: string, editionId: string, change: EditionChange): Nft {
    if (!this.repository.findEdition(nftId, editionId)) throw errors.notFound('Edição')
    const updated = this.repository.updateEditions(nftId, (editions) => {
      const edition = editions.find((e) => e.id === editionId)
      if (!edition) return
      if (change.price !== undefined) edition.price = new Decimal(change.price).toFixed(18)
      if (change.available !== undefined) edition.available = Math.max(0, Math.min(edition.supply, change.available))
    })
    if (!updated) throw errors.notFound('NFT')
    this.broadcast(updated)
    return updated
  }

  /** Reserves (negative delta) or releases (positive delta) stock for several editions atomically. */
  adjustStock(lines: Array<{ nftId: string; editionId: string; delta: number }>) {
    const byNft = new Map<string, typeof lines>()
    lines.forEach((line) => byNft.set(line.nftId, [...(byNft.get(line.nftId) ?? []), line]))
    byNft.forEach((nftLines, nftId) => {
      const updated = this.repository.updateEditions(nftId, (editions) => {
        nftLines.forEach((line) => {
          const edition = editions.find((e) => e.id === line.editionId)
          if (edition) edition.available = Math.max(0, Math.min(edition.supply, edition.available + line.delta))
        })
      })
      if (updated) this.broadcast(updated)
    })
  }

  private broadcast(nft: Nft) {
    this.publisher.publish(
      createEvent('nft.updated', { type: 'nft', id: nft.id }, nft.version, {
        nftId: nft.id,
        priceFrom: nft.priceFrom,
        totalAvailable: nft.totalAvailable,
        editions: nft.editions.map(({ id, price, available, status }) => ({ id, price, available, status })),
      }),
      { kind: 'everyone' },
    )
  }
}
