import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, signIn, VIEWPORTS } from './helpers'

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    for (const route of ['/', '/nft/nft_001']) {
      test(`no horizontal scroll on ${route}`, async ({ page }) => {
        await page.goto(route)
        await expect(page.getByRole('main')).toBeVisible()
        expect(await hasNoHorizontalScroll(page)).toBe(true)
      })
    }

    test('profile: no horizontal scroll and correct navigation chrome', async ({ page }) => {
      await signIn(page)
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      const dock = page.getByRole('navigation', { name: 'Navegação rápida' })
      if (viewport.width < 768) await expect(dock).toBeVisible()
      else await expect(dock).toBeHidden()
      await expect(page).toHaveScreenshot(`profile-${viewport.width}.png`, { fullPage: true })
    })
  })
}

test.describe('dock', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test('has touch-sized targets and marks the current page', async ({ page }) => {
    await page.goto('/')
    const dock = page.getByRole('navigation', { name: 'Navegação rápida' })
    await expect(dock.locator('[aria-current="page"]')).toHaveText('Início')
    for (const item of await dock.locator('a, [aria-disabled="true"]').all()) {
      const box = await item.boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('does not cover the end of the page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('footer')).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const footer = await page.locator('footer').boundingBox()
    const dock = await page.getByRole('navigation', { name: 'Navegação rápida' }).boundingBox()
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(dock!.y + 1)
  })

  test('survives 200% zoom without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 195, height: 422 })
    await page.goto('/')
    expect(await hasNoHorizontalScroll(page)).toBe(true)
  })
})
