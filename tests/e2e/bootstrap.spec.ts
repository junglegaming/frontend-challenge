import { expect, test } from '@playwright/test';

test('bootstrap checks MSW health through Axios before rendering', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('gm_scenario', 'padrao'));
  const health = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/_health'
  );
  await page.goto('/');
  const response = await health;
  expect(response.fromServiceWorker()).toBe(true);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  await expect(
    page.getByRole('heading', { name: 'Início', exact: true })
  ).toBeVisible();
  const resetStatus = await page.evaluate(
    async () => (await fetch('/api/_mock/reset', { method: 'POST' })).status
  );
  expect(resetStatus).toBe(200);
});
