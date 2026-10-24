import { expect, test, type Page } from '@playwright/test'
import {
  apiGet,
  hasNoHorizontalScroll,
  pickAvailableEditions,
  promoteCurrentUserToAdmin,
  runAxe,
  seedBuyerOrders,
  selectScenario,
  SESSION_KEY,
  signIn,
  VIEWPORTS,
} from '../design-system/helpers'

// specs/013-marketplace-admin, US2: the administrator sees the orders of ALL users: a paginated list with a status
// filter. Read-only. Everything is simulated (MSW).

interface Seeded {
  confirmed: string[]
  pending: string[]
  declined: string[]
  all: string[]
}

/** 25 orders from 3 different buyers (10 confirmed, 5 declined, 10 pending); leaves the last buyer signed in as admin. */
async function seedMarketplace(page: Page): Promise<Seeded> {
  await signIn(page)
  const editions = await pickAvailableEditions(page, 25)
  const confirmed = await seedBuyerOrders(page, 'confirmed', editions.slice(0, 10))
  const declined = await seedBuyerOrders(page, 'declined', editions.slice(10, 15))
  const pending = await seedBuyerOrders(page, 'pending', editions.slice(15, 25))
  await promoteCurrentUserToAdmin(page)
  return { confirmed, declined, pending, all: [...confirmed, ...declined, ...pending] }
}

async function signInAsAdmin(page: Page) {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)
}

async function openOrders(page: Page, search = '') {
  await page.goto(`/admin/orders${search}`)
  await expect(page.getByRole('heading', { name: 'Pedidos', level: 1 })).toBeVisible()
}

const rows = (page: Page) => page.getByRole('main').locator('tbody tr')
const idCells = (page: Page) => page.getByRole('main').locator('tbody tr td:first-child a')
const statusFilter = (page: Page) => page.getByLabel('Estado')
const pagerText = (page: Page) => page.getByRole('navigation', { name: 'Paginação dos pedidos' }).getByText(/^Página \d+ de \d+/)

async function pageIds(page: Page): Promise<string[]> {
  return idCells(page).allInnerTexts()
}

test('the list opens with the 20 newest orders of every buyer, each with who, what, how much, status and date', async ({ page }) => {
  const seeded = await seedMarketplace(page)
  await openOrders(page)

  await expect(rows(page)).toHaveCount(20)
  await expect(pagerText(page)).toContainText('Página 1 de 2')

  // Newest first: the screen follows the service's order, which is by creation time (then id) descending.
  const listing = await apiGet<{ items: { id: string; createdAt: string }[] }>(page, '/admin/orders?pageSize=20')
  expect(listing.items.map((item) => item.id)).toEqual(await pageIds(page))
  const times = listing.items.map((item) => item.createdAt)
  expect(times).toEqual([...times].sort().reverse())

  const first = rows(page).first()
  await expect(first.locator('td').nth(1)).toContainText('Teste E2E')
  await expect(first.locator('td').nth(1)).toContainText('teste@nft.dev')
  await expect(first.locator('td').nth(2)).toHaveText('1')
  await expect(first.locator('td').nth(3)).toContainText('ETH')
  await expect(first.locator('td').nth(4)).toHaveText(/Pendente|Confirmado|Recusado/)
  await expect(first.locator('td').nth(5)).toHaveText(/\d{2}\/\d{2}\/\d{4}/)
  expect(seeded.all).toHaveLength(25)
})

test('paging through the list shows every order exactly once', async ({ page }) => {
  const seeded = await seedMarketplace(page)
  await openOrders(page)

  const firstPage = await pageIds(page)
  expect(firstPage).toHaveLength(20)
  await page.getByRole('button', { name: 'Próxima' }).click()
  await expect(pagerText(page)).toContainText('Página 2 de 2')
  await expect(page).toHaveURL(/\/admin\/orders\?page=2$/)
  const secondPage = await pageIds(page)
  expect(secondPage).toHaveLength(5)
  await expect(page.getByRole('button', { name: 'Próxima' })).toBeDisabled()

  const seen = [...firstPage, ...secondPage]
  expect(new Set(seen).size).toBe(25)
  expect([...seen].sort()).toEqual([...seeded.all].sort())

  await page.getByRole('button', { name: 'Anterior' }).click()
  await expect(pagerText(page)).toContainText('Página 1 de 2')
  await expect(page).toHaveURL(/\/admin\/orders$/)
  await expect(page.getByRole('button', { name: 'Anterior' })).toBeDisabled()
})

test('the status filter keeps one status and its count, and lives in the address', async ({ page }) => {
  const seeded = await seedMarketplace(page)
  await openOrders(page)

  const cases = [
    { label: 'Confirmado', value: 'confirmed', ids: seeded.confirmed },
    { label: 'Pendente', value: 'pending', ids: seeded.pending },
    { label: 'Recusado', value: 'declined', ids: seeded.declined },
  ] as const
  for (const { label, value, ids } of cases) {
    await statusFilter(page).selectOption({ label })
    await expect(page).toHaveURL(new RegExp(`\\?status=${value}$`))
    await expect(rows(page)).toHaveCount(ids.length)
    await expect(pagerText(page)).toContainText('Página 1 de 1')
    await expect(page.getByRole('navigation', { name: 'Paginação dos pedidos' })).toContainText(`(${ids.length} pedidos)`)
    for (const cell of await rows(page).locator('td:nth-child(5)').allInnerTexts()) expect(cell.trim()).toBe(label)
    expect((await pageIds(page)).sort()).toEqual([...ids].sort())
  }

  await statusFilter(page).selectOption({ label: 'Todos' })
  await expect(page).toHaveURL(/\/admin\/orders$/)
  await expect(rows(page)).toHaveCount(20)
})

