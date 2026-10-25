import { ALICE, addToCart, expect, login, test } from './fixtures'

test('quantidades, remoção, cupom e persistência após refresh e login', async ({ page }) => {
  await addToCart(page, 'emerald-ape-042')
  const summary = page.getByRole('region', { name: /Resumo/ }).or(page.locator('[aria-labelledby="cart-summary-heading"]')).first()
  await expect(summary).toContainText('1.206 ETH')

  await page.getByRole('button', { name: /Aumentar quantidade de Emerald Ape/ }).filter({ visible: true }).first().click()
  await expect(summary).toContainText('2.396 ETH')

  const coupon = page.getByPlaceholder('Digite o código promocional…').filter({ visible: true }).first()
  await coupon.fill('NADA')
  await page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true }).first().click()
  await expect(page.getByText('Cupom inválido')).toBeVisible()
  await coupon.fill('EXPIRADO')
  await page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true }).first().click()
  await expect(page.getByText('Cupom expirado')).toBeVisible()
  await coupon.fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true }).first().click()
  await expect(summary).toContainText('2.158 ETH')

  await page.reload()
  await expect(summary).toContainText('2.158 ETH')

  // visitante → login: itens preservados
  await login(page, ALICE, '/cart')
  await expect(page.getByText('Emerald Ape #042').filter({ visible: true }).first()).toBeVisible()
  await expect(summary).toContainText('2.158 ETH')

  await page.getByRole('button', { name: /Remover Emerald Ape #042 do carrinho/ }).filter({ visible: true }).first().click()
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
})
