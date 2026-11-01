import { expect, test } from '@playwright/test'

test('início: carrega o catálogo com os mocks', async ({ page }) => {
  await page.goto('/')

  // Hero desktop e mobile têm títulos diferentes no Figma.
  await expect(
    page
      .getByRole('heading', { name: /SEJA DONO D(O FUTURO|A CULTURA)/i })
      .filter({ visible: true }),
  ).toBeVisible()
  await expect(
    page
      .getByRole('link', { name: /Emerald Ape/i })
      .filter({ visible: true })
      .first(),
  ).toBeVisible({ timeout: 10_000 })
})
