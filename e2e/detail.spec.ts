import { expect, test } from './fixtures'

test('acesso direto ao detalhe, edição esgotada e limite de quantidade', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
  const editions = page.getByRole('radiogroup').filter({ visible: true }).first()
  await editions.getByRole('radio', { name: /^1\/1(?!\d)/ }).click()
  await expect(page).toHaveURL(/edition=1%2F1|edition=1\/1/)
  // 1/1 tem uma única unidade: o "+" já nasce bloqueado no limite
  const plus = page.getByRole('button', { name: 'Aumentar quantidade' }).filter({ visible: true }).first()
  await expect(plus).toBeDisabled()
  await editions.getByRole('radio', { name: /^1\/10/ }).click()
  await expect(plus).toBeEnabled()
})

test('NFT inexistente e rota inexistente', async ({ page }) => {
  await page.goto('/nft/nao-existe-123')
  await expect(page.getByText('NFT não encontrado')).toBeVisible()
  await page.goto('/rota/que/nao/existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
})
