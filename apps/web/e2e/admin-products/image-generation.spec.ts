import { expect, test } from '@playwright/test'
import { promoteCurrentUserToAdmin, signIn } from '../design-system/helpers'

test('generating from the same description twice produces an identical image', async ({ page }) => {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)
  await page.goto('/admin/products')

  const form = page.locator('form')
  const promptField = form.getByLabel('Descrição da imagem (para gerar com IA)')
  const preview = form.getByAltText('Pré-visualização da imagem gerada')

  await promptField.fill('paisagem futurista em tons de roxo')
  await form.getByRole('button', { name: 'Gerar imagem' }).click()
  await expect(preview).toBeVisible()
  const firstSrc = await preview.getAttribute('src')

  await promptField.fill('')
  await promptField.fill('paisagem futurista em tons de roxo')
  await form.getByRole('button', { name: 'Gerar imagem' }).click()
  await expect(async () => {
    expect(await preview.getAttribute('src')).toBe(firstSrc)
  }).toPass()
})

test('rejects an empty image description with a clear message', async ({ page }) => {
  await signIn(page)
  await promoteCurrentUserToAdmin(page)
  await page.goto('/admin/products')

  const form = page.locator('form')
  await form.getByRole('button', { name: 'Gerar imagem' }).click()
  await expect(page.getByText('Informe uma descrição para gerar a imagem.')).toBeVisible()
})
