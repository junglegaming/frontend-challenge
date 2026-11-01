import { expect, test } from '@playwright/test'

test('catálogo: busca, filtros combinados e ordenação refletem na URL', async ({ page }) => {
  await page.goto('/')

  await page.getByPlaceholder('Buscar NFTs').fill('ape')
  await page.waitForURL(/q=ape/)
  await expect(page.getByRole('link', { name: /Emerald Ape/i }).first()).toBeVisible()

  await page.getByRole('radio', { name: /Arte digital/ }).check()
  await page.waitForURL(/collection=/)
  // Filtros combináveis: coleção + rede ao mesmo tempo.
  await page.getByRole('radio', { name: /Polygon/ }).check()
  await page.waitForURL(/network=Polygon/)
  await expect(page).toHaveURL(/collection=/)

  await page.getByRole('button', { name: 'Listados recentemente' }).click()
  await page.getByRole('option', { name: 'Menor preço' }).click()
  await page.waitForURL(/sort=price_asc/)

  await page.reload()
  await expect(page.getByPlaceholder('Buscar NFTs')).toHaveValue('ape')
  await expect(page.getByRole('button', { name: 'Menor preço' })).toBeVisible()
})

test('catálogo: busca desktop visível e URL padrão limpa', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByPlaceholder('Buscar NFTs')).toBeVisible()

  await page.goto('/?page=2')
  await page.getByRole('link', { name: 'Início' }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL((url) => url.pathname === '/' && url.search === '')
})

test('catálogo: limpar filtros remove os parâmetros da URL', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: /Arte digital/ }).check()
  await page.waitForURL(/collection=/)

  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page).toHaveURL((url) => !url.searchParams.has('collection'))
})

test('catálogo: aba ativa da ordenação acompanha o filtro', async ({ page }) => {
  await page.goto('/')
  const tabs = page.locator('nav[aria-label="Abas do catálogo"]')
  const all = tabs.getByRole('button', { name: 'Todos os NFTs' })
  const newest = tabs.getByRole('button', { name: 'Novos lançamentos' })

  await newest.click()
  await expect(newest).toHaveAttribute('aria-pressed', 'true')
  await expect(all).toHaveAttribute('aria-pressed', 'false')
})

test('catálogo: parâmetros inválidos não derrubam a tela', async ({ page }) => {
  await page.goto('/?network=Bitcoin&page=abc&priceMin=abc')
  await expect(page.getByText('Something went wrong!')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Emerald Ape/i }).first()).toBeVisible()
})

test('detalhe: miniaturas trocam a arte principal', async ({ page }) => {
  await page.goto('/nft/nft-1')
  const main = page.getByAltText('Arte digital de Emerald Ape #042')
  await expect(main).toHaveAttribute('src', /Frame-136/)

  await page.getByRole('button', { name: 'Visualizar miniatura 2' }).click()
  await expect(main).toHaveAttribute('src', /NFT-Artwork-05/)
})

test('catálogo: mudar filtro reinicia a paginação', async ({ page }) => {
  await page.goto('/?page=2')
  await expect(
    page.getByRole('link', { name: /Emerald Ape|Genesis|Ape|Drop/i }).first(),
  ).toBeVisible()
  await page.getByRole('radio', { name: /Ethereum/ }).check()
  await page.waitForURL(/network=Ethereum/)
  await expect(page).not.toHaveURL(/page=/)
})

test('rota inexistente exibe a página 404 com retorno ao catálogo', async ({ page }) => {
  await page.goto('/rota-que-nao-existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
  await expect(page).toHaveURL(/\/(\?.*)?$/)
})

test('catálogo: paginação altera a URL e o histórico restaura', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Próxima' }).click()
  await page.waitForURL(/page=2/)

  await page.goBack()
  await expect(page).toHaveURL((url) => url.pathname === '/' && url.search === '')
})

test('detalhe: acesso direto e NFT inexistente', async ({ page }) => {
  await page.goto('/nft/nft-1')
  await expect(page.getByRole('heading', { name: /Emerald Ape/i })).toBeVisible({ timeout: 10_000 })

  await page.goto('/nft/nao-existe')
  await expect(page.getByText('NFT não encontrado')).toBeVisible({ timeout: 10_000 })
})

test('mobile: trava scroll do body quando menu de filtros estiver aberto', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')

  const initialOverflow = await page.evaluate(() => document.body.style.overflow)
  expect(initialOverflow).not.toBe('hidden')

  await page.getByLabel('Abrir filtros').click()
  await expect(page.getByRole('dialog', { name: 'Filtros de coleções e redes' })).toBeVisible()

  const lockedOverflow = await page.evaluate(() => document.body.style.overflow)
  expect(lockedOverflow).toBe('hidden')

  await page.getByLabel('Fechar filtros').click()
  await expect(page.getByRole('dialog', { name: 'Filtros de coleções e redes' })).not.toBeVisible()

  const restoredOverflow = await page.evaluate(() => document.body.style.overflow)
  expect(restoredOverflow).toBe(initialOverflow)
})

test('mobile: detalhes do NFT não possui scroll de página', async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 896 })
  await page.goto('/nft/nft-1')
  await expect(page.getByRole('heading', { name: /Emerald Ape/i })).toBeVisible({ timeout: 10_000 })

  const isScrollable = await page.evaluate(() => {
    return document.documentElement.scrollHeight > window.innerHeight
  })
  expect(isScrollable).toBe(false)
})
