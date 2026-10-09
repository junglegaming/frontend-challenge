import { test, expect } from '@playwright/test';

test('typography classes can be copied with accessible feedback', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => localStorage.setItem('gm_scenario', 'padrao'));
  await page.goto('/tokens');
  await expect(
    page.getByRole('heading', { name: 'Design Tokens Showcase' })
  ).toBeVisible();
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    await http.post('/api/_mock/reset');
  });
  await expect(
    page.getByRole('button', { name: /^Copiar classe / })
  ).toHaveCount(23);
  const body17RegularSample = page.getByText(
    'Regular body text — 17px / 24px',
    { exact: true }
  );
  await expect(body17RegularSample).toHaveCSS('font-size', '17px');
  await expect(body17RegularSample).toHaveCSS('line-height', '24px');
  await expect(body17RegularSample).toHaveCSS('font-weight', '400');
  const stepper = page.getByRole('region', { name: 'QuantityStepper size sm' });
  await expect(stepper.getByLabel('Quantidade', { exact: true })).toHaveCSS(
    'font-size',
    '17px'
  );
  await expect(stepper.getByLabel('Quantidade', { exact: true })).toHaveCSS(
    'font-weight',
    '400'
  );
  for (const name of ['Diminuir quantidade', 'Aumentar quantidade']) {
    const button = stepper.getByRole('button', { name });
    await expect(button).toHaveCSS('width', '20px');
    await expect(button).toHaveCSS('height', '30px');
    const icon = button.locator('svg');
    await expect(icon).toHaveCSS('width', '16px');
    await expect(icon).toHaveCSS('height', '16px');
  }
  await stepper.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(stepper.getByLabel('Quantidade', { exact: true })).toHaveText(
    '3'
  );
  const tinyBoldSample = page.getByText('Bold tiny text — 9px / 11.9px', {
    exact: true,
  });
  await expect(tinyBoldSample).toHaveCSS('font-size', '9px');
  await expect(tinyBoldSample).toHaveCSS('line-height', '11.9px');
  await expect(tinyBoldSample).toHaveCSS('font-weight', '700');
  await expect(tinyBoldSample).toHaveCSS('letter-spacing', 'normal');
  const body18Sample = page.getByText('Bold body text — 18px / 16px', {
    exact: true,
  });
  await expect(body18Sample).toHaveCSS('font-size', '18px');
  await expect(body18Sample).toHaveCSS('line-height', '16px');
  await expect(body18Sample).toHaveCSS('font-weight', '700');
  await expect(body18Sample).toHaveCSS('letter-spacing', 'normal');
  const body17Sample = page.getByText('Bold body text — 17px / 16px', {
    exact: true,
  });
  await expect(body17Sample).toHaveCSS('font-size', '17px');
  await expect(body17Sample).toHaveCSS('line-height', '16px');
  await expect(body17Sample).toHaveCSS('font-weight', '700');
  await expect(body17Sample).toHaveCSS('letter-spacing', 'normal');
  const body18RegularSample = page.getByText(
    'Regular body text — 18px / 16px',
    {
      exact: true,
    }
  );
  await expect(body18RegularSample).toHaveCSS('font-size', '18px');
  await expect(body18RegularSample).toHaveCSS('line-height', '16px');
  await expect(body18RegularSample).toHaveCSS('font-weight', '400');
  await expect(body18RegularSample).toHaveCSS('letter-spacing', 'normal');
  await page
    .getByRole('button', { name: 'Copiar classe text-body-bold', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('text-body-bold');
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Classe text-body-bold copiada.' })
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: () => Promise.reject(new Error('Clipboard unavailable')),
    });
  });
  await page
    .getByRole('button', { name: 'Copiar classe text-title', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Não foi possível copiar.' })
  ).toBeVisible();
});
