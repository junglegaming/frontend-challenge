import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, seedCartItem, signIn, VIEWPORTS } from '../design-system/helpers'

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
