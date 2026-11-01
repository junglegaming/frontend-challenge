import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { addToCartAndOpenCart, login, prepareCheckout } from './support/helpers'

test.describe('acessibilidade e teclado', () => {
  test('link "Pular para o conteúdo" leva o foco ao conteúdo principal', async ({ page }) => {
    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#conteudo')).toBeFocused()
  })

  test('diálogo de revisão prende o foco, fecha com Esc e devolve o foco', async ({ page }) => {
    await login(page)
    await addToCartAndOpenCart(page)
    await prepareCheckout(page)

    const trigger = page.getByRole('button', { name: 'Confirmar compra' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Revise sua compra' })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator(':focus')).toHaveCount(1)

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('abas do detalhe navegam pelo teclado', async ({ page, isMobile }) => {
    test.skip(isMobile, 'abas existem só no layout desktop')
    await page.goto('/nft/nft-1')
    const details = page.getByRole('tab', { name: 'Detalhes do NFT' })
    await details.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: /Avaliações de colecionadores/ })).toBeFocused()
    await expect(page.getByRole('tabpanel')).toContainText(/Baseado em \d+ avaliações/)
  })

  for (const path of ['/', '/nft/nft-1', '/carrinho', '/login']) {
    test(`axe: sem violações críticas em ${path}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      const critical = results.violations.filter((v) => v.impact === 'critical')
      expect(critical.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    })
  }
})
