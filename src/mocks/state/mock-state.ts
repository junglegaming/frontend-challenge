/**
 * Centralized mock state store for the NFT Marketplace.
 *
 * Maintains application-wide mock state that persists across
 * MSW handlers and test scenarios. Provides reset utility
 * to restore initial state.
 *
 * @module mocks/state
 * @see src/shared/api/api-types - Types consumed by state
 * @see src/mocks/fixtures/index.ts - Initial fixture data source
 * @see src/mocks/browser.ts - Browser initialization
 * @see src/mocks/server.ts - Test server initialization
 *
 * State structure:
 * - nfts: Available, sold-out, and empty catalog states
 * - users: Authenticated and anonymous user scenarios
 * - cart: Current cart state with items and totals
 * - favorites: User-specific favorite NFTs
 * - orders: Active and completed orders
 * - session: Active authentication session
 */

import type {
  NftSummary,
  UserSummary,
  CartItem,
  OrderSummary,
  PaginationParams
} from '../shared/api/api-types'

/** Mock state interface - all mutable state managed by MSW */
export interface MockState {
  /** Current authenticated user (or null for anonymous) */
  user: UserSummary | null

  /** Current user's cart items */
  cart: CartItem[]

  /** User's favorite NFT IDs */
  favorites: string[]

  /** Catalog NFTs - available items */
  nfts: NftSummary[]

  /** Sold-out NFTs (filtered from catalog) */
  nftsSoldOut: NftSummary[]

  /** Empty catalog flag */
  nftsEmpty: boolean

  /** Active order (if any) */
  order: OrderSummary | null

  /** Current authentication session */
  session: {
    isAuthenticated: boolean
    accessToken: string | null
    expiresAt: string | null
  }

  /** Pagination state for catalog queries */
  pagination: PaginationParams

  /** Metadata about last API calls */
  meta: {
    lastRequest: string | null
    requestCount: number
    error: string | null
  }
}

/** Initial mock state - loaded from fixtures at app start */
export const initialState: MockState = {
  user: null,
  cart: [],
  favorites: [],
  nfts: [],
  nftsSoldOut: [],
  nftsEmpty: true,
  order: null,
  session: {
    isAuthenticated: false,
    accessToken: null,
    expiresAt: null
  },
  pagination: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: undefined,
    collectionId: undefined,
    minPrice: undefined,
    maxPrice: undefined
  },
  meta: {
    lastRequest: null,
    requestCount: 0,
    error: null
  }
}

/** Current mutable state - starts as initialState and gets modified */
let currentState: MockState = { ...initialState }

/**
 * Get current mock state.
 *
 * @returns Current MockState instance
 * @example
 * const state = getMockState()
 * state.cart.push(item)
 */
export function getMockState(): MockState {
  return currentState
}

/**
 * Update mock state (used by MSW handlers).
 *
 * @param partial - Partial state to merge
 * @returns Updated MockState
 * @example
 * setMockState({ cart: [...cart, newItem] })
 */
export function setMockState(partial: Partial<MockState>): MockState {
  currentState = { ...currentState, ...partial }
  return currentState
}

/**
 * Reset mock state to initial fixtures.
 *
 * Restores all state to initial values defined in initialState.
 * Useful for test isolation between scenarios.
 *
 * @returns Previous state before reset
 * @example
 * beforeEach(() => {
 *   resetMockState()
 * })
 */
export function resetMockState(): MockState {
  const previous = currentState
  currentState = { ...initialState }
  return previous
}

/**
 * Reset mock state to a specific scenario.
 *
 * @param partial - Partial state to reset to
 * @returns Updated MockState
 * @example
 * resetToScenario({ user: userAlice, cart: cartWithItems })
 */
export function resetToScenario(partial: Partial<MockState>): MockState {
  currentState = { ...initialState, ...partial }
  return currentState
}

/**
 * Set user state (authentication).
 *
 * @param user - User summary or null for logout
 * @param token - Access token or null
 */
export function setUser(user: UserSummary | null, token?: string | null): void {
  currentState.user = user
  currentState.session = {
    isAuthenticated: user !== null,
    accessToken: token ?? null,
    expiresAt: user?.id === 'user-alice' ? '2025-12-31T23:59:59Z' : null
  }
}

/**
 * Add item to cart.
 *
 * @param nftId - NFT identifier
 * @param price - NFT price as string
 * @param quantity - Quantity (default: 1)
 */
