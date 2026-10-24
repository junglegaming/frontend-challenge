import type { AdminOverview, AdminUserDetail, AdminUserSummary, CreateListingRequest, UpdateEditionRequest } from '@/domains/admin'
import type { Nft } from '@/domains/catalog'
import { errors } from '../../http/errors'
import { randomId } from '../../infra/random'
import type { SessionRepository, UserRepository } from '../auth/repository'
import type { CatalogRepository } from '../catalog/repository'
import { derivePricing } from '../catalog/pricing'
import type { CatalogService } from '../catalog/service'

function toAdminUserSummary(user: { id: string; name: string; email: string; username: string; role: 'collector' | 'admin'; status: 'active' | 'suspended' }): AdminUserSummary {
  return { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role, status: user.status }
}

export class AdminService {
  private readonly catalogRepository: CatalogRepository
  private readonly catalogService: CatalogService
  private readonly users: UserRepository
  private readonly sessions: SessionRepository

  constructor(catalogRepository: CatalogRepository, catalogService: CatalogService, users: UserRepository, sessions: SessionRepository) {
    this.catalogRepository = catalogRepository
    this.catalogService = catalogService
    this.users = users
    this.sessions = sessions
  }

  // --- Products -----------------------------------------------------------

  listNfts() {
    return this.catalogRepository.allIncludingDelisted()
  }

  /**
   * The marketplace totals the admin home shows. Products are the NFTs on the public storefront (not delisted);
   * the order counts come from the order service, which owns them (`counts`).
   */
  overview(counts: AdminOverview['orders']): AdminOverview {
    const users = this.users.all()
    return {
      products: { total: this.catalogRepository.all().length },
      users: { total: users.length, suspended: users.filter((user) => user.status === 'suspended').length },
      orders: counts,
    }
  }

  createListing(input: CreateListingRequest): Nft {
    const id = randomId('nft')
    const edition = {
      id: `${id}_${input.edition.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: input.edition.name,
      price: input.edition.price,
      supply: input.edition.supply,
      available: input.edition.supply,
      maxPerOrder: input.edition.maxPerOrder,
      status: 'available' as const,
    }
    const nft: Nft = {
      id,
      name: input.name,
      artist: { id: 'art_admin', name: 'Kurio Admin', avatarUrl: '/art/avatar-ana.svg' },
      category: input.category,
      image: input.image,
      featured: false,
      createdAt: new Date().toISOString(),
      version: 1,
      collection: input.collection,
      description: input.description,
      tags: [],
      gallery: [input.image],
      editions: [edition],
      ...derivePricing([edition]),
    }
    this.catalogRepository.insert(nft)
    return nft
  }

  updateEdition(nftId: string, editionId: string, change: UpdateEditionRequest) {
    return this.catalogService.changeEdition(nftId, editionId, change)
  }

  delist(nftId: string) {
    const nft = this.catalogRepository.setListed(nftId, false)
    if (!nft) throw errors.notFound('NFT')
    return nft
  }

  // --- Users ---------------------------------------------------------------

  listUsers(q: string | undefined): AdminUserSummary[] {
    const term = q?.trim().toLowerCase()
    return this.users
      .all()
      .filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
      .map(toAdminUserSummary)
  }

  getUser(id: string): AdminUserDetail {
    const user = this.users.findById(id)
    if (!user) throw errors.notFound('Usuário')
    return { ...toAdminUserSummary(user), bio: user.bio, avatarUrl: user.avatarUrl, updatedAt: user.updatedAt }
  }

  suspendUser(id: string): AdminUserDetail {
    const user = this.users.findById(id)
    if (!user) throw errors.notFound('Usuário')
    if (user.role === 'admin') {
      const activeAdmins = this.users.all().filter((u) => u.role === 'admin' && u.status === 'active')
      if (activeAdmins.length <= 1) {
        throw errors.conflict('Não é possível suspender o único administrador ativo.')
      }
    }
    const updated = this.users.update(id, { status: 'suspended' })
    this.sessions.deleteByUserId(id)
    if (!updated) throw errors.notFound('Usuário')
    return { ...toAdminUserSummary(updated), bio: updated.bio, avatarUrl: updated.avatarUrl, updatedAt: updated.updatedAt }
  }

  reactivateUser(id: string): AdminUserDetail {
    const updated = this.users.update(id, { status: 'active' })
    if (!updated) throw errors.notFound('Usuário')
    return { ...toAdminUserSummary(updated), bio: updated.bio, avatarUrl: updated.avatarUrl, updatedAt: updated.updatedAt }
  }
}
