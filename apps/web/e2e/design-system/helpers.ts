import { createRequire } from 'node:module'
import { expect, type Page } from '@playwright/test'

declare global {
  interface Window {
    __nftMock?: {
      scenario: { select: (id: string) => void }
      settleAllOrders: () => void
      setRole: (userId: string, role: 'collector' | 'admin') => void
    }
  }
}

export const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const

export const SESSION_KEY = 'nft-session:token'

/** Creates a throw-away collector through the mocked API and stores its session token, like a real login would. */
export async function signIn(page: Page) {
  await page.goto('/')
  // The app renders only after MSW is ready, so a visible header means the mocked API is active.
  await page.getByRole('banner').waitFor()
  const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const token = await page.evaluate(async (id) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Teste Design', username: `user_${id}`, email: `${id}@nft.dev`, password: 'Senha1234' }),
    })
    return ((await response.json()) as { token: string }).token
  }, unique)
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SESSION_KEY, token])
  await page.goto('/account/profile')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
}

export async function hasNoHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
}

/** Selects a mock scenario (src/mocks/scenarios/definitions.ts) via the devtools control surface. */
export async function selectScenario(page: Page, scenarioId: string) {
  await page.evaluate((id) => window.__nftMock?.scenario.select(id), scenarioId)
}

/**
 * Promotes the currently signed-in test user to admin via the devtools-only `setRole` hook —
 * signup itself can never create an admin by design, so tests that need one sign up a fresh
 * throwaway collector (via `signIn`) and flip their role here, rather than sharing the fixture
 * `usr_ana` admin account across parallel test workers.
 */
export async function promoteCurrentUserToAdmin(page: Page) {
  const token = await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)
  await page.evaluate(async (authToken) => {
    const response = await fetch('/api/session', { headers: { Authorization: `Bearer ${authToken}` } })
    const session = (await response.json()) as { user: { id: string } }
    window.__nftMock?.setRole(session.user.id, 'admin')
  }, token)
}

/** Settles every pending order immediately instead of waiting for the simulated delay. */
export async function settleAllOrders(page: Page) {
  await page.evaluate(() => window.__nftMock?.settleAllOrders())
}

/**
 * Creates a wallet, a cart item and an order for the signed-in user, entirely through the mocked
 * API — used by tests that only care about the order-confirmation page, not the checkout form.
 * Returns the created order id. The edition defaults to `nft_001`/`nft_001_standard`; tests that create many orders
 * pass distinct editions (see `pickAvailableEditions`): one edition only has 1 to 25 units and every pending or
 * confirmed order takes one.
 */
export interface OrderEdition {
  nftId: string
  editionId: string
}

export async function createOrderViaApi(
  page: Page,
  edition: OrderEdition = { nftId: 'nft_001', editionId: 'nft_001_standard' },
): Promise<string> {
  const token = await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)
  return page.evaluate(async ([authToken, chosen]) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }
    await fetch('/api/cart/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ nftId: chosen.nftId, editionId: chosen.editionId, quantity: 1 }),
    })
    // The primary wallet is created once; a second order of the same user reuses it.
    const existing = (await (await fetch('/api/wallets', { headers })).json()) as { id: string; slot: string }[]
    const wallet =
      existing.find((candidate) => candidate.slot === 'primary') ??
      (await (
        await fetch('/api/wallets', {
          method: 'POST',
          headers,
          body: JSON.stringify({ slot: 'primary', label: 'Carteira de teste', provider: 'metamask', address: `0x${'1'.repeat(40)}`, networks: ['ethereum'] }),
        })
      ).json())
    const quote = await (await fetch('/api/cart/quote?network=ethereum', { headers })).json()
    const order = await (
      await fetch('/api/orders', {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          quoteSignature: quote.signature,
          network: 'ethereum',
          walletId: wallet.id,
          collector: { fullName: 'Teste E2E', email: 'teste@nft.dev', country: 'BR' },
        }),
      })
    ).json()
    // The cart keeps its items until the order is confirmed: empty it, or the next order of this user would carry them too.
    const cart = (await (await fetch('/api/cart', { headers })).json()) as { items: { id: string }[] }
    for (const item of cart.items) await fetch(`/api/cart/items/${item.id}`, { method: 'DELETE', headers })
    return order.id as string
  }, [token, edition] as const)
}

