import { expect, test } from '@playwright/test'
import { signIn, VIEWPORTS } from './helpers'

test.use({ viewport: VIEWPORTS.desktop })

test('profile screen matches the visual baseline at 1440 px', async ({ page }) => {
  await signIn(page)
  await expect(page.getByRole('main').getByRole('navigation', { name: 'Minha conta' })).toBeVisible()
  await expect(page).toHaveScreenshot('profile-1440.png', { fullPage: true })
})
