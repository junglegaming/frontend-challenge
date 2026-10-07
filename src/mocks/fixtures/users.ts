import type { Wallet } from '@/domains/wallets'
import type { UserRecord } from '../state'

/**
 * Fictitious accounts — credentials are documented in README.md.
 * Passwords exist here only as PBKDF2-SHA256 hashes (see infra/password.ts).
 */
const SEED_DATE = '2026-01-15T12:00:00.000Z'

export function buildUserFixtures() {
  const users: UserRecord[] = [
    {
      id: 'usr_ana',
      name: 'Ana Souza',
      username: 'anasouza',
      email: 'ana@nft.dev',
      bio: 'Colecionadora de arte generativa e fotografia.',
      avatarUrl: '/art/avatar-ana.svg',
      passwordSalt: '72586dd57164fdaaed3bac29ad271d5f',
      passwordHash: 'f69b171abc331eafb1cccc5eb1fa992c368d1dc5d22d36587fae0faf78391e85',
      updatedAt: SEED_DATE,
    },
    {
      id: 'usr_bruno',
      name: 'Bruno Lima',
      username: 'brunolima',
      email: 'bruno@nft.dev',
      bio: 'Música, vídeo e mundos virtuais.',
      avatarUrl: null,
      passwordSalt: '013e42d72923c939457eec307ff1effc',
      passwordHash: '9a1557372aff93b01aa4989f3cfa919e73207dfa867f550f80dcee1696915f17',
      updatedAt: SEED_DATE,
    },
  ]

  const wallets: Record<string, Wallet[]> = {
    usr_ana: [
      {
        id: 'wal_ana_primary',
        slot: 'primary',
        label: 'Carteira principal',
        provider: 'metamask',
        address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        networks: ['ethereum', 'polygon', 'base'],
        updatedAt: SEED_DATE,
      },
    ],
    usr_bruno: [
      {
        id: 'wal_bruno_primary',
        slot: 'primary',
        label: 'Ledger + MetaMask',
        provider: 'metamask',
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        networks: ['ethereum', 'arbitrum'],
        updatedAt: SEED_DATE,
      },
      {
        id: 'wal_bruno_secondary',
        slot: 'secondary',
        label: 'Coinbase',
        provider: 'coinbase',
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        networks: ['base', 'polygon'],
        updatedAt: SEED_DATE,
      },
    ],
  }

  const favorites: Record<string, string[]> = {
    usr_ana: ['nft_001', 'nft_004'],
    usr_bruno: ['nft_002'],
  }

  return { users, wallets, favorites }
}
