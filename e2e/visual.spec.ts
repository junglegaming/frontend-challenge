import { ALICE, addToCart, expect, login, test } from './fixtures'

// Dados determinísticos (seed fixa do mock), relógio fixo e toasts mascarados.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-25T12:00:00-03:00'))
})

const mask = (page: import('@playwright/test').Page) => [page.locator('[data-sonner-toaster]')]

test('início', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#catalogo').getByRole('article')).toHaveCount(9)
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('inicio.png', { fullPage: true, mask: mask(page) })
})

test('detalhe', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true, mask: mask(page) })
})

test('carrinho', async ({ page }) => {
  await addToCart(page)
  await expect(page.getByText('1.206 ETH').filter({ visible: true }).first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true, mask: mask(page) })
})

test('pagamento', async ({ page }) => {
  await addToCart(page)
  await login(page, ALICE, '/checkout')
  await expect(page.getByRole('heading', { name: 'Carteira e rede' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true, mask: mask(page) })
})
