import { expect, test } from '@playwright/test'

import { login } from './support/helpers'

test.describe('conta do colecionador', () => {
  test('perfil: valida, salva nome e avatar e persiste após refresh', async ({ page }) => {
    await login(page)
    await page.goto('/perfil')

    await page.locator('#name').fill('N')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true')

    await page.locator('#name').fill('Nova Sato Atualizada')
    await page.locator('#avatarUrl').fill('https://kurio.test/avatar.png')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: /Dados atualizados/ })
        .first(),
    ).toBeVisible()

    await page.reload()
    await expect(page.locator('#name')).toHaveValue('Nova Sato Atualizada')
  })

  test('perfil: senha atual incorreta e troca de senha', async ({ page }) => {
    await login(page)
    await page.goto('/perfil')

    await page.locator('#currentPassword').fill('errada')
    await page.locator('#newPassword').fill('novasenha1')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha atual incorreta').first()).toBeVisible()

    await page.locator('#currentPassword').fill('kurio123')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByRole('status').filter({ hasText: /senha/i }).first()).toBeVisible()
  })

  test('carteiras: erros de validação e da API, cadastro da secundária e persistência', async ({
    page,
  }) => {
    await login(page, 'bruno')
    await page.goto('/carteiras')
    await expect(page.getByText('Cadastre sua primeira carteira.')).toBeVisible()

    await page.locator('#walletAlias').fill('Principal')
    await page.locator('#walletAddress').fill('0x123')
    await page.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText(/40 caracteres hexadecimais/)).toBeVisible()
    await expect(page.getByText(/código de indicação/)).toBeVisible()

    await page.locator('#walletAddress').fill('0x1111111111111111111111111111111111111111')
    await page.locator('#referralCode').fill('BRUNO01')
    await page.locator('#ensName').fill('bruno')
    await page.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText(/Carteira salva/)).toBeVisible()

    await page.getByRole('button', { name: 'Adicionar carteira secundária' }).click()
    await page.locator('#walletAlias').fill('Reserva')
    await page.locator('#walletAddress').fill('0x1111111111111111111111111111111111111111')
    await page.locator('#referralCode').fill('BRUNO02')
    await page.locator('#ensName').fill('bruno-reserva')
    await page.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText(/já está cadastrado/)).toBeVisible()

    await page.locator('#walletAddress').fill('0x2222222222222222222222222222222222222222')
    await page.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText(/Carteira salva/)).toBeVisible()

    await page.reload()
    await expect(page.getByText('Reserva').first()).toBeVisible()
    await expect(page.locator('#walletAlias')).toHaveValue('Principal')
  })
})
