import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, seedCartItem, SESSION_KEY, settleAllOrders, signIn, VIEWPORTS } from '../design-system/helpers'
import { connectWallet, createWalletViaApi, openCheckout, reachReview } from './checkout-helpers'

test('prefills the collector from the profile', async ({ page }) => {
  await signIn(page)
  await seedCartItem(page)
  await openCheckout(page)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Design')
  await expect(page.getByLabel('E-mail')).toHaveValue(/@nft\.dev$/)
})

test('blocks the review while required fields are invalid and focuses the first one', async ({ page }) => {
  await signIn(page)
  await seedCartItem(page)
  await openCheckout(page)
  await page.getByLabel('Nome de exibição').fill('')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByText('Informe o nome completo.')).toBeVisible()
  await expect(page.getByLabel('Nome de exibição')).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Revise seu pedido' })).toHaveCount(0)
})

test('completes checkout: connect, review, confirm and reach the receipt', async ({ page }) => {
  await signIn(page)
  await createWalletViaApi(page)
  await seedCartItem(page)
  await reachReview(page)

  await expect(page.getByText('Ethereum', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Processando pagamento' })).toBeVisible()

  await settleAllOrders(page)
  await expect(page).toHaveURL(/\/orders\//, { timeout: 10_000 })
})

test('going back from the review keeps what was filled in', async ({ page }) => {
  await signIn(page)
  await createWalletViaApi(page)
  await seedCartItem(page)
  await openCheckout(page)
  await page.getByLabel('Observação do colecionador (opcional)').fill('Presente para mim')
  await connectWallet(page)
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByText('Presente para mim')).toBeVisible()

  await page.getByRole('button', { name: 'Voltar e editar' }).click()
  await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue('Presente para mim')
  await expect(page.getByRole('combobox', { name: /^Rede/ })).toHaveValue('ethereum')
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

test('checkout has no critical accessibility violations in the form and review steps', async ({ page }) => {
  await signIn(page)
  await createWalletViaApi(page)
  await seedCartItem(page)
  await openCheckout(page)
  expect(await runAxe(page)).toEqual([])
  await connectWallet(page)
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Revise seu pedido' })).toBeFocused()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('checkout renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await signIn(page)
      await seedCartItem(page)
      await openCheckout(page)
      // The prefilled e-mail is unique per run; pin it so the baseline stays stable.
      await page.getByLabel('E-mail').fill('ana@nft.dev')
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`checkout-${viewport.width}.png`, { fullPage: true })
    })
  })
}
