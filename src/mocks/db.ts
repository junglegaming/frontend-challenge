import type { Cart, Nft, Order, Wallet } from '@/shared/contracts'

import { createNfts, createUserRecords, seedWallets } from './fixtures'

const DB_KEY = 'kurio:mock-db'

/**
 * As artes passaram de PNG para WebP. Bancos salvos antes da troca guardam as
 * URLs antigas em NFTs, carrinhos e pedidos — reescritas ao carregar.
 */
const LEGACY_ARTWORK_URL = /\/images\/(Frame-136|NFT-Artwork-\d+)\.png/g

export type UserRecord = {
  id: string
  name: string
  email: string
  passwordHash: string
  avatarUrl: string | null
}

export type SessionRecord = {
  token: string
  userId: string
  expiresAt: string
}

export type Db = {
  nfts: Nft[]
  users: UserRecord[]
  /** userId -> lista de nftIds favoritados. */
  favorites: Record<string, string[]>
  /** ownerKey -> carrinho. */
  carts: Record<string, Cart>
  /** orderId -> pedido (snapshot imutável). */
  orders: Record<string, Order>
  /** userId -> carteiras. */
  wallets: Record<string, Wallet[]>
  /** token -> sessão. */
  sessions: Record<string, SessionRecord>
  /** idempotencyKey -> orderId (recuperação de pedido idempotente). */
  idempotency: Record<string, string>
  /** idempotencyKey -> impressão digital do corpo (detecta reuso com conteúdo diferente). */
  idempotencyFingerprints: Record<string, string>
  /** orderId -> dono do pedido (autorização e limpeza do carrinho certo). */
  orderOwners: Record<string, OrderOwner>
}

export type OrderOwner = {
  userId: string
  /** Chave do carrinho de onde o pedido saiu. */
  ownerKey: string
  /**
   * Quando e como o pagamento simulado se resolve. Persistido porque os timers
   * do mock vivem na página: recarregar não pode deixar o pedido pendente para sempre.
   */
  paymentResolvesAt?: number
  paymentOutcome?: 'confirmed' | 'declined'
}

type StoredDb = Omit<Db, 'idempotencyFingerprints' | 'orderOwners'> &
  Partial<Pick<Db, 'idempotencyFingerprints' | 'orderOwners'>>

/** Completa bancos salvos por versões anteriores do mock (campos criados depois). */
function upgrade(stored: StoredDb): Db {
  for (const wallets of Object.values(stored.wallets)) {
    for (const wallet of wallets) {
      if (wallet.provider === undefined) wallet.provider = null
      if (wallet.ensName === undefined) wallet.ensName = null
      if (wallet.referralCode === undefined) wallet.referralCode = null
    }
  }
  for (const order of Object.values(stored.orders)) {
    if (order.payment === undefined) order.payment = null
    for (const item of order.items) {
      if (!item.imageUrl) {
        item.imageUrl = stored.nfts.find((n) => n.id === item.nftId)?.imageUrl ?? ''
      }
    }
  }
  // Catálogo salvo antes de atributos/edições por faixa: o seed atual o substitui
  // (ids de NFT e da edição principal se mantêm, então carrinhos seguem válidos).
  const isCatalogOutdated = stored.nfts.some((nft) => !Array.isArray(nft.attributes))
  return {
    ...stored,
    nfts: isCatalogOutdated ? createNfts() : stored.nfts,
    idempotencyFingerprints: stored.idempotencyFingerprints ?? {},
    orderOwners: stored.orderOwners ?? {},
  }
}

/**
 * Hash simples e determinístico para o mock (NÃO é criptográfico).
 * Existe apenas para nunca armazenar senha em claro, conforme o enunciado.
 */
export function hashPassword(password: string): string {
  const salted = `kurio:${password}`
  let h = 5381
  for (let i = 0; i < salted.length; i++) {
    h = ((h << 5) + h + salted.charCodeAt(i)) | 0
  }
  return `h${(h >>> 0).toString(16)}`
}

function seed(): Db {
  return {
    nfts: createNfts(),
    users: createUserRecords(),
    favorites: {},
    carts: {},
    orders: {},
    wallets: seedWallets(),
    sessions: {},
    idempotency: {},
    idempotencyFingerprints: {},
    orderOwners: {},
  }
}

function load(): Db {
  try {
    const stored = localStorage.getItem(DB_KEY)
    if (stored) {
      const raw = stored.replace(LEGACY_ARTWORK_URL, '/images/$1.webp')
      const parsed = JSON.parse(raw) as StoredDb
      if (
        parsed &&
        Array.isArray(parsed.nfts) &&
        parsed.nfts.length > 0 &&
        typeof parsed.nfts[0]?.priceEth === 'string' &&
        typeof parsed.nfts[0]?.imageUrl === 'string'
      ) {
        const imageFixes: Record<string, string> = {
          'nft-1': '/images/Frame-136.webp',
          'nft-19': '/images/NFT-Artwork-18.webp',
          'nft-20': '/images/NFT-Artwork-18.webp',
          'nft-21': '/images/NFT-Artwork-05.webp',
          'nft-22': '/images/NFT-Artwork-09.webp',
          'nft-23': '/images/NFT-Artwork-09.webp',
        }
        let changed = false
        for (const [id, url] of Object.entries(imageFixes)) {
          const item = parsed.nfts.find((n) => n.id === id)
          if (item && item.imageUrl !== url) {
            item.imageUrl = url
            changed = true
          }
        }
        const upgraded = upgrade(parsed)
        if (changed || raw !== stored) {
          persistRaw(upgraded)
        }
        return upgraded
      }
    }
  } catch {
    /* ignora e re-seeda */
  }
  const fresh = seed()
  persistRaw(fresh)
  return fresh
}

function persistRaw(d: Db): void {
  localStorage.setItem(DB_KEY, JSON.stringify(d))
}

let db: Db = load()

export function getDb(): Db {
  return db
}

export function persist(): void {
  persistRaw(db)
}

/** Restaura integralmente o cenário conhecido (seed). */
export function resetDb(): Db {
  db = seed()
  persistRaw(db)
  return db
}
