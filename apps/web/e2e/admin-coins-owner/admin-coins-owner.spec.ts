import { expect, test, type Page } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, selectScenario, VIEWPORTS } from '../design-system/helpers'
import { openCoinsAdminLogin, submitCoinsAdminLogin } from '../admin-coins/helpers'

// specs/012-coins-admin, US3: the administrator opens one owner and sees the balance and the 50 most recent
// operations, read-only. The mock behaves like apps/api (balance 0 and no operations for an unknown id).

const main = (page: Page) => page.getByRole('main')
const operations = (page: Page) => main(page).getByRole('table').locator('tbody tr')

/** Gives an owner operations through the (mocked) coins service. `ops` are applied in order. */
async function seedOperations(page: Page, ownerId: string, ops: { direction: 'credit' | 'debit'; amount: number }[]) {
  await page.evaluate(
    async ([owner, list]) => {
      const issued = await fetch('/backend/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: owner }),
      })
      const { token } = (await issued.json()) as { token: string }
      let index = 0
      for (const op of list) {
        index += 1
        await fetch(op.direction === 'credit' ? '/backend/coins/topup' : '/backend/coins/debit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'Idempotency-Key': `seed-${owner}-${index}` },
          body: JSON.stringify({ amount: op.amount }),
        })
      }
    },
    [ownerId, ops] as const,
  )
}

type Ops = { direction: 'credit' | 'debit'; amount: number }[]

/** Seeds the owner and signs in, ending on the list (client-side navigation keeps the in-memory session). */
async function openList(page: Page, ownerId: string, ops: Ops) {
  await openCoinsAdminLogin(page)
  await selectScenario(page, 'fast')
  await seedOperations(page, ownerId, ops)
  await submitCoinsAdminLogin(page)
  await expect(page).toHaveURL(/\/admin\/coins(\?.*)?$/)
  await expect(page.getByRole('link', { name: ownerId, exact: true })).toBeVisible()
}

