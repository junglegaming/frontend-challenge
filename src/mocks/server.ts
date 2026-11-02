/**
 * MSW server instance for automated tests.
 *
 * Provides a programmatic MSW server that can be used in Jest/ Vitest test files.
 * Enables MSW initialization in automated tests without a browser environment.
 *
 * @module mocks/server
 * @see src/mocks/browser.ts - Browser development initialization
 * @see src/mocks/handlers/index.ts - Request handlers
 * @see src/mocks/state/mock-state.ts - Centralized mock state
 */

import { setupServer } from 'msw'
import { handlers } from './handlers'
import type { MockState } from '../state/mock-state'

/** MSW server instance exported for test usage */
export const server = setupServer(...handlers)

/** Mock state instance for test server */
let testMockState: MockState = {
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

/**
 * Reset mock state before each test.
 *
 * Ensures test isolation by resetting all mock state to initial fixtures.
 * Should be called in beforeEach or test setup.
 *
 * @example
 * beforeEach(async () => {
 *   await resetMockState()
 * })
 */
export async function resetMockState(): Promise<void> {
  testMockState = {
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
}

/**
 * Check if server is listening.
 *
 * @returns boolean indicating if MSW server is active
 */
export function isServerActive(): boolean {
  return server.listening({ silent: true })
}

/**
 * Get base URL for MSW handlers.
 *
 * Returns the base URL that MSW is listening on.
 * Useful for Axios client configuration in tests.
 */
export function getBaseUrl(): string {
  return '/api'
}

/**
 * Set mock state for the test server.
 *
 * @param state - Mock state to set
 */
export function setTestMockState(state: MockState): void {
  testMockState = state
}

/**
 * Get current mock state from test server.
 *
 * @returns Current MockState instance
 */
export function getTestMockState(): MockState {
  return testMockState
}

/**
 * Reset mock state to initial fixtures.
 *
 * Restores all state to initial values.
 * Useful for test isolation between scenarios.
 */
export function resetTestMockState(): MockState {
  testMockState = {
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
  return testMockState
}

/**
 * Export mock state utilities for use in tests.
 *
 * @example
 * import { getTestMockState, resetMockState } from '@/mocks/server'
 * expect(getTestMockState().user).toBeNull()
 */
export const mockStateUtils = {
  getTestMockState,
  resetMockState,
  resetTestMockState,
  setTestMockState
}

/**
 * Default export for convenience in test files.
 *
 * @example
 * import { server, resetMockState, isServerActive } from '@/mocks/server'
 *
 * beforeEach(async () => {
 *   await resetMockState()
 *   server.listen()
 * })
 *
 * afterEach(() => {
 *   server.close()
 * })
 */
export default {
  server,
  resetMockState,
  isServerActive,
  getBaseUrl,
  setTestMockState,
  getTestMockState,
  mockStateUtils
}