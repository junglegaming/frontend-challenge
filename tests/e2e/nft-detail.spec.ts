import { test, expect as baseExpect, type Page } from '@playwright/test';
import { loginThroughForm, setScenario } from './auth-helpers';

const expect = baseExpect.configure({ timeout: 15_000 });
test.setTimeout(60_000);
const detail = '/nfts/emerald-ape-042';
const buyButton = (page: Page) =>
  page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ });

test('mobile detail keeps its surface background at the end of scrolling', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Mobile purchase bar only');
  for (const width of [390, 414]) {
    await page.setViewportSize({ width, height: 945 });
    for (const id of ['crimson-echo-451', 'emerald-ape-042']) {
      await page.goto(`/nfts/${id}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight)
      );
      const colors = await page.evaluate(() => {
        const purchase = document.querySelector('[aria-label="Comprar NFT"]')!;
        const expected = getComputedStyle(
          document.querySelector('[aria-label="Informações do NFT"]')!
        ).backgroundColor;
        let element = document.elementFromPoint(
          innerWidth / 2,
          purchase.getBoundingClientRect().top - 16
        );
        while (
          element &&
          getComputedStyle(element).backgroundColor === 'rgba(0, 0, 0, 0)'
        )
          element = element.parentElement;
        return {
          actual: element && getComputedStyle(element).backgroundColor,
          expected,
        };
      });
      expect(colors.actual).toBe(colors.expected);
    }
  }
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('gm_scenario'))
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
});

async function openDetail(page: Page, search = '') {
  await page.goto(detail + search);
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042', exact: true })
  ).toBeVisible();
}

async function login(page: Page) {
  await page
    .getByRole('button', { name: 'Favoritar NFT', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Login', exact: true })
  ).toBeVisible();
  await loginThroughForm(page);
  await expect(
    page.getByRole('button', { name: 'Favoritar NFT', exact: true })
  ).toBeEnabled();
}

test('gallery, enlargement and responsive visual composition', async ({
  page,
}, info) => {
  await openDetail(page);
  await page
    .getByRole('button', { name: 'Ver imagem 2', exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page.getByRole('img', { name: 'Emerald Ape #042, imagem 2', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ampliar imagem' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Emerald Ape #042' })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Ampliar imagem' })
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Ver imagem 1', exact: true })
    .filter({ visible: true })
    .click();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page.screenshot({
    path: `test-results/nft-detail-${info.project.name}.png`,
    fullPage: true,
  });
  if (info.project.name === 'mobile') {
    await page.setViewportSize({ width: 414, height: 896 });
    await page.screenshot({ path: 'test-results/nft-detail-mobile-414.png' });
  } else {
    await page
      .getByRole('tab', { name: /Avaliações de colecionadores/ })
      .click();
    await expect(page.getByRole('tabpanel')).toContainText('Ana Costa');
    await page
      .getByRole('tab', { name: 'Detalhes do NFT', exact: true })
      .focus();
    await page.keyboard.press('ArrowRight');
    await expect(
      page.getByRole('tab', { name: /Avaliações de colecionadores/ })
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByLabel('Mais desta coleção').getByRole('link', { name: /^Ver / })
    ).toHaveCount(5);
  }
});

test('quantity is bounded and survives direct URL, refresh and history', async ({
  page,
}) => {
  await openDetail(page, '?qty=5');
  const quantity = page
    .getByLabel('Quantidade', { exact: true })
    .filter({ visible: true });
  await expect(quantity).toHaveText('5');
  await page
    .getByRole('button', { name: 'Aumentar quantidade' })
    .filter({ visible: true })
    .click();
  await expect(quantity).toHaveText('6');
  await page.reload();
  await expect(quantity).toHaveText('6');
  await page.goBack();
  await expect(quantity).toHaveText('5');
  await openDetail(page, '?qty=999');
  await expect(quantity).toHaveText('8');
  await expect(
    page
      .getByRole('button', { name: 'Aumentar quantidade' })
      .filter({ visible: true })
  ).toBeDisabled();
  await openDetail(page, '?qty=invalid');
  await expect(quantity).toHaveText('1');
});

test('unknown NFT and erro-4xx offer a catalog return', async ({ page }) => {
  await page.goto('/nfts/does-not-exist');
  await expect(
    page.getByRole('heading', { name: 'NFT não encontrado' })
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Voltar ao catálogo', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Início', exact: true })
  ).toBeVisible();
  await setScenario(page, 'erro-4xx');
  await page.goto(detail);
  await expect(
    page.getByRole('heading', { name: 'NFT não encontrado' })
  ).toBeVisible();
});

test('loading respects reduced motion and server errors can be retried', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await setScenario(page, 'lento');
  await page.goto(detail);
  const loading = page.getByLabel('Carregando detalhes do NFT', {
    exact: true,
  });
  await expect(loading).toBeVisible();
  await expect(loading.locator('[data-slot="skeleton"]').first()).toHaveCSS(
    'animation-name',
    'none'
  );
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042' })
  ).toBeVisible();
  await setScenario(page, 'erro-5xx');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Não foi possível carregar o NFT' })
  ).toBeVisible();
  await setScenario(page, 'padrao');
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042' })
  ).toBeVisible();
});

test('sold out and unavailable edition block purchase', async ({ page }) => {
  const ids = await page.evaluate(async () => {
    const moduleUrl = '/src/mocks/fixtures/nfts.ts';
    const { SEED_NFTS } = await import(moduleUrl);
    return [
      SEED_NFTS.find((nft: { editable: boolean }) => !nft.editable).id,
      SEED_NFTS.find((nft: { available: number }) => nft.available === 0).id,
    ];
  });
  for (const [index, id] of ids.entries()) {
    await page.goto(`/nfts/${id}`);
    await expect(
      page.getByText(
        index === 0
          ? 'Edição indisponível. A compra desta edição está desativada.'
          : 'Esgotado. Não há exemplares disponíveis.',
        { exact: true }
      )
    ).toBeVisible();
    await expect(buyButton(page)).toBeDisabled();
    await expect(
      page
        .getByRole('button', { name: 'Aumentar quantidade' })
        .filter({ visible: true })
    ).toBeDisabled();
  }
});

for (const authenticated of [false, true])
  test(`purchase adds quantity before navigating (${authenticated ? 'session' : 'guest'})`, async ({
    page,
  }) => {
    await openDetail(page, '?qty=2');
    if (authenticated) await login(page);
    await buyButton(page).click();
    await expect(page).toHaveURL(/\/cart/);
    const cart = await page.evaluate(async () => {
      const moduleUrl = '/src/lib/http/client.ts';
      const { http } = await import(moduleUrl);
      return (await http.get('/api/cart')).data;
    });
    expect(cart.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nftId: 'emerald-ape-042',
          qty: 2,
          lineTotal: '2.38',
        }),
      ])
    );
  });

test('stock conflict preserves the route and suggests remaining quantity', async ({
  page,
}) => {
  await openDetail(page, '?qty=5');
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    await http.post('/api/cart/items', { nftId: 'emerald-ape-042', qty: 6 });
  });
  await buyButton(page).click();
  await expect(
    page.getByText(
      'Você pode adicionar até 2 exemplar(es). Ajustamos a quantidade ao limite disponível.',
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    page.getByLabel('Quantidade', { exact: true }).filter({ visible: true })
  ).toHaveText('2');
  await expect(page).toHaveURL(/\/nfts\/emerald-ape-042/);
  await buyButton(page).click();
  await expect(page).toHaveURL(/\/cart/);
});

test('favorite login return, optimism, rollback and reconciliation', async ({
  page,
}) => {
  await openDetail(page, '?qty=3');
  await login(page);
  expect(new URL(page.url()).pathname).toBe(detail);
  expect(new URL(page.url()).searchParams.get('qty')).toBe('3');
  await page.evaluate(async () => {
    const workerUrl = '/src/mocks/browser.ts';
    const mswUrl = '/node_modules/.vite/deps/msw.js';
    const { worker } = await import(workerUrl);
    const { http, HttpResponse, delay } = await import(mswUrl);
    worker.use(
      http.put('/api/favorites/emerald-ape-042', async () => {
        await delay(1200);
        return HttpResponse.json(
          { error: { code: 'INTERNAL', message: 'Falha de teste' } },
          { status: 500 }
        );
      })
    );
  });
  await page
    .getByRole('button', { name: 'Favoritar NFT', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Remover dos favoritos', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByText('Não foi possível atualizar o favorito. Tente novamente.', {
      exact: true,
    })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Favoritar NFT', exact: true })
  ).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(async () => {
    const moduleUrl = '/src/mocks/browser.ts';
    const { worker } = await import(moduleUrl);
    worker.resetHandlers();
  });
  await page
    .getByRole('button', { name: 'Favoritar NFT', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Remover dos favoritos', exact: true })
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Remover dos favoritos', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Remover dos favoritos', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Favoritar NFT', exact: true })
  ).toBeEnabled();
});

test('socket updates guest price and quantity, rejecting old versions', async ({
  page,
}) => {
  await openDetail(page, '?qty=7');
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const socketUrl = '/src/lib/socket/client.ts';
    const { http } = await import(moduleUrl);
    const { socket } = await import(socketUrl);
    if (!socket.connected)
      await new Promise<void>((resolve) => socket.once('connect', resolve));
    await http.post('/api/_mock/emit', {
      type: 'nft.updated',
      resourceId: 'emerald-ape-042',
      version: 3,
      payload: { price: '2.19', previousPrice: '1.19', available: 2 },
    });
    await http.post('/api/_mock/emit', {
      type: 'nft.updated',
      resourceId: 'emerald-ape-042',
      version: 2,
      payload: { price: '0.01', previousPrice: '1.19', available: 8 },
    });
  });
  await expect(
    page.getByLabel('Quantidade', { exact: true }).filter({ visible: true })
  ).toHaveText('2');
  await expect(
    page.getByText('2.19 ETH', { exact: true }).filter({ visible: true })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('2.19 ETH', { exact: true }).filter({ visible: true })
  ).toBeVisible();
});

test('favorite response cannot roll back a replacement session', async ({
  page,
}) => {
  await openDetail(page);
  await login(page);
  await page.evaluate(async () => {
    const workerUrl = '/src/mocks/browser.ts';
    const mswUrl = '/node_modules/.vite/deps/msw.js';
    const { worker } = await import(workerUrl);
    const { http, HttpResponse, delay } = await import(mswUrl);
    worker.use(
      http.put('/api/favorites/emerald-ape-042', async () => {
        await delay(1800);
        return HttpResponse.json(
          { error: { code: 'INTERNAL', message: 'Delayed failure' } },
          { status: 500 }
        );
      })
    );
  });
  await page
    .getByRole('button', { name: 'Favoritar NFT', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Remover dos favoritos', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(async () => {
    const serviceUrl = '/src/lib/session/service.ts';
    const httpUrl = '/src/lib/http/client.ts';
    const { sessionService } = await import(serviceUrl);
    const { http } = await import(httpUrl);
    await sessionService.logout();
    await sessionService.login({
      email: 'ana@nft-marketplace.test',
      password: 'Ana12345',
    });
    const workerUrl = '/src/mocks/browser.ts';
    const { worker } = await import(workerUrl);
    worker.resetHandlers();
    await http.put('/api/favorites/emerald-ape-042');
    const queryUrl = '/src/lib/query/client.ts';
    const keysUrl = '/src/lib/query/keys.ts';
    const { queryClient } = await import(queryUrl);
    const { keyFactory } = await import(keysUrl);
    await queryClient.invalidateQueries({
      queryKey: keyFactory.favorites.all('usr_ana'),
    });
  });
  await expect(
    page.getByRole('button', { name: 'Remover dos favoritos', exact: true })
  ).toBeEnabled();
  await expect(
    page.getByText(/Tente novamente\.$/, { exact: true })
  ).toHaveCount(0);
});
