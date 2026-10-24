import type { Creator } from '@/domains/creators'
import type { CatalogRepository } from '../catalog/repository'

/** Short, deterministic bio derived from the artist's own name (research.md D3 — no free-text/editable field). */
function bioFor(name: string): string {
  return `${name} é um dos criadores da Kurio, com obras publicadas em múltiplas edições na plataforma.`
}

/**
 * Read-only projection over `CatalogRepository` — a Creator has no state of its own; it is derived
 * by grouping the catalog's NFTs on `artist.id` every time it's read (research.md D2).
 */
export class CreatorsRepository {
  private readonly catalog: CatalogRepository

  constructor(catalog: CatalogRepository) {
    this.catalog = catalog
  }

  private byArtist(): Map<string, Creator> {
    const byId = new Map<string, Creator>()
    for (const nft of this.catalog.all()) {
      const existing = byId.get(nft.artist.id)
      if (existing) existing.nftCount += 1
      else
        byId.set(nft.artist.id, {
          id: nft.artist.id,
          name: nft.artist.name,
          avatarUrl: nft.artist.avatarUrl,
          bio: bioFor(nft.artist.name),
          nftCount: 1,
        })
    }
    return byId
  }

  all(): Creator[] {
    return Array.from(this.byArtist().values())
  }

  findById(id: string): Creator | null {
    return this.byArtist().get(id) ?? null
  }

  nftsByArtist(id: string) {
    return this.catalog.all().filter((nft) => nft.artist.id === id)
  }
}
