import { type Page, expect } from '@playwright/test'

/** Usuários das fixtures (senha `kurio123`). */
export const USERS = {
  nova: { email: 'nova@kurio.test', name: 'Nova Sato' },
  bruno: { email: 'bruno@kurio.test', name: 'Bruno Lima' },
} as const

const PASSWORD = 'kurio123'

/** Layout desktop (≥ md) ou mobile do viewport atual. */
export function isDesktop(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) >= 768
}

/** Faz login pela tela de login e espera a sessão ativa. */
export async function login(page: Page, user: keyof typeof USERS = 'nova'): Promise<void> {
  await page.goto('/login')
  await page.locator('input[type=email]:visible').first().fill(USERS[user].email)
  await page.locator('input[type=password]:visible').first().fill(PASSWORD)
  await page
    .locator('button:visible', { hasText: /^Entrar$/ })
    .first()
    .click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
  await expect.poll(() => page.evaluate(() => localStorage.getItem('kurio:token'))).not.toBeNull()
}

/** Abre o detalhe e compra a edição padrão, terminando no carrinho. */
export async function addToCartAndOpenCart(page: Page, nftId = 'nft-1'): Promise<void> {
  await page.goto(`/nft/${nftId}`)
  await page
    .locator('button:visible', { hasText: /^(COMPRAR|Comprar NFT)$/ })
    .first()
    .click()
  await page.waitForURL(/\/carrinho/)
}

/** Ativa um cenário do backend simulado (MSW). */
export async function applyScenario(page: Page, name: string): Promise<void> {
  // O controle só existe depois que o MSW sobe: esperar evita um no-op silencioso.
  await page.waitForFunction(() => window.__kurio !== undefined)
  await page.evaluate((scenario) => window.__kurio!.applyScenario(scenario), name)
}

/**
 * Preenche o que o layout exige e conecta a carteira no checkout, deixando a
 * compra pronta para revisão.
 */
export async function prepareCheckout(page: Page): Promise<void> {
  await page.goto('/pagamento')
  if (isDesktop(page)) await page.locator('#referralCode').fill('KURIO2026')
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada:')).toBeVisible()
}

/** Abre a revisão e confirma o pagamento. */
export async function confirmPurchase(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('dialog', { name: 'Revise sua compra' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar e pagar' }).click()
}

/** Pedidos do usuário persistidos no banco simulado (para provar idempotência). */
export async function countOrders(page: Page): Promise<number> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('kurio:mock-db')
    if (!raw) return 0
    const db: unknown = JSON.parse(raw)
    if (typeof db !== 'object' || db === null || !('orders' in db)) return 0
    const orders = db.orders
    return typeof orders === 'object' && orders !== null ? Object.keys(orders).length : 0
  })
}
