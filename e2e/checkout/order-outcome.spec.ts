import { expect, test, type Page } from '@playwright/test'
import { seedCartItem, selectScenario, settleAllOrders, signIn } from '../design-system/helpers'
import { createWalletViaApi, reachReview } from './checkout-helpers'

/** Order ids returned by POST /orders (MSW answers inside the page, so watch the page's responses). */
function trackOrderResponses(page: Page) {
  const ids: string[] = []
  page.on('response', async (response) => {
    if (response.request().method() !== 'POST' || !response.url().endsWith('/api/orders')) return
    const body = (await response.json().catch(() => null)) as { id?: string } | null
    if (body?.id) ids.push(body.id)
  })
  return ids
}

test('repeated clicks on confirm create a single order', async ({ page }) => {
  await signIn(page)
  await createWalletViaApi(page)
  await seedCartItem(page)
  await reachReview(page)
  const orderIds = trackOrderResponses(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).dblclick()
  await expect(page.getByRole('heading', { name: 'Processando pagamento' })).toBeVisible()
  expect(new Set(orderIds).size).toBe(1)
})

test('a declined payment keeps the items and lets the collector try again', async ({ page }) => {
  await signIn(page)
  await selectScenario(page, 'payment-declined')
  await createWalletViaApi(page)
  await seedCartItem(page)
  await reachReview(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Processando pagamento' })).toBeVisible()
  await settleAllOrders(page)

  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  await expect(page.getByText('Seus itens continuam no carrinho.')).toBeVisible()
  await expect(page).toHaveURL('/checkout')

  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('button', { name: 'Revisar pedido' })).toBeVisible()
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Design')
})

test('reloading while the payment is pending resumes the same order', async ({ page }) => {
  await signIn(page)
  await createWalletViaApi(page)
  await seedCartItem(page)
  await reachReview(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const pending = page.getByText(/^Pedido [^ ]+$/)
  await expect(pending).toBeVisible()
  const orderLabel = await pending.textContent()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Processando pagamento' })).toBeVisible()
  await expect(page.getByText(/^Pedido [^ ]+$/)).toHaveText(orderLabel ?? '')

  await settleAllOrders(page)
  await expect(page).toHaveURL(/\/orders\//, { timeout: 10_000 })
})

test('a timeout after the order was created recovers the same order on retry', async ({ page }) => {
  test.setTimeout(60_000)
  await signIn(page)
  await selectScenario(page, 'order-timeout')
  await createWalletViaApi(page)
  await seedCartItem(page)
  await reachReview(page)
  const orderIds = trackOrderResponses(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert').getByText('Não recebemos a confirmação a tempo.', { exact: false })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Processando pagamento' })).toBeVisible()
  // The late first response and the replay both carry the same order.
  expect(new Set(orderIds).size).toBe(1)
})
