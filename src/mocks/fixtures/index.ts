/**
 * Centralized mock fixtures for the NFT Marketplace.
 *
 * Provides deterministic fixture data for all API endpoints.
 * Fixtures are pure data structures that match the types defined
 * in src/shared/api/api-types.ts.
 *
 * Key principles:
 * - No React component imports directly (acceptance criteria)
 * - Centralized source of truth for mock data
 * - Easy to update for new scenarios
 * - Supports multiple user isolation scenarios
 *
 * @module mocks/fixtures
 * @see src/shared/api/api-types - Type definitions fixtures must match
 * @see src/mocks/state/mock-state.ts - State consumer
 */

import type { NftSummary, UserSummary, CartItem, OrderSummary } from '../shared/api/api-types'
import type { PaginationParams } from '../shared/api/api-types'

/** NFT fixture data - available NFTs in catalog */
export const nftAvailable: NftSummary[] = [
  {
    id: 'nft-001',
    title: 'Cyberpunk Ape #1',
    description: 'A rare cyberpunk-style ape NFT',
    imageUrl: '/placeholder-nft-1.jpg',
    owner: '0x1234...abcd',
    price: '2.5',
    royalty: 5,
    edition: 1,
    totalEdition: 10,
    isAvailable: true,
    isFavorite: false,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    attributes: [
      { traitType: 'Rarity', value: 'Legendary' },
      { traitType: 'Color', value: 'Midnight' }
    ],
    stats: {
      viewCount: 1245,
      bidCount: 23,
      floorPrice: '1.8'
    }
  },
  {
    id: 'nft-002',
    title: 'Solar Flare Dragon',
    description: 'A fiery dragon NFT with solar properties',
    imageUrl: '/placeholder-nft-2.jpg',
    owner: '0x1234...efgh',
    price: '8.75',
    royalty: 8,
    edition: 1,
    totalEdition: 50,
    isAvailable: true,
    isFavorite: false,
    createdAt: '2024-02-10T14:20:00Z',
    updatedAt: '2024-02-10T14:20:00Z',
    attributes: [
      { traitType: 'Rarity', value: 'Epic' },
      { traitType: 'Element', value: 'Fire' }
    ],
    stats: {
      viewCount: 2891,
      bidCount: 45,
      floorPrice: '6.2'
    }
  },
  {
    id: 'nft-003',
    title: 'Midnight Lotus',
    description: 'An elegant lotus NFT with subtle glow',
    imageUrl: '/placeholder-nft-3.jpg',
    owner: '0x1234...ijkl',
    price: '1.2',
    royalty: 3,
    edition: 2,
    totalEdition: 100,
    isAvailable: true,
    isFavorite: false,
    createdAt: '2024-03-05T09:10:00Z',
    updatedAt: '2024-03-05T09:10:00Z',
    attributes: [
      { traitType: 'Rarity', value: 'Rare' },
      { traitType: 'Color', value: 'Purple' }
    ],
    stats: {
      viewCount: 421,
      bidCount: 8,
      floorPrice: '0.9'
    }
  }
]

/** Sold-out NFT fixtures */
export const nftSoldOut: NftSummary[] = [
  {
    id: 'nft-010',
    title: 'Golden Dragon #5',
    description: 'Sold-out NFT - no longer available',
    imageUrl: '/placeholder-nft-2.jpg',
    owner: '0x1234...abcd',
    price: '0',
    royalty: 10,
    edition: 5,
    totalEdition: 5,
    isAvailable: false,
    isFavorite: false,
    createdAt: '2024-01-10T10:30:00Z',
    updatedAt: '2024-01-10T10:30:00Z',
    attributes: [
      { traitType: 'Rarity', value: 'Epic' },
      { traitType: 'Color', value: 'Gold' }
    ],
    stats: {
      viewCount: 2891,
      bidCount: 45,
      floorPrice: '0'
    }
  }
]

/** Empty catalog fixture */
export const nftEmpty: NftSummary[] = []

/** User fixtures - isolated scenarios */
export const userAlice: UserSummary = {
  id: 'user-alice',
  address: '0xAlice...123',
  username: 'alice_crypto',
  avatar: '/avatar-alice.png',
  walletCount: 2,
  totalVolume: '15.5',
  isVerified: true
}

export const userBob: UserSummary = {
  id: 'user-bob',
  address: '0xBob...456',
  username: 'bob_wallet',
  avatar: '/avatar-bob.png',
  walletCount: 1,
  totalVolume: '3.2',
  isVerified: false
}

/** Empty cart fixture */
export const cartEmpty: CartItem[] = []

/** Cart with items fixture */
export const cartWithItems: CartItem[] = [
  {
    nftId: 'nft-001',
    price: '2.5',
    quantity: 1,
    total: '2.5',
    nft: nftAvailable[0]
  }
]

/** Order success fixture */
export const orderSuccess: OrderSummary = {
  id: 'order-001',
  status: 'confirmed',
  price: '2.5',
  fee: '0.15',
  total: '2.65',
  createdAt: '2024-01-20T14:30:00Z',
  nft: nftAvailable[0],
  buyer: userAlice
}

/** Empty order fixture */
export const orderEmpty: OrderSummary = {
  id: '',
  status: 'pending',
  price: '0',
  fee: '0',
  total: '0',
  createdAt: new Date().toISOString(),
  nft: nftAvailable[0],
  buyer: userAlice
}

/** Coupon fixtures */
export const couponValid: { code: string; discount: number } = {
  code: 'WELCOME10',
  discount: 10
}

export const couponExpired: { code: string; reason: string } = {
  code: 'EXPIRED20',
  reason: 'Coupon has expired'
}

export const couponInvalid: { code: string; reason: string } = {
  code: 'INVALID99',
  reason: 'Invalid coupon code'
}

/** Pagination fixture */
export const paginationDefault: PaginationParams = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
}

/**
 * Get fixtures by scenario name.
 *
 * Useful for test scenarios that need specific data combinations.
 *
 * @param scenario - Scenario name ('alice-cart', 'bob-favorites', 'empty-catalog', etc.)
 * @returns Fixture object matching the scenario
 */
export function getFixtures(scenario: string): Record<string, unknown> {
  const scenarios: Record<string, Record<string, unknown>> = {
    'alice-cart': {
      user: userAlice,
      cart: cartWithItems,
      nfts: nftAvailable
    },
    'bob-cart': {
      user: userBob,
      cart: cartEmpty,
      nfts: nftSoldOut
    },
    'empty-catalog': {
      user: userAlice,
      cart: cartEmpty,
      nfts: nftEmpty
    },
    'two-users': {
      userAlice,
      userBob
    }
  }

  return scenarios[scenario] || {}
}

/**
 * Get all available scenarios.
 *
 * @returns Array of scenario names
 */
export function getAvailableScenarios(): string[] {
  return ['alice-cart', 'bob-cart', 'empty-catalog', 'two-users']
}