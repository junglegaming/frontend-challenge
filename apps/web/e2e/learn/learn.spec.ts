import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, VIEWPORTS } from '../design-system/helpers'

test('the learn list renders the seeded articles', async ({ page }) => {
  await page.goto('/learn')
  await expect(page.getByRole('heading', { name: 'Aprenda' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'O que são NFTs?' })).toBeVisible()
})

test('selecting an article navigates to its full content', async ({ page }) => {
  await page.goto('/learn')
  await page.getByRole('link', { name: /O que são NFTs\?/ }).click()
  await expect(page).toHaveURL('/learn/o-que-sao-nfts')
  await expect(page.getByRole('heading', { name: 'O que são NFTs?' })).toBeVisible()
  await expect(page.getByText(/token não-fungível/)).toBeVisible()
})

test('shows a not-found state for an unknown slug', async ({ page }) => {
  await page.goto('/learn/does-not-exist')
  await expect(page.getByText('Artigo não encontrado')).toBeVisible()
  await page.getByRole('link', { name: 'Voltar para Aprenda' }).click()
  await expect(page).toHaveURL('/learn')
})

test('learn has no critical accessibility violations', async ({ page }) => {
  await page.goto('/learn')
  await expect(page.getByRole('heading', { name: 'Aprenda' })).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('learn renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await page.goto('/learn')
      await expect(page.getByRole('heading', { name: 'Aprenda' })).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`learn-${viewport.width}.png`, { fullPage: true })
    })
  })
}
