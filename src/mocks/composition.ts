import { env } from '@/shared/config/env'
import { AuthService } from './contexts/auth/service'
import { identityResolverFor } from './contexts/auth/realtime-identity'
import { authHandlers } from './contexts/auth/handlers'
import { SessionRepository, UserRepository } from './contexts/auth/repository'
import { catalogHandlers } from './contexts/catalog/handlers'
import { CatalogRepository } from './contexts/catalog/repository'
import { CatalogService } from './contexts/catalog/service'
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
import { DEFAULT_ORDER_SETTLE_MS, DEFAULT_SESSION_TTL_MS } from './scenarios/definitions'
import { scenarioRuntime } from './scenarios/runtime'
import { MockRealtimeServer } from './realtime/server'
import { store } from './state'
import { systemClock } from './infra/store'

const API = '/api'
const clock = systemClock

const users = new UserRepository(store)
const sessions = new SessionRepository(store)
const auth = new AuthService(users, sessions, clock, () => scenarioRuntime.current.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS)

const catalogRepository = new CatalogRepository(store)

// Realtime server is created first; it both publishes events and accepts Socket.IO connections.
const realtime = new MockRealtimeServer(new URL(env.socketUrl, location.origin).origin, identityResolverFor(auth))

const catalog = new CatalogService(catalogRepository, realtime, () => scenarioRuntime.current.emptyCatalog === true)
const cartRepository = new CartRepository(store)
const cart = new CartService(cartRepository, catalogRepository, clock)
const favorites = new FavoritesService(new FavoritesRepository(store), catalogRepository)
const wallets = new WalletService(new WalletRepository(store), clock, () => scenarioRuntime.current.walletRejects === true)
const profile = new ProfileService(users, clock)

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
  ...favoritesHandlers(API, auth, favorites),
  ...cartHandlers(API, auth, cart),
  ...walletHandlers(API, auth, wallets),
  ...profileHandlers(API, auth, profile),
  ...orderHandlers(API, auth, orders, () => scenarioRuntime.current.orderResponseDelayMs ?? 0),
  realtime.handler,
]

/** Debug/test surface, documented in README.md and used by Playwright (`window.__nftMock`). */
export const mockControls = {
  scenario: scenarioRuntime,
  reset: () => {
    store.reset()
    scenarioRuntime.restart()
  },
  realtime,
  settleAllOrders: () => orders.settleAllNow(),
}
