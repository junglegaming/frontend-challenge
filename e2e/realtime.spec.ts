import { ALICE, addToCart, expect, goToReview, login, serverOrders, test, waitForSocket } from './fixtures'

test('preço alterado via Socket.IO durante o checkout exige nova revisão', async ({ page }) => {
  await addToCart(page)
  await login(page, ALICE, '/checkout')
  await goToReview(page)
  await waitForSocket(page, 'u_alice')
  // muda no "servidor": o evento chega pelo socket.io-client, não por chamada direta à UI
  await page.evaluate(() => window.__kurioMock?.changePrice('emerald-ape-042', '1/50', '1.50'))
  await expect(page.getByText('Revise o pedido novamente').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toHaveCount(0)
  // desktop mostra a linha do item (1.50 ETH); o mobile do Figma só mostra o total (1.516 ETH)
  await expect(page.getByText(/^1\.5\d* ETH$/).filter({ visible: true }).first()).toBeVisible()
  expect(await serverOrders(page)).toEqual([])
})

test('carrinho aberto recebe alteração de disponibilidade e bloqueia o checkout', async ({ page }) => {
  await addToCart(page)
  await expect(page.getByText('Emerald Ape #042').filter({ visible: true }).first()).toBeVisible()
  await waitForSocket(page)
  await page.evaluate(() => window.__kurioMock?.sellOut('emerald-ape-042', '1/50'))
  await expect(page.getByText(/esgotad/i).filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText(/preço ou disponibilidade atualizados/)).toBeVisible()
})

test('eventos duplicados ou antigos não regridem o preço', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
  await waitForSocket(page)
  await page.evaluate(() => window.__kurioMock?.changePrice('emerald-ape-042', '1/50', '1.30'))
  const price = page.getByText('1.30 ETH').filter({ visible: true }).first()
  await expect(price).toBeVisible()
  await page.evaluate(() => {
    window.__kurioMock?.duplicateLastEvent()
    window.__kurioMock?.emitStaleEvent('emerald-ape-042')
  })
  await page.waitForTimeout(800)
  await expect(price).toBeVisible()
  await expect(page.getByText('999.00 ETH')).toHaveCount(0)
})

test('queda de conexão e refresh com pedido pendente recuperam o estado sem nova compra', async ({ page }) => {
  await addToCart(page)
  await login(page, ALICE, '/checkout')
  await goToReview(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/orders\//)
  await page.evaluate(() => window.__kurioMock?.dropSocket())
  await page.reload()
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({ timeout: 15_000 })
  expect(await serverOrders(page)).toEqual(['confirmed'])
  expect(await page.evaluate(() => window.__kurioMock?.connectedUsers())).toEqual(['u_alice'])
})
