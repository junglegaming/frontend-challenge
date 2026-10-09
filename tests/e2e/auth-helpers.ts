import { expect, type Page } from '@playwright/test';

export async function loginThroughForm(
  page: Page,
  email = 'ana@nft-marketplace.test',
  password = 'Ana12345'
) {
  const form = page.getByRole('form', { name: 'Formulário de login' });
  await form.getByLabel('E-mail', { exact: true }).fill(email);
  await form.getByLabel('Senha', { exact: true }).fill(password);
  await form.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Login', exact: true })
  ).toHaveCount(0);
}

export async function setScenario(page: Page, id: string) {
  await page.evaluate(async (id) => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    await http.post('/api/_mock/scenario', { id });
  }, id);
}
