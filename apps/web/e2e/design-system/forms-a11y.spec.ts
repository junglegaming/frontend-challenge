import { expect, test } from '@playwright/test'
import { signIn, VIEWPORTS } from './helpers'

test.use({ viewport: VIEWPORTS.desktop })

test('profile form is operable by keyboard, with visible focus and associated errors', async ({ page }) => {
  await signIn(page)
  const name = page.getByLabel('Nome de exibição')
  await name.focus()
  // Move away and back with the keyboard so :focus-visible applies, as it would for a keyboard user.
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(name).toBeFocused()
  const outline = await name.evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe('none')

  await name.fill('')
  await page.keyboard.press('Tab')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  const describedBy = await name.getAttribute('aria-describedby')
  expect(describedBy).toBeTruthy()
  await expect(page.locator(`[id="${describedBy}"]`)).toContainText('Informe pelo menos 3 caracteres')
})

test('required fields are identified in text for assistive technology', async ({ page }) => {
  await signIn(page)
  await expect(page.getByRole('textbox', { name: 'Nome de exibição (obrigatório)' })).toBeVisible()
})

test('password visibility toggle exposes name and state', async ({ page }) => {
  await signIn(page)
  const toggle = page.getByRole('button', { name: 'Mostrar senha' }).first()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(page.getByRole('button', { name: 'Ocultar senha' }).first()).toHaveAttribute('aria-pressed', 'true')
})
