import { createRequire } from 'node:module'
import { expect, type Page } from '@playwright/test'

declare global {
  interface Window {
    __nftMock?: { scenario: { select: (id: string) => void }; settleAllOrders: () => void }
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

/** Settles every pending order immediately instead of waiting for the simulated delay. */
export async function settleAllOrders(page: Page) {
  await page.evaluate(() => window.__nftMock?.settleAllOrders())
}

/**
 * Creates a wallet, a cart item and an order for the signed-in user, entirely through the mocked
 * API — used by tests that only care about the order-confirmation page, not the checkout form.
 * Returns the created order id.
 */
export async function createOrderViaApi(page: Page): Promise<string> {
  const token = await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)
  return page.evaluate(async (authToken) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }
    await fetch('/api/cart/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ nftId: 'nft_001', editionId: 'nft_001_standard', quantity: 1 }),
    })
    const wallet = await (
      await fetch('/api/wallets', {
        method: 'POST',
        headers,
        body: JSON.stringify({ slot: 'primary', label: 'Carteira de teste', provider: 'metamask', address: `0x${'1'.repeat(40)}`, networks: ['ethereum'] }),
      })
    ).json()
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
    return order.id as string
  }, token)
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
