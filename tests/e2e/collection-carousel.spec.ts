import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gm_scenario', 'padrao');
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = '[aria-label="Controle dos mocks"] { display:none }';
      document.head.append(style);
    });
  });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Destaques' })).toBeVisible();
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    await http.post('/api/_mock/reset');
  });
});

test('collection drag preserves cards, pagination, keyboard and link activation', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Collection is desktop only');
  await page.goto('/nfts/emerald-ape-042');
  const carousel = page.getByRole('region', { name: 'NFTs da mesma coleção' });
  const first = carousel.getByRole('button', {
    name: 'Ver página 1 da coleção',
  });
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(carousel.getByRole('link')).toHaveCount(5);
  const pages = await carousel.getByRole('button').count();
  expect(pages).toBeGreaterThan(1);
  await carousel.scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const card = carousel.getByRole('link').last();
  const bounds = await card.boundingBox();
  if (!bounds) throw new Error('Card without bounds');
  const y = bounds.y + 70;
  await page.mouse.move(bounds.x + bounds.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(bounds.x - 700, y, { steps: 18 });
  await page.mouse.up();
  await expect(first).toHaveAttribute('aria-pressed', 'false');
  await expect(page).toHaveURL(/\/nfts\/emerald-ape-042(?:\?qty=1)?$/);
  await expect(carousel.getByRole('button', { pressed: true })).toHaveCount(1);
  expect(await carousel.getByRole('button').count()).toBe(pages);
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await carousel.focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    carousel.getByRole('button', { name: 'Ver página 2 da coleção' })
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('End');
  await expect(
    carousel.getByRole('button', { name: `Ver página ${pages} da coleção` })
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(
    carousel.getByRole('button', { name: `Ver página ${pages} da coleção` })
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Home');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(carousel.getByRole('link')).toHaveCount(5);
  const lastVisible = carousel.getByRole('link').last();
  await lastVisible.focus();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await carousel.screenshot({
    path: info.outputPath('collection-carousel.png'),
  });
  await carousel.getByRole('link').first().click();
  await expect(page).not.toHaveURL(/\/nfts\/emerald-ape-042(?:\?qty=1)?$/);
});
