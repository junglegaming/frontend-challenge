import { expect, test, type Page } from '@playwright/test'
import {
  hasNoHorizontalScroll,
  promoteCurrentUserToAdmin,
  runAxe,
  selectScenario,
  SESSION_KEY,
  signIn,
  VIEWPORTS,
} from '../design-system/helpers'

// specs/012-coins-admin, US1: the coins administrator signs in with the real service's credentials (here answered by
// the MSW mock, which behaves like apps/api: one answer for every failed sign-in, 15-minute admin token).
// Demo credential: mocks/contexts/coins-admin/README.md.

const EMAIL = 'moedas@nft.dev'
const PASSWORD = 'Moedas@123'

async function openLogin(page: Page, search = '') {
  await page.goto(`/admin/coins/login${search}`)
  // The first load of a page compiles it in the dev server: allow more than the default 5 s under CPU load.
  await expect(page.getByRole('heading', { name: 'Administração das moedas' })).toBeVisible({ timeout: 20_000 })
}

async function fillAndSubmit(page: Page, email: string, password: string) {
  await page.getByLabel(/^E-mail/).fill(email)
  await page.getByLabel(/^Senha/).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

async function signInCoinsAdmin(page: Page) {
  await openLogin(page)
  await fillAndSubmit(page, EMAIL, PASSWORD)
  await expect(page).toHaveURL(/\/admin\/coins$/)
}

test('signs in and shows which administrator is connected', async ({ page }) => {
  await signInCoinsAdmin(page)
  await expect(page.getByText(`Conectado como ${EMAIL}`)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible()
})

test('a wrong password and an unknown e-mail get exactly the same answer', async ({ page }) => {
  await openLogin(page)

  await fillAndSubmit(page, EMAIL, 'senha-errada-123')
  const wrongPassword = page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })
  await expect(wrongPassword).toBeVisible()
  const first = await wrongPassword.innerText()

  await page.getByLabel(/^E-mail/).fill('ninguem@nft.dev')
  await page.getByLabel(/^Senha/).fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(wrongPassword).toBeVisible()
  expect(await wrongPassword.innerText()).toBe(first)
  await expect(page).toHaveURL(/\/admin\/coins\/login/)
})

test('invalid input is refused before anything is sent', async ({ page }) => {
  const logins: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/admin/login')) logins.push(request.url())
  })
  await openLogin(page)

  await fillAndSubmit(page, 'isto-nao-e-email', '')
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
  await expect(page.getByText('Informe a senha.')).toBeVisible()
  expect(logins).toEqual([])
})

test('signing out returns to the sign-in page without the expiry notice and closes the area', async ({ page }) => {
  await signInCoinsAdmin(page)
  await page.getByRole('button', { name: 'Sair', exact: true }).click()

  await expect(page).toHaveURL(/\/admin\/coins\/login/)
  await expect(page.getByRole('heading', { name: 'Administração das moedas' })).toBeVisible()
  await expect(page.getByText('Sua sessão de administrador expirou')).toHaveCount(0)

  await page.goto('/admin/coins')
  await expect(page).toHaveURL(/\/admin\/coins\/login/)
})

test('without a session the area redirects to sign-in and comes back to the requested page after it', async ({ page }) => {
  await page.goto('/admin/coins')
  await expect(page).toHaveURL(/\/admin\/coins\/login\?redirect=%2Fadmin%2Fcoins/)

  await fillAndSubmit(page, EMAIL, PASSWORD)
  await expect(page).toHaveURL(/\/admin\/coins$/)
})

test('a redirect to another origin or outside the coins area is ignored', async ({ page }) => {
  for (const redirect of ['https://evil.test/', '//evil.test/', '/account/profile', '/admin/users']) {
    await openLogin(page, `?redirect=${encodeURIComponent(redirect)}`)
    await fillAndSubmit(page, EMAIL, PASSWORD)
    await expect(page).toHaveURL(/\/admin\/coins$/)
    expect(new URL(page.url()).hostname).not.toBe('evil.test')
    await page.getByRole('button', { name: 'Sair', exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/coins\/login/)
  }
})

test('the site session does not open the area, and this sign-in creates no site session', async ({ page }) => {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)
  await page.goto('/admin/coins')
  await expect(page).toHaveURL(/\/admin\/coins\/login/)

  // The other way round: signing in here leaves the site session untouched (no token for the site is created).
  await page.evaluate((key) => localStorage.removeItem(key), SESSION_KEY)
  await fillAndSubmit(page, EMAIL, PASSWORD)
  await expect(page).toHaveURL(/\/admin\/coins$/)
  expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)).toBeNull()
})

test('reloading asks for the sign-in again and no token is kept in browser storage', async ({ page }) => {
  await signInCoinsAdmin(page)

  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))
  expect(stored).not.toContain('mock-coins-admin')

  await page.reload()
  await expect(page).toHaveURL(/\/admin\/coins\/login/)
})

test('with an active session, opening the sign-in page goes straight to the area', async ({ page }) => {
  await signInCoinsAdmin(page)
  // Client-side navigation keeps the in-memory session (a full page load would drop it, by design).
  await page.evaluate(() => {
    window.history.pushState({}, '', '/admin/coins/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page).toHaveURL(/\/admin\/coins$/)
})

test('an unavailable coins service shows a clear message on the sign-in page', async ({ page }) => {
  await openLogin(page)
  await selectScenario(page, 'coins-unavailable')
  await fillAndSubmit(page, EMAIL, PASSWORD)
  await expect(page.getByRole('alert').filter({ hasText: 'Serviço de moedas indisponível. Tente novamente.' })).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/coins\/login/)
})

test('the admin menu of the site links to the coins area', async ({ page }) => {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)
  await page.goto('/admin/users')

  const link = page.getByRole('navigation', { name: 'Administração' }).getByRole('link', { name: 'Moedas' })
  await expect(link).toBeVisible()
  await link.click()
  await expect(page).toHaveURL(/\/admin\/coins\/login\?redirect=%2Fadmin%2Fcoins/)
})

test('the sign-in page has no critical accessibility violations', async ({ page }) => {
  await openLogin(page)
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('the sign-in page renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await openLogin(page)
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`admin-coins-login-${viewport.width}.png`, { fullPage: true })
    })
  })
}
