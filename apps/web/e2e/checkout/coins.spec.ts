import { expect, test, type Page } from '@playwright/test'
import { seedCartItem, selectScenario, signIn } from '../design-system/helpers'

// specs/011-web-coins-real-api, US2: paying an order with coins through `/backend` (answered by the MSW ledger mock,
// which applies `Idempotency-Key` exactly like apps/api). A definite order rejection gives the coins back once; an
// ambiguous failure (the order may exist) never does, and a retry replays the debit instead of charging again.

const history = (page: Page) => page.getByRole('list', { name: 'Histórico de moedas' }).getByRole('listitem')
const debits = (page: Page) => history(page).filter({ hasText: 'Débito de' })
const credits = (page: Page) => history(page).filter({ hasText: 'Crédito de' })

async function balanceOnWallets(page: Page): Promise<number> {
  await page.goto('/account/wallets')
  const text = await page.getByRole('region', { name: 'Moedas da Kurio' }).getByText(/^\d+ moedas$/).textContent()
  return Number((text ?? '').replace(/\D/g, ''))
}

async function topUpOnWallets(page: Page, amount: number) {
  await page.goto('/account/wallets')
  await page.getByLabel('Recarregar moedas').fill(String(amount))
  await page.getByRole('button', { name: 'Recarregar' }).click()
  await expect(page.getByRole('region', { name: 'Moedas da Kurio' }).getByText(`${amount} moedas`, { exact: true })).toBeVisible()
}

/** Opens the checkout with the coins method selected and a saved wallet; returns the cost in coins. */
async function openCheckoutPayingWithCoins(page: Page): Promise<number> {
  await page.goto('/checkout')
  await page.getByLabel('Nome de exibição').fill('Ana Colecionadora')
  await page.getByLabel('E-mail').fill('ana@nft.dev')
  await page.getByLabel('Rede').selectOption('ethereum')
  await page.getByLabel('Apelido da carteira').fill('Carteira moedas')
  await page.getByLabel('Tipo de carteira').selectOption('metamask')
  await page.getByPlaceholder('Endereço 0x da carteira').fill(`0x${'4'.repeat(40)}`)
  await page.getByLabel('Ethereum').check()
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByLabel(/Carteira moedas/)).toBeVisible()
  await page.getByLabel(/Carteira moedas/).check()

  await page.getByLabel('Pagar com moedas da Kurio').check()
  const costText = await page.getByText(/Custo desta compra:/).textContent()
  const cost = Number(/Custo desta compra:\s*(\d+)/.exec(costText ?? '')?.[1])
  expect(cost).toBeGreaterThan(0)
  return cost
}

test.beforeEach(async ({ page }) => {
  await signIn(page)
  await selectScenario(page, 'fast')
  await seedCartItem(page)
})

test('pays an order with coins and debits exactly the cost', async ({ page }) => {
  await topUpOnWallets(page, 1_000_000)
  const cost = await openCheckoutPayingWithCoins(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\//, { timeout: 10_000 })

  expect(await balanceOnWallets(page)).toBe(1_000_000 - cost)
  await expect(debits(page)).toHaveCount(1)
  await expect(credits(page)).toHaveCount(1) // the top-up only
})

test('refuses before charging when the balance is too low', async ({ page }) => {
  const cost = await openCheckoutPayingWithCoins(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Saldo de moedas insuficiente: você tem 0, esta compra custa' })).toBeVisible()
  await expect(page.getByText(`esta compra custa ${cost}.`).first()).toBeVisible()
  await expect(page).toHaveURL('/checkout')

  expect(await balanceOnWallets(page)).toBe(0)
  await expect(history(page)).toHaveCount(0)
})

test('a definitely rejected order gives the coins back exactly once', async ({ page }) => {
  await topUpOnWallets(page, 1_000_000)
  await selectScenario(page, 'sold-out-at-checkout')
  const cost = await openCheckoutPayingWithCoins(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText('Pedido não criado; suas moedas foram devolvidas.')).toBeVisible({ timeout: 10_000 })
  await expect(page).toHaveURL('/checkout')

  expect(await balanceOnWallets(page)).toBe(1_000_000)
  await expect(debits(page)).toHaveCount(1)
  await expect(credits(page).filter({ hasText: `Crédito de ${cost} moedas` })).toHaveCount(1)
})

test('an ambiguous order failure keeps the debit and never gives coins back', async ({ page }) => {
  test.slow() // the client waits for its request timeout once
  await topUpOnWallets(page, 1_000_000)
  await selectScenario(page, 'order-timeout')
  const cost = await openCheckoutPayingWithCoins(page)

  // The order is created but its response arrives after the client timeout: the order may exist, so the
  // coins must stay debited. (Replaying without charging again is covered by the lost-debit test below.)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Não confirmamos a compra. Confira seus pedidos antes de tentar de novo.' }),
  ).toBeVisible({ timeout: 20_000 })

  expect(await balanceOnWallets(page)).toBe(1_000_000 - cost)
  await expect(debits(page)).toHaveCount(1)
  await expect(credits(page)).toHaveCount(1) // the top-up only: nothing was given back
})

test('a lost debit response is recovered by retrying, with a single debit', async ({ page }) => {
  await topUpOnWallets(page, 1_000_000)
  await selectScenario(page, 'coins-response-lost')
  const cost = await openCheckoutPayingWithCoins(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Serviço de moedas indisponível. Tente novamente.' })).toBeVisible()

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\//, { timeout: 10_000 })

  expect(await balanceOnWallets(page)).toBe(1_000_000 - cost)
  await expect(debits(page)).toHaveCount(1)
})

test('a double click debits only once', async ({ page }) => {
  await topUpOnWallets(page, 1_000_000)
  const cost = await openCheckoutPayingWithCoins(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).dblclick()
  await expect(page).toHaveURL(/\/orders\//, { timeout: 10_000 })

  expect(await balanceOnWallets(page)).toBe(1_000_000 - cost)
  await expect(debits(page)).toHaveCount(1)
})
