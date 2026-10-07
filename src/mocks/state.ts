import type { Nft } from '@/domains/catalog'
import type { Order } from '@/domains/orders'
import type { Wallet } from '@/domains/wallets'
import type { EthAmount } from '@/shared/lib/eth'
import { buildNftFixtures } from './fixtures/nfts'
import { buildUserFixtures } from './fixtures/users'
import { LocalStoragePersistence, Store } from './infra/store'

export interface UserRecord {
  id: string
  name: string
  username: string
  email: string
  bio: string
  avatarUrl: string | null
  passwordSalt: string
  passwordHash: string
  updatedAt: string
}

export interface SessionRecord {
  token: string
  userId: string
  createdAt: number
  expiresAt: number
}

export interface CartLineRecord {
  nftId: string
  editionId: string
  quantity: number
  acknowledgedUnitPrice: EthAmount
}

export interface CartRecord {
  /** `user:<userId>` or `guest:<uuid>` */
  id: string
  lines: CartLineRecord[]
  couponCode: string | null
  updatedAt: string
}

export interface OrderRecord extends Order {
  userId: string
  idempotencyKey: string
  requestFingerprint: string
  /** Timestamp at which the simulated payment settles. */
  settleAt: number
  outcome: 'confirmed' | 'declined'
}

export interface MockState {
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: Nft[]
  favorites: Record<string, string[]>
  carts: Record<string, CartRecord>
  wallets: Record<string, Wallet[]>
  orders: Record<string, OrderRecord>
  /** `${userId}:${idempotencyKey}` → orderId */
  idempotency: Record<string, string>
  eventSequence: number
}

export function createInitialState(): MockState {
  const { users, wallets, favorites } = buildUserFixtures()
  return {
    users,
    sessions: [],
    nfts: buildNftFixtures(),
    favorites,
    carts: {},
    wallets,
    orders: {},
    idempotency: {},
    eventSequence: 0,
  }
}

const SCHEMA_VERSION = 1

export const store = new Store<MockState>(
  new LocalStoragePersistence<MockState>('nft-mock:state', SCHEMA_VERSION),
  createInitialState,
)
