import { expect, test } from '@playwright/test'

test.describe('footer: envio de email e tratamento de erros da newsletter', () => {
  test.beforeEach(async ({ page }) => {
    // Definir viewport desktop para o footer completo ficar visível
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
  })

  test('tablet: benefícios e newsletter em grade de duas colunas', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 })
    await page.goto('/')
    await expect(page.locator('footer')).toBeVisible()

    // Colunas visíveis do bloco W / C / D / Newsletter.
    const columns = await page.evaluate(() => {
      const grid = Array.from(document.querySelectorAll('div')).find(
        (element) =>
          element.className.includes('md:grid-cols-2') && element.className.includes('lg:flex'),
      )
      if (!grid) return null
      return Array.from(grid.children)
        .filter((element) => getComputedStyle(element).display !== 'none')
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return { x: rect.x, y: rect.y }
        })
    })

    expect(columns).not.toBeNull()
    if (!columns) return
    expect(columns).toHaveLength(4)

    const [wallet, creators, alerts, newsletter] = columns
    // W e C na primeira linha; D e Newsletter na segunda, em duas colunas.
    expect(wallet.y).toBe(creators.y)
    expect(alerts.y).toBe(newsletter.y)
    expect(creators.x).toBeGreaterThan(wallet.x)
    expect(newsletter.x).toBeGreaterThan(alerts.x)
    expect(alerts.y).toBeGreaterThan(wallet.y)

    const footer = await page.locator('footer').boundingBox()
    expect(footer?.height ?? 0).toBeLessThan(1_400)
  })

  test('exibe erro ao tentar enviar email vazio', async ({ page }) => {
    const input = page.getByLabel('Assinar newsletter')
    const button = page.getByRole('button', { name: 'Enviar' })

    await expect(input).toBeVisible()
    await input.fill('')
    await button.click()

    await expect(page.locator('#newsletter-error')).toBeVisible()
    await expect(page.locator('#newsletter-error')).toContainText('Por favor, digite seu e-mail')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  test('exibe erro ao tentar enviar formato de email inválido', async ({ page }) => {
    const input = page.getByLabel('Assinar newsletter')
    const button = page.getByRole('button', { name: 'Enviar' })

    await input.fill('emailinvalido')
    await button.click()

    await expect(page.locator('#newsletter-error')).toBeVisible()
    await expect(page.locator('#newsletter-error')).toContainText(
      'Insira um endereço de e-mail válido',
    )
  })

  test('exibe erro quando o servidor retorna erro interno (500)', async ({ page }) => {
    const input = page.getByLabel('Assinar newsletter')
    const button = page.getByRole('button', { name: 'Enviar' })

    await input.fill('erro@kurio.test')
    await button.click()

    await expect(page.locator('#newsletter-error')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('#newsletter-error')).toContainText(
      'Não foi possível registrar o e-mail no momento',
    )
  })

  test('exibe erro quando o e-mail já está cadastrado (409)', async ({ page }) => {
    const input = page.getByLabel('Assinar newsletter')
    const button = page.getByRole('button', { name: 'Enviar' })

    await input.fill('duplicado@kurio.test')
    await button.click()

    await expect(page.locator('#newsletter-error')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('#newsletter-error')).toContainText('Este e-mail já está cadastrado')
  })

  test('exibe sucesso e limpa o campo ao enviar e-mail válido', async ({ page }) => {
    const input = page.getByLabel('Assinar newsletter')
    const button = page.getByRole('button', { name: 'Enviar' })

    await input.fill('novousuario@exemplo.com')
    await button.click()

    await expect(page.locator('#newsletter-success')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('#newsletter-success')).toContainText(
      'Inscrição realizada com sucesso',
    )
    await expect(input).toHaveValue('')
  })
})
