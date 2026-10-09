import { test, expect, type Page } from '@playwright/test';
import { setScenario } from './auth-helpers';

test.setTimeout(60_000);
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('gm_scenario'))
      localStorage.setItem('gm_scenario', 'padrao');
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = '[aria-label="Controle dos mocks"] { display:none }';
      document.head.append(style);
    });
  });
  await page.goto('/cart');
  await expect(
    page.getByRole('heading', { name: 'Carrinho de NFTs', includeHidden: true })
  ).toBeAttached({ timeout: 20_000 });
  await page.evaluate(async () => {
    const url = '/src/lib/http/client.ts';
    const { http } = await import(url);
    await http.post('/api/_mock/reset');
  });
});

test('responsive cart keeps items and the complete summary reachable', async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(async () => {
    const url = '/src/lib/http/client.ts';
    const { http } = await import(url);
    for (const nftId of ['violet-nomad-314', 'golden-signal-160']) {
      await http.post('/api/cart/items', { nftId, qty: 1 });
    }
  });
  await page.reload();
  const summary = page.getByRole('region', { name: 'Resumo da carteira' });
  await expect(summary.getByText('0.0042 ETH', { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const clientUrl = '/src/lib/http/client.ts';
    const workerUrl = '/src/mocks/browser.ts';
    const mswUrl = '/node_modules/.vite/deps/msw.js';
    const queryUrl = '/src/lib/query/client.ts';
    const keysUrl = '/src/lib/query/keys.ts';
    const { http: client } = await import(clientUrl);
    const { worker } = await import(workerUrl);
    const { http, HttpResponse } = await import(mswUrl);
    const { queryClient } = await import(queryUrl);
    const { keyFactory } = await import(keysUrl);
    const { data } = await client.get('/api/cart');
    data.items[0].name = 'Emerald Ape com um nome muito longo #042';
    data.version += 1;
    worker.use(http.get('/api/cart', () => HttpResponse.json(data)));
    await queryClient.invalidateQueries({ queryKey: keyFactory.cart() });
  });

  for (const width of [390, 414, 768, 1440, 195]) {
    await page.setViewportSize({ width, height: 844 });
    const mobile = width < 768;
    await expect(
      page.getByRole(mobile ? 'list' : 'table', { name: 'Itens do carrinho' })
    ).toBeVisible();
    const panel = page.locator('[data-cart-summary-panel]');
    await expect(panel).toHaveCSS('position', mobile ? 'fixed' : 'static');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    if (mobile) {
      await expect(page.getByRole('listitem').first()).toContainText(
        'Emerald Ape com um nome muito longo #042'
      );
      await expect(page.getByRole('listitem')).toHaveCount(3);
      await expect(page.getByRole('listitem').first()).toContainText(
        'Edição: 1/50'
      );
      await expect(page.getByRole('listitem').first()).toContainText(
        '2.38 ETH'
      );
      await expect
        .poll(async () => {
          const panelBox = await panel.boundingBox();
          const spacerBox = await page
            .locator('[data-cart-summary-spacer]')
            .boundingBox();
          return Math.abs((panelBox?.height ?? 0) - (spacerBox?.height ?? 0));
        })
        .toBeLessThan(1);
      const remove = page
        .getByRole('listitem')
        .last()
        .getByRole('button', { name: /^Remover / });
      await remove.scrollIntoViewIfNeeded();
      await remove.focus();
      const box = await remove.boundingBox();
      const panelBox = await panel.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(panelBox!.y);
      const finish = summary.getByRole('link', {
        name: 'Conectar e finalizar',
        exact: true,
      });
      await finish.scrollIntoViewIfNeeded();
      await finish.focus();
      await expect(finish).toBeInViewport();
    }
  }
  await page.setViewportSize({ width: 390, height: 400 });
  await summary.getByLabel('Código promocional', { exact: true }).focus();
  await summary.getByRole('button', { name: 'Aplicar', exact: true }).focus();
  await expect(
    summary.getByRole('button', { name: 'Aplicar', exact: true })
  ).toBeInViewport();
  await summary
    .getByRole('link', { name: 'Conectar e finalizar', exact: true })
    .focus();
  await expect(
    summary.getByRole('link', { name: 'Conectar e finalizar', exact: true })
  ).toBeInViewport();
});
async function seed(page: Page, id = 'emerald-ape-042', qty = 2) {
  await page.evaluate(
    async ({ id, qty }) => {
      const url = '/src/lib/http/client.ts';
      const { http } = await import(url);
      await http.post('/api/cart/items', { nftId: id, qty });
    },
    { id, qty }
  );
  await page.reload();
  await expect(page.getByLabel('Resumo da cotação')).toBeVisible({
    timeout: 20_000,
  });
}
test('header cart count follows quantities, refresh and removal', async ({
  page,
}) => {
  await seed(page);
  const cartLink = page.locator('header a[href="/cart"]');
  const badge = cartLink.locator('[data-slot="icon-badge-count"]');
  await expect(badge).toHaveText('2');
  await expect(cartLink).toHaveAttribute('aria-label', 'Carrinho, 2 itens');
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(badge).toHaveText('3');
  await page.reload();
  await expect(badge).toHaveText('3');
  await page.getByRole('button', { name: 'Diminuir quantidade' }).click();
  await expect(badge).toHaveText('2');
  // The header and dedicated remove action are displayed on desktop.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Remover Emerald Ape #042' }).click();
  await expect(badge).toHaveCount(0);
  await expect(cartLink).toHaveAttribute('aria-label', 'Carrinho');
});

