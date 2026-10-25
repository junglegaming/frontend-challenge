import { test as base, expect, type Page } from '@playwright/test'

type ScenarioId =
  | 'default'
  | 'empty'
  | 'slow'
  | 'out-of-order'
  | 'offline'
  | 'server-error'
  | 'session-expired'
  | 'favorite-fail'
  | 'price-change'
  | 'sold-out'
  | 'order-timeout'
  | 'payment-rejected'
  | 'wallet-rejected'

export const ALICE = { email: 'alice@kurio.dev', password: 'Kurio@123', name: 'Alice Martins' }
export const BOB = { email: 'bob@kurio.dev', password: 'Kurio@123', name: 'Bob Souza' }

/**
 * Cada teste parte de um estado isolado: storage limpo (db do mock volta ao seed)
 * e cenário definido antes de qualquer script da página rodar.
 */
export const test = base.extend<{ scenario: ScenarioId }>({
  scenario: ['default', { option: true }],
  page: async ({ page, scenario }, use) => {
    await page.addInitScript((id) => {
      if (!sessionStorage.getItem('kurio:e2e-init')) {
        localStorage.clear()
        sessionStorage.setItem('kurio:e2e-init', '1')
      }
      localStorage.setItem('kurio:scenario', id)
    }, scenario)
    await use(page)
  },
})

export { expect }

/** Login pela UI real. */
export async function login(page: Page, user = ALICE, redirect?: string) {
  await page.goto(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login')
  await page.getByLabel('E-mail', { exact: true }).fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  // /login vira o diálogo `?auth=login` sobre uma página; o login termina quando o diálogo some
  await page.waitForURL((url) => !url.searchParams.has('auth'))
}

/** Adiciona um NFT pelo detalhe (botão "COMPRAR" no desktop, "Comprar NFT" no mobile). */
export async function addToCart(page: Page, nftId = 'emerald-ape-042') {
  await page.goto(`/nft/${nftId}`)
  await page.getByRole('button', { name: /^comprar( nft)?$/i }).filter({ visible: true }).first().click()
  await page.waitForURL('**/cart')
}

/** Carrinho → login (se preciso) → checkout com a carteira principal conectada e cotação revisada. */
export async function goToReview(page: Page) {
  await page.goto('/checkout')
  await page.getByRole('button', { name: 'Conectar' }).first().click()
  await expect(page.getByText('Conectada', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
}

export async function serverOrders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('kurio:db')
    return raw ? (JSON.parse(raw) as { state: { orders: { order: { status: string } }[] } }).state.orders.map((o) => o.order.status) : []
  })
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Sair' }).filter({ visible: true }).first().click()
  await page.waitForFunction(() => !localStorage.getItem('kurio:token'))
}

/** Espera o socket.io-client conectar ao servidor simulado (opcionalmente como um usuário). */
export async function waitForSocket(page: Page, userId?: string) {
  await page.waitForFunction((id) => {
    const users = window.__kurioMock?.connectedUsers() ?? []
    return id ? users.includes(id) : users.length > 0
  }, userId)
}
