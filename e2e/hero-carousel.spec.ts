import { expect, test } from '@playwright/test'

test.describe('hero: carrossel e bolinhas (elipses) de criadores', () => {
  test('desktop: clicar nas bolinhas alterna os criadores e obras em destaque', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const tablist = page.locator('section[aria-labelledby="hero-title"] [role="tablist"]')
    await expect(tablist).toBeVisible()

    const tabs = tablist.getByRole('tab')
    await expect(tabs).toHaveCount(3)

    // Slide 1 inicial ativo
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#hero-title')).toContainText('SEJA DONO DO FUTURO')
    await expect(
      page.locator('section[aria-labelledby="hero-title"] img[alt*="Emerald Ape"]'),
    ).toBeVisible()

    // Clicar na 2ª bolinha (elipse 2)
    await tabs.nth(1).click()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false')
    await expect(page.locator('#hero-title')).toContainText('COLECIONE OBRAS')
    await expect(
      page.locator('section[aria-labelledby="hero-title"] img[alt*="Sage Nomad"]'),
    ).toBeVisible()

    // Clicar na 3ª bolinha (elipse 3)
    await tabs.nth(2).click()
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#hero-title')).toContainText('ARTE DIGITAL RARA')
    await expect(
      page.locator('section[aria-labelledby="hero-title"] img[alt*="Solace in Motion"]'),
    ).toBeVisible()

    // Clicar de volta na 1ª bolinha
    await tabs.nth(0).click()
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#hero-title')).toContainText('SEJA DONO DO FUTURO')
  })

  test('mobile: clicar nas bolinhas alterna os criadores do banner mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const tablist = page.locator('section[aria-labelledby="mobile-hero-title"] [role="tablist"]')
    await expect(tablist).toBeVisible()

    const tabs = tablist.getByRole('tab')
    await expect(tabs).toHaveCount(3)

    // Slide 1 inicial ativo no mobile
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#mobile-hero-title')).toContainText('SEJA DONO DA')

    // Clicar na 2ª bolinha
    await tabs.nth(1).click()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#mobile-hero-title')).toContainText('CRIADORES EM')

    // Clicar na 3ª bolinha
    await tabs.nth(2).click()
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#mobile-hero-title')).toContainText('EDIÇÕES RARAS')

    // Clicar de volta na 1ª bolinha
    await tabs.nth(0).click()
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#mobile-hero-title')).toContainText('SEJA DONO DA')
  })
})
