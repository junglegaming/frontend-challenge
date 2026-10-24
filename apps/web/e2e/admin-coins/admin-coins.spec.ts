import { expect, test, type Page } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, selectScenario, VIEWPORTS } from '../design-system/helpers'
import { openCoinsAdminLogin, ownerIds, seedOwners, signInCoinsAdmin, submitCoinsAdminLogin } from './helpers'

// specs/012-coins-admin, US2: the administrator lists the balance owners, page by page, in a stable order, with the
// current page in the URL. The mock behaves like apps/api: cursor pagination ordered by owner id.

const OWNERS = ownerIds(45)

const region = (page: Page) => page.getByRole('region', { name: 'Moedas' })
const table = (page: Page) => region(page).getByRole('table')
const ownerCells = (page: Page) => table(page).locator('tbody tr td:first-child')
const next = (page: Page) => region(page).getByRole('button', { name: 'Próxima' })
const previous = (page: Page) => region(page).getByRole('button', { name: 'Anterior' })

async function listedOwners(page: Page): Promise<string[]> {
  await expect(table(page)).toBeVisible()
  return (await ownerCells(page).allInnerTexts()).map((text) => text.trim())
}

/** Seeds the owners, then signs in (the app must be mounted to seed: the sign-in page does that). */
async function openListWith(page: Page, owners: string[]) {
  await openCoinsAdminLogin(page)
  await selectScenario(page, 'fast')
  if (owners.length > 0) await seedOwners(page, owners)
  await submitCoinsAdminLogin(page)
  await expect(page).toHaveURL(/\/admin\/coins(\?.*)?$/)
}

test('the first page lists 20 owners and offers the next one', async ({ page }) => {
  await openListWith(page, OWNERS)
  const first = await listedOwners(page)
  expect(first).toEqual(OWNERS.slice(0, 20))
  await expect(next(page)).toBeEnabled()
  await expect(previous(page)).toBeDisabled()
  await expect(region(page).getByText('Página 1')).toBeVisible()
})

test('walking through every page shows each owner exactly once (20, 20 and 5)', async ({ page }) => {
  await openListWith(page, OWNERS)
  const seen: string[] = []
  const sizes: number[] = []

  for (let pageNumber = 1; pageNumber <= 5; pageNumber += 1) {
    await expect(region(page).getByText(`Página ${pageNumber}`)).toBeVisible()
    const owners = await listedOwners(page)
    sizes.push(owners.length)
    seen.push(...owners)
    if (!(await next(page).isEnabled())) break
    await next(page).click()
  }

  expect(sizes).toEqual([20, 20, 5])
  expect(seen).toEqual(OWNERS) // none repeated, none missing, in order (SC-004)
  await expect(next(page)).toBeDisabled()
})

test('"Anterior" goes back to the identical previous page', async ({ page }) => {
  await openListWith(page, OWNERS)
  const first = await listedOwners(page)
  await next(page).click()
  await expect(region(page).getByText('Página 2')).toBeVisible()
  expect(await listedOwners(page)).toEqual(OWNERS.slice(20, 40))

  await previous(page).click()
  await expect(region(page).getByText('Página 1')).toBeVisible()
  expect(await listedOwners(page)).toEqual(first)
})

test('the page is in the URL: opening that address after signing in shows the same page', async ({ page }) => {
  await openListWith(page, OWNERS)
  await next(page).click()
  await expect(region(page).getByText('Página 2')).toBeVisible()
  const address = page.url()
  expect(address).toContain('cursors=')

  // A full page load drops the in-memory session: it goes through sign-in and comes back to this very page.
  await page.goto(address)
  await expect(page).toHaveURL(/\/admin\/coins\/login\?redirect=/)
  await submitCoinsAdminLogin(page)
  await expect(region(page).getByText('Página 2')).toBeVisible()
  expect(await listedOwners(page)).toEqual(OWNERS.slice(20, 40))
})

test('with no owners it shows the empty state', async ({ page }) => {
  await openListWith(page, [])
  await expect(region(page).getByText('Nenhum dono de saldo ainda.')).toBeVisible()
  await expect(table(page)).toHaveCount(0)
})

test('choosing an owner opens that owner', async ({ page }) => {
  await openListWith(page, OWNERS)
  await region(page).getByRole('link', { name: 'dono-003' }).click()
  // The detail screen itself is covered by e2e/admin-coins-owner.
  await expect(page).toHaveURL(/\/admin\/coins\/dono-003$/)
})

test('an expired session returns to sign-in, then back to the same page, without showing the old data', async ({ page }) => {
  await openListWith(page, OWNERS)
  await expect(table(page)).toBeVisible()

  await selectScenario(page, 'coins-admin-session-expired')
  await next(page).click()
  await expect(page).toHaveURL(/\/admin\/coins\/login\?/)
  await expect(page.getByText('Sua sessão de administrador expirou. Entre de novo.')).toBeVisible()

  // Back on a slow network, nothing from the previous session may show while the new answer is on its way.
  await selectScenario(page, 'slow-network')
  await submitCoinsAdminLogin(page)
  await expect(page).toHaveURL(/\/admin\/coins(\?.*)?$/, { timeout: 15_000 })
  await expect(table(page)).toHaveCount(0)
  await expect(table(page)).toBeVisible({ timeout: 15_000 })
})

test('an unavailable service shows a clear message and "Tentar de novo" recovers', async ({ page }) => {
  await openListWith(page, OWNERS)
  await expect(table(page)).toBeVisible()

  await selectScenario(page, 'coins-unavailable')
  await next(page).click()
  await expect(region(page).getByRole('alert')).toContainText('Serviço de moedas indisponível. Tente novamente.', { timeout: 15_000 })

  await selectScenario(page, 'fast')
  await region(page).getByRole('button', { name: 'Tentar de novo' }).click()
  await expect(table(page)).toBeVisible()
})

test('a malformed cursor list in the URL falls back to the first page', async ({ page }) => {
  await openCoinsAdminLogin(page)
  await seedOwners(page, OWNERS)
  await page.goto('/admin/coins?cursors=isto-nao-e-uma-lista')
  await submitCoinsAdminLogin(page)
  await expect(region(page).getByText('Página 1')).toBeVisible()
  expect(await listedOwners(page)).toEqual(OWNERS.slice(0, 20))
})

test('the area offers no action that changes data', async ({ page }) => {
  await openListWith(page, OWNERS)
  await expect(table(page)).toBeVisible()
  const names = await region(page).getByRole('button').evaluateAll((buttons) => buttons.map((b) => b.textContent?.trim()))
  for (const name of names) expect(['Anterior', 'Próxima', 'Sair', 'Tentar de novo']).toContain(name)
})

test('the list has no critical accessibility violations', async ({ page }) => {
  await openListWith(page, OWNERS)
  await expect(table(page)).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    // Frozen clock and UTC: the table shows each owner's last movement, which must not change between runs.
    test.use({ viewport, timezoneId: 'UTC', locale: 'pt-BR' })

    test('the list renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'))
      await openListWith(page, OWNERS)
      await expect(table(page)).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`admin-coins-${viewport.width}.png`, { fullPage: true })
    })
  })
}