/**
 * Picks `count` DISTINCT editions that can still be bought (`status: 'available'`, at least one unit), reading the
 * public catalog through the mocked API. Throws if the catalog does not have enough.
 */
export async function pickAvailableEditions(page: Page, count: number): Promise<OrderEdition[]> {
  const editions = await page.evaluate(async () => {
    const found: { nftId: string; editionId: string }[] = []
    for (let pageNumber = 1; pageNumber <= 20; pageNumber += 1) {
      const response = await fetch(`/api/nfts?availability=available&pageSize=48&page=${pageNumber}`)
      const listing = (await response.json()) as { items: { id: string }[]; totalPages: number }
      for (const summary of listing.items) {
        const detail = (await (await fetch(`/api/nfts/${summary.id}`)).json()) as {
          editions: { id: string; status: string; available: number }[]
        }
        for (const edition of detail.editions) {
          if (edition.status === 'available' && edition.available >= 1) found.push({ nftId: summary.id, editionId: edition.id })
        }
      }
      if (pageNumber >= listing.totalPages) break
    }
    return found
  })
  if (editions.length < count) throw new Error(`Only ${editions.length} purchasable editions in the catalog; ${count} needed.`)
  return editions.slice(0, count)
}

export type SeededStatus = 'confirmed' | 'pending' | 'declined'

// Pending orders must STAY pending while a test runs: the default 3 s settlement would turn them into confirmed ones.
const SEED_SCENARIO: Record<SeededStatus, string> = { confirmed: 'fast', pending: 'payment-slow', declined: 'payment-declined' }

/**
 * Signs up a NEW buyer, gives them one order per edition and leaves them signed in. The orders end up `confirmed` or
 * `declined` at once, or stay `pending`. `at` freezes the clock first, so the orders get a known creation time.
 * Returns the order ids, in creation order.
 */
export async function seedBuyerOrders(page: Page, status: SeededStatus, editions: OrderEdition[], at?: Date): Promise<string[]> {
  await signIn(page)
  await selectScenario(page, SEED_SCENARIO[status])
  if (at) await page.clock.setFixedTime(at)
  const ids: string[] = []
  for (const edition of editions) ids.push(await createOrderViaApi(page, edition))
  if (status !== 'pending') await settleAllOrders(page)
  return ids
}

/** GET on the mocked API as the signed-in user (an administrator, for the `/admin/*` paths). */
export async function apiGet<T>(page: Page, path: string): Promise<T> {
  return page.evaluate(
    async ([url, key]) => {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem(key)}` } })
      return (await response.json()) as unknown
    },
    [`/api${path}`, SESSION_KEY] as const,
  ) as Promise<T>
}

/** Adds an item to the signed-in user's cart through the mocked API, like clicking "add to cart" would. */
export async function seedCartItem(
  page: Page,
  input: { nftId: string; editionId: string; quantity: number } = { nftId: 'nft_001', editionId: 'nft_001_standard', quantity: 1 },
) {
  const token = await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)
  await page.evaluate(
    async ([body, authToken]) => {
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(body),
      })
    },
    [input, token] as const,
  )
}

interface AxeViolation {
  id: string
  impact: string
  nodes: { target: string[] }[]
}

/** axe-core is injected into the page; resolved from the dependency tree. */
export async function runAxe(page: Page) {
  const require = createRequire(import.meta.url)
  let path: string
  try {
    path = require.resolve('axe-core/axe.min.js')
  } catch {
    path = require.resolve('axe-core/axe.min.js', { paths: [`${process.cwd()}/node_modules/.pnpm/node_modules`] })
  }
  await page.addScriptTag({ path })
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (ctx: Document, opts: object) => Promise<{ violations: AxeViolation[] }> } }).axe
    const results = await axe.run(document, { resultTypes: ['violations'] })
    return results.violations
      .filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .map((v) => ({ id: v.id, impact: v.impact, targets: v.nodes.map((n) => n.target.join(' ')) }))
  })
}
