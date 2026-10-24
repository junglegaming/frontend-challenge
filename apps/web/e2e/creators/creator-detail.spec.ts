import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, VIEWPORTS } from '../design-system/helpers'

test('shows the creator bio and their NFT grid', async ({ page }) => {
  await page.goto('/creators/art_orbitian')
  await expect(page.getByRole('heading', { name: 'Orbitian' })).toBeVisible()
  await expect(page.getByText(/é um dos criadores da Kurio/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'NFTs deste criador' })).toBeVisible()
})

test('shows a not-found state for an unknown creator id', async ({ page }) => {
  await page.goto('/creators/does-not-exist')
  await expect(page.getByText('Criador não encontrado')).toBeVisible()
  await page.getByRole('link', { name: 'Voltar para Criadores' }).click()
  await expect(page).toHaveURL('/creators')
})

test('creator detail has no critical accessibility violations', async ({ page }) => {
  await page.goto('/creators/art_orbitian')
  await expect(page.getByRole('heading', { name: 'Orbitian' })).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('creator detail renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await page.goto('/creators/art_orbitian')
      await expect(page.getByRole('heading', { name: 'Orbitian' })).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`creator-detail-${viewport.width}.png`, { fullPage: true })
    })
  })
}
