import { expect, type Page } from '@playwright/test'

// Shared by the coins-admin specs (specs/012-coins-admin). The mock admin credential is documented in
// src/mocks/contexts/coins-admin/README.md.
export const COINS_ADMIN_EMAIL = 'moedas@nft.dev'
export const COINS_ADMIN_PASSWORD = 'Moedas@123'

export async function openCoinsAdminLogin(page: Page) {
  await page.goto('/admin/coins/login')
  // The first load of a page compiles it in the dev server: allow more than the default 5 s under CPU load.
  await expect(page.getByRole('heading', { name: 'Administração das moedas' })).toBeVisible({ timeout: 20_000 })
}

export async function submitCoinsAdminLogin(page: Page, email = COINS_ADMIN_EMAIL, password = COINS_ADMIN_PASSWORD) {
  await page.getByLabel(/^E-mail/).fill(email)
  await page.getByLabel(/^Senha/).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

/** Signs the coins administrator in through the form (a full page load drops the in-memory session by design). */
export async function signInCoinsAdmin(page: Page) {
  await openCoinsAdminLogin(page)
  await submitCoinsAdminLogin(page)
  await expect(page).toHaveURL(/\/admin\/coins(\?.*)?$/)
}

/**
 * Gives each owner a balance through the (mocked) coins service so it shows up in the admin list. Needs the app
 * mounted (MSW ready). Owner ids use only lowercase letters, digits and `-`: the real service orders by the database
 * collation and the mock by character code, which agree for these.
 */
export async function seedOwners(page: Page, ownerIds: string[], amount = 10) {
  await page.evaluate(
    async ([owners, value]) => {
      for (const ownerId of owners) {
        const issued = await fetch('/backend/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId }),
        })
        const { token } = (await issued.json()) as { token: string }
        await fetch('/backend/coins/topup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'Idempotency-Key': `seed-${ownerId}` },
          body: JSON.stringify({ amount: value }),
        })
      }
    },
    [ownerIds, amount] as const,
  )
}

/** `dono-001` … `dono-NNN`. */
export const ownerIds = (count: number) => Array.from({ length: count }, (_, i) => `dono-${String(i + 1).padStart(3, '0')}`)
