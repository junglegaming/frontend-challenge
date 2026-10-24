import { expect, test, type Page } from '@playwright/test'
import { seedCartItem, signIn } from '../design-system/helpers'

// The production build must not depend on local infrastructure and must run under the real security headers.
// Since specs/011-web-coins-real-api the coins feature is ON in production: it talks to the real apps/api only
// through the same-origin `/backend` path (never the retired server/ on port 4000).
//
// Locally nothing listens behind the preview's `/backend` proxy, so the coins section must show its "unavailable"
// state; against a published deploy (PLAYWRIGHT_BASE_URL) the real API answers and the balance is shown.

declare global {
  interface Window {
    __csp?: string[]
  }
}

const published = Boolean(process.env.PLAYWRIGHT_BASE_URL)

async function watchCsp(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__csp = [...(window.__csp ?? []), `${event.violatedDirective} ${event.blockedURI}`]
    })
  })
}

test('coins are visible and only ever reach /backend, across a full journey', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await watchCsp(page)

  await signIn(page)
  await seedCartItem(page)

  for (const path of ['/', '/nft/nft_001', '/cart', '/checkout', '/account/profile', '/account/wallets']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }

  // Wallets: the coins section is there, with the real balance or, locally, the unavailable state.
  await page.goto('/account/wallets')
  const coins = page.getByRole('region', { name: 'Moedas da Kurio' })
  await expect(coins).toBeVisible()
  if (published) {
    await expect(coins.getByText(/^\d+ moedas$/)).toBeVisible({ timeout: 15_000 })
  } else {
    await expect(coins.getByRole('alert')).toContainText('Serviço de moedas indisponível. Tente novamente.', { timeout: 15_000 })
  }

  // Checkout: the payment-method picker offers coins next to the wallet/ETH flow.
  await page.goto('/checkout')
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
  await expect(page.getByLabel('Pagar com moedas da Kurio')).toBeVisible()

  // Every coins call is same-origin under /backend; nothing ever reaches the old coins backend (port 4000).
  const origin = new URL(page.url()).origin
  const coinsCalls = requests.filter((url) => /\/(coins|auth\/token)(\/|\?|$)/.test(new URL(url).pathname) && !url.startsWith(`${origin}/api/`))
  expect(coinsCalls.length).toBeGreaterThan(0)
  for (const url of coinsCalls) expect(url.startsWith(`${origin}/backend/`), url).toBe(true)
  expect(requests.filter((url) => new URL(url).port === '4000')).toEqual([])

  // No Content-Security-Policy violation during the whole journey, except the known MSW WebSocket attempt
  // to ws://localhost/socket.io/ (see storefront.spec.ts): the CSP blocking it is the desired outcome.
  const violations = (await page.evaluate(() => window.__csp ?? [])).filter(
    (v) => !/^connect-src ws:\/\/localhost\/socket\.io\//.test(v),
  )
  expect(violations).toEqual([])
})

// specs/012-coins-admin: the coins administrator's sign-in only ever reaches `/backend/admin/*` on the site's own
// origin. Locally nothing listens behind the preview's `/backend` proxy, so the attempt must end in the
// "unavailable" message; against a published deploy it only checks that the page loads (no real credentials here).
test('the coins admin sign-in only reaches /backend/admin on the same origin', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))

  await page.goto('/admin/coins/login')
  await expect(page.getByRole('heading', { name: 'Administração das moedas' })).toBeVisible()
  if (published) return

  await page.getByLabel(/^E-mail/).fill('moedas@nft.dev')
  await page.getByLabel(/^Senha/).fill('qualquer-senha-123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('alert')).toContainText('Serviço de moedas indisponível. Tente novamente.', { timeout: 15_000 })

  const origin = new URL(page.url()).origin
  const adminCalls = requests.filter((url) => new URL(url).pathname.startsWith('/backend/admin/'))
  expect(adminCalls.length).toBeGreaterThan(0)
  for (const url of adminCalls) expect(url.startsWith(`${origin}/backend/admin/`), url).toBe(true)
  expect(requests.filter((url) => new URL(url).port === '4000')).toEqual([])
})

// specs/013-marketplace-admin: the administration areas of the marketplace are guarded in the production build too,
// and opening them calls nothing outside the site's own origin (admin data stays the mock's, /backend the real service).
test('a visitor opening the admin areas is sent to sign-in without leaving the site origin', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))

  for (const path of ['/admin', '/admin/orders']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login\?redirect=/)
  }

  const origin = new URL(page.url()).origin
  expect(requests.filter((url) => ['localhost', '127.0.0.1'].includes(new URL(url).hostname) && !url.startsWith(origin))).toEqual([])
  expect(requests.filter((url) => new URL(url).port === '4000')).toEqual([])
})
