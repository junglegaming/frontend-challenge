import { ALICE, BOB, expect, login, logout, test } from './fixtures'

test('cadastro com validação e conflito de e-mail', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('button', { name: /^Criar (conta|perfil)$/ }).filter({ visible: true }).last().click()
  await expect(page.getByText('Mínimo de 3 caracteres').first()).toBeVisible()

  await page.getByLabel('Nome de usuário').fill('novo_colecionador')
  await page.getByLabel('E-mail', { exact: true }).fill(ALICE.email)
  await page.getByLabel('Senha', { exact: true }).fill('Kurio@456')
  await page.getByLabel('Confirmar senha').fill('Kurio@456')
  await page.getByRole('button', { name: /^Criar (conta|perfil)$/ }).filter({ visible: true }).last().click()
  await expect(page.getByText('Este e-mail já está cadastrado')).toBeVisible()

  await page.getByLabel('E-mail', { exact: true }).fill('novo@kurio.dev')
  await page.getByRole('button', { name: /^Criar (conta|perfil)$/ }).filter({ visible: true }).last().click()
  await page.waitForURL((url) => !url.searchParams.has('auth'))
  await page.reload()
  await page.goto('/profile')
  await expect(page.getByLabel(/^Nome de usuário/)).toHaveValue('novo_colecionador')
})

test('login inválido, retorno ao fluxo anterior e logout', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/auth=login&redirect=/)
  await page.getByLabel('E-mail', { exact: true }).fill(ALICE.email)
  await page.getByLabel('Senha', { exact: true }).fill('errada123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos' })).toBeVisible()
  await page.getByLabel('Senha', { exact: true }).fill(ALICE.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await page.reload()
  await expect(page.getByLabel(/^Nome de exibição/)).toHaveValue(ALICE.name)

  await logout(page)
  await page.goto('/profile')
  await expect(page).toHaveURL(/auth=login/)
})

test('sessão expirada durante a navegação volta ao login preservando o destino', async ({ page }) => {
  await login(page, ALICE, '/wallets')
  await expect(page).toHaveURL(/\/wallets/)
  await page.evaluate(() => window.__kurioMock?.expireSessions())
  await page.goto('/profile')
  await expect(page).toHaveURL(/auth=login&redirect=%2Fprofile/)
})

test.describe('sessão com relógio controlado', () => {
  test.use({ scenario: 'session-expired' })
  test('expira após o TTL do servidor e a próxima ação privada pede login', async ({ page }) => {
    await page.clock.install()
    await login(page, ALICE, '/wallets')
    await expect(page.getByLabel(/^Apelido da carteira/).first()).toHaveValue('Cofre principal')
    // TTL de 20 s no cenário: avança o relógio da página (Date e timers) sem esperar de verdade
    await page.clock.runFor(25_000)
    await page.goto('/profile')
    await expect(page).toHaveURL(/auth=login&redirect=%2Fprofile/)
  })
})

test('troca de usuário não expõe dados do anterior', async ({ page }) => {
  await login(page, ALICE, '/wallets')
  await expect(page.getByLabel(/^Apelido da carteira/).first()).toHaveValue('Cofre principal')
  await logout(page)
  await login(page, BOB, '/wallets')
  await expect(page).toHaveURL(/\/wallets/)
  await expect(page.getByLabel(/^Nome de exibição/).first()).toBeVisible()
  await expect(page.getByLabel(/^Apelido da carteira/).first()).toHaveValue('')
  expect(await page.evaluate(() => window.__kurioMock?.connectedUsers())).toEqual(['u_bob'])
})
