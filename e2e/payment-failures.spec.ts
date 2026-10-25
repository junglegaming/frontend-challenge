import { ALICE, addToCart, expect, goToReview, login, serverOrders, test } from './fixtures'

async function prepare(page: import('@playwright/test').Page) {
  await addToCart(page)
  await login(page, ALICE, '/checkout')
  await goToReview(page)
}

test.describe('pagamento recusado', () => {
  test.use({ scenario: 'payment-rejected' })
  test('mostra a recusa e preserva os itens', async ({ page }) => {
    await prepare(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 15_000 })
    expect(await serverOrders(page)).toEqual(['rejected'])
    await page.goto('/cart')
    await expect(page.getByText('Emerald Ape #042').filter({ visible: true }).first()).toBeVisible()
  })
})

test('clique repetido não duplica o pedido', async ({ page }) => {
  await prepare(page)
  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  await confirm.dblclick()
  await confirm.click({ force: true, timeout: 1000 }).catch(() => {})
  await expect(page).toHaveURL(/\/orders\//)
  expect(await serverOrders(page)).toHaveLength(1)
})

test.describe('timeout após a criação do pedido', () => {
  test.use({ scenario: 'order-timeout' })
  test('nova tentativa recupera o mesmo pedido pela chave de idempotência', async ({ page }) => {
    test.setTimeout(90_000)
    await prepare(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const retry = page.getByRole('button', { name: 'Tentar novamente' })
    await expect(retry).toBeVisible({ timeout: 15_000 })
    expect(await serverOrders(page)).toHaveLength(1)
    await retry.click()
    await expect(page).toHaveURL(/\/orders\//, { timeout: 20_000 })
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({ timeout: 15_000 })
    expect(await serverOrders(page)).toEqual(['confirmed'])
  })
})
