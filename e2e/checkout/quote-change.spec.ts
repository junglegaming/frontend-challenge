import { expect, test } from '@playwright/test'
import { seedCartItem, selectScenario, signIn } from '../design-system/helpers'
import { createWalletViaApi, reachReview } from './checkout-helpers'

test('a price change at submission creates no order and asks for a new confirmation', async ({ page }) => {
  await signIn(page)
  await selectScenario(page, 'price-change-at-checkout')
  await createWalletViaApi(page)
  await seedCartItem(page)
  await reachReview(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert').getByText('Os valores do pedido mudaram. Revise e confirme novamente.')).toBeVisible()
  await expect(page.getByText(/ETH → .*ETH/).first()).toBeVisible()
  await expect(page).toHaveURL('/checkout')
  await expect(page.getByRole('heading', { name: 'Processando pagamento' })).toHaveCount(0)

  // The new values were shown; confirming again goes through.
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Processando pagamento' })).toBeVisible()
})

test('a sold-out edition at submission blocks the purchase and points to the cart', async ({ page }) => {
  await signIn(page)
  await selectScenario(page, 'sold-out-at-checkout')
  await createWalletViaApi(page)
  await seedCartItem(page)
  await reachReview(page)

  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert').getByText('Os valores do pedido mudaram. Revise e confirme novamente.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ajustar carrinho' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
})