test('CRUD, server totals and persistence', async ({ page }, info) => {
  await seed(page);
  const table = page.getByRole('table', { name: 'Itens do carrinho' });
  if (info.project.name === 'desktop')
    await expect(table.getByRole('columnheader')).toHaveText([
      'NFT',
      'Preço',
      'Edições',
      'Total',
      '',
    ]);
  const item = page.getByRole(
    info.project.name === 'desktop' ? 'row' : 'listitem',
    {
      name: 'Emerald Ape #042',
      exact: true,
    }
  );
  await expect(item.getByLabel('Quantidade', { exact: true })).toHaveText('2');
  await item.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(item.getByLabel('Quantidade', { exact: true })).toHaveText('3');
  await expect(page.getByLabel('Resumo da cotação')).toContainText(
    '3.5742 ETH'
  );
  await page.reload();
  await expect(item.getByLabel('Quantidade', { exact: true })).toHaveText('3');
  await item.getByRole('button', { name: 'Diminuir quantidade' }).click();
  await expect(item.getByLabel('Quantidade', { exact: true })).toHaveText('2');
  await item.getByRole('button', { name: 'Remover Emerald Ape #042' }).click();
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Explorar catálogo' })
  ).toBeVisible();
});
test('coupon apply, remove, invalid and expired', async ({ page }) => {
  await seed(page);
  const input = page.getByLabel('Código promocional', { exact: true });
  await input.fill('launch10');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(page.getByLabel('Resumo da cotação')).toContainText(
    '2.1462 ETH'
  );
  await page.getByRole('button', { name: 'Remover cupom' }).click();
  await expect(page.getByLabel('Resumo da cotação')).toContainText(
    '2.3842 ETH'
  );
  await input.fill('EXPIRED');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(
    page.getByText('Cupom expirado. O cupom foi removido.', { exact: true })
  ).toBeVisible();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await setScenario(page, 'cupom-ruim');
  await input.fill('LAUNCH10');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(
    page.getByText('Cupom inválido.', { exact: true })
  ).toBeVisible();
  await expect(page.getByLabel('Resumo da cotação')).toContainText(
    '2.3842 ETH'
  );
});
test('visitor cart merges on login', async ({ page }, info) => {
  await seed(page);
  await page.evaluate(async () => {
    const url = '/src/lib/session/service.ts';
    const { sessionService } = await import(url);
    await sessionService.login({
      email: 'ana@nft-marketplace.test',
      password: 'Ana12345',
    });
  });
  await expect(
    page
      .getByRole(info.project.name === 'desktop' ? 'row' : 'listitem', {
        name: 'Emerald Ape #042',
        exact: true,
      })
      .getByLabel('Quantidade', { exact: true })
  ).toHaveText('2');
  await page.reload();
  await expect(
    page.getByRole('link', { name: 'Finalizar compra', exact: true })
  ).toBeVisible();
});
test('preco-muda announces new price and refreshes quote', async ({ page }) => {
  await setScenario(page, 'preco-muda');
  await seed(page, 'golden-signal-160', 1);
  await expect(
    page.getByText(/preço alterado de 0.99 ETH para 1.19 ETH/)
  ).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByLabel('Resumo da cotação')).toContainText(
    '1.1942 ETH'
  );
});
test('stock conflict preserves quantity and updates limit', async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(async () => {
    const workerUrl = '/src/mocks/browser.ts';
    const mswUrl = '/node_modules/.vite/deps/msw.js';
    const { worker } = await import(workerUrl);
    const { http, HttpResponse } = await import(mswUrl);
    worker.use(
      http.patch('/api/cart/items/emerald-ape-042', () =>
        HttpResponse.json(
          {
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: 'Quantidade indisponível',
            },
          },
          { status: 409 }
        )
      )
    );
  });
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Mantivemos' })
  ).toBeVisible();
  await expect(page.getByLabel('Quantidade', { exact: true })).toHaveText('2');
  await expect(
    page.getByRole('button', { name: 'Aumentar quantidade' })
  ).toBeEnabled();
  const available = await page.evaluate(async () => {
    const queryPath = '/src/lib/query/client.ts';
    const keysPath = '/src/lib/query/keys.ts';
    const { queryClient } = await import(queryPath);
    const { keyFactory } = await import(keysPath);
    return queryClient
      .getQueryData(keyFactory.cart())
      ?.items.find(
        (item: { nftId: string }) => item.nftId === 'emerald-ape-042'
      )?.available;
  });
  expect(available).toBe(8);
});
test('cart error supports retry', async ({ page }) => {
  await page.evaluate(async () => {
    const workerUrl = '/src/mocks/browser.ts';
    const mswUrl = '/node_modules/.vite/deps/msw.js';
    const queryUrl = '/src/lib/query/client.ts';
    const keysUrl = '/src/lib/query/keys.ts';
    const { worker } = await import(workerUrl);
    const { http, HttpResponse } = await import(mswUrl);
    const { queryClient } = await import(queryUrl);
    const { keyFactory } = await import(keysUrl);
    worker.use(
      http.get('/api/cart', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Falha transitória' } },
          { status: 500 }
        )
      )
    );
    await queryClient.invalidateQueries({ queryKey: keyFactory.cart() });
  });
  await expect(
    page.getByText('Não foi possível carregar o carrinho.', { exact: true })
  ).toBeVisible({ timeout: 20_000 });
  await page.evaluate(async () => {
    const workerUrl = '/src/mocks/browser.ts';
    const { worker } = await import(workerUrl);
    worker.resetHandlers();
  });
  await page
    .getByRole('alert')
    .filter({ hasText: /carregar o carrinho/ })
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click();
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible();
});

