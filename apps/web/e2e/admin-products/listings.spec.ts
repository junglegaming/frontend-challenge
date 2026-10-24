import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, promoteCurrentUserToAdmin, runAxe, signIn, VIEWPORTS } from '../design-system/helpers'

async function goToAdminProducts(page: import('@playwright/test').Page) {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)
  await page.goto('/admin/products')
}

test('creating a listing publishes it to the public catalog', async ({ page }) => {
  await goToAdminProducts(page)
  const form = page.locator('form')

  await form.getByLabel('Nome do NFT').fill('Teste Admin NFT')
  await form.getByLabel('Coleção').fill('Coleção de Teste')
  await form.locator('textarea').fill('Uma obra criada via painel administrativo.')
  await form.getByLabel('Imagem (URL)').fill('/art/nft-001-1.svg')
  await form.getByLabel('Preço (ETH)').fill('0.42')
  await form.getByLabel('Estoque').fill('10')
  await form.getByLabel('Limite por pedido').fill('2')
  await form.getByRole('button', { name: 'Criar anúncio' }).click()

  await expect(page.getByText('Teste Admin NFT', { exact: true })).toBeVisible()

  await page.goto('/?q=Teste Admin NFT')
  await expect(page.getByText('Teste Admin NFT', { exact: true })).toBeVisible()
})

test('editing an edition updates the public catalog without a manual refresh', async ({ page }) => {
  await goToAdminProducts(page)
  const list = page.getByRole('list', { name: 'Anúncios do catálogo' })
  const priceInput = list.getByLabel(/Preço de/).first()
  await priceInput.fill('9.99')
  await list.getByRole('button', { name: 'Salvar' }).first().click()
  await expect(page.getByText('Edição atualizada.')).toBeVisible()
})

test('delisting a listing removes it from the public catalog', async ({ page }) => {
  await goToAdminProducts(page)
  const form = page.locator('form')
  await form.getByLabel('Nome do NFT').fill('Anúncio Temporário')
  await form.getByLabel('Coleção').fill('Temp')
  await form.locator('textarea').fill('Será removido.')
  await form.getByLabel('Imagem (URL)').fill('/art/nft-001-1.svg')
  await form.getByLabel('Preço (ETH)').fill('0.1')
  await form.getByLabel('Estoque').fill('5')
  await form.getByLabel('Limite por pedido').fill('1')
  await form.getByRole('button', { name: 'Criar anúncio' }).click()
  await expect(page.getByText('Anúncio Temporário', { exact: true })).toBeVisible()

  const list = page.getByRole('list', { name: 'Anúncios do catálogo' })
  const row = list.locator('li', { hasText: 'Anúncio Temporário' })
  await row.getByRole('button', { name: 'Remover da vitrine' }).click()
  await expect(page.getByText('removido da vitrine')).toBeVisible()

  await page.goto('/?q=Anúncio Temporário')
  await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
})

test('admin-products has no critical accessibility violations', async ({ page }) => {
  await goToAdminProducts(page)
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('admin products renders without horizontal scroll', async ({ page }) => {
      await goToAdminProducts(page)
      expect(await hasNoHorizontalScroll(page)).toBe(true)
    })
  })
}
