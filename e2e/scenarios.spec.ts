import { expect, test } from '@playwright/test'

test('carregamento lento exibe skeleton e depois os dados', async ({ page }) => {
  await page.goto('/?scenario=slow')

  await expect(page.getByRole('status', { name: /Carregando/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Emerald Ape/i }).first()).toBeVisible({
    timeout: 10_000,
  })
})

test('falha de conexão exibe erro e recupera com nova tentativa', async ({ page }) => {
  await page.goto('/?scenario=offline')

  await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 })

  await page.evaluate(() => window.__kurio!.applyScenario('default'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()

  await expect(page.getByRole('link', { name: /Emerald Ape/i }).first()).toBeVisible({
    timeout: 10_000,
  })
})

test('latência variável: a resposta antiga não sobrescreve o filtro atual', async ({ page }) => {
  await page.goto('/?scenario=latency')
  await expect(page.getByRole('link', { name: /Emerald Ape/i }).first()).toBeVisible({
    timeout: 10_000,
  })
  // Duas trocas rápidas: a primeira resposta (mais lenta) chega depois da segunda.
  await page.getByRole('radio', { name: /Fotografia/ }).check()
  await page.getByRole('radio', { name: /Arte digital/ }).check()
  await page.waitForURL(/collection=Arte/)
  await page.waitForTimeout(2000)
  await expect(page.getByRole('radio', { name: /Arte digital/ })).toBeChecked()
  await expect(page.getByRole('link', { name: /Ape/i }).first()).toBeVisible()
})

test('erro 5xx do servidor exibe falha e recupera', async ({ page }) => {
  await page.goto('/?scenario=server_error')
  await expect(
    page.getByRole('alert').filter({ hasText: 'Não foi possível carregar' }),
  ).toBeVisible({
    timeout: 15_000,
  })
  await page.evaluate(() => window.__kurio!.applyScenario('default'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('link', { name: /Emerald Ape/i }).first()).toBeVisible()
})
