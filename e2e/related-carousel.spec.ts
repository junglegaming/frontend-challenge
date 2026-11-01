import { expect, test } from '@playwright/test'

/**
 * Regressão: as bolinhas do carrossel de relacionados precisam trocar a página
 * de cards, não apenas a bolinha ativa.
 */
test.describe('relacionados: paginação por bolinhas', () => {
  test('detalhe do NFT troca os cards ao trocar de página', async ({ page }) => {
    await page.goto('/nft/nft-1')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })

    const section = page.getByRole('region', { name: 'Mais desta coleção' })
    const cards = section.locator('a[href^="/nft/"]')
    await expect(cards).toHaveCount(5)

    const firstPage = await cards.allTextContents()

    await section.getByRole('button', { name: 'Ir para a página 2 de 3' }).click()
    await expect(cards.first()).not.toHaveText(firstPage[0] ?? '')
    const secondPage = await cards.allTextContents()
    expect(secondPage).not.toEqual(firstPage)

    await section.getByRole('button', { name: 'Ir para a página 3 de 3' }).click()
    await expect(cards.first()).not.toHaveText(secondPage[0] ?? '')
  })

  test('carrinho troca os cards ao trocar de página', async ({ page }) => {
    await page.goto('/carrinho')

    const section = page.getByRole('region', { name: 'Colecionadores também viram' })
    await expect(section.getByRole('heading', { name: 'Colecionadores também viram' })).toBeVisible(
      { timeout: 10_000 },
    )

    const cards = section.locator('a[href^="/nft/"]')
    await expect(cards).toHaveCount(5)

    const firstPage = await cards.allTextContents()

    await section.getByRole('button', { name: 'Ir para a página 2 de 3' }).click()
    await expect(cards.first()).not.toHaveText(firstPage[0] ?? '')
    expect(await cards.allTextContents()).not.toEqual(firstPage)
  })
})
