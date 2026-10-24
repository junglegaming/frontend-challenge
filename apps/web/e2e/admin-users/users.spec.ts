import { expect, test, type Page } from '@playwright/test'
import { hasNoHorizontalScroll, promoteCurrentUserToAdmin, runAxe, SESSION_KEY, signIn, VIEWPORTS } from '../design-system/helpers'

/** Signs up a fresh collector with a known, returned e-mail (unlike `signIn`, which hides it). */
async function signUpKnownUser(page: Page, label: string) {
  await page.goto('/')
  await page.getByRole('banner').waitFor()
  const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const email = `${label.toLowerCase().replaceAll(' ', '-')}_${unique}@nft.dev`
  const { token, id } = await page.evaluate(
    async ([name, mail]) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username: `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, email: mail, password: 'Senha1234' }),
      })
      const session = (await response.json()) as { token: string; user: { id: string } }
      return { token: session.token, id: session.user.id }
    },
    [label, email] as const,
  )
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SESSION_KEY, token])
  return { email, id, token }
}

test('searching finds a known account by e-mail', async ({ page }) => {
  const target = await signUpKnownUser(page, 'Busca Teste')
  await promoteCurrentUserToAdmin(page)
  await page.goto('/admin/users')
  await page.getByLabel('Buscar por nome ou e-mail').fill(target.email)
  await expect(page.getByRole('button', { name: new RegExp(target.email) })).toBeVisible()
})

test('suspending an account ends its session and blocks sign-in until reactivated', async ({ page }) => {
  // Both accounts live in the same page/context so they share the same mock backend; the target's
  // own bearer token is captured up front and used directly in raw API calls afterward, since the
  // app only remembers one session at a time in `localStorage` (can't stay "logged in as target"
  // once this same page signs in as admin).
  const target = await signUpKnownUser(page, 'Suspenso Teste')

  await signUpKnownUser(page, 'Admin Teste')
  await promoteCurrentUserToAdmin(page)
  await page.goto('/admin/users')
  await page.getByLabel('Buscar por nome ou e-mail').fill(target.email)
  await page.getByRole('button', { name: new RegExp(target.email) }).click()
  await page.getByRole('button', { name: 'Suspender' }).click()
  await expect(page.getByText('Conta suspensa.')).toBeVisible()

  // The target's existing session is now dead server-side — its own token no longer authenticates.
  const status = await page.evaluate(
    (token) => fetch('/api/session', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.status),
    target.token,
  )
  expect(status).toBe(401)
})

test('attempting to suspend the sole remaining administrator is blocked', async ({ page }) => {
  await signUpKnownUser(page, 'Unico Admin')
  await promoteCurrentUserToAdmin(page)
  await page.goto('/admin/users')

  // Two active admins exist at this point (the fresh promoted account + the seed `usr_ana`).
  // Suspend `usr_ana` first so the current admin becomes the sole remaining one.
  await page.getByLabel('Buscar por nome ou e-mail').fill('ana@nft.dev')
  await page.getByRole('button', { name: /ana@nft\.dev/ }).click()
  await page.getByRole('button', { name: 'Suspender' }).click()
  await expect(page.getByText('Conta suspensa.')).toBeVisible()

  // Now suspend the only remaining admin — the current, signed-in user.
  const session = await page.evaluate(async () => {
    const token = localStorage.getItem('nft-session:token')
    const response = await fetch('/api/session', { headers: { Authorization: `Bearer ${token}` } })
    return (await response.json()) as { user: { email: string } }
  })
  await page.getByLabel('Buscar por nome ou e-mail').fill(session.user.email)
  await page.getByRole('button', { name: new RegExp(session.user.email) }).click()
  await page.getByRole('button', { name: 'Suspender' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Não é possível suspender o único administrador ativo.' })).toBeVisible()
})

test('admin-users has no critical accessibility violations', async ({ page }) => {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)
  await page.goto('/admin/users')
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('admin users renders without horizontal scroll', async ({ page }) => {
      await signIn(page)
      await promoteCurrentUserToAdmin(page)
      await page.goto('/admin/users')
      expect(await hasNoHorizontalScroll(page)).toBe(true)
    })
  })
}
