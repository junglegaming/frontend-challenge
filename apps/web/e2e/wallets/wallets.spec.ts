import { expect, test } from '@playwright/test'
import { hasNoHorizontalScroll, runAxe, signIn, VIEWPORTS } from '../design-system/helpers'

test('redirect round-trips through a protected route', async ({ page }) => {
  await page.goto('/account/wallets')
  await expect(page).toHaveURL(/\/login\?redirect=/)

  const unique = Date.now().toString(36)
  await page.getByRole('tab', { name: 'Criar conta' }).click()
  await page.getByLabel('Nome de usuário').fill(`user_${unique}`)
  await page.getByLabel('E-mail').fill(`${unique}@nft.dev`)
  await page.getByLabel(/^Senha/).fill('Senha1234')
  await page.getByLabel('Confirmar senha').fill('Senha1234')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL('/account/wallets')
})

test('saves the primary wallet and it persists on reload', async ({ page }) => {
  await signIn(page)
  await page.goto('/account/wallets')

  await page.getByLabel('Apelido da carteira').fill('Carteira principal')
  await page.getByLabel('Tipo de carteira').selectOption('metamask')
  await page.getByPlaceholder('Endereço 0x da carteira').fill(`0x${'3'.repeat(40)}`)
  await page.getByLabel('Ethereum').check()
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva.')).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Apelido da carteira')).toHaveValue('Carteira principal')
  await expect(page.getByPlaceholder('Endereço 0x da carteira')).toHaveValue(`0x${'3'.repeat(40)}`)
})

test('adding a secondary wallet "igual à carteira principal" copies its values', async ({ page }) => {
  await signIn(page)
  await page.goto('/account/wallets')

  await page.getByLabel('Apelido da carteira').fill('Carteira principal')
  await page.getByLabel('Tipo de carteira').selectOption('metamask')
  await page.getByPlaceholder('Endereço 0x da carteira').fill(`0x${'4'.repeat(40)}`)
  await page.getByLabel('Ethereum').check()
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva.')).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar' }).click()
  await page.getByLabel('Igual à carteira principal').check()
  const secondaryAddress = page.getByPlaceholder('Endereço 0x da carteira').nth(1)
  await expect(secondaryAddress).toHaveValue(`0x${'4'.repeat(40)}`)
})

test('wallets page has no critical accessibility violations', async ({ page }) => {
  await signIn(page)
  await page.goto('/account/wallets')
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  expect(await runAxe(page)).toEqual([])
})

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${name} (${viewport.width}px)`, () => {
    test.use({ viewport })

    test('wallets renders without horizontal scroll and matches its baseline', async ({ page }) => {
      await signIn(page)
      await page.goto('/account/wallets')
      await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
      expect(await hasNoHorizontalScroll(page)).toBe(true)
      await expect(page).toHaveScreenshot(`wallets-${viewport.width}.png`, { fullPage: true })
    })
  })
}
