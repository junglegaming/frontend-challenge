import { expect, test, type Page } from '@playwright/test'
import {
  createOrderViaApi,
  hasNoHorizontalScroll,
  pickAvailableEditions,
  promoteCurrentUserToAdmin,
  runAxe,
  selectScenario,
  SESSION_KEY,
  settleAllOrders,
  signIn,
  VIEWPORTS,
} from '../design-system/helpers'

// specs/013-marketplace-admin, US1: the administrator finds the link, opens the home panel and sees the totals;
// nobody else sees the link. Everything is simulated (MSW): accounts, orders and the admin overview.

const adminLink = (page: Page) => page.getByRole('banner').getByRole('link', { name: 'Administração' })
const metric = (page: Page, label: string) =>
  page.getByRole('main').locator('dt', { hasText: new RegExp(`^${label}$`) }).locator('xpath=following-sibling::dd[1]')

async function signInAsAdmin(page: Page) {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)
}

async function adminApi<T>(page: Page, path: string): Promise<T> {
  return page.evaluate(
    async ([url, key]) => {
      const token = localStorage.getItem(key)
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      return (await response.json()) as unknown
    },
    [`/api${path}`, SESSION_KEY] as const,
  ) as Promise<T>
}

test('an administrator finds "Administração" in the navigation and in the account menu', async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto('/account/profile')

  await expect(adminLink(page)).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Minha conta', exact: true }).getByRole('link', { name: 'Administração' })).toBeVisible()

  await adminLink(page).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Visão geral', level: 1 })).toBeVisible()
})

test.describe('on a phone (390 px)', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test('the bottom bar offers "Administração" and an area is at most 2 clicks away from any page', async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto('/')

    // The wide navigation does not exist here: the link must be in the bottom bar (Dock).
    const dockLink = page.getByRole('navigation', { name: 'Navegação rápida' }).getByRole('link', { name: 'Administração' })
    await expect(dockLink).toBeVisible()

    await dockLink.click() // click 1: the home panel
    await expect(page).toHaveURL(/\/admin$/)
    await page.getByRole('main').getByRole('link', { name: 'Produtos' }).first().click() // click 2: an area
    await expect(page).toHaveURL(/\/admin\/products$/)
    expect(await hasNoHorizontalScroll(page)).toBe(true)
  })
})

test('a collector and a visitor never see the link, not even for an instant', async ({ page }) => {
  // Records whether ANY link to the administration shows up in the DOM while pages load.
  await page.addInitScript(() => {
    ;(window as unknown as { __sawAdminLink: boolean }).__sawAdminLink = false
    const check = () => {
      const found = Array.from(document.querySelectorAll('a')).some(
        (a) => a.textContent?.trim() === 'Administração' || a.getAttribute('href') === '/admin',
      )
      if (found) (window as unknown as { __sawAdminLink: boolean }).__sawAdminLink = true
    }
    new MutationObserver(check).observe(document, { childList: true, subtree: true })
  })
  const sawLink = () => page.evaluate(() => (window as unknown as { __sawAdminLink: boolean }).__sawAdminLink)

  // Visitor.
  await page.goto('/')
  await page.getByRole('banner').waitFor()
  await expect(adminLink(page)).toHaveCount(0)
  expect(await sawLink()).toBe(false)

  // Collector (a plain account).
  await signIn(page)
  await page.goto('/account/profile')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await page.goto('/account/wallets')
  await expect(page.getByRole('navigation', { name: 'Minha conta', exact: true })).toBeVisible()
  await expect(adminLink(page)).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Minha conta', exact: true }).getByRole('link', { name: 'Administração' })).toHaveCount(0)
  expect(await sawLink()).toBe(false)
})

test('a collector opening the panel goes home with the access-denied notice; a visitor goes to sign-in and comes back', async ({ page }) => {
  await signIn(page)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/\?forbidden=true$/)

  // A visitor with no session at all.
  await page.evaluate((key) => localStorage.removeItem(key), SESSION_KEY)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login\?redirect=/)
})