/** Opens the owner from the list. The detail query is new (never cached), so it reaches the service right now. */
async function goToOwner(page: Page, ownerId: string) {
  await page.getByRole('link', { name: ownerId, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/admin/coins/${ownerId}$`))
}

async function openOwner(page: Page, ownerId: string, ops: Ops) {
  await openList(page, ownerId, ops)
  await goToOwner(page, ownerId)
}

test('shows the balance and the operations, newest first', async ({ page }) => {
  await openOwner(page, 'dono-a', [
    { direction: 'credit', amount: 100 },
    { direction: 'debit', amount: 40 },
  ])
  await expect(main(page).getByText('60 moedas', { exact: true })).toBeVisible()

  const rows = operations(page)
  await expect(rows).toHaveCount(2)
  await expect(rows.nth(0)).toContainText('Débito')
  await expect(rows.nth(0)).toContainText('40')
  await expect(rows.nth(0)).toContainText('60') // balance right after the debit
  await expect(rows.nth(1)).toContainText('Crédito')
  await expect(rows.nth(1)).toContainText('100')
})

test('with more than 50 operations it shows the 50 most recent and says so', async ({ page }) => {
  await openOwner(
    page,
    'dono-b',
    Array.from({ length: 55 }, () => ({ direction: 'credit' as const, amount: 1 })),
  )
  await expect(main(page).getByText('55 moedas', { exact: true })).toBeVisible()
  await expect(operations(page)).toHaveCount(50)
  await expect(main(page).getByText('Mostrando as 50 operações mais recentes.')).toBeVisible()
})

test('an owner with no operations shows a zero balance, not an error', async ({ page }) => {
  // Opening the address with no session goes through sign-in and comes back to this owner.
  await page.goto('/admin/coins/dono-sem-operacoes')
  await expect(page).toHaveURL(/\/admin\/coins\/login\?redirect=/)
  await submitCoinsAdminLogin(page)
  await expect(main(page).getByText('0 moedas', { exact: true })).toBeVisible()
  await expect(main(page).getByText('Nenhuma operação.')).toBeVisible()
  await expect(main(page).getByRole('alert')).toHaveCount(0)
})

test('an invalid owner id shows a clear message and a way back to the list', async ({ page }) => {
  for (const id of ['id%20invalido', 'x'.repeat(129)]) {
    await openCoinsAdminLogin(page)
    await page.goto(`/admin/coins/${id}`)
    await submitCoinsAdminLogin(page)
    await expect(main(page).getByText('Identificador de dono inválido.')).toBeVisible()
    await main(page).getByRole('link', { name: 'Voltar para a lista' }).click()
    await expect(page).toHaveURL(/\/admin\/coins(\?.*)?$/)
  }
})

test('an expired session returns to sign-in and then to the same owner, without showing the old data', async ({ page }) => {
  await openList(page, 'dono-c', [{ direction: 'credit', amount: 25 }])

  // The access runs out before the owner is opened: the detail request is refused and nothing is shown.
  await selectScenario(page, 'coins-admin-session-expired')
  await goToOwner(page, 'dono-c')
  await expect(page).toHaveURL(/\/admin\/coins\/login\?redirect=/)
  await expect(main(page).getByText('25 moedas', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Sua sessão de administrador expirou. Entre de novo.')).toBeVisible()

  await selectScenario(page, 'slow-network')
  await submitCoinsAdminLogin(page)
  await expect(page).toHaveURL(/\/admin\/coins\/dono-c$/, { timeout: 15_000 })
  // Nothing from the previous session while the new answer is on its way.
  await expect(main(page).getByText('25 moedas', { exact: true })).toHaveCount(0)
  await expect(main(page).getByText('25 moedas', { exact: true })).toBeVisible({ timeout: 15_000 })
})

test('an unavailable service shows a clear message and "Tentar de novo" recovers', async ({ page }) => {
  await openList(page, 'dono-d', [{ direction: 'credit', amount: 7 }])
  await selectScenario(page, 'coins-unavailable')
  await goToOwner(page, 'dono-d')
  await expect(main(page).getByRole('alert')).toContainText('Serviço de moedas indisponível. Tente novamente.', { timeout: 15_000 })

  await selectScenario(page, 'fast')
  await main(page).getByRole('button', { name: 'Tentar de novo' }).click()
  await expect(main(page).getByText('7 moedas', { exact: true })).toBeVisible()
})

test('the screen offers no action that changes data', async ({ page }) => {
  await openOwner(page, 'dono-e', [{ direction: 'credit', amount: 3 }])
  await expect(main(page).getByText('3 moedas', { exact: true })).toBeVisible()
  const names = await main(page).getByRole('button').evaluateAll((buttons) => buttons.map((b) => b.textContent?.trim()))
  for (const name of names) expect(['Sair', 'Sair do site', 'Tentar de novo']).toContain(name)
})

test('signing out closes the owner: going back shows no data', async ({ page }) => {
  await openOwner(page, 'dono-f', [{ direction: 'credit', amount: 9 }])
  await expect(main(page).getByText('9 moedas', { exact: true })).toBeVisible()

  await main(page).getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/coins\/login/)
  await page.goBack()
  await expect(page).toHaveURL(/\/admin\/coins\/login/)
  await expect(page.getByText('9 moedas', { exact: true })).toHaveCount(0)
})

test('the detail has no critical accessibility violations', async ({ page }) => {
  await openOwner(page, 'dono-g', [
    { direction: 'credit', amount: 10 },
    { direction: 'debit', amount: 4 },
  ])
  await expect(main(page).getByText('6 moedas', { exact: true })).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    // Frozen clock and UTC: the operations show their date, which must not change between runs.
    test.use({ viewport, timezoneId: 'UTC', locale: 'pt-BR' })

    test('the detail renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'))
      await openOwner(page, 'dono-visual', [
        { direction: 'credit', amount: 100 },
        { direction: 'debit', amount: 40 },
        { direction: 'credit', amount: 5 },
      ])
      await expect(main(page).getByText('65 moedas', { exact: true })).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`admin-coins-owner-${viewport.width}.png`, { fullPage: true })
    })
  })
}
