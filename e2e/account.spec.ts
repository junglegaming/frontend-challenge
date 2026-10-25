import { fileURLToPath } from 'node:url'
import { ALICE, BOB, expect, login, test } from './fixtures'

test('perfil: edição persiste, avatar e validação', async ({ page }) => {
  await login(page, ALICE, '/profile')
  const displayName = page.getByLabel(/^Nome de exibição/)
  await expect(displayName).toHaveValue(ALICE.name)

  await page.getByLabel(/^E-mail/).fill('email-invalido')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('E-mail inválido')).toBeVisible()
  await expect(page.getByLabel(/^E-mail/)).toHaveAttribute('aria-invalid', 'true')

  await page.getByLabel(/^E-mail/).fill(BOB.email)
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Este e-mail já está cadastrado')).toBeVisible()

  await page.getByLabel(/^E-mail/).fill(ALICE.email)
  await displayName.fill('Alice M.')
  await page.getByLabel('Selecionar imagem de avatar').setInputFiles(fileURLToPath(new URL('./assets/avatar.webp', import.meta.url)))
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Perfil atualizado')).toBeVisible()
  await page.reload()
  await expect(displayName).toHaveValue('Alice M.')
  await expect(page.locator('img[src^="data:image/webp"]').filter({ visible: true }).first()).toBeVisible()
})

test('troca de senha valida a senha atual e a nova', async ({ page }) => {
  await login(page, ALICE, '/profile')
  await page.getByLabel('Senha atual').fill('errada000')
  await page.getByLabel('Nova senha', { exact: true }).fill('fraca')
  await page.getByLabel('Confirmar nova senha').fill('fraca')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Mínimo de 8 caracteres')).toBeVisible()
  await page.getByLabel('Nova senha', { exact: true }).fill('Kurio@456')
  await page.getByLabel('Confirmar nova senha').fill('Kurio@456')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Senha atual incorreta').first()).toBeVisible()
  await page.getByLabel('Senha atual').fill(ALICE.password)
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByLabel('Senha atual')).toHaveValue('')
})

test('carteiras: cadastro com validação e conexão', async ({ page }) => {
  await login(page, BOB, '/wallets')
  const form = page.locator('form').filter({ visible: true }).first()
  await form.getByLabel(/^Nome de exibição/).fill('Bob Souza')
  await form.getByLabel(/^Apelido da carteira/).fill('Principal do Bob')
  await form.getByRole('combobox', { name: /^Rede/ }).click()
  await page.getByRole('option', { name: 'Ethereum' }).click()
  await form.getByLabel(/^Nome do perfil/).fill('bob.collector')
  await form.getByLabel(/^Endereço da carteira/).fill('0x123')
  await form.getByRole('combobox', { name: /^Tipo de carteira/ }).click()
  await page.getByRole('option', { name: 'MetaMask' }).click()
  await form.getByLabel(/^Código de indicação/).fill('KURIO-BOB')
  await form.getByLabel(/^E-mail/).fill(BOB.email)
  await form.getByLabel(/^Nome ENS/).fill('bobsouza')
  await form.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText(/Endereço 0x inválido/)).toBeVisible()

  await form.getByLabel(/^Endereço da carteira/).fill('0x5B7c8D9eE82CA91F3c2b7D5e8F1a4B6c9D0e2F3b')
  await form.getByRole('button', { name: 'Salvar carteira' }).click()
  const nickname = page.locator('form').filter({ visible: true }).first().getByLabel(/^Apelido da carteira/)
  await expect(page.getByRole('button', { name: 'Conectar', exact: true }).first()).toBeVisible()
  await page.reload()
  await expect(nickname).toHaveValue('Principal do Bob')
  await page.getByRole('button', { name: 'Conectar', exact: true }).first().click()
  await expect(page.getByText('Conectada', { exact: true }).first()).toBeVisible()
})

test.describe('carteira recusa a conexão', () => {
  test.use({ scenario: 'wallet-rejected' })
  test('mostra a recusa sem aparentar sucesso', async ({ page }) => {
    await login(page, ALICE, '/wallets')
    await page.getByRole('button', { name: 'Conectar' }).first().click()
    await expect(page.getByText(/recusada/i).first()).toBeVisible()
  })
})
