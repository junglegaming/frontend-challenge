import { expect, test, type Page } from '@playwright/test'
import { signIn } from '../design-system/helpers'

// US1 — runs against the PRODUCTION build (playwright.production.config.ts): MSW must still start
// (the product is a mock-driven demo) and deep links must work, including after a reload.

// KNOWN, PRE-EXISTING noise (reproduces on the dev server before specs/008): MSW's WebSocket interceptor
// also tries a native connection to `ws://localhost/socket.io/`. Under production's CSP (`connect-src 'self'`)
// the browser blocks it — which is the desired outcome: the page never reaches the visitor's localhost.
// The block is logged as a console error. Not caused by, and out of scope of, this configuration
// (Principle IV / realtime). ONLY these exact messages are ignored; any other console error still fails.
// Tracked in specs/008-web-production-env/spec.md (SC-003).
const KNOWN_REALTIME_NOISE =
  /(WebSocket connection to|Connecting to) 'ws:\/\/localhost\/socket\.io\//

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error' && !KNOWN_REALTIME_NOISE.test(message.text())) {
      errors.push(`console.error: ${message.text()}`)
    }
  })
  return errors
}

test('home renders in the production build with the mocked API active', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/')
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
  expect(errors).toEqual([])
})

test('an NFT detail URL opens directly and survives a reload', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/nft/nft_001')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })

  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  expect(errors).toEqual([])
})

test('the internal design-system page is available because mocks are on', async ({ page }) => {
  await page.goto('/design-system')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('an authenticated deep link works', async ({ page }) => {
  await signIn(page)
  await page.goto('/account/profile')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
})
