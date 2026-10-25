import { addEth, compareEth, mulEth, percentOf, subEth } from '@/lib/eth'
import type { Cart, CartItem } from '@/schemas/cart'
import type { Network, Summary } from '@/schemas/common'
import type { LineItem } from '@/schemas/line-item'
import { NETWORK_LABELS } from '@/schemas/common'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/schemas/events'
import type { Nft, NftListParams, NftListResponse, NftSummary } from '@/schemas/nft'
import { COLLECTION_LABELS } from '@/schemas/nft'
import type { Order } from '@/schemas/order'
import type { Quote } from '@/schemas/quote'
import type { DbCart, DbOrder, DbState } from './db'
import { COUPONS, NETWORK_FEES, type DbNft } from './fixtures'
import { uid } from './random'

export class DomainError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

// ---------- NFTs ----------

function toNftSummary(nft: DbNft): NftSummary {
  const inStock = nft.editions.filter((edition) => edition.available > 0)
  const priced = inStock.length > 0 ? inStock : nft.editions
  // Preço de vitrine = edição 1/50 (padrão do detalhe, como no Figma); senão a menor disponível.
  const featured = inStock.find((edition) => edition.id === '1/50')
  const price = featured?.price ?? priced.map((edition) => edition.price).reduce((min, value) => (compareEth(value, min) < 0 ? value : min))
  return {
    id: nft.id,
    name: nft.name,
    image: nft.image,
    collection: nft.collection,
    network: nft.network,
    price,
    compareAtPrice: nft.compareAtPrice,
    badge: nft.badge,
    available: nft.editions.reduce((sum, edition) => sum + edition.available, 0),
    version: nft.version,
  }
}

export function toNft(nft: DbNft): Nft {
  return {
    ...toNftSummary(nft),
    description: nft.description,
    details: nft.details,
    tokenId: nft.tokenId,
    collectionName: nft.collectionName,
    attributes: nft.attributes,
    rating: nft.rating,
    reviewsCount: nft.reviewsCount,
    royalty: nft.royalty,
    contract: nft.contract,
    gallery: nft.gallery,
    editions: nft.editions,
  }
}

export function listNfts(state: DbState, params: NftListParams): NftListResponse {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 9
  const q = params.q?.toLowerCase()

  const summaries = state.nfts
    .filter((nft) => !q || nft.name.toLowerCase().includes(q))
    .filter((nft) => params.tab !== 'new' || nft.isNew)
    .filter((nft) => params.tab !== 'trending' || nft.isTrending)
    .map((nft) => ({ nft, summary: toNftSummary(nft) }))

  const inPriceRange = ({ summary }: { summary: NftSummary }) =>
    (!params.minPrice || compareEth(summary.price, params.minPrice) >= 0) &&
    (!params.maxPrice || compareEth(summary.price, params.maxPrice) <= 0)
  const inCollections = ({ nft }: { nft: DbNft }) => !params.collections?.length || params.collections.includes(nft.collection)
  const inNetworks = ({ nft }: { nft: DbNft }) => !params.networks?.length || params.networks.includes(nft.network)

  const filtered = summaries.filter((row) => inPriceRange(row) && inCollections(row) && inNetworks(row))

  const sorted = [...filtered].sort((a, b) => {
    switch (params.sort) {
      case 'price-asc':
        return compareEth(a.summary.price, b.summary.price)
      case 'price-desc':
        return compareEth(b.summary.price, a.summary.price)
      case 'name':
        return a.nft.name.localeCompare(b.nft.name, 'pt-BR')
      default:
        return b.nft.createdAt.localeCompare(a.nft.createdAt)
    }
  })

  // Facetas contam considerando os outros filtros, para que as contagens reflitam o que o clique vai mostrar.
  const collectionBase = summaries.filter((row) => inPriceRange(row) && inNetworks(row))
  const networkBase = summaries.filter((row) => inPriceRange(row) && inCollections(row))
  const prices = state.nfts.map((nft) => toNftSummary(nft).price)

  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize).map((row) => row.summary),
    page,
    pageSize,
    total: sorted.length,
    totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    facets: {
      collections: Object.entries(COLLECTION_LABELS).map(([id, label]) => ({
        id,
        label,
        count: collectionBase.filter((row) => row.nft.collection === id).length,
      })),
      networks: Object.entries(NETWORK_LABELS).map(([id, label]) => ({
        id,
        label,
        count: networkBase.filter((row) => row.nft.network === id).length,
      })),
      priceRange: {
        min: prices.reduce((min, value) => (compareEth(value, min) < 0 ? value : min)),
        max: prices.reduce((max, value) => (compareEth(value, max) > 0 ? value : max)),
      },
    },
  }
}