export function addToCart(nftId: string, price: string, quantity: number = 1): void {
  const existingIndex = currentState.cart.findIndex(item => item.nftId === nftId)

  if (existingIndex >= 0) {
    currentState.cart[existingIndex].quantity += quantity
    currentState.cart[existingIndex].total = (
      parseFloat(currentState.cart[existingIndex].price) *
      currentState.cart[existingIndex].quantity
    ).toString()
  } else {
    currentState.cart.push({
      nftId,
      price,
      quantity,
      total: price
    })
  }
}

/**
 * Remove item from cart.
 *
 * @param nftId - NFT identifier to remove
 */
export function removeFromCart(nftId: string): void {
  currentState.cart = currentState.cart.filter(item => item.nftId !== nftId)
}

/**
 * Update cart item quantity.
 *
 * @param nftId - NFT identifier
 * @param quantity - New quantity
 */
export function updateCartQuantity(nftId: string, quantity: number): void {
  const item = currentState.cart.find(item => item.nftId === nftId)
  if (item) {
    item.quantity = quantity
    item.total = (parseFloat(item.price) * quantity).toString()
  }
}

/**
 * Set favorites for a user.
 *
 * @param nftIds - Array of NFT favorite IDs
 */
export function setFavorites(nftIds: string[]): void {
  currentState.favorites = nftIds
}

/**
 * Toggle favorite for a single NFT.
 *
 * @param nftId - NFT identifier to toggle
 * @returns New favorites state
 */
export function toggleFavorite(nftId: string): string[] {
  const index = currentState.favorites.indexOf(nftId)

  if (index >= 0) {
    currentState.favorites.splice(index, 1)
  } else {
    currentState.favorites.push(nftId)
  }

  return currentState.favorites
}

/**
 * Set current order.
 *
 * @param order - Order summary or null
 */
export function setOrder(order: OrderSummary | null): void {
  currentState.order = order
}

/**
 * Set pagination state.
 *
 * @param params - Partial pagination parameters
 */
export function setPagination(params: Partial<PaginationParams>): void {
  currentState.pagination = { ...currentState.pagination, ...params }
}

/**
 * Set error state.
 *
 * @param error - Error message or null
 */
export function setError(error: string | null): void {
  currentState.meta.error = error
}

/**
 * Increment request counter.
 *
 * @param error - Optional error message if request failed
 */
export function trackRequest(error?: string): void {
  currentState.meta.requestCount += 1
  currentState.meta.lastRequest = new Date().toISOString()
  if (error) {
    currentState.meta.error = error
  }
}

/**
 * Get cart total.
 *
 * @returns Total price as string
 */
export function getCartTotal(): string {
  return currentState.cart
    .reduce((sum, item) => sum + parseFloat(item.total), 0)
    .toString()
}

/**
 * Get cart item count.
 *
 * @returns Total quantity count
 */
export function getCartItemCount(): number {
  return currentState.cart.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Check if NFT is in favorites.
 *
 * @param nftId - NFT identifier
 * @returns boolean
 */
export function isFavorite(nftId: string): boolean {
  return currentState.favorites.includes(nftId)
}

/**
 * Check if user is authenticated.
 *
 * @returns boolean
 */
export function isAuthenticated(): boolean {
  return currentState.session.isAuthenticated
}

/**
 * Get current user.
 *
 * @returns UserSummary or null
 */
export function getCurrentUser(): UserSummary | null {
  return currentState.user
}

/**
 * Validate NFT availability.
 *
 * @param nftId - NFT identifier
 * @returns boolean indicating if NFT is available
 */
export function isNftAvailable(nftId: string): boolean {
  return (
    currentState.nfts.some(nft => nft.id === nftId) &&
    !currentState.nftsSoldOut.some(nft => nft.id === nftId)
  )
}

/**
 * Export utilities for MSW handlers.
 *
 * Handlers import from this file to access and modify mock state.
 */
export const mockStateUtils = {
  getMockState,
  setMockState,
  resetMockState,
  resetToScenario,
  setUser,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  setFavorites,
  toggleFavorite,
  setOrder,
  setPagination,
  setError,
  trackRequest,
  getCartTotal,
  getCartItemCount,
  isFavorite,
  isAuthenticated,
  getCurrentUser,
  isNftAvailable
}

/** Default export for convenience */
export default {
  getMockState,
  setMockState,
  resetMockState,
  resetToScenario,
  setUser,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  setFavorites,
  toggleFavorite,
  setOrder,
  setPagination,
  setError,
  trackRequest,
  getCartTotal,
  getCartItemCount,
  isFavorite,
  isAuthenticated,
  getCurrentUser,
  isNftAvailable,
  mockStateUtils
}