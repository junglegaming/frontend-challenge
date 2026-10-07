import Decimal from 'decimal.js'
import type { NftEdition } from '@/domains/catalog'

/** Derived values of an NFT aggregate, recomputed whenever an edition changes. */
export function derivePricing(editions: NftEdition[]) {
  const purchasable = editions.filter((e) => e.status === 'available' && e.available > 0)
  const pool = purchasable.length > 0 ? purchasable : editions
  const priceFrom = pool.reduce((min, e) => Decimal.min(min, e.price), new Decimal(pool[0]?.price ?? '0'))
  return {
    priceFrom: priceFrom.toFixed(18),
    totalAvailable: purchasable.reduce((sum, e) => sum + e.available, 0),
  }
}

export function editionStatus(edition: Pick<NftEdition, 'status' | 'available'>): NftEdition['status'] {
  if (edition.status === 'unavailable') return 'unavailable'
  return edition.available > 0 ? 'available' : 'sold_out'
}
