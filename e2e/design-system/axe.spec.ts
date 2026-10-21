import { expect, test } from '@playwright/test'
import { runAxe, signIn, VIEWPORTS } from './helpers'

test.use({ viewport: VIEWPORTS.desktop })

test('home has no critical or serious accessibility violations', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

test('NFT detail has no critical or serious accessibility violations', async ({ page }) => {
  await page.goto('/nft/nft_001')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  expect(await runAxe(page)).toEqual([])
})

test('profile has no critical or serious accessibility violations', async ({ page }) => {
  await signIn(page)
  expect(await runAxe(page)).toEqual([])
})
