import { expect, test } from '@playwright/test'

import {
  USERS,
  addToCartAndOpenCart,
  applyScenario,
  confirmPurchase,
  login,
  prepareCheckout,
} from './support/helpers'

test('conta: login exibe o usuário no header e logout limpa a sessão', async ({ page }) => {
  await login(page)
  await page.goto('/')
  await expect(page.getByText(USERS.nova.name).first()).toBeVisible()

  await page.getByRole('button', { name: 'Sair' }).first().click()
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('kurio:token'))).toBeNull()
})

test('cadastro cria a conta e trata e-mail já cadastrado', async ({ page }) => {
  await page.goto('/cadastro')
  const fill = async (email: string) => {
    await page
      .locator(
        'input[aria-label="Nome de usuário"]:visible, input[placeholder="Nome de usuário"]:visible',
      )
      .first()
      .fill('Colecionadora Teste')
    await page.locator('input[type=email]:visible').first().fill(email)
    await page.locator('input[placeholder="Senha"]:visible').first().fill('segredo123')
    await page.locator('input[placeholder="Confirmar senha"]:visible').first().fill('segredo123')
    await page.locator('button[type=submit]:visible').first().click()
  }

  await fill(USERS.nova.email)
  await expect(page.getByText('E-mail já em uso').first()).toBeVisible()

  await fill('nova.conta@kurio.test')
  await page.waitForURL((url) => !url.pathname.startsWith('/cadastro'))
  expect(await page.evaluate(() => localStorage.getItem('kurio:token'))).not.toBeNull()
})

test('login com credenciais inválidas exibe erro', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type=email]:visible').first().fill(USERS.nova.email)
  await page.locator('input[type=password]:visible').first().fill('senha-errada')
  await page
    .locator('button:visible', { hasText: /^Entrar$/ })
    .first()
    .click()
  await expect(
    page.getByText(/E-mail ou senha incorretos|Credenciais inválidas/).first(),
  ).toBeVisible()
})

test('mobile: login e cadastro podem ser fechados e voltam ao catálogo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })

  for (const path of ['/login', '/cadastro']) {
    await page.goto(path)
    await page.getByRole('button', { name: 'Fechar' }).click()
    await expect(page).toHaveURL((url) => url.pathname === '/')
  }
})

test('sessão expirada na área privada volta ao login e retoma o contexto', async ({ page }) => {
  await login(page)
  await page.goto('/carteiras')
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()

  await applyScenario(page, 'session_expired')
  await page.reload()

  await expect(page).toHaveURL(/\/login\?redirect=/)
  await expect(page.getByText(/Sua sessão expirou/)).toBeVisible()

  const email = page.locator('input[type=email]:visible').first()
  await expect(email).toBeEditable()
  await email.fill(USERS.nova.email)
  await page.locator('input[type=password]:visible').first().fill('kurio123')
  await page
    .locator('button:visible', { hasText: /^Entrar$/ })
    .first()
    .click()
  await page.waitForURL(/\/carteiras/, { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
})

test('sessão expirada no checkout preserva o carrinho para retomar', async ({ page }) => {
  await login(page)
  await addToCartAndOpenCart(page)
  await page.goto('/pagamento')

  await applyScenario(page, 'session_expired')
  // A próxima requisição autenticada (aqui, conectar a carteira) recebe 401.
  // Uma consulta em segundo plano pode chegar antes e já redirecionar.
  await page
    .getByRole('button', { name: 'Conectar carteira' })
    .click({ timeout: 3000 })
    .catch(() => undefined)

  await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento|\/login\?redirect=\/pagamento/)
  await login(page)
  await page.goto('/pagamento')
  await expect(page.getByText(/Emerald Ape/).first()).toBeVisible()
})

test('troca de usuário não expõe dados do anterior', async ({ page }) => {
  test.setTimeout(60_000)
  await login(page, 'nova')
  await addToCartAndOpenCart(page)
  await prepareCheckout(page)
  await confirmPurchase(page)
  await expect(page).toHaveURL(/\/pedido\//, { timeout: 10_000 })
  const novaOrderUrl = page.url()

  await page.getByRole('button', { name: 'Fechar confirmação' }).click()
  await page.getByRole('button', { name: 'Sair' }).first().click()
  await login(page, 'bruno')

  await page.goto('/carrinho')
  await expect(page.getByText('Seu carrinho está vazio').first()).toBeVisible()
  await page.goto(novaOrderUrl)
  await expect(page.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
})