test('applied coupon expiration removes discount automatically', async ({
  page,
}) => {
  await seed(page);
  await page.getByLabel('Código promocional', { exact: true }).fill('LAUNCH10');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(page.getByLabel('Resumo da cotação')).toContainText(
    '2.1462 ETH'
  );
  await page.evaluate(async () => {
    const workerUrl = '/src/mocks/browser.ts';
    const mswUrl = '/node_modules/.vite/deps/msw.js';
    const clientUrl = '/src/lib/query/client.ts';
    const keysUrl = '/src/lib/query/keys.ts';
    const { worker } = await import(workerUrl);
    const { http, HttpResponse } = await import(mswUrl);
    worker.use(
      http.post(
        '/api/cart/quote',
        async ({ request }: { request: Request }) => {
          const body = await request.json();
          if (body.coupon) {
            worker.resetHandlers();
            return HttpResponse.json(
              {
                error: { code: 'COUPON_EXPIRED', message: 'Cupom expirado' },
              },
              { status: 410 }
            );
          }
        }
      )
    );
    const { queryClient } = await import(clientUrl);
    const { keyFactory } = await import(keysUrl);
    await queryClient.invalidateQueries({ queryKey: keyFactory.quotes });
  });
  await expect(
    page.getByText('Cupom expirado. O cupom foi removido.', { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText('Cupom aplicado: LAUNCH10', { exact: true })
  ).toHaveCount(0);
  await expect(page.getByLabel('Resumo da cotação')).toContainText(
    '2.3842 ETH'
  );
});

test('stock event rejects old versions and allows reducing to the new limit', async ({
  page,
}) => {
  await seed(page, 'emerald-ape-042', 3);
  await page.evaluate(async () => {
    const url = '/src/lib/http/client.ts';
    const socketUrl = '/src/lib/socket/client.ts';
    const { http } = await import(url);
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
    page.getByText(
      'Quantidade acima do estoque. Reduza para até 2 ou remova o item.',
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    page.getByText(
      'Estoque insuficiente. Ajuste ou remova os itens indisponíveis.',
      { exact: true }
    )
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Conectar e finalizar', exact: true })
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Diminuir quantidade' }).click();
  await expect(page.getByLabel('Quantidade', { exact: true })).toHaveText('2');
  await expect(page.getByLabel('Resumo da cotação')).toContainText(
    '4.3842 ETH'
  );
});

test('cart recommendations exclude cart items and support keyboard pagination', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page);
  const section = page.getByRole('region', {
    name: 'Colecionadores também viram',
    exact: true,
  });
  await expect(section.getByRole('heading', { level: 2 })).toBeVisible();
  await expect(section.locator('a[href="/nfts/emerald-ape-042"]')).toHaveCount(
    0
  );
  await expect(section.getByRole('link', { name: /^Ver / })).toHaveCount(
    info.project.name === 'desktop' ? 5 : 2
  );
  const carousel = section.getByRole('region', { name: 'NFTs recomendados' });
  await carousel.focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    section.getByRole('button', { name: 'Ver página 2 de recomendações' })
  ).toHaveAttribute('aria-pressed', 'true');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await page.screenshot({
    path: `test-results/cart-recommendations-${info.project.name}.png`,
    fullPage: true,
  });
});
