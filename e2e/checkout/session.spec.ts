import { expect, test } from '@playwright/test'
import { seedCartItem, selectScenario, signIn } from '../design-system/helpers'
import { connectWallet, createWalletViaApi, openCheckout } from './checkout-helpers'

test('an expired session sends the collector to login and restores the checkout afterwards', async ({ page }) => {
  await page.clock.install()
  await signIn(page)
  await selectScenario(page, 'short-session')
  await createWalletViaApi(page)
  await seedCartItem(page)
  await openCheckout(page)
  // The e-mail is prefilled from the profile of the throw-away collector; reuse it to log in again.
  await expect(page.getByLabel('E-mail')).toHaveValue(/@nft\.dev$/)
  const email = await page.getByLabel('E-mail').inputValue()
  await page.getByLabel('Observação do colecionador (opcional)').fill('Guardar isto')
  await connectWallet(page)

  await page.clock.fastForward('00:31')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page).toHaveURL(/\/login\?redirect=/)

  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('textbox', { name: /^Senha/ }).fill('Senha1234')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL('/checkout')
  await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue('Guardar isto')
  await expect(page.getByRole('combobox', { name: /^Rede/ })).toHaveValue('ethereum')
  // The connection itself is never restored.
  await expect(page.getByText('Desconectada', { exact: true })).toBeVisible()
})

test('another collector never sees the previous draft', async ({ page }) => {
  await signIn(page)
  await seedCartItem(page)
  await openCheckout(page)
  await page.getByLabel('Observação do colecionador (opcional)').fill('Rascunho privado')

  await signIn(page)
  await seedCartItem(page)
  await openCheckout(page)
  await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue('')
})
