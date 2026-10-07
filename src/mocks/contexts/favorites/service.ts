import type { FavoritesResponse } from '@/domains/favorites'
import type { Store } from '../../infra/store'
import { errors } from '../../http/errors'
import type { MockState } from '../../state'
import type { CatalogRepository } from '../catalog/repository'

export class FavoritesRepository {
  private readonly store: Store<MockState>

  constructor(store: Store<MockState>) {
    this.store = store
  }

  list(userId: string): string[] {
    return this.store.read((s) => s.favorites[userId] ?? [])
  }

  save(userId: string, nftIds: string[]) {
    this.store.write((s) => {
      s.favorites[userId] = nftIds
    })
  }
}

export class FavoritesService {
  private readonly repository: FavoritesRepository
  private readonly catalog: CatalogRepository

  constructor(repository: FavoritesRepository, catalog: CatalogRepository) {
    this.repository = repository
    this.catalog = catalog
  }

  list(userId: string): FavoritesResponse {
    return { nftIds: this.repository.list(userId) }
  }

  add(userId: string, nftId: string): FavoritesResponse {
    if (!this.catalog.findById(nftId)) throw errors.notFound('NFT')
    const current = this.repository.list(userId)
    if (!current.includes(nftId)) this.repository.save(userId, [...current, nftId])
    return this.list(userId)
  }

  remove(userId: string, nftId: string): FavoritesResponse {
    this.repository.save(
      userId,
      this.repository.list(userId).filter((id) => id !== nftId),
    )
    return this.list(userId)
  }
}
