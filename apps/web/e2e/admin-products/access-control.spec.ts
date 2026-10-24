import { expect, test } from '@playwright/test'
import { promoteCurrentUserToAdmin, signIn } from '../design-system/helpers'

test('an admin can reach the admin area', async ({ page }) => {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)
  await page.goto('/admin/products')
  await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
})

test('a signed-in collector is redirected away from the admin area, never seeing its content', async ({ page }) => {
  await signIn(page)
  await page.goto('/admin/products')
  await expect(page).toHaveURL(/\/\?forbidden=true$/)
  await expect(page.getByRole('heading', { name: 'Produtos' })).not.toBeVisible()
})

test('a signed-out visitor is redirected to login with a redirect back to the admin area', async ({ page }) => {
  await page.goto('/admin/users')
  await expect(page).toHaveURL(/\/login\?redirect=/)
})

test('public sign-up never creates an admin account', async ({ page }) => {
  await signIn(page)
  await page.goto('/admin/products')
  await expect(page).not.toHaveURL(/\/admin\/products/)
})
