import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, seedCartItem, selectScenario, SESSION_KEY, signIn, VIEWPORTS } from '../design-system/helpers'

async function fillCheckoutForm(page: import('@playwright/test').Page, walletLabel: string, walletAddressDigit: string) {
  await page.getByLabel('Nome de exibição').fill('Ana Colecionadora')
  await page.getByLabel('E-mail').fill('ana@nft.dev')
  await page.getByLabel('Rede').selectOption('ethereum')
  await page.getByLabel('Apelido da carteira').fill(walletLabel)
  await page.getByLabel('Tipo de carteira').selectOption('metamask')
  await page.getByPlaceholder('Endereço 0x da carteira').fill(`0x${walletAddressDigit.repeat(40)}`)
  await page.getByLabel('Ethereum').check()
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByLabel(new RegExp(walletLabel))).toBeVisible()
  await page.getByLabel(new RegExp(walletLabel)).check()
}

test('blocks submission while required fields are invalid', async ({ page }) => {
  await signIn(page)
  await seedCartItem(page)
  await page.goto('/checkout')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText('Informe o nome completo.')).toBeVisible()
  await expect(page).toHaveURL('/checkout')
})

test('completes checkout and reaches order confirmation', async ({ page }) => {
  await signIn(page)
  await seedCartItem(page)
  await page.goto('/checkout')

  await page.getByLabel('Nome de exibição').fill('Ana Colecionadora')
  await page.getByLabel('E-mail').fill('ana@nft.dev')
  await page.getByLabel('Rede').selectOption('ethereum')
  await page.getByLabel('Apelido da carteira').fill('Minha carteira')
  await page.getByLabel('Tipo de carteira').selectOption('metamask')
  await page.getByPlaceholder('Endereço 0x da carteira').fill(`0x${'1'.repeat(40)}`)
  await page.getByLabel('Ethereum').check()
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByLabel(/Minha carteira/)).toBeVisible()
  await page.getByLabel(/Minha carteira/).check()

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\//, { timeout: 10_000 })
})

test('blocks the purchase and refreshes the total when the price changes at checkout', async ({ page }) => {
  // selectScenario needs the app already mounted (it calls window.__nftMock), so sign in first.
  await signIn(page)
  await selectScenario(page, 'price-change-at-checkout')
  await seedCartItem(page)
  await page.goto('/checkout')

  const totalBefore = await page.getByText(/^Total$/).last().locator('..').getByText(/ETH/).textContent()
  await fillCheckoutForm(page, 'Carteira preço', '5')

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText('Os valores do pedido mudaram. Revise e confirme novamente.')).toBeVisible()
  await expect(page).toHaveURL('/checkout')

  const total = page.getByText(/^Total$/).last().locator('..').getByText(/ETH/)
  await expect(async () => {
    expect(await total.textContent()).not.toBe(totalBefore)
  }).toPass({ timeout: 10_000 })
})

test('redirects to login when the session expires mid-checkout', async ({ page }) => {
  test.setTimeout(60_000)
  // selectScenario needs the app already mounted (it calls window.__nftMock), so sign in first;
  // the session's sliding TTL is re-read on the next authenticated call (seedCartItem).
  await signIn(page)
  await selectScenario(page, 'short-session')
  await seedCartItem(page)
  await page.waitForTimeout(31_000)

  await page.goto('/checkout')
  await expect(page).toHaveURL(/\/login\?redirect=/, { timeout: 10_000 })
})

test('retrying the same idempotency key never creates a duplicate order', async ({ page }) => {
  await signIn(page)
  await seedCartItem(page)
  const token = await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)

  const [firstOrderId, secondOrderId] = await page.evaluate(async (authToken) => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }
    const wallet = await (
      await fetch('/api/wallets', {
        method: 'POST',
        headers,
        body: JSON.stringify({ slot: 'primary', label: 'Carteira', provider: 'metamask', address: `0x${'2'.repeat(40)}`, networks: ['ethereum'] }),
      })
    ).json()
    const quote = await (await fetch('/api/cart/quote?network=ethereum', { headers })).json()
    const idempotencyKey = crypto.randomUUID()
    const payload = JSON.stringify({
      quoteSignature: quote.signature,
      network: 'ethereum',
      walletId: wallet.id,
      collector: { fullName: 'Retry Tester', email: 'retry@nft.dev', country: 'BR' },
    })
    const first = await (await fetch('/api/orders', { method: 'POST', headers: { ...headers, 'Idempotency-Key': idempotencyKey }, body: payload })).json()
    // Simulates the client retrying after a timeout: same key, same payload.
    const second = await (await fetch('/api/orders', { method: 'POST', headers: { ...headers, 'Idempotency-Key': idempotencyKey }, body: payload })).json()
    return [first.id, second.id]
  }, token)

  expect(firstOrderId).toBe(secondOrderId)
})

test('checkout has no critical accessibility violations', async ({ page }) => {
  await signIn(page)
  await seedCartItem(page)
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Pagamento', exact: true })).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('checkout renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await signIn(page)
      await seedCartItem(page)
      await page.goto('/checkout')
      await expect(page.getByRole('heading', { name: 'Pagamento', exact: true })).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`checkout-${viewport.width}.png`, { fullPage: true })
    })
  })
}
