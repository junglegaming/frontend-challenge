import { ALICE, expect, login, test } from './fixtures'

test('favoritar persiste para o usuário autenticado', async ({ page }) => {
  await login(page, ALICE, '/nft/emerald-ape-042')
  const button = page.getByRole('button', { name: /^Favoritar$|^Favoritado$|favoritos/ }).filter({ visible: true }).first()
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Adicionado aos favoritos')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { pressed: true, name: /Favoritado|Remover dos favoritos/ }).filter({ visible: true }).first()).toBeVisible()
})

test('visitante é levado ao login ao favoritar', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042')
  await page.getByRole('button', { name: 'Favoritar' }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL(/\/nft\/emerald-ape-042\?.*auth=login&redirect=%2Fnft%2Femerald-ape-042/)
})

test.describe('falha na mutation', () => {
  test.use({ scenario: 'favorite-fail' })
  test('atualização otimista volta atrás e avisa', async ({ page }) => {
    await login(page, ALICE, '/nft/emerald-ape-042')
    const button = page.getByRole('button', { name: /^Favoritar$|favoritos/ }).filter({ visible: true }).first()
    await button.click()
    await expect(page.getByText('Não foi possível favoritar. Tente novamente.')).toBeVisible()
    await expect(button).toHaveAttribute('aria-pressed', 'false')
  })
})
