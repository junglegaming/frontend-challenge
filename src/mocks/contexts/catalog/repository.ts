import type { Nft, NftEdition } from '@/domains/catalog'
import type { Store } from '../../infra/store'
import type { MockState } from '../../state'
import { derivePricing, editionStatus } from './pricing'

export class CatalogRepository {
  private readonly store: Store<MockState>

  constructor(store: Store<MockState>) {
    this.store = store
  }

  all(): Nft[] {
    return this.store.read((s) => s.nfts)
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
