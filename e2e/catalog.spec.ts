import { expect, test } from './fixtures'

test.describe('catálogo', () => {
  test('busca, filtros combinados, ordenação, paginação e histórico', async ({ page, isMobile }) => {
    test.skip(isMobile, 'filtros laterais e ordenação são do layout desktop; mobile coberto abaixo')
    await page.goto('/')
    const grid = page.locator('#catalogo')
    await expect(grid.getByRole('article').first()).toBeVisible()

    // paginação
    await page.getByRole('link', { name: 'Página 2' }).or(page.getByRole('button', { name: 'Página 2' })).click()
    await expect(page).toHaveURL(/page=2/)

    // filtro combinado reinicia a paginação
    const filters = page.getByRole('complementary', { name: 'Filtros do catálogo' })
    await filters.getByRole('button', { name: 'Arte digital' }).click()
    await expect(page).toHaveURL(/collections=.*digital-art/)
    await expect(page).not.toHaveURL(/page=/)
    await filters.getByRole('button', { name: 'Ethereum' }).click()
    await expect(page).toHaveURL(/networks=.*ethereum/)
    await expect(filters.getByRole('button', { name: 'Arte digital' })).toHaveAttribute('aria-pressed', 'true')

    // ordenação
    await page.getByRole('combobox').filter({ visible: true }).first().click()
    await page.getByRole('option', { name: 'Maior preço' }).click()
    await expect(page).toHaveURL(/sort=price-desc/)

    // busca: a lupa do header abre o campo; buscar fora da home leva ao catálogo filtrado
    await page.goto('/cart')
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()
    await page.getByLabel('Buscar coleções').fill('golden')
    await expect(page).toHaveURL(/\/\?q=golden/)
    await expect(page).toHaveURL(/q=golden/)
    await expect(grid.getByRole('article').first()).toContainText(/Golden/i)
    for (const name of await grid.getByRole('article').getByRole('heading').allInnerTexts()) expect(name).toMatch(/golden/i)

    // histórico: voltar restaura o estado anterior, refresh mantém
    await page.getByLabel('Buscar coleções').fill('')
    await expect(page).not.toHaveURL(/q=/)
    const sidebar = page.getByRole('complementary', { name: 'Filtros do catálogo' })
    await sidebar.getByRole('button', { name: 'Música' }).click()
    await expect(page).toHaveURL(/collections=.*music/)
    await sidebar.getByRole('button', { name: 'Jogos' }).click()
    await expect(page).toHaveURL(/collections=.*games/)
    await page.goBack()
    await expect(page).toHaveURL(/collections=.*music/)
    await expect(page).not.toHaveURL(/games/)
    await page.reload()
    await expect(page.getByRole('complementary', { name: 'Filtros do catálogo' }).getByRole('button', { name: 'Música' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('mobile: busca e filtros no sheet', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'somente mobile')
    await page.goto('/')
    await page.locator('#catalog-search').fill('nomad')
    await expect(page).toHaveURL(/q=nomad/)
    await page.getByRole('button', { name: /abrir filtros/i }).click()
    const sheet = page.getByRole('dialog')
    await sheet.getByRole('button', { name: 'Polygon' }).click()
    await expect(page).toHaveURL(/networks=.*polygon/)
  })

  test('resultado vazio e limpar filtros', async ({ page }) => {
    await page.goto('/?q=nada-existe-aqui')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(page).not.toHaveURL(/q=/)
    await expect(page.locator('#catalogo').getByRole('article').first()).toBeVisible()
  })
})

test.describe('respostas fora de ordem', () => {
  test.use({ scenario: 'out-of-order' })
  test('a resposta antiga não sobrescreve a busca atual', async ({ page }) => {
    await page.goto('/?q=sage')
    await page.goto('/?q=golden')
    await page.waitForTimeout(2500)
    const names = await page.locator('#catalogo').getByRole('article').getByRole('heading').allInnerTexts()
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) expect(name).toMatch(/golden/i)
  })
})
