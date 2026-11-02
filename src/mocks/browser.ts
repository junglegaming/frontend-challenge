/**
 * MSW browser initialization for development environment.
 *
 * Activates MSW mock handlers in the browser during development.
 * Must be called once at app startup (typically in main.tsx or entry point).
 *
 * Features:
 * - Activates MSW request handlers
 * - Initializes Axios interceptor for mock routing
 * - Exposes reset utility for test scenarios
 * - Configurable via MOCK_MODE environment variable
 *
 * @module mocks/browser
 * @see src/mocks/server.ts - Test server initialization
 * @see src/shared/api/http-client.ts - Axios client setup
 */

import { setupWorker } from 'msw'
import { server } from './server'
import type { MockState } from '../state/mock-state'

/** MSW worker instance for browser development */
let worker: ReturnType<typeof setupWorker> | null = null

/** Mock state instance for browser */
let mockState: MockState = {
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
 * Initialize MSW for browser development.
 *
 * Sets up the MSW worker with all request handlers and starts listening
 * for network requests. Must be called before any Axios requests are made.
 *
 * @param options - Optional configuration
 * @param options.enabled - Whether MSW is enabled (defaults to true in dev)
 */
export function initializeMswBrowser(options: { enabled?: boolean } = {}): void {
  const enabled = options.enabled ?? import.meta.env.DEV

  if (!enabled) {
    return
  }

  // Import handlers dynamically
  import('../mocks/handlers').then(({ handlers }) => {
    worker = setupWorker(...handlers)

    worker.start({ silent: true })

    // @ts-expect-error - MSW types
    ;(window as any).mswWorker = worker

    // Initialize mock state from handlers
    mockState = worker.mock?.state || mockState
  })
}

/**
 * Reset mock state to initial fixtures.
 *
 * Resets all mock state to initial fixture values.
 * Useful for test isolation between scenarios.
 *
 * @param state - Optional partial state to reset (merges with initial)
 */
export function resetMockState(state: Partial<MockState> = {}): void {
  const initial = {
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

  mockState = { ...initial, ...state }
}

/**
 * Check if MSW is currently active.
 *
 * @returns boolean indicating if MSW mock mode is active
 */
export function isMswActive(): boolean {
  return !!worker && worker.isRunning
}

/**
 * Manual MSW worker control for test scenarios.
 *
 * @param handler - MSW request handler to add/remove
 * @param action - 'add' or 'remove'
 */
export function controlMsw(handler: MSWRequestHandler, action: 'add' | 'remove'): void {
  if (action === 'add') {
    worker?.use(handler)
  } else {
    worker?.resetHandlers()
  }
}

/**
 * Get current mock state.
 *
 * @returns Current MockState instance
 */
export function getMockState(): MockState {
  return mockState
}

/**
 * Set mock state (used by MSW handlers and tests).
 *
 * @param partial - Partial state to merge
 */
export function setMockState(partial: Partial<MockState>): MockState {
  mockState = { ...mockState, ...partial }
  return mockState
}

/** Default export for convenience */
export default {
  initializeMswBrowser,
  resetMockState,
  isMswActive,
  controlMsw,
  getMockState,
  setMockState
}