test('the page is in the address, and changing the filter goes back to page 1', async ({ page }) => {
  await seedMarketplace(page)
  await openOrders(page, '?page=2')
  await expect(pagerText(page)).toContainText('Página 2 de 2')
  await expect(rows(page)).toHaveCount(5)

  await statusFilter(page).selectOption({ label: 'Pendente' })
  await expect(page).toHaveURL(/\/admin\/orders\?status=pending$/)
  await expect(pagerText(page)).toContainText('Página 1 de 1')
})

test('an invalid page or status in the address is ignored', async ({ page }) => {
  await seedMarketplace(page)

  await openOrders(page, '?page=abc')
  await expect(rows(page)).toHaveCount(20)
  await expect(pagerText(page)).toContainText('Página 1 de 2')

  await openOrders(page, '?status=xyz')
  await expect(rows(page)).toHaveCount(20)
  await expect(statusFilter(page)).toHaveValue('')

  await openOrders(page, '?page=0&status=pending')
  await expect(pagerText(page)).toContainText('Página 1 de 1')
  await expect(rows(page)).toHaveCount(10)
})

test('empty states: a filter with no result, and a marketplace with no orders', async ({ page }) => {
  await signInAsAdmin(page)
  await openOrders(page)
  await expect(page.getByText('Nenhum pedido encontrado.')).toBeVisible()
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)

  // One confirmed order only: filtering by "Recusado" finds nothing.
  const [edition] = await pickAvailableEditions(page, 1)
  await seedBuyerOrders(page, 'confirmed', [edition!])
  await promoteCurrentUserToAdmin(page)
  await openOrders(page, '?status=declined')
  await expect(page.getByText('Nenhum pedido encontrado.')).toBeVisible()
  await expect(rows(page)).toHaveCount(0)
})

test('a collector is sent home with the access-denied notice and a visitor to sign-in', async ({ page }) => {
  await signIn(page)
  await page.goto('/admin/orders')
  await expect(page).toHaveURL(/\/\?forbidden=true$/)

  await page.evaluate((key) => localStorage.removeItem(key), SESSION_KEY)
  await page.goto('/admin/orders')
  await expect(page).toHaveURL(/\/login\?redirect=/)
})

test('the list offers no action that changes an order', async ({ page }) => {
  await seedMarketplace(page)
  await openOrders(page)
  await expect(rows(page)).toHaveCount(20)

  const allowed = new Set(['Anterior', 'Próxima', 'Sair do site'])
  const buttons = await page.getByRole('main').getByRole('button').allInnerTexts()
  for (const name of buttons) expect(allowed.has(name.trim())).toBe(true)
  await expect(page.getByRole('main').getByRole('combobox')).toHaveCount(1) // only the status filter
  await expect(page.getByRole('main').locator('form, input')).toHaveCount(0)
})

test('a failing service shows a clear message and "Tentar de novo" recovers', async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Visão geral', level: 1 })).toBeVisible()

  await selectScenario(page, 'offline')
  await page.getByRole('navigation', { name: 'Atalhos' }).getByRole('link', { name: 'Pedidos' }).click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Não foi possível carregar os pedidos.', { timeout: 15_000 })

  await selectScenario(page, 'fast')
  await page.getByRole('main').getByRole('button', { name: 'Tentar de novo' }).click()
  await expect(page.getByText('Nenhum pedido encontrado.')).toBeVisible()
})

test('the panel shortcut "Pedidos" leads to the list', async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto('/admin')
  await page.getByRole('navigation', { name: 'Atalhos' }).getByRole('link', { name: 'Pedidos' }).click()
  await expect(page).toHaveURL(/\/admin\/orders$/)
  await expect(page.getByRole('heading', { name: 'Pedidos', level: 1 })).toBeVisible()
})

test('an order stays on the list, with its buyer, after the buyer is suspended', async ({ page }) => {
  const seeded = await seedMarketplace(page)
  const target = seeded.confirmed[0]!
  const detail = await apiGet<{ userId: string }>(page, `/admin/orders/${target}`)

  await page.evaluate(
    async ([id, key]) => {
      await fetch(`/api/admin/users/${id}/suspend`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem(key)}` } })
    },
    [detail.userId, SESSION_KEY] as const,
  )
  const users = await apiGet<{ id: string; status: string }[]>(page, '/admin/users')
  expect(users.find((user) => user.id === detail.userId)?.status).toBe('suspended')

  await openOrders(page, '?status=confirmed')
  const row = rows(page).filter({ has: page.getByRole('link', { name: target }) })
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('Teste E2E')
  await expect(row).toContainText('Confirmado')
})

test('the list has no critical accessibility violations', async ({ page }) => {
  await seedMarketplace(page)
  await openOrders(page)
  await expect(rows(page)).toHaveCount(20)
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    // Frozen clock and UTC keep the page deterministic. Each order gets its own minute, so the order of the rows is
    // fixed; the random order ids are masked.
    test.use({ viewport, timezoneId: 'UTC', locale: 'pt-BR' })

    test('the list renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'))
      await signIn(page)
      const editions = await pickAvailableEditions(page, 3)
      await seedBuyerOrders(page, 'confirmed', [editions[0]!], new Date('2026-01-15T12:00:00Z'))
      await seedBuyerOrders(page, 'declined', [editions[1]!], new Date('2026-01-15T12:01:00Z'))
      await seedBuyerOrders(page, 'pending', [editions[2]!], new Date('2026-01-15T12:02:00Z'))
      await promoteCurrentUserToAdmin(page)
      await selectScenario(page, 'fast')
      await page.goto('/admin/orders')
      await expect(rows(page)).toHaveCount(3)
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`admin-orders-${viewport.width}.png`, {
        fullPage: true,
        mask: [page.locator('tbody td:first-child')],
      })
    })
  })
}
