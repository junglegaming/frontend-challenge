import { expect, test } from '@playwright/test'

import {
  addToCartAndOpenCart,
  applyScenario,
  confirmPurchase,
  countOrders,
  login,
  prepareCheckout,
} from './support/helpers'

test.describe('tempo real (Socket.IO)', () => {
  test('preço muda durante o checkout: avisa e exige nova confirmação', async ({ page }) => {
    await login(page)
    await addToCartAndOpenCart(page)
    await prepareCheckout(page)

    // O cenário altera o preço na API e publica `nft.updated` pelo socket.io-client.
    await applyScenario(page, 'price_changed')

    await expect(page.getByText(/O preço de Emerald Ape #042 mudou para 2\.99 ETH/)).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: /Os valores mudaram/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()

    await page.getByRole('button', { name: 'Revisei, aceitar novo total' }).click()
    await confirmPurchase(page)
    await expect(page).toHaveURL(/\/pedido\//, { timeout: 10_000 })
  })

  test('carrinho aberto reflete a mudança de preço e atualiza os valores', async ({ page }) => {
    await login(page)
    await addToCartAndOpenCart(page)
    const visible = (text: RegExp) => page.getByText(text).filter({ visible: true }).first()
    await expect(visible(/1\.19 ETH/)).toBeVisible()

    await applyScenario(page, 'price_changed')

    await expect(visible(/Preço atualizado \(era 1\.19 ETH\)/)).toBeVisible()
    await expect(visible(/2\.99 ETH/)).toBeVisible()
  })

  test('edição esgotada durante a compra bloqueia a confirmação', async ({ page }) => {
    await login(page)
    await addToCartAndOpenCart(page)
    await prepareCheckout(page)

    await applyScenario(page, 'sold_out')

    await expect(page.getByText(/A disponibilidade de Emerald Ape #042 mudou/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
    expect(await countOrders(page)).toBe(0)
  })

  test('eventos duplicados ou antigos não reaplicam efeitos', async ({ page }) => {
    await login(page)
    await addToCartAndOpenCart(page)
    const notice = page.getByText(/A disponibilidade de Emerald Ape #042 mudou/)

    const emit = (version: number) =>
      page.evaluate(
        (v) => window.__kurio?.emitNftUpdated({ nftId: 'nft-1', version: v, priceEth: '1.19' }),
        version,
      )
    await emit(50)
    await emit(50) // duplicata: mesmo eventId
    await expect(notice).toHaveCount(1)

    await emit(10) // versão antiga
    await page.waitForTimeout(500)
    await expect(notice).toHaveCount(1)
  })

  test('queda de conexão com pedido pendente: reconcilia sem criar outra compra', async ({
    page,
  }) => {
    await login(page)
    await addToCartAndOpenCart(page)
    await prepareCheckout(page)
    await confirmPurchase(page)

    await expect(page).toHaveURL(/\/pedido\//, { timeout: 10_000 })
    await expect(page.getByText('Processando pagamento…')).toBeVisible()

    await page.evaluate(() => window.__kurio?.dropRealtimeConnections())
    await expect(page.getByText('Compra confirmada')).toBeVisible({ timeout: 15_000 })
    expect(await countOrders(page)).toBe(1)
  })

  test('recarregar com pedido pendente recupera o estado', async ({ page }) => {
    await login(page)
    await addToCartAndOpenCart(page)
    await prepareCheckout(page)
    await confirmPurchase(page)
    await expect(page).toHaveURL(/\/pedido\//, { timeout: 10_000 })

    await page.reload()
    await expect(page.getByText('Compra confirmada')).toBeVisible({ timeout: 15_000 })
    expect(await countOrders(page)).toBe(1)
  })
})
