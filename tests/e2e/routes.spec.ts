import { test, expect as baseExpect } from '@playwright/test';
import { loginThroughForm } from './auth-helpers';
const expect = baseExpect.configure({ timeout: 15_000 });
const routes = [
  ['/', 'Início'],
  ['/teste', 'Início'],
  ['/nfts/golden-signal-160', 'Golden Signal #160'],
  ['/nfts/sample', 'NFT não encontrado'],
  ['/cart', 'Carrinho de NFTs'],
  ['/login', 'Login'],
  ['/signup', 'Cadastro'],
  ['/not-found', '404'],
  ['/unknown', '404'],
];
const privateRoutes = [
  ['/checkout', 'Início / Mercado / Pagamento'],
  ['/orders/sample', 'Não foi possível consultar o pedido'],
  ['/profile', 'Perfil'],
  ['/wallets', 'Carteiras'],
];
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
  await expect(
    page.getByRole('heading', { name: 'Início', exact: true })
  ).toBeVisible({ timeout: 15_000 });
  // MSW runs in the browser, so reset uses a browser request rather than APIRequestContext.
  const status = await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    return (await http.post('/api/_mock/reset')).status;
  });
  expect(status).toBe(200);
});
for (const [path, title] of routes)
  test(`direct URL and refresh ${path}`, async ({ page, isMobile }) => {
    const visibleTitle =
      path === '/cart' && !isMobile ? 'Início / Mercado / Carrinho' : title;
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: visibleTitle, exact: true })
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: visibleTitle, exact: true })
    ).toBeVisible();
  });
for (const [path, title] of privateRoutes)
  test(`guard and return ${path}`, async ({ page }) => {
    const target = path + '?draft=abc#review';
    await page.goto(target);
    await expect(
      page.getByRole('heading', { name: 'Login', exact: true })
    ).toBeVisible();
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(target);
    await loginThroughForm(page);
    await expect(page).toHaveURL(
      new RegExp(path.replaceAll('/', '\\/') + '\\?draft=abc#review$')
    );
    await expect(
      page.getByRole('heading', { name: title, exact: true })
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: title, exact: true })
    ).toBeVisible();
    if (path.startsWith('/orders/')) {
      await page.goto('/cart');
      await expect(
        page.getByRole('heading', { name: /Carrinho/ })
      ).toBeVisible();
    }
    await page
      .getByRole('button', { name: 'Sair', exact: true })
      .filter({ visible: true })
      .click();
    if (path.startsWith('/orders/')) {
      await page
        .getByRole('button', { name: 'Entrar', exact: true })
        .filter({ visible: true })
        .click();
    }
    await expect(
      page.getByRole('heading', { name: 'Login', exact: true })
    ).toBeVisible();
  });
test('catalog URL survives refresh and back/forward; filters reset page', async ({
  page,
}) => {
  await page.goto('/teste?q=abc&page=2');
  const state = page.getByLabel('Filtros atuais');
  await expect(state).toContainText('"q": "abc"');
  await expect(state).toContainText('"page": 2');
  await page.reload();
  await expect(state).toContainText('"page": 2');
  await page.getByRole('button', { name: 'Buscar cyberpunk' }).click();
  await expect(state).toContainText('"page": 1');
  await page.goBack();
  await expect(state).toContainText('"q": "abc"');
  await expect(state).toContainText('"page": 2');
  await page.goForward();
  await expect(state).toContainText('cyberpunk');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(state).toContainText('Arte digital');
  await expect(state).toContainText('"page": 1');
  await page.reload();
  await expect(state).toContainText('Arte digital');
  await expect(state).not.toContainText('Colecionáveis');
});
test('quantity survives refresh and history', async ({ page }) => {
  await page.goto('/nfts/golden-signal-160?qty=5');
  const qty = page
    .getByLabel('Quantidade', { exact: true })
    .filter({ visible: true });
  await expect(qty).toHaveText('5');
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(qty).toHaveText('6');
  await page.reload();
  await expect(qty).toHaveText('6');
  await page.goBack();
  await expect(qty).toHaveText('5');
});
test('external redirect is rejected', async ({ page }) => {
  await page.goto('/login?redirect=' + encodeURIComponent('//evil.com'));
  await loginThroughForm(page);
  await expect(
    page.getByRole('heading', { name: 'Início', exact: true })
  ).toBeVisible();
});
test('expired and malformed sessions cannot access private routes', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/teste');
  await page
    .getByRole('button', { name: 'Simular Login Rápido (Ana)', exact: true })
    .click();
  await expect(page.getByText('Ativa (Ana', { exact: false })).toBeVisible();
  await page.clock.fastForward(2 * 60 * 60 * 1000 + 1);
  await page.goto('/checkout');
  await expect(
    page.getByRole('heading', { name: 'Login', exact: true })
  ).toBeVisible();
  await page.evaluate(() => localStorage.setItem('gm_session', '{invalid'));
  await page.goto('/profile');
  await expect(
    page.getByRole('heading', { name: 'Login', exact: true })
  ).toBeVisible();
});
test('all marketplace screens reachable by click', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/teste');
  await page
    .getByRole('button', { name: 'Simular Login Rápido (Ana)', exact: true })
    .click();
  await expect(page.getByText('Ativa (Ana', { exact: false })).toBeVisible();
  for (const name of [
    'Detalhes NFT (#1)',
    'Carrinho',
    'Pagamento (Privada)',
    'Confirmação (Privada)',
    'Login',
    'Cadastro',
    'Perfil (Privada)',
    'Carteiras (Privada)',
    '404 (Rota Inexistente)',
  ]) {
    await page.goto('/teste');
    await page
      .locator('section')
      .filter({
        has: page.getByRole('heading', {
          name: 'Navegação entre rotas do Marketplace',
        }),
      })
      .getByRole('link', { name, exact: true })
      .evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await page
      .locator('section')
      .filter({
        has: page.getByRole('heading', { name: /Navega.*Marketplace/ }),
      })
      .getByRole('link', { name, exact: true })
      .click();
    await expect(page.locator('h1')).toBeVisible();
    if (name === 'Login' || name === 'Cadastro') {
      await page.keyboard.press('Escape');
      await page.goto('/teste');
    }
    if (name === '404 (Rota Inexistente)')
      await page
        .getByRole('link', { name: 'Voltar para a página inicial' })
        .click();
  }
});
