import { test, expect } from '@playwright/test';
import { loginThroughForm } from './auth-helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gm_scenario', 'padrao');
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent =
        '[aria-label="Controle dos mocks"] { display: none; }';
      document.head.append(style);
    });
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Início', exact: true })
  ).toBeVisible();
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    await http.post('/api/_mock/reset');
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Início', exact: true })
  ).toBeVisible();
});

test('navigation is mobile only and restricted to catalog', async ({
  page,
}, info) => {
  const nav = page.getByRole('navigation', { name: 'Navegação mobile' });
  if (info.project.name === 'desktop') {
    await expect(nav).toBeHidden();
    return;
  }
  await expect(nav).toBeVisible();
  await expect(nav.locator('a, button')).toHaveCount(5);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  for (const action of await nav.locator('a, button').all()) {
    const box = await action.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: 'test-results/mobile-navigation-320.png' });
  await nav.getByRole('link', { name: 'Carrinho', exact: true }).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(nav).toHaveCount(0);
});

test('profile and wallets login preserve destination and focus', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  const nav = page.getByRole('navigation', { name: 'Navegação mobile' });
  const profile = nav.getByRole('button', { name: 'Perfil', exact: true });
  await profile.click();
  await expect(
    page.getByRole('dialog', { name: 'Login', exact: true })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(profile).toBeFocused();
  await profile.click();
  await loginThroughForm(page);
  await expect(page).toHaveURL(/\/profile/);
  await page.goto('/');
  await nav.getByRole('link', { name: 'Carteiras', exact: true }).click();
  await expect(page).toHaveURL(/\/wallets/);
});

test('wallets opens login for visitors and resumes its destination', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await page
    .getByRole('navigation', { name: 'Navegação mobile' })
    .getByRole('button', { name: 'Carteiras', exact: true })
    .click();
  await loginThroughForm(page);
  await expect(page).toHaveURL(/\/wallets/);
});

test('favorites login, pagination, reset and logout', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  const nav = page.getByRole('navigation', { name: 'Navegação mobile' });
  await nav.getByRole('button', { name: 'Favoritos', exact: true }).click();
  await loginThroughForm(page, 'bruno@nft-marketplace.test', 'Bruno1234');
  await expect(page).toHaveURL(/favoritesOnly=true/);
  await expect(
    page.getByText('Nenhum favorito encontrado', { exact: true })
  ).toBeVisible();
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    const { data } = await http.get('/api/nfts', { params: { pageSize: 12 } });
    for (const nft of data.items) await http.put(`/api/favorites/${nft.id}`);
  });
  await page.reload();
  const cards = page
    .getByLabel('NFTs do catálogo')
    .getByRole('link', { name: /^Ver / });
  await expect(cards).toHaveCount(9);
  await page.getByRole('button', { name: 'Página 2', exact: true }).click();
  await expect(cards).toHaveCount(3);
  await nav.getByRole('button', { name: 'Favoritos', exact: true }).click();
  await expect(
    nav.getByRole('link', { name: 'Início', exact: true })
  ).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('button', { name: 'Favoritos', exact: true }).click();
  await expect(cards).toHaveCount(9);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).not.toHaveURL(/favoritesOnly/);
  await expect(cards).toHaveCount(9);
});
