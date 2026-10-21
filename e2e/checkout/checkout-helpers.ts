import { expect, type Page } from '@playwright/test'
import { SESSION_KEY } from '../design-system/helpers'

/** Saves a wallet for the signed-in collector through the mocked API. */
export async function createWalletViaApi(page: Page, networks: string[] = ['ethereum'], label = 'Minha carteira') {
  const token = await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)
  await page.evaluate(
    async ([authToken, body]) => {
      await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(body),
      })
    },
    [token, { slot: 'primary', label, provider: 'metamask', address: `0x${'3'.repeat(40)}`, networks }] as const,
  )
}

export async function openCheckout(page: Page) {
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Pagamento' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Seus NFTs' })).toBeVisible()
}

/** Picks the network and connects the preselected (primary) wallet. */
export async function connectWallet(page: Page, network = 'ethereum') {
  await page.getByRole('combobox', { name: /^Rede/ }).selectOption(network)
  await page.getByRole('button', { name: 'Conectar' }).click()
  await expect(page.getByText('Conectada', { exact: true })).toBeVisible()
}

export async function goToReview(page: Page) {
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Revise seu pedido' })).toBeVisible()
}

/** Signed-in collector with a wallet → checkout open, wallet connected, review step reached. */
export async function reachReview(page: Page) {
  await openCheckout(page)
  await connectWallet(page)
  await goToReview(page)
}
