import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, VIEWPORTS } from './helpers'

const COLOR_TOKENS = ['background', 'card', 'primary', 'muted-foreground', 'foreground', 'ring', 'destructive', 'success', 'warning']
const TYPE_LEVELS = ['title', 'body', 'action', 'caption']
const ICONS = ['SearchIcon', 'CartIcon', 'ProfileIcon', 'WalletIcon', 'HeartIcon', 'EyeIcon', 'EyeOffIcon', 'LogoutIcon', 'AvatarIcon']

test('catalog lists every token, type level, icon and component state', async ({ page }) => {
  await page.goto('/design-system')
  await expect(page.getByRole('heading', { level: 1, name: 'Design system Kurio' })).toBeVisible()
  for (const token of COLOR_TOKENS) await expect(page.getByText(`--${token}`, { exact: true })).toBeVisible()
  for (const level of TYPE_LEVELS) await expect(page.getByText(level, { exact: true }).first()).toBeVisible()
  for (const icon of ICONS) await expect(page.getByText(icon, { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Desabilitado', exact: true })).toBeDisabled()
  await expect(page.getByRole('textbox', { name: 'Com erro (obrigatório)' })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: 'Mostrar senha' })).toBeVisible()
})

test('catalog has no critical accessibility violations', async ({ page }) => {
  await page.goto('/design-system')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('catalog renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await page.goto('/design-system')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`catalog-${viewport.width}.png`, { fullPage: true })
    })
  })
}
