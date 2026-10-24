import { expect, test } from '@playwright/test'
import { signIn, VIEWPORTS } from './helpers'

test.use({ viewport: VIEWPORTS.desktop })

const ROUTES = ['/', '/nft/nft_001', '/rota-inexistente']

for (const route of ROUTES) {
  test(`same navbar on ${route}`, async ({ page }) => {
    await page.goto(route)
    const nav = page.getByRole('navigation', { name: 'Principal' })
    await expect(nav).toBeVisible()
    await expect(nav.getByText('Início')).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Mercado' })).toHaveAttribute('href', '/market')
    await expect(page.getByRole('link', { name: 'Kurio, página inicial' })).toBeVisible()
  })
}

test('current item is marked only on the home route', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Principal' }).locator('[aria-current="page"]')).toHaveText('Início')
  await page.goto('/nft/nft_001')
  await expect(page.getByRole('navigation', { name: 'Principal' }).locator('[aria-current="page"]')).toHaveCount(0)
})

test('signed-in navbar exposes the account link', async ({ page }) => {
  await signIn(page)
  await expect(page.getByRole('link', { name: /Conta de/ })).toBeVisible()
})
