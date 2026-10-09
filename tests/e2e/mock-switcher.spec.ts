import { expect, test } from '@playwright/test';

test('mock switcher can collapse and expand with the keyboard', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('gm_scenario', 'padrao'));
  await page.goto('/');
  await page.evaluate(async () => {
    await fetch('/api/_mock/reset', { method: 'POST' });
  });
  await page.reload();

  const panel = page.getByRole('complementary', { name: 'Controle dos mocks' });
  const select = panel.getByRole('combobox', { name: 'Cenário' });
  const toggle = panel.getByRole('button', {
    name: 'Ocultar controle dos mocks',
  });
  await expect(select).toHaveValue('padrao');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.focus();
  await page.keyboard.press('Enter');

  const expand = panel.getByRole('button', {
    name: 'Mostrar controle dos mocks',
  });
  await expect(expand).toBeVisible();
  await expect(expand).toBeFocused();
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
  await expect(select).toBeHidden();
  await expect(
    panel.getByRole('button', { name: 'Reset cenário' })
  ).toBeHidden();
  await page.keyboard.press('Space');

  await expect(select).toBeVisible();
  await expect(select).toHaveValue('padrao');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(
    panel.getByRole('button', { name: 'Reset cenário' })
  ).toBeVisible();
});
