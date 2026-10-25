import { ALICE, expect, login, test } from './fixtures'

test('teclado: pular para o conteúdo, foco visível e diálogo com foco contido', async ({ page, isMobile }) => {
  test.skip(isMobile, 'navegação por teclado validada no desktop')
  await page.goto('/')
  await expect(page.locator('#catalogo').getByRole('article').first()).toBeVisible()
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#conteudo/)

  await page.goto('/login')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(page).not.toHaveURL(/auth=/)
})

test('formulário anuncia erros associados aos campos', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  const email = page.getByLabel('E-mail', { exact: true })
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  const describedBy = await email.getAttribute('aria-describedby')
  expect(describedBy).toBeTruthy()
  await expect(page.locator(`#${describedBy}`)).toContainText(/e-mail/i)
})

test('sem overflow horizontal nas telas principais', async ({ page }) => {
  await login(page, ALICE, '/')
  for (const url of ['/', '/nft/emerald-ape-042', '/cart', '/checkout', '/profile', '/wallets']) {
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    // compara com a largura do dispositivo: no mobile, conteúdo vazado amplia o próprio innerWidth
    const width = page.viewportSize()!.width
    expect(await page.evaluate(() => [window.innerWidth, document.documentElement.scrollWidth]), url).toEqual([width, width])
  }
})

test.describe('carregamento lento', () => {
  test.use({ scenario: 'slow' })
  test('skeletons com shimmer preservam o layout', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.shimmer').filter({ visible: true }).first()).toBeVisible()
    await expect(page.locator('#catalogo').getByRole('article').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('#catalogo .shimmer')).toHaveCount(0)
  })
})

test.describe('falha transitória do servidor', () => {
  test.use({ scenario: 'server-error' })
  test('mostra o erro e recupera ao tentar novamente', async ({ page }) => {
    await page.goto('/')
    const retry = page.getByRole('button', { name: 'Tentar novamente' })
    await expect(retry).toBeVisible({ timeout: 15_000 })
    await retry.click()
    await expect(page.locator('#catalogo').getByRole('article').first()).toBeVisible()
  })
})

test.describe('sem conexão', () => {
  test.use({ scenario: 'offline' })
  test('informa a falha de rede', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Sem conexão com o servidor').first()).toBeVisible({ timeout: 15_000 })
  })
})
