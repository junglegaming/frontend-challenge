import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, VIEWPORTS } from '../design-system/helpers'

async function fillSignup(page: import('@playwright/test').Page, username: string, email: string) {
  await page.getByLabel('Nome de usuário').fill(username)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel(/^Senha/).fill('Senha1234')
  await page.getByLabel('Confirmar senha').fill('Senha1234')
  await page.getByRole('button', { name: 'Criar conta' }).click()
}

test('logs in with valid credentials and closes the dialog', async ({ page }) => {
  const unique = Date.now().toString(36)
  await page.goto('/signup')
  await fillSignup(page, `user_${unique}`, `${unique}@nft.dev`)
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('link', { name: /Conta de/ })).toBeVisible()
})

test('shows an inline error for the wrong password', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('nobody@nft.dev')
  await page.getByLabel(/^Senha/).fill('wrong-password')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

test('rejects a duplicate e-mail on signup', async ({ page }) => {
  const unique = Date.now().toString(36)
  const email = `${unique}@nft.dev`
  await page.goto('/signup')
  await fillSignup(page, `user_${unique}`, email)
  await expect(page).toHaveURL('/')

  await page.goto('/signup')
  await fillSignup(page, `user2_${unique}`, email)
  await expect(page.getByRole('alert')).toBeVisible()
})

test('auth dialog has no critical accessibility violations', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('login dialog renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByRole('dialog')).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`login-${viewport.width}.png`, { fullPage: true })
    })
  })
}
