import type { Order } from '@/schemas/order'
import type { Quote } from '@/schemas/quote'
import type { EditionId } from '@/schemas/nft'
import { buildSeed, type DbNft, type DbUser, type DbWallet } from './fixtures'

export interface DbSession {
  token: string
  userId: string
  expiresAt: number
}

export interface DbCartItem {
  id: string
  nftId: string
  editionId: EditionId
  quantity: number
  priceAtAdd: string
}

export interface DbCart {
  id: string
  /** `user:<id>` ou `guest:<uuid>` */
  owner: string
  items: DbCartItem[]
  coupon: string | null
  version: number
}

export interface DbQuote {
  quote: Quote
  userId: string
  cartId: string
}

export interface DbOrder {
  order: Order
  userId: string
  quoteId: string
  walletId: string
  idempotencyKey: string
  requestHash: string
  outcome: 'confirm' | 'reject'
  resolveAt: number
}

export interface DbState {
  users: DbUser[]
  sessions: DbSession[]
  nfts: DbNft[]
  carts: DbCart[]
  favorites: Record<string, string[]>
  wallets: DbWallet[]
  quotes: DbQuote[]
  orders: DbOrder[]
}

const STORAGE_KEY = 'kurio:db'
const SCHEMA_VERSION = 1

function fresh(): DbState {
  const seed = buildSeed()
  return { ...seed, sessions: [], carts: [], favorites: {}, quotes: [], orders: [] }
}

function load(): DbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { v: number; state: DbState }
      if (parsed.v === SCHEMA_VERSION) return parsed.state
    }
  } catch {
    // storage indisponível ou corrompido: volta ao seed
  }
  return fresh()
}

let state = load()

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: SCHEMA_VERSION, state }))
  } catch {
    // ponytail: sem storage o mock segue em memória (perde estado no refresh)
  }
}

// Outra aba alterou o "servidor": recarrega para manter as abas coerentes.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) state = load()
  })
}

export const db = {
  get state(): DbState {
    return state
  },
  update<T>(mutate: (draft: DbState) => T): T {
    const result = mutate(state)
    save()
    return result
  },
  reset() {
    state = fresh()
    save()
  },
}
