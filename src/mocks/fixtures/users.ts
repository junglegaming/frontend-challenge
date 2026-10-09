import type { Cart, CartItem, Nft } from '@/lib/http/schemas'
import { addEth, mulQty } from '@/lib/money'
import type { MockUser, OwnerKey } from '../db/store'
import { getSeedNft } from './nfts'

export const pseudoHash = (input: string): string => {
  let hash = 5381
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export const SEED_CREDENTIALS = {
  ana: { email: 'ana@nft-marketplace.test', password: 'Ana12345' },
  bruno: { email: 'bruno@nft-marketplace.test', password: 'Bruno1234' },
} as const

export const SEED_USERS: MockUser[] = [
  {
    id: 'usr_ana',
    name: 'Ana Colecionadora',
    email: SEED_CREDENTIALS.ana.email,
    username: 'ana.eth',
    bio: 'Colecionadora de arte digital e fotografia on-chain.',
    createdAt: '2026-01-15T10:00:00.000Z',
    passwordHash: `hash:${pseudoHash(SEED_CREDENTIALS.ana.password)}`,
  },
  {
    id: 'usr_bruno',
    name: 'Bruno Colecionador',
    email: SEED_CREDENTIALS.bruno.email,
    username: 'bruno',
    createdAt: '2026-03-02T10:00:00.000Z',
    passwordHash: `hash:${pseudoHash(SEED_CREDENTIALS.bruno.password)}`,
  },
]

export const SEED_FAVORITES: Partial<Record<OwnerKey, string[]>> = {
  'user:usr_ana': ['golden-signal-160', 'sage-nomad-009'],
  'user:usr_bruno': [],
}

const CART_UPDATED_AT = '2026-08-20T12:00:00.000Z'

const cartItemFromNft = (nft: Nft, qty: number): CartItem => ({
  nftId: nft.id,
  name: nft.name,
  image: nft.image,
  price: nft.price,
  qty,
  available: nft.available,
  edition: { ...nft.edition },
  lineTotal: mulQty(nft.price, qty),
  updatedAt: CART_UPDATED_AT,
})

const buildAnaCart = (): Cart => {
  const items = [
    cartItemFromNft(getSeedNft('golden-signal-160'), 1),
    cartItemFromNft(getSeedNft('sage-nomad-009'), 2),
  ]
  return {
    items,
    subtotal: items.reduce((total, item) => addEth(total, item.lineTotal), '0'),
    itemCount: items.reduce((count, item) => count + item.qty, 0),
    updatedAt: CART_UPDATED_AT,
    version: 1,
  }
}

export const SEED_CARTS: Partial<Record<OwnerKey, Cart>> = {
  'user:usr_ana': buildAnaCart(),
}
