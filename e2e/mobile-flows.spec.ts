import { expect, test } from '@playwright/test'

import { addToCartAndOpenCart, login } from './support/helpers'

test.describe('mobile: cobertura funcional', () => {
  test('catálogo: busca, filtros, limpeza e paginação', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByPlaceholder('Explorar coleções')).toBeVisible()

    await page.getByPlaceholder('Explorar coleções').fill('ape')
    await page.waitForURL(/q=ape/)
    await expect(page.getByRole('link', { name: /Ape/i }).first()).toBeVisible()

    await page.getByLabel('Abrir filtros').click()
    const filters = page.getByRole('dialog', { name: 'Filtros de coleções e redes' })
    await expect(filters).toBeVisible()
    await filters.getByRole('radio', { name: /Arte digital/ }).check()
    await page.waitForURL(/collection=Arte\+digital/)
    await filters.getByRole('button', { name: 'Ver resultados' }).click()

    await page.getByLabel('Abrir filtros').click()
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(page).toHaveURL((url) => !url.searchParams.has('collection'))
    await filters.getByRole('button', { name: 'Ver resultados' }).click()

    await page.goto('/')
    await page.getByRole('button', { name: 'Próxima' }).click()
    await page.waitForURL(/page=2/)
  })

  test('detalhe: acesso, edição esgotada e NFT inexistente', async ({ page }) => {
    await page.goto('/nft/nft-1')
    await expect(page.getByRole('heading', { name: /Emerald Ape/i })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByRole('button', { name: '1/1 (esgotada)' }).first()).toBeDisabled()

    await page.goto('/nft/nao-existe')
    await expect(page.getByText('NFT não encontrado')).toBeVisible({ timeout: 10_000 })
  })

  test('conta: login, perfil e logout em mobile', async ({ page }) => {
    await login(page)
    await page.goto('/perfil')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()

    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: 'Sair' }).click()
    expect(await page.evaluate(() => localStorage.getItem('kurio:token'))).toBeNull()
  })

  test('favoritos: persistem após refresh em mobile', async ({ page }) => {
    await login(page)
    await page.goto('/nft/nft-1')

    const favorite = page
      .getByRole('button', { name: /Adicionar aos favoritos|Favoritar/ })
      .filter({ visible: true })
      .first()
    await favorite.click()

    const unfavorite = page
      .getByRole('button', { name: /Remover dos favoritos|Remover .* dos favoritos/ })
      .filter({ visible: true })
      .first()
    await expect(unfavorite).toBeVisible()
    await page.reload()
    await expect(unfavorite).toBeVisible()
  })

  test('carrinho: quantidade, cupom e remoção em mobile', async ({ page }) => {
    await login(page)
    await addToCartAndOpenCart(page)

    const increase = page
      .getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' })
      .filter({ visible: true })
      .first()
    await increase.click()
    await expect(
      page
        .getByText(/2\.38 ETH/)
        .filter({ visible: true })
        .first(),
    ).toBeVisible()

    const coupon = page.locator('input[aria-label="Código promocional"]').filter({ visible: true })
    await coupon.fill('KURIO10')
    await page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true }).first().click()
    await expect(page.getByText('KURIO10').filter({ visible: true }).first()).toBeVisible()

    await page
      .getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' })
      .filter({ visible: true })
      .first()
      .click()
    await expect(
      page.getByText('Seu carrinho está vazio').filter({ visible: true }).first(),
    ).toBeVisible({
      timeout: 10_000,
    })
  })

  test('perfil e carteira: criação e persistência em mobile', async ({ page }) => {
    await login(page, 'bruno')
    await page.goto('/perfil')
    await page.locator('#name').fill('Bruno Mobile')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: /Dados atualizados/ })
        .first(),
    ).toBeVisible()

    await page.goto('/carteiras')
    await page.locator('#walletAlias').fill('Principal')
    await page.locator('#walletAddress').fill('0x3333333333333333333333333333333333333333')
    await page.locator('#referralCode').fill('BRUNO03')
    await page.locator('#ensName').fill('bruno-mobile')
    await page.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText(/Carteira salva/).first()).toBeVisible()

    await page.reload()
    await expect(page.locator('#walletAlias')).toHaveValue('Principal')
  })

  test('cenários: skeleton de carregamento em mobile', async ({ page }) => {
    await page.goto('/?scenario=slow')
    await expect(page.getByRole('status', { name: 'Carregando catálogo' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Emerald Ape/i }).first()).toBeVisible({
      timeout: 10_000,
    })
  })
})
