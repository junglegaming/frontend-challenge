import { expect, test, type Page } from '@playwright/test'
import { selectScenario, signIn } from '../design-system/helpers'

// specs/011-web-coins-real-api, US1: the wallet shows and tops up coins through `/backend` (here answered by the
// MSW ledger mock, which behaves like apps/api: idempotency, isolation, persistence across reloads).

const coinsSection = (page: Page) => page.getByRole('region', { name: 'Moedas da Kurio' })
const history = (page: Page) => page.getByRole('list', { name: 'Histórico de moedas' }).getByRole('listitem')

async function openWallets(page: Page) {
  await page.goto('/account/wallets')
  await expect(coinsSection(page)).toBeVisible()
}

async function topUp(page: Page, amount: number) {
  await page.getByLabel('Recarregar moedas').fill(String(amount))
  await page.getByRole('button', { name: 'Recarregar' }).click()
}

test.beforeEach(async ({ page }) => {
  await signIn(page)
  await selectScenario(page, 'fast')
})

test('a new user sees a zero balance and can top up', async ({ page }) => {
  await openWallets(page)
  await expect(coinsSection(page).getByText('0 moedas', { exact: true })).toBeVisible()
  await expect(page.getByText('Nenhuma operação ainda.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Recarregar' })).toBeEnabled()
})

test('a top-up shows the new balance and one history entry, also after a reload', async ({ page }) => {
  await openWallets(page)
  await topUp(page, 100)
  await expect(coinsSection(page).getByText('100 moedas', { exact: true })).toBeVisible()
  await expect(history(page)).toHaveCount(1)

  await page.reload()
  await expect(coinsSection(page).getByText('100 moedas', { exact: true })).toBeVisible()
  await expect(history(page)).toHaveCount(1)
})

test('a double click tops up only once', async ({ page }) => {
  await openWallets(page)
  await page.getByLabel('Recarregar moedas').fill('30')
  await page.getByRole('button', { name: 'Recarregar' }).dblclick()
  await expect(coinsSection(page).getByText('30 moedas', { exact: true })).toBeVisible()
  await expect(history(page)).toHaveCount(1)
})

test('retrying after a lost response applies the top-up exactly once (idempotent recovery)', async ({ page }) => {
  await selectScenario(page, 'coins-response-lost')
  await openWallets(page)

  await topUp(page, 50)
  await expect(coinsSection(page).getByRole('alert')).toContainText('Serviço de moedas indisponível. Tente novamente.')

  // Same amount, same intent: the same Idempotency-Key is sent, so the API replays instead of crediting again.
  await page.getByRole('button', { name: 'Recarregar' }).click()
  await expect(coinsSection(page).getByText('50 moedas', { exact: true })).toBeVisible()
  await expect(history(page)).toHaveCount(1)
})

test('an unavailable coins service shows a clear message and recovers on retry', async ({ page }) => {
  await selectScenario(page, 'coins-unavailable')
  await openWallets(page)
  await expect(coinsSection(page).getByRole('alert')).toContainText('Serviço de moedas indisponível. Tente novamente.')

  await selectScenario(page, 'fast')
  await coinsSection(page).getByRole('button', { name: 'Tentar de novo' }).click()
  await expect(coinsSection(page).getByText('0 moedas', { exact: true })).toBeVisible()
})

test('another account never sees the previous account coins', async ({ page }) => {
  await openWallets(page)
  await topUp(page, 70)
  await expect(coinsSection(page).getByText('70 moedas', { exact: true })).toBeVisible()

  await signIn(page) // a new, distinct account
  await openWallets(page)
  await expect(coinsSection(page).getByText('0 moedas', { exact: true })).toBeVisible()
  await expect(history(page)).toHaveCount(0)
})

test('signed out, the wallet page redirects to login and shows no coins', async ({ browser }) => {
  const page = await browser.newPage()
  await page.goto('/account/wallets')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await expect(page.getByRole('region', { name: 'Moedas da Kurio' })).toHaveCount(0)
  await page.close()
})
