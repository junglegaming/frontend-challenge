import { expect, test } from '@playwright/test'

import { applyScenario, login } from './support/helpers'

test('visitante que favorita é levado ao login', async ({ page }) => {
  await page.goto('/nft/nft-1')
  await page
    .getByRole('button', { name: /Favoritar Emerald Ape|Adicionar aos favoritos/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/login\?redirect=/)
})

test('favorito persiste para o usuário e falha de mutation desfaz a mudança', async ({ page }) => {
  await login(page)
  await page.goto('/nft/nft-1')
  const favorite = page.getByRole('button', { name: 'Favoritar Emerald Ape #042' })
  await favorite.click()
  const unfavorite = page.getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' })
  await expect(unfavorite).toBeVisible()

  await page.reload()
  await expect(unfavorite).toBeVisible()

  await applyScenario(page, 'favorite_error')
  await unfavorite.click()
  await expect(
    page.getByText('Não foi possível remover dos favoritos. Tente novamente.'),
  ).toBeVisible()
  // Rollback: o estado volta ao que o servidor confirmou.
  await expect(unfavorite).toBeVisible()
})