export function findNft(state: DbState, nftId: string): DbNft {
  const nft = state.nfts.find((item) => item.id === nftId)
  if (!nft) throw new DomainError(404, 'NOT_FOUND', 'NFT não encontrado')
  return nft
}

export function findEdition(state: DbState, nftId: string, editionId: string) {
  const edition = findNft(state, nftId).editions.find((item) => item.id === editionId)
  if (!edition) throw new DomainError(404, 'NOT_FOUND', 'Edição não encontrada')
  return edition
}

// ---------- Carrinho e cotação ----------

export function validateCoupon(code: string, now = Date.now()) {
  const coupon = COUPONS[code.toUpperCase()]
  if (!coupon) throw new DomainError(422, 'COUPON_INVALID', 'Cupom inválido', { field: 'code' })
  if (Date.parse(coupon.expiresAt) < now) throw new DomainError(422, 'COUPON_EXPIRED', 'Cupom expirado')
  return { code: code.toUpperCase(), percent: coupon.percent }
}

function couponOf(cart: DbCart) {
  if (!cart.coupon) return null
  try {
    return validateCoupon(cart.coupon)
  } catch {
    return null
  }
}

function summarize(lines: { lineTotal: string }[], couponPercent: number | null, network: Network): Summary {
  const subtotal = addEth('0', ...lines.map((line) => line.lineTotal))
  const discount = couponPercent ? percentOf(subtotal, couponPercent) : '0.00'
  const networkFee = lines.length > 0 ? NETWORK_FEES[network] : '0.00'
  return { subtotal, discount, networkFee, total: addEth(subEth(subtotal, discount), networkFee) }
}

export function cartView(state: DbState, cart: DbCart): Cart {
  const items: CartItem[] = cart.items.map((item) => {
    const nft = findNft(state, item.nftId)
    const edition = findEdition(state, item.nftId, item.editionId)
    const priceChanged = compareEth(edition.price, item.priceAtAdd) !== 0
    return {
      id: item.id,
      nftId: item.nftId,
      editionId: item.editionId,
      name: nft.name,
      image: nft.image,
      tokenId: nft.tokenId,
      quantity: item.quantity,
      unitPrice: edition.price,
      lineTotal: mulEth(edition.price, item.quantity),
      available: edition.available,
      priceChanged,
      previousUnitPrice: priceChanged ? item.priceAtAdd : null,
    }
  })
  const coupon = couponOf(cart)
  return {
    id: cart.id,
    items,
    coupon,
    summary: summarize(items, coupon?.percent ?? null, 'ethereum'),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    version: cart.version,
  }
}

export function ensureCart(state: DbState, owner: string): DbCart {
  let cart = state.carts.find((item) => item.owner === owner)
  if (!cart) {
    cart = { id: uid('cart'), owner, items: [], coupon: null, version: 1 }
    state.carts.push(cart)
  }
  return cart
}

export function setCartQuantity(state: DbState, cart: DbCart, nftId: string, editionId: DbCart['items'][number]['editionId'], quantity: number) {
  const edition = findEdition(state, nftId, editionId)
  if (quantity > edition.available) {
    throw new DomainError(409, 'OUT_OF_STOCK', `Apenas ${edition.available} disponível(is) nesta edição`, {
      nftId,
      editionId,
      available: edition.available,
    })
  }
  const existing = cart.items.find((item) => item.nftId === nftId && item.editionId === editionId)
  if (existing) existing.quantity = quantity
  else cart.items.push({ id: uid('ci'), nftId, editionId, quantity, priceAtAdd: edition.price })
  cart.version += 1
}

/** Visitante autenticou: soma os itens no carrinho do usuário, limitado pela disponibilidade. */
export function mergeCarts(state: DbState, guest: DbCart, target: DbCart) {
  for (const item of guest.items) {
    const edition = findEdition(state, item.nftId, item.editionId)
    const existing = target.items.find((row) => row.nftId === item.nftId && row.editionId === item.editionId)
    const quantity = Math.min((existing?.quantity ?? 0) + item.quantity, edition.available)
    if (quantity <= 0) continue
    if (existing) existing.quantity = quantity
    else target.items.push({ ...item, id: uid('ci'), quantity })
  }
  if (!target.coupon && guest.coupon) target.coupon = guest.coupon
  target.version += 1
  state.carts = state.carts.filter((cart) => cart.id !== guest.id)
}

