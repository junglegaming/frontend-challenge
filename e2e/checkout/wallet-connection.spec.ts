import { expect, test } from '@playwright/test'
import { seedCartItem, selectScenario, signIn } from '../design-system/helpers'
import { connectWallet, createWalletViaApi, goToReview, openCheckout } from './checkout-helpers'

test('connects and disconnects the wallet; disconnected blocks the review', async ({ page }) => {
  await signIn(page)
  await createWalletViaApi(page)
  await seedCartItem(page)
  await openCheckout(page)

  await expect(page.getByRole('radio', { name: /Minha carteira/ })).toBeChecked()
  await connectWallet(page)
  await page.getByRole('button', { name: 'Desconectar' }).click()
  await expect(page.getByText('Desconectada', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByText('Conecte a carteira na rede escolhida para continuar.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Revise seu pedido' })).toHaveCount(0)

  await connectWallet(page)
  await goToReview(page)
})

test('shows the refusal when the wallet rejects the connection', async ({ page }) => {
  await signIn(page)
  await selectScenario(page, 'wallet-rejected')
  await createWalletViaApi(page)
  await seedCartItem(page)
  await openCheckout(page)

  await page.getByRole('combobox', { name: /^Rede/ }).selectOption('ethereum')
  await page.getByRole('button', { name: 'Conectar' }).click()
  await expect(page.getByText('A conexão foi recusada na carteira.')).toBeVisible()
  await expect(page.getByText('Recusada', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled()
})

test('flags a network the wallet does not support', async ({ page }) => {
  await signIn(page)
  await createWalletViaApi(page, ['ethereum'])
  await seedCartItem(page)
  await openCheckout(page)

  await page.getByRole('combobox', { name: /^Rede/ }).selectOption('polygon')
  await expect(page.getByText('Esta carteira não suporta a rede selecionada.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Conectar' })).toBeDisabled()
})

test('changing the network undoes the connection', async ({ page }) => {
  await signIn(page)
  await createWalletViaApi(page, ['ethereum', 'polygon'])
  await seedCartItem(page)
  await openCheckout(page)
  await connectWallet(page)
  await page.getByRole('combobox', { name: /^Rede/ }).selectOption('polygon')
  await expect(page.getByText('Desconectada', { exact: true })).toBeVisible()
})

test('a collector without wallets adds one on the page and uses it right away', async ({ page }) => {
  await signIn(page)
  await seedCartItem(page)
  await openCheckout(page)

  await page.getByRole('combobox', { name: /^Rede/ }).selectOption('ethereum')
  await page.getByLabel('Apelido da carteira').fill('Nova carteira')
  await page.getByLabel('Tipo de carteira').selectOption('metamask')
  await page.getByPlaceholder('Endereço 0x da carteira').fill(`0x${'4'.repeat(40)}`)
  await page.getByLabel('Ethereum').check()
  await page.getByRole('button', { name: 'Salvar carteira' }).click()

  await expect(page.getByRole('radio', { name: /Nova carteira/ })).toBeChecked()
  await page.getByRole('button', { name: 'Conectar' }).click()
  await expect(page.getByText('Conectada', { exact: true })).toBeVisible()
})
