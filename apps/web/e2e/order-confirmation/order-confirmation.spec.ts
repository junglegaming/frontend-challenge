import { expect, test } from '@playwright/test'
import { createOrderViaApi, hasNoHorizontalScroll, runAxe, selectScenario, settleAllOrders, signIn, VIEWPORTS } from '../design-system/helpers'

test('shows a pending state right after the order is created', async ({ page }) => {
  await signIn(page)
  const orderId = await createOrderViaApi(page)
  await page.goto(`/orders/${orderId}`)
  await expect(page.getByText('Confirmando sua transação…')).toBeVisible()
})

test('shows the full receipt once the order settles as confirmed', async ({ page }) => {
  await signIn(page)
  const orderId = await createOrderViaApi(page)
  await settleAllOrders(page)
  await page.goto(`/orders/${orderId}`)
  await expect(page.getByText('Obrigado!')).toBeVisible()
  await expect(page.getByText('Distant Galaxy')).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute('target', '_blank')
})

test('shows a declined state when the payment is declined', async ({ page }) => {
  await signIn(page)
  await selectScenario(page, 'payment-declined')
  const orderId = await createOrderViaApi(page)
  await settleAllOrders(page)
  await page.goto(`/orders/${orderId}`)
  await expect(page.getByText('Pagamento recusado', { exact: true })).toBeVisible()
})

test('shows a not-found state for a foreign or missing order id', async ({ page }) => {
  await signIn(page)
  await page.goto('/orders/ord_does_not_exist')
  await expect(page.getByText('Pedido não encontrado')).toBeVisible()
})

test('order confirmation has no critical accessibility violations', async ({ page }) => {
  await signIn(page)
  const orderId = await createOrderViaApi(page)
  await settleAllOrders(page)
  await page.goto(`/orders/${orderId}`)
  await expect(page.getByText('Obrigado!')).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('order confirmation renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await signIn(page)
      const orderId = await createOrderViaApi(page)
      await settleAllOrders(page)
      await page.goto(`/orders/${orderId}`)
      await expect(page.getByText('Obrigado!')).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`order-confirmation-${viewport.width}.png`, { fullPage: true })
    })
  })
}
