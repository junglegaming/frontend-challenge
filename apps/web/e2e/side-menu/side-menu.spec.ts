import { expect, test, type Page } from '@playwright/test'
import { signInCoinsAdmin } from '../admin-coins/helpers'
import { promoteCurrentUserToAdmin, SESSION_KEY, signIn, VIEWPORTS } from '../design-system/helpers'

// specs/013-marketplace-admin, US3: the side menus move between pages through the router. A full page load would drop
// what lives only in memory (such as the coins administrator's session) and flash the whole page.

declare global {
  interface Window {
    __marker?: number
  }
}

const markPage = (page: Page) => page.evaluate(() => (window.__marker = 1))
const marker = (page: Page) => page.evaluate(() => window.__marker)
const adminMenu = (page: Page) => page.getByRole('navigation', { name: 'Administração', exact: true })
const accountMenu = (page: Page) => page.getByRole('navigation', { name: 'Minha conta', exact: true })

test('the account and admin menus change page without reloading it', async ({ page }) => {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)

  // Account menu.
  await page.goto('/account/profile')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await markPage(page)
  await accountMenu(page).getByRole('link', { name: 'Carteiras' }).click()
  await expect(page).toHaveURL(/\/account\/wallets$/)
  expect(await marker(page)).toBe(1)
  await accountMenu(page).getByRole('link', { name: 'Dados do perfil' }).click()
  await expect(page).toHaveURL(/\/account\/profile$/)
  expect(await marker(page)).toBe(1)

  // Admin menu.
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Visão geral', level: 1 })).toBeVisible()
  await markPage(page)
  for (const [item, url] of [
    ['Produtos', /\/admin\/products$/],
    ['Usuários', /\/admin\/users$/],
    ['Pedidos', /\/admin\/orders$/],
    ['Visão geral', /\/admin$/],
  ] as const) {
    await adminMenu(page).getByRole('link', { name: item }).click()
    await expect(page).toHaveURL(url)
    expect(await marker(page)).toBe(1)
  }
})

test('the coins area keeps its access when the menu goes to another admin area and back', async ({ page }) => {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)
  await signInCoinsAdmin(page)

  await adminMenu(page).getByRole('link', { name: 'Produtos' }).click()
  await expect(page).toHaveURL(/\/admin\/products$/)
  await adminMenu(page).getByRole('link', { name: 'Moedas' }).click()

  await expect(page).toHaveURL(/\/admin\/coins$/)
  await expect(page.getByRole('heading', { name: 'Moedas', level: 1 })).toBeVisible()
  await expect(page).not.toHaveURL(/\/login/)
})

test('a click with Ctrl/Cmd opens a new tab and leaves the current page where it is', async ({ page, context }) => {
  await signIn(page)
  await page.goto('/account/profile')
  await expect(accountMenu(page)).toBeVisible()

  const opened = context.waitForEvent('page')
  await accountMenu(page).getByRole('link', { name: 'Carteiras' }).click({ modifiers: ['ControlOrMeta'] })
  const tab = await opened
  await tab.waitForLoadState()
  expect(tab.url()).toMatch(/\/account\/wallets$/)
  await tab.close()
  await expect(page).toHaveURL(/\/account\/profile$/)
})

test('from the keyboard: Enter on a focused item navigates and the current page is marked', async ({ page }) => {
  await signIn(page)
  await page.goto('/account/profile')
  await expect(accountMenu(page)).toBeVisible()
  await expect(accountMenu(page).getByRole('link', { name: 'Dados do perfil' })).toHaveAttribute('aria-current', 'page')

  await accountMenu(page).getByRole('link', { name: 'Carteiras' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/account\/wallets$/)
  await expect(accountMenu(page).getByRole('link', { name: 'Carteiras' })).toHaveAttribute('aria-current', 'page')
  await expect(accountMenu(page).getByRole('link', { name: 'Dados do perfil' })).not.toHaveAttribute('aria-current', 'page')
})

test('items that are not available stay inert and announce it', async ({ page }) => {
  await signIn(page)
  await page.goto('/account/profile')
  await expect(accountMenu(page)).toBeVisible()

  for (const name of ['Atividade', 'Ofertas', 'Arquivos baixados', 'Suporte']) {
    const item = accountMenu(page).getByRole('button', { name: new RegExp(`^${name} \\(indisponível\\)$`) })
    await expect(item).toBeDisabled()
    await item.click({ force: true })
    await expect(page).toHaveURL(/\/account\/profile$/)
  }
})

test('"Sair" in the account menu and "Sair do site" in the admin menu still end the session', async ({ page }) => {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)
  await page.goto('/account/profile')
  await accountMenu(page).getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)).toBeNull()

  await signIn(page)
  await promoteCurrentUserToAdmin(page)
  await page.goto('/admin')
  await adminMenu(page).getByRole('button', { name: 'Sair do site' }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)).toBeNull()
})

test.describe('on a phone (390 px)', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test('the current item of the scrollable strip is brought into view', async ({ page }) => {
    await signIn(page)
    await promoteCurrentUserToAdmin(page)
    // "Pedidos" is the fourth item: it sits past the edge of the strip unless the strip scrolls to it.
    await page.goto('/admin/orders')
    await expect(page.getByRole('heading', { name: 'Pedidos', level: 1 })).toBeVisible()

    const current = adminMenu(page).getByRole('link', { name: 'Pedidos' })
    await expect(current).toHaveAttribute('aria-current', 'page')
    const inside = await current.evaluate((link) => {
      const strip = link.closest('ul')!.getBoundingClientRect()
      const box = link.getBoundingClientRect()
      return box.left >= strip.left - 1 && box.right <= strip.right + 1
    })
    expect(inside).toBe(true)
  })
})