export function buildQuote(state: DbState, cart: DbCart, network: Network, walletId: string, now = Date.now()): Quote {
  if (cart.items.length === 0) throw new DomainError(422, 'VALIDATION_ERROR', 'Carrinho vazio')
  const items: LineItem[] = cart.items.map((item) => {
    const nft = findNft(state, item.nftId)
    const edition = findEdition(state, item.nftId, item.editionId)
    if (item.quantity > edition.available) {
      throw new DomainError(409, 'OUT_OF_STOCK', `${nft.name} (${item.editionId}) sem disponibilidade suficiente`, {
        nftId: item.nftId,
        editionId: item.editionId,
        available: edition.available,
      })
    }
    return {
      nftId: item.nftId,
      editionId: item.editionId,
      name: nft.name,
      image: nft.image,
      tokenId: nft.tokenId,
      quantity: item.quantity,
      unitPrice: edition.price,
      lineTotal: mulEth(edition.price, item.quantity),
    }
  })
  const coupon = couponOf(cart)
  return {
    id: uid('q'),
    items,
    coupon,
    network,
    walletId,
    ...summarize(items, coupon?.percent ?? null, network),
    expiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
  }
}

/** Cotação desatualizada = recalcular hoje daria outro resultado (preço, estoque, cupom, taxa ou itens). */
export function isQuoteStale(state: DbState, cart: DbCart, quote: Quote, now = Date.now()): { stale: false } | { stale: true; fresh: Quote | null } {
  if (Date.parse(quote.expiresAt) < now) return { stale: true, fresh: tryQuote(state, cart, quote) }
  const fresh = tryQuote(state, cart, quote)
  if (!fresh) return { stale: true, fresh: null }
  const fingerprint = (value: Quote) => JSON.stringify([value.items, value.subtotal, value.discount, value.networkFee, value.total, value.coupon])
  return fingerprint(fresh) === fingerprint(quote) ? { stale: false } : { stale: true, fresh }
}

function tryQuote(state: DbState, cart: DbCart, quote: Quote): Quote | null {
  try {
    return buildQuote(state, cart, quote.network, quote.walletId)
  } catch {
    return null
  }
}

// ---------- Pedidos ----------

export function nftUpdatedEvent(nft: DbNft): NftUpdatedEvent {
  return {
    eventId: uid('evt'),
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: new Date().toISOString(),
    data: { editions: nft.editions },
  }
}

export function orderUpdatedEvent(order: Order): OrderUpdatedEvent {
  return {
    eventId: uid('evt'),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    data: { status: order.status },
  }
}

interface ResolveResult {
  order: Order
  changedNfts: DbNft[]
}

/**
 * Finaliza um pedido pendente. Confirmação revalida estoque, debita disponibilidade
 * e remove do carrinho apenas os itens e quantidades comprados.
 */
export function resolveOrder(state: DbState, record: DbOrder, now = Date.now()): ResolveResult | null {
  if (record.order.status !== 'pending') return null
  const changedNfts: DbNft[] = []

  const shortage = record.order.receipt.items.find((item) => findEdition(state, item.nftId, item.editionId).available < item.quantity)
  if (record.outcome === 'reject' || shortage) {
    record.order = {
      ...record.order,
      status: 'rejected',
      rejectionReason: shortage ? `${shortage.name} esgotou antes da confirmação` : 'Pagamento recusado pela carteira',
      version: record.order.version + 1,
    }
    return { order: record.order, changedNfts }
  }

  for (const item of record.order.receipt.items) {
    const nft = findNft(state, item.nftId)
    const edition = findEdition(state, item.nftId, item.editionId)
    edition.available -= item.quantity
    nft.version += 1
    changedNfts.push(nft)
  }

  const cart = state.carts.find((row) => row.owner === `user:${record.userId}`)
  if (cart) {
    for (const item of record.order.receipt.items) {
      const row = cart.items.find((line) => line.nftId === item.nftId && line.editionId === item.editionId)
      if (row) row.quantity -= item.quantity
    }
    cart.items = cart.items.filter((row) => row.quantity > 0)
    if (cart.items.length === 0) cart.coupon = null
    cart.version += 1
  }

  record.order = {
    ...record.order,
    status: 'confirmed',
    confirmedAt: new Date(now).toISOString(),
    version: record.order.version + 1,
  }
  return { order: record.order, changedNfts }
}
