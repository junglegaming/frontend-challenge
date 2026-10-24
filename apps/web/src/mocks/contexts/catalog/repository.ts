import type { Nft, NftEdition } from '@/domains/catalog'
import type { Store } from '../../infra/store'
import type { MockState } from '../../state'
import { derivePricing, editionStatus } from './pricing'

export class CatalogRepository {
  private readonly store: Store<MockState>

  constructor(store: Store<MockState>) {
    this.store = store
  }

  /** Public browsing/search — excludes delisted NFTs (FR-007). */
  all(): Nft[] {
    return this.store.read((s) => s.nfts.filter((n) => !s.delistedNftIds.includes(n.id)))
  }

  /** Admin view — includes delisted NFTs, so they remain manageable/re-listable. */
  allIncludingDelisted(): Nft[] {
    return this.store.read((s) => s.nfts)
  }

  insert(nft: Nft) {
    this.store.write((s) => {
      s.nfts.push(nft)
    })
  }

  isListed(id: string): boolean {
    return this.store.read((s) => !s.delistedNftIds.includes(id))
  }

  setListed(id: string, listed: boolean): Nft | null {
    return this.store.write((s) => {
      const nft = s.nfts.find((n) => n.id === id)
      if (!nft) return null
      s.delistedNftIds = listed ? s.delistedNftIds.filter((x) => x !== id) : [...new Set([...s.delistedNftIds, id])]
      nft.version += 1
      return structuredClone(nft)
    })
  }

  findById(id: string): Nft | null {
    return this.store.read((s) => s.nfts.find((n) => n.id === id) ?? null)
  }

  findEdition(nftId: string, editionId: string): { nft: Nft; edition: NftEdition } | null {
    const nft = this.findById(nftId)
    const edition = nft?.editions.find((e) => e.id === editionId)
    return nft && edition ? { nft, edition } : null
  }

  /** Applies edition changes, recomputes aggregate values and bumps the version. Returns the new NFT. */
  updateEditions(nftId: string, mutate: (editions: NftEdition[]) => void): Nft | null {
    return this.store.write((s) => {
      const nft = s.nfts.find((n) => n.id === nftId)
      if (!nft) return null
      mutate(nft.editions)
      nft.editions.forEach((edition) => {
        edition.status = editionStatus(edition)
      })
      Object.assign(nft, derivePricing(nft.editions))
      nft.version += 1
      return structuredClone(nft)
    })
  }
}