test('a new marketplace shows zeros, not an error', async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto('/admin')
  await expect(metric(page, 'Pedidos')).toHaveText('0')
  await expect(metric(page, 'Pedidos pendentes')).toHaveText('0')
  await expect(metric(page, 'Pedidos confirmados')).toHaveText('0')
  await expect(metric(page, 'Pedidos recusados')).toHaveText('0')
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
})

test('the totals match the data: products, users (and suspended) and orders by status', async ({ page }) => {
  await signIn(page)
  const editions = await pickAvailableEditions(page, 2)
  await createOrderViaApi(page, editions[0]!)
  await createOrderViaApi(page, editions[1]!)
  await promoteCurrentUserToAdmin(page)

  await page.goto('/admin')
  await expect(metric(page, 'Pedidos')).toHaveText('2')
  await expect(metric(page, 'Pedidos pendentes')).toHaveText('2')

  await settleAllOrders(page)
  await page.reload()
  await expect(metric(page, 'Pedidos pendentes')).toHaveText('0')
  await expect(metric(page, 'Pedidos confirmados')).toHaveText('2')

  // Users and products come from independent endpoints, never from the overview itself.
  const users = await adminApi<{ id: string; status: string; role: string }[]>(page, '/admin/users')
  const victim = users.find((user) => user.role === 'collector' && user.status === 'active')
  expect(victim).toBeDefined()
  await page.evaluate(
    async ([id, key]) => {
      await fetch(`/api/admin/users/${id}/suspend`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem(key)}` } })
    },
    [victim!.id, SESSION_KEY] as const,
  )
  const afterSuspend = await adminApi<{ id: string; status: string }[]>(page, '/admin/users')
  const publicCatalog = await page.evaluate(async () => ((await (await fetch('/api/nfts?pageSize=1')).json()) as { total: number }).total)

  await page.reload()
  await expect(metric(page, 'Usuários')).toHaveText(String(afterSuspend.length))
  await expect(metric(page, 'Usuários suspensos')).toHaveText(String(afterSuspend.filter((user) => user.status === 'suspended').length))
  await expect(metric(page, 'Produtos publicados')).toHaveText(String(publicCatalog))
})

test('the panel links to Produtos, Usuários, Pedidos and Moedas', async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto('/admin')
  const shortcuts = page.getByRole('navigation', { name: 'Atalhos' })
  await expect(shortcuts.getByRole('link', { name: 'Produtos' })).toHaveAttribute('href', '/admin/products')
  await expect(shortcuts.getByRole('link', { name: 'Usuários' })).toHaveAttribute('href', '/admin/users')
  await expect(shortcuts.getByRole('link', { name: 'Moedas' })).toHaveAttribute('href', '/admin/coins')
  await expect(shortcuts.getByRole('link', { name: 'Pedidos' })).toHaveAttribute('href', '/admin/orders')
})

test('"Sair do site" ends the site session and goes home', async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto('/admin')
  await page.getByRole('navigation', { name: 'Administração' }).getByRole('button', { name: 'Sair do site' }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)).toBeNull()

  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login\?redirect=/)
})

test('a failing request shows a clear message and "Tentar de novo" recovers', async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto('/account/profile')
  await expect(adminLink(page)).toBeVisible()

  await selectScenario(page, 'offline')
  await adminLink(page).click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Não foi possível carregar o painel.', { timeout: 15_000 })

  await selectScenario(page, 'fast')
  await page.getByRole('main').getByRole('button', { name: 'Tentar de novo' }).click()
  await expect(metric(page, 'Pedidos')).toBeVisible()
})

test('the panel has no critical accessibility violations', async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto('/admin')
  await expect(metric(page, 'Pedidos')).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    // Frozen clock and UTC keep the page deterministic; a fresh marketplace has only zeros.
    test.use({ viewport, timezoneId: 'UTC', locale: 'pt-BR' })

    test('the panel renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'))
      await signInAsAdmin(page)
      await selectScenario(page, 'fast')
      await page.goto('/admin')
      await expect(metric(page, 'Pedidos')).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`admin-dashboard-${viewport.width}.png`, { fullPage: true })
    })
  })
}
