import { expect, test } from '@playwright/test'
import { signIn } from '../design-system/helpers'

// US2 — in a production build `/api/*` stays mocked but `/backend/*` (the real apps/api) must NOT be.
//
// Locally nothing listens behind the Vite proxy (BACKEND_PROXY_TARGET), so a real call fails while the
// mock would have answered 200. When PLAYWRIGHT_BASE_URL points at a published deploy, the real-chain check
// (token -> credit -> debit -> balance through /backend) is done by hand: quickstart.md step 6.

test('the mocked API still answers /api/* in production', async ({ page }) => {
  await signIn(page)
  const status = await page.evaluate(async () => {
    const token = localStorage.getItem('nft-session:token')
    return (await fetch('/api/session', { headers: { Authorization: `Bearer ${token}` } })).status
  })
  expect(status).toBe(200)
})

test('/backend/health is not answered by the mock', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('banner').waitFor()

  const result = await page.evaluate(async () => {
    const response = await fetch('/backend/health')
    return { status: response.status, body: await response.text() }
  })

  const answeredByMock = result.status === 200 && result.body.includes('"status":"ok"')
  // Published deploy: the real API legitimately answers 200 {"status":"ok"}; the mock never ran there either.
  if (!process.env.PLAYWRIGHT_BASE_URL) expect(answeredByMock).toBe(false)
})

test('an unauthenticated /backend/coins/balance is not served by the mock', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('banner').waitFor()

  const body = await page.evaluate(async () => (await fetch('/backend/coins/balance')).text())
  // The mock answers 401 with code `missing_token` in this exact shape; a failing proxy does not.
  if (!process.env.PLAYWRIGHT_BASE_URL) expect(body).not.toContain('"code":"missing_token"')
})
