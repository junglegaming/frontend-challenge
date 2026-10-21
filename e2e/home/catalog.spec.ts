import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, VIEWPORTS } from '../design-system/helpers'

test('filtering by collection resets to page 1 and narrows the grid', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Seja dono do futuro da arte digital' })).toBeVisible()
  await page.getByRole('button', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)

  await page.getByLabel('Arte', { exact: true }).check()
  await expect(page).toHaveURL(/category/)
  expect(decodeURIComponent(page.url())).toContain('"art"')
  await expect(page).not.toHaveURL(/page=2/)
})

test('changing the sort order updates the catalog query', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('combobox', { name: 'Ordenar por' }).selectOption('price_asc')
  await expect(page).toHaveURL(/sort=price_asc/)
})

test('a filter combination with no matches shows the empty state', async ({ page }) => {
  await page.goto('/?minPrice=999&maxPrice=999')
  await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page).toHaveURL('/')
})

test('catalog has no critical accessibility violations', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('home renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`home-${viewport.width}.png`, { fullPage: true })
    })
  })
}
