import { ALICE, addToCart, expect, goToReview, login, serverOrders, test } from './fixtures'

test('compra completa do catálogo ao recibo confirmado', async ({ page }) => {
  await page.goto('/')
  await page.locator('#catalogo').getByRole('link', { name: 'Emerald Ape #042', exact: true }).click()
  await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)
  await page.getByRole('button', { name: /^comprar( nft)?$/i }).filter({ visible: true }).first().click()
  await page.waitForURL('**/cart')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL(/\/\?auth=login&redirect=%2Fcheckout/)
  await page.getByLabel('E-mail', { exact: true }).fill(ALICE.email)
  await page.getByLabel('Senha', { exact: true }).fill(ALICE.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL('**/checkout')

  await goToReview(page)
  await expect(page.getByText('1.206 ETH').first()).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page).toHaveURL(/\/orders\/ord_/)
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Emerald Ape #042').first()).toBeVisible()
  await expect(page.getByText('1.206 ETH').first()).toBeVisible()
  expect(await serverOrders(page)).toEqual(['confirmed'])

  // carrinho perde apenas o que foi comprado; recibo é snapshot e sobrevive a mudança de preço
  const url = page.url()
  await page.evaluate(() => window.__kurioMock?.changePrice('emerald-ape-042', '1/50', '9.99'))
  await page.goto(url)
  await expect(page.getByText('1.206 ETH').first()).toBeVisible()
  await page.goto('/cart')
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
})

test('bob sem carteiras é levado ao cadastro de carteira', async ({ page }) => {
  await addToCart(page)
  await login(page, { email: 'bob@kurio.dev', password: 'Kurio@123', name: 'Bob' }, '/checkout')
  await expect(page.getByRole('link', { name: /carteira/i }).filter({ visible: true }).first()).toHaveAttribute('href', /\/wallets\?redirect=%2Fcheckout/)
})
