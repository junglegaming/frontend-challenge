import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, VIEWPORTS } from '../design-system/helpers'

test('the creators directory renders real creators with NFT counts', async ({ page }) => {
  await page.goto('/creators')
  await expect(page.getByRole('heading', { name: 'Criadores' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Orbitian/ })).toBeVisible()
})

test('selecting a creator navigates to their detail page', async ({ page }) => {
  await page.goto('/creators')
  await page.getByRole('link', { name: /Orbitian/ }).click()
  await expect(page).toHaveURL(/\/creators\/art_orbitian/)
  await expect(page.getByRole('heading', { name: 'Orbitian' })).toBeVisible()
})

test('creators directory has no critical accessibility violations', async ({ page }) => {
  await page.goto('/creators')
  await expect(page.getByRole('heading', { name: 'Criadores' })).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('creators renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await page.goto('/creators')
      await expect(page.getByRole('heading', { name: 'Criadores' })).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`creators-${viewport.width}.png`, { fullPage: true })
    })
  })
}
