import { expect, test, type Page } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, seedCartItem, selectScenario, signIn, VIEWPORTS } from '../design-system/helpers'

/**
 * Simulates a second collector buying out an edition's remaining stock through the raw mocked
 * API, entirely independent of the signed-in test session, so this page's already-fetched
 * `available`/`max` go stale relative to the server — the race the optimistic rollback must survive.
 */
async function buyOutStock(page: Page, input: { nftId: string; editionId: string; quantity: number }) {
  await page.evaluate(async ({ nftId, editionId, quantity }) => {
    const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const signup = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Outro Colecionador', username: `buyer_${unique}`, email: `${unique}@nft.dev`, password: 'Senha1234' }),
    })
    const { token } = (await signup.json()) as { token: string }
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    await fetch('/api/cart/items', { method: 'POST', headers, body: JSON.stringify({ nftId, editionId, quantity }) })
    const walletResponse = await fetch('/api/wallets', {
      method: 'POST',
      headers,
      body: JSON.stringify({ slot: 'primary', label: 'Carteira concorrente', provider: 'metamask', address: `0x${'9'.repeat(40)}`, networks: ['ethereum'] }),
    })
    const wallet = (await walletResponse.json()) as { id: string }
    const quoteResponse = await fetch('/api/cart/quote?network=ethereum', { headers })
    const quote = (await quoteResponse.json()) as { signature: string }
    await fetch('/api/orders', {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({
        quoteSignature: quote.signature,
        network: 'ethereum',
        walletId: wallet.id,
        collector: { fullName: 'Outro Colecionador', email: `${unique}@nft.dev`, country: 'BR' },
      }),
    })
  }, input)
}

test('reverts an optimistic quantity bump when the server rejects it for exceeding stock', async ({ page }) => {
  await signIn(page)
  // nft_005's standard edition has 4 units available (deterministic fixture seed): seeding 2
  // leaves headroom for the stepper's "+" to be enabled, while a competing buyout below can still
  // leave 1 unit — positive, so the edition itself doesn't flip to sold_out, but fewer than this
  // line's own quantity, which is exactly what flips its status to 'quantity_exceeds_stock'.
  await seedCartItem(page, { nftId: 'nft_005', editionId: 'nft_005_standard', quantity: 2 })
  await page.goto('/cart')

  const quantity = page.locator('span[aria-live="polite"]')
  await expect(quantity).toHaveText('2')

  await buyOutStock(page, { nftId: 'nft_005', editionId: 'nft_005_standard', quantity: 3 })
  // Slows only the next request, giving the optimistic value time to be observed before it reverts.
  await selectScenario(page, 'slow-network')

  await page.getByRole('button', { name: /Aumentar quantidade/ }).click()
  await expect(quantity).toHaveText('3')
  await expect(quantity).toHaveText('2', { timeout: 10_000 })
  await expect(page.getByText('A quantidade foi ajustada ao estoque disponível.')).toBeVisible({ timeout: 10_000 })
})

test('changing quantity recomputes totals, removing the last line shows the empty state', async ({ page }) => {
  await signIn(page)
  await seedCartItem(page, { nftId: 'nft_001', editionId: 'nft_001_standard', quantity: 1 })
  await page.goto('/cart')

  const total = page.getByText(/^Total$/).locator('..').getByText(/ETH/)
  await expect(total).toBeVisible()
  const totalBefore = await total.textContent()

  await page.getByRole('button', { name: /Aumentar quantidade/ }).click()
  await expect(async () => {
    expect(await total.textContent()).not.toBe(totalBefore)
  }).toPass()

  await page.getByRole('button', { name: /Remover .* do carrinho/ }).click()
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
})

test('an invalid coupon leaves totals unchanged', async ({ page }) => {
  await signIn(page)
  await seedCartItem(page)
  await page.goto('/cart')

  const total = page.getByText(/^Total$/).locator('..').getByText(/ETH/)
  await expect(total).toBeVisible()
  const totalBefore = await total.textContent()

  await page.getByPlaceholder('Digite o código promocional...').fill('CODIGO-INVALIDO')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  expect(await total.textContent()).toBe(totalBefore)
})

test('cart has no critical accessibility violations', async ({ page }) => {
  await signIn(page)
  await seedCartItem(page)
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Carrinho' })).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('cart renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await signIn(page)
      await seedCartItem(page)
      await page.goto('/cart')
      await expect(page.getByRole('heading', { name: 'Carrinho' })).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`cart-${viewport.width}.png`, { fullPage: true })
    })
  })
}
