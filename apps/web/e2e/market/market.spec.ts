import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, VIEWPORTS } from '../design-system/helpers'

test('selecting a category tile narrows the catalog by that category', async ({ page }) => {
  await page.goto('/market')
  await expect(page.getByRole('heading', { name: 'Mercado' })).toBeVisible()

  await page.getByRole('list').getByRole('link', { name: 'Arte' }).click()
  await expect(page).toHaveURL(/category/)
  expect(decodeURIComponent(page.url())).toContain('"art"')
})

test('the trending rail renders real NFTs linking to their detail page', async ({ page }) => {
  await page.goto('/market')
  const trending = page.getByRole('region', { name: 'Em alta' })
  await expect(trending).toBeVisible()
  await expect(trending.getByRole('link').first()).toBeVisible()
})

test('market has no critical accessibility violations', async ({ page }) => {
  await page.goto('/market')
  await expect(page.getByRole('heading', { name: 'Mercado' })).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('market renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await page.goto('/market')
      await expect(page.getByRole('heading', { name: 'Mercado' })).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`market-${viewport.width}.png`, { fullPage: true })
    })
  })
}
