import { expect, test } from '@playwright/test'

import { addToCartAndOpenCart, login } from './support/helpers'

test('carrinho: adiciona item pelo detalhe e exibe no carrinho', async ({ page }) => {
  await page.goto('/')

  await page
    .getByRole('link', { name: /Emerald Ape/i })
    .first()
    .click()
  await expect(page.getByRole('heading', { name: /Emerald Ape/i })).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: 'Comprar' }).click()

  await expect(page).toHaveURL(/\/carrinho/)
  await expect(page.getByText(/Emerald Ape/i).first()).toBeVisible({ timeout: 10_000 })
})

test('carrinho mobile: modo de exclusão e exclusão de itens', async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 896 })
  await page.goto('/nft/nft-1')
  await page.getByRole('button', { name: 'Comprar NFT' }).first().click()
  await expect(page).toHaveURL(/\/carrinho/)
  await expect(page.locator('.md\\:hidden').getByText(/Emerald Ape/i)).toBeVisible({
    timeout: 10_000,
  })

  // Ativar modo de exclusão
  const toggleBtn = page.getByRole('button', { name: /Ativar modo de exclusão|Excluir/i }).first()
  await expect(toggleBtn).toBeVisible()
  await toggleBtn.click()

  await expect(page.getByText('Modo de exclusão ativo')).toBeVisible()
  const deleteBtn = page.getByRole('button', { name: /Excluir Emerald Ape/i }).first()
  await expect(deleteBtn).toBeVisible()
  await deleteBtn.click()

  await expect(page.getByText('Seu carrinho está vazio').filter({ visible: true })).toBeVisible({
    timeout: 10_000,
  })
})

test('carrinho: quantidades, limite de estoque e remoção', async ({ page }) => {
  await addToCartAndOpenCart(page, 'nft-2')
  const increase = page
    .getByRole('button', { name: 'Aumentar quantidade de Genesis Drop #001' })
    .first()
  const decrease = page
    .getByRole('button', { name: 'Diminuir quantidade de Genesis Drop #001' })
    .first()

  // A edição principal do nft-2 tem 3 unidades: o + trava no limite.
  await increase.click()
  await increase.click()
  await expect(increase).toBeDisabled()
  await decrease.click()
  await expect(increase).toBeEnabled()

  await page.getByRole('button', { name: 'Remover Genesis Drop #001 do carrinho' }).first().click()
  await expect(page.getByText('Seu carrinho está vazio').first()).toBeVisible()
})

test('carrinho: cupom válido, inválido e expirado', async ({ page }) => {
  await addToCartAndOpenCart(page)
  const input = page.locator('#promo-code-input')
  const apply = page.getByRole('button', { name: 'Aplicar' }).first()

  await input.fill('NAOEXISTE')
  await apply.click()
  await expect(page.getByRole('alert').filter({ hasText: 'Cupom inválido.' })).toBeVisible()
  await page.getByRole('button', { name: 'Remover', exact: true }).first().click()

  await input.fill('EXPIRADO20')
  await apply.click()
  await expect(page.getByRole('alert').filter({ hasText: 'Cupom expirado.' })).toBeVisible()
  await page.getByRole('button', { name: 'Remover', exact: true }).first().click()

  await input.fill('kurio10')
  await apply.click()
  await expect(page.getByText('KURIO10').first()).toBeVisible()
  await expect(page.getByText(/\(-\) 0\.119/).first()).toBeVisible()
})

test('carrinho: persiste após refresh e após login', async ({ page }) => {
  await addToCartAndOpenCart(page)
  await page.reload()
  await expect(page.getByText(/Emerald Ape/i).first()).toBeVisible()

  await login(page)
  await page.goto('/carrinho')
  await expect(page.getByText(/Emerald Ape/i).first()).toBeVisible()
  await page.reload()
  await expect(page.getByText(/Emerald Ape/i).first()).toBeVisible()
})

test('detalhe: edição esgotada fica indisponível', async ({ page }) => {
  await page.goto('/nft/nft-1')
  // nft-1 não tem estoque na faixa 1/1 (fixtures determinísticas).
  const soldOut = page.getByRole('button', { name: '1/1 (esgotada)' }).first()
  await expect(soldOut).toBeDisabled()
})
