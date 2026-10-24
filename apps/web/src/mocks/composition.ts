import { env } from '@/shared/config/env'
import { AuthService } from './contexts/auth/service'
import { identityResolverFor } from './contexts/auth/realtime-identity'
import { authHandlers } from './contexts/auth/handlers'
import { SessionRepository, UserRepository } from './contexts/auth/repository'
import { adminHandlers } from './contexts/admin/handlers'
import { AdminService } from './contexts/admin/service'
import { catalogHandlers } from './contexts/catalog/handlers'
import { CatalogRepository } from './contexts/catalog/repository'
import { CatalogService } from './contexts/catalog/service'
import { creatorsHandlers } from './contexts/creators/handlers'
import { CreatorsRepository } from './contexts/creators/repository'
import { CreatorsService } from './contexts/creators/service'
import { mediaGenerationHandlers } from './contexts/media-generation/handlers'
import { MediaGenerationService } from './contexts/media-generation/service'
import { CartRepository } from './contexts/cart/repository'
import { CartService } from './contexts/cart/service'
import { cartHandlers } from './contexts/cart/handlers'
import { FavoritesRepository, FavoritesService } from './contexts/favorites/service'
import { favoritesHandlers } from './contexts/favorites/handlers'
import { WalletRepository, WalletService } from './contexts/wallets/service'
import { walletHandlers } from './contexts/wallets/handlers'
import { ProfileService } from './contexts/profile/service'
import { profileHandlers } from './contexts/profile/handlers'
import { OrderRepository, OrderService, type OrderPolicy } from './contexts/orders/service'
import { orderHandlers } from './contexts/orders/handlers'
import { ledgerHandlers } from './contexts/ledger/handlers'
import { coinsAdminHandlers } from './contexts/coins-admin/handlers'
import { CoinsAdminService } from './contexts/coins-admin/service'
import { LedgerService } from './contexts/ledger/service'
import { DEFAULT_ORDER_SETTLE_MS, DEFAULT_SESSION_TTL_MS } from './scenarios/definitions'
import { scenarioRuntime } from './scenarios/runtime'
import { MockRealtimeServer } from './realtime/server'
import { store } from './state'
import { systemClock } from './infra/store'

const API = '/api'
// The real backend (apps/api) is reached through `/backend/*`; in dev and tests it is mocked here.
const BACKEND = env.backendBaseUrl
const clock = systemClock

const users = new UserRepository(store)
const sessions = new SessionRepository(store)
const auth = new AuthService(users, sessions, clock, () => scenarioRuntime.current.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS)

const catalogRepository = new CatalogRepository(store)

// Realtime server is created first; it both publishes events and accepts Socket.IO connections.
const realtime = new MockRealtimeServer(new URL(env.socketUrl, location.origin).origin, identityResolverFor(auth))

const catalog = new CatalogService(catalogRepository, realtime, () => scenarioRuntime.current.emptyCatalog === true)
const creators = new CreatorsService(new CreatorsRepository(catalogRepository))
const admin = new AdminService(catalogRepository, catalog, users, sessions)
const mediaGeneration = new MediaGenerationService()
const cartRepository = new CartRepository(store)
const cart = new CartService(cartRepository, catalogRepository, clock)
const favorites = new FavoritesService(new FavoritesRepository(store), catalogRepository)
const wallets = new WalletService(new WalletRepository(store), clock, () => scenarioRuntime.current.walletRejects === true)
const profile = new ProfileService(users, clock)
const ledger = new LedgerService()
const coinsAdmin = new CoinsAdminService()

let checkoutMutationApplied = false
scenarioRuntime.subscribe(() => {
  checkoutMutationApplied = false
})

const orderPolicy: OrderPolicy = {
  settleDelayMs: () => scenarioRuntime.current.orderSettleMs ?? DEFAULT_ORDER_SETTLE_MS,
  paymentOutcome: () => scenarioRuntime.current.paymentOutcome ?? 'confirmed',
  beforeValidation: (userId) => {
    const mutation = scenarioRuntime.current.checkoutMutation
    if (!mutation || checkoutMutationApplied) return
    checkoutMutationApplied = true
    const firstLine = store.read((s) => Object.values(s.carts).find((c) => c.id === `user:${userId}`)?.lines[0])
    if (!firstLine) return
    if (mutation === 'price_change') {
      const edition = catalogRepository.findEdition(firstLine.nftId, firstLine.editionId)
      if (edition) catalog.changeEdition(firstLine.nftId, firstLine.editionId, { price: scaleUp(edition.edition.price) })
    } else {
      catalog.changeEdition(firstLine.nftId, firstLine.editionId, { available: 0 })
    }
  },
}

function scaleUp(price: string) {
  return (Number(price) * 1.1).toFixed(18)
}

const orders = new OrderService(new OrderRepository(store), cart, catalog, wallets, realtime, clock, orderPolicy)
orders.resumePending()

export const handlers = [
  ...authHandlers(API, auth),
  ...catalogHandlers(API, catalog),
  ...creatorsHandlers(API, creators),
  ...adminHandlers(API, admin, auth, orders),
  ...mediaGenerationHandlers(API, mediaGeneration),
  ...favoritesHandlers(API, auth, favorites),
  ...cartHandlers(API, auth, cart),
  ...walletHandlers(API, auth, wallets),
  ...profileHandlers(API, auth, profile),
  ...orderHandlers(API, auth, orders, () => scenarioRuntime.current.orderResponseDelayMs ?? 0),
  // Only when backend mocks are on (dev, e2e). Production/preview turn them off so `/backend/*` reaches
  // the real apps/api instead of being answered here (specs/008-web-production-env, FR-005).
  ...(env.enableBackendMocks
    ? ledgerHandlers(BACKEND, ledger, {
        unavailable: () => scenarioRuntime.current.ledgerUnavailable === true,
        loseFirstWriteResponse: () => scenarioRuntime.current.ledgerLoseFirstWriteResponse === true,
      })
    : []),
  // Admin of the real coins service (specs/012-coins-admin): same switch, own credential and token.
  ...(env.enableBackendMocks
    ? coinsAdminHandlers(BACKEND, coinsAdmin, ledger, {
        unavailable: () => scenarioRuntime.current.ledgerUnavailable === true,
        sessionExpired: () => scenarioRuntime.current.coinsAdminSessionExpired === true,
        latencyMs: () => scenarioRuntime.nextLatencyMs(),
      })
    : []),
  realtime.handler,
]

/** Debug/test surface, documented in README.md and used by Playwright (`window.__nftMock`). */
export const mockControls = {
  scenario: scenarioRuntime,
  reset: () => {
    store.reset()
    ledger.reset()
    scenarioRuntime.restart()
  },
  realtime,
  settleAllOrders: () => orders.settleAllNow(),
  /** Test-only: promotes a user to admin without going through signup (which never can, by design). */
  setRole: (userId: string, role: 'collector' | 'admin') => users.update(userId, { role }),
}
