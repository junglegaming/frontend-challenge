import { test, expect as baseExpect } from '@playwright/test';
import { loginThroughForm } from './auth-helpers';

const expect = baseExpect.configure({ timeout: 15_000 });

test.setTimeout(60_000);

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
  ).toBeVisible({ timeout: 15_000 });
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    await http.post('/api/_mock/reset');
  });
  await page.reload();
  await expect(
    page.getByLabel('NFTs do catálogo').getByRole('link', { name: /^Ver / })
  ).toHaveCount(9);
});

test('active catalog tab preserves typography and primary color', async ({
  page,
}, info) => {
  const desktop = info.project.name === 'desktop';
  const group = page.getByRole('group', { name: 'Seleção de catálogo' });
  const active = group.getByRole('button', {
    name: 'Todos os NFTs',
    exact: true,
  });
  await expect(active).toHaveCSS('font-size', desktop ? '15px' : '14px');
  await expect(active).toHaveCSS('font-weight', desktop ? '500' : '700');
  await expect(active).toHaveCSS('line-height', '16px');
  await expect(active).toHaveCSS('color', 'rgb(210, 138, 76)');

  if (desktop) {
    await page.evaluate(() => document.fonts.ready);
    const select = page.getByLabel('Ordenar por:');
    await expect(select.locator('..')).toHaveCSS('line-height', '16px');
    // The toolbar may wrap below the tabs when the sidebar reduces its width.
    await expect(select).toBeVisible();
    const selectBox = await select.boundingBox();
    expect(selectBox!.height).toBeGreaterThan(16);
    await select
      .locator('../..')
      .screenshot({ path: 'test-results/catalog-toolbar.png' });
  }

  const recent = group.getByRole('button', {
    name: 'Novos lançamentos',
    exact: true,
  });
  await recent.click();
  await expect(recent).toHaveAttribute('aria-pressed', 'true');
  await expect(recent).toHaveCSS('font-weight', desktop ? '500' : '700');
  await expect(recent).toHaveCSS('color', 'rgb(210, 138, 76)');
  await expect(active).toHaveCSS('font-weight', desktop ? '500' : '400');
  await expect(active).toHaveCSS('color', 'rgb(245, 241, 235)');
});

test('mobile filters open by click and keyboard and restore trigger focus', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Mobile filter trigger');
  const trigger = page.getByRole('button', {
    name: 'Abrir filtros',
    includeHidden: true,
  });
  const panel = page.getByRole('dialog', { name: 'Filtros', exact: true });

  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(panel).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await panel.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.press('Enter');
  await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
});

test('debounced search preserves focus and syncs with history', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'mobile',
    'Search input is currently visible only on mobile'
  );
  const search = page
    .getByRole('searchbox', { name: 'Buscar NFTs' })
    .filter({ visible: true });
  await search.fill('Golden');
  await expect(page).toHaveURL(/q=Golden/);
  await expect(search).toBeFocused();
  await expect(
    page.getByLabel('NFTs do catálogo').getByRole('link', { name: /^Ver / })
  ).toHaveCount(3);
  await expect(search).toBeFocused();
  await expect(page.getByRole('button', { name: 'Limpar busca' })).toHaveCount(
    0
  );
  await search.fill('Violet');
  await expect(page).toHaveURL(/q=Violet/);
  await expect(search).toBeFocused();
  await page.goBack();
  await expect(search).toHaveValue('Golden');
  await search.fill('');
  await expect
    .poll(() => new URL(page.url()).searchParams.has('q'))
    .toBe(false);
  await expect(search).toBeFocused();
});

test('search, combined filters, sorting, refresh and history preserve URL state', async ({
  page,
}, info) => {
  await page.goto(
    '/?q=Kurio&categories=%5B%22Arte+digital%22%2C%22M%C3%BAsica%22%5D&minPrice=0.02&maxPrice=5&sort=price_asc&page=2'
  );
  if (info.project.name === 'mobile') {
    await expect(
      page
        .getByRole('searchbox', { name: 'Buscar NFTs' })
        .filter({ visible: true })
    ).toHaveValue('Kurio');
  }
  await expect(page.getByLabel('Ordenar por:')).toHaveValue('price_asc');
  await page.reload();
  await expect(page.getByLabel('Ordenar por:')).toHaveValue('price_asc');
  if (info.project.name === 'mobile') {
    await page
      .getByRole('button', { name: 'Novos lançamentos', exact: true })
      .click();
  } else {
    await page.getByLabel('Ordenar por:').selectOption('recent');
  }
  await expect
    .poll(() => new URL(page.url()).searchParams.has('page'))
    .toBe(false);
  await page.goBack();
  await expect(page.getByLabel('Ordenar por:')).toHaveValue('price_asc');
  expect(new URL(page.url()).searchParams.get('page')).toBe('2');
  await page.goForward();
  await expect(page.getByLabel('Ordenar por:')).toHaveValue('recent');
  if (info.project.name === 'mobile')
    await page.getByRole('button', { name: 'Abrir filtros' }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Arte digital', exact: true })
  ).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Música', exact: true })
  ).not.toBeChecked();
  await expect(
    page.getByRole('slider', { name: 'Preço mínimo' }).filter({ visible: true })
  ).toHaveAttribute('aria-valuetext', '0,02 ETH');
  await expect(
    page
      .locator('[data-slot="catalog-filters"]')
      .getByRole('button', { name: 'Limpar filtros' })
  ).toHaveCount(0);
});

test('pagination restores results and default search leaves a clean URL', async ({
  page,
}) => {
  const first = await page
    .getByLabel('NFTs do catálogo')
    .getByRole('heading', { level: 3 })
    .first()
    .innerText();
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page
      .getByLabel('NFTs do catálogo')
      .getByRole('heading', { level: 3 })
      .first()
  ).not.toHaveText(first);
  const second = await page
    .getByLabel('NFTs do catálogo')
    .getByRole('heading', { level: 3 })
    .first()
    .innerText();
  await page.reload();
  await expect(
    page
      .getByLabel('NFTs do catálogo')
      .getByRole('heading', { level: 3 })
      .first()
  ).toHaveText(second);
  await page.getByRole('button', { name: 'Página anterior' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page
      .getByLabel('NFTs do catálogo')
      .getByRole('heading', { level: 3 })
      .first()
  ).toHaveText(first);
});

test('price slider changes are applied explicitly and can be cleared', async ({
  page,
}, info) => {
  await page.goto('/?q=nenhum-resultado');
  await expect(
    page.getByRole('heading', { name: 'Nenhum NFT encontrado' })
  ).toBeVisible();
  await page.goto('/');
  await expect(
    page.getByLabel('NFTs do catálogo').getByRole('link', { name: /^Ver / })
  ).toHaveCount(9);
  if (info.project.name === 'mobile')
    await page.getByRole('button', { name: 'Abrir filtros' }).click();
  const minimum = page
    .getByRole('slider', { name: 'Preço mínimo' })
    .filter({ visible: true });
  const maximum = page
    .getByRole('slider', { name: 'Preço máximo' })
    .filter({ visible: true });
  const priceRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/nfts' && url.searchParams.has('minPrice'))
      priceRequests.push(request.url());
  });
  await minimum.focus();
  await minimum.press('ArrowRight');
  await minimum.press('ArrowRight');
  await maximum.focus();
  await maximum.press('ArrowLeft');
  await expect(minimum).toHaveAttribute('aria-valuetext', '0,02 ETH');
  await expect(maximum).toHaveAttribute('aria-valuetext', '19,99 ETH');
  expect(new URL(page.url()).search).toBe('');
  expect(priceRequests).toHaveLength(0);
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect
    .poll(() =>
      new URL(page.url()).searchParams.get('minPrice')?.replace(/^"|"$/g, '')
    )
    .toBe('0.02');
  expect(
    new URL(page.url()).searchParams.get('maxPrice')?.replace(/^"|"$/g, '')
  ).toBe('19.99');
  await minimum.focus();
  await minimum.press('Home');
  await maximum.focus();
  await maximum.press('End');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect.poll(() => new URL(page.url()).search).toBe('');
  await expect(
    page.getByRole('slider', { name: 'Preço mínimo' }).filter({ visible: true })
  ).toHaveAttribute('aria-valuetext', '0,00 ETH');
});

test('range accepts pointer input, equal bounds and expanded URL prices', async ({
  page,
}, info) => {
  await page.goto('/?minPrice=0.02&maxPrice=25.123');
  if (info.project.name === 'mobile')
    await page.getByRole('button', { name: 'Abrir filtros' }).click();
  const minimum = page
    .getByRole('slider', { name: 'Preço mínimo' })
    .filter({ visible: true });
  const maximum = page
    .getByRole('slider', { name: 'Preço máximo' })
    .filter({ visible: true });
  await expect(maximum).toHaveAttribute('aria-valuemax', '2600');
  await expect(maximum).toHaveAttribute('aria-valuetext', '25,123 ETH');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  expect(
    new URL(page.url()).searchParams.get('maxPrice')?.replace(/^"|"$/g, '')
  ).toBe('25.123');
  await minimum.scrollIntoViewIfNeeded();
  const slider = page.locator('[data-slot="slider"]').filter({ visible: true });
  const position = await slider.boundingBox();
  expect(position).not.toBeNull();
  const x = position!.x + position!.width * 0.25;
  const y = position!.y + position!.height / 2;
  if (info.project.name === 'mobile') await page.touchscreen.tap(x, y);
  else {
    const thumb = (await minimum.boundingBox())!;
    await page.mouse.move(
      thumb.x + thumb.width / 2,
      thumb.y + thumb.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(x, y, { steps: 5 });
    await page.mouse.up();
  }
  await expect(minimum).not.toHaveAttribute('aria-valuenow', '2');
  await minimum.press('Home');
  await expect(minimum).toHaveAttribute('aria-valuenow', '0');
  await maximum.press('End');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect.poll(() => new URL(page.url()).search).toBe('');
  await page.goto('/?minPrice=1&maxPrice=1');
  if (info.project.name === 'mobile')
    await page.getByRole('button', { name: 'Abrir filtros' }).click();
  await expect(minimum).toHaveAttribute('aria-valuenow', '100');
  await expect(maximum).toHaveAttribute('aria-valuenow', '100');
  await page.goto('/?minPrice=0.02&maxPrice=12.30');
  if (info.project.name === 'mobile')
    await page.getByRole('button', { name: 'Abrir filtros' }).click();
  const priceGroup = page
    .locator('fieldset')
    .filter({ has: page.locator('[data-slot="slider"]') })
    .filter({ visible: true });
  await expect(priceGroup).toContainText('Preço: 0,02 - 12,30 ETH');
  await priceGroup.screenshot({ path: info.outputPath('price-slider.png') });
});

test('loading, failure and retry use the network and preserve layout', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Search control is mobile only');
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    await http.post('/api/_mock/scenario', { id: 'lento' });
  });
  const search = page
    .getByRole('searchbox', { name: 'Buscar NFTs' })
    .filter({ visible: true });
  await search.fill('Kurio');
  await search.press('Enter');
  await expect(page.locator('[aria-label="NFTs do catálogo"]')).toHaveAttribute(
    'aria-busy',
    'true'
  );
  await expect(
    page.getByLabel('NFTs do catálogo').locator('[data-slot="skeleton"]')
  ).toHaveCount(36);
  await expect(
    page.getByLabel('NFTs do catálogo').getByRole('link')
  ).toHaveCount(0);
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    await http.post('/api/_mock/scenario', { id: 'erro-5xx' });
  });
  await search.fill('Golden');
  await search.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Erro ao carregar NFTs' })
  ).toBeVisible({ timeout: 15000 });
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    await http.post('/api/_mock/scenario', { id: 'padrao' });
  });
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(
    page.getByLabel('NFTs do catálogo').getByRole('link', { name: /^Ver / })
  ).toHaveCount(3);
});

test('out of order responses do not replace the current search', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Search control is mobile only');
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/http/client.ts';
    const { http } = await import(moduleUrl);
    await http.post('/api/_mock/scenario', { id: 'latencia-varia' });
  });
  const search = page
    .getByRole('searchbox', { name: 'Buscar NFTs' })
    .filter({ visible: true });
  await search.fill('Golden');
  await search.press('Enter');
  await search.fill('Violet');
  await search.press('Enter');
  await expect(
    page.getByLabel('NFTs do catálogo').getByRole('link', { name: /^Ver / })
  ).toHaveCount(1);
  await expect(
    page.getByLabel('NFTs do catálogo').getByRole('heading', { level: 3 })
  ).toHaveText('Violet Nomad #314');
  await expect(search).toHaveValue('Violet');
});

test.fixme('favorites require login, then persist through refresh (catalog favorite control is not implemented)', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'Adicionar Golden Signal #160 aos favoritos' })
    .click();
  await expect(page).toHaveURL(/\/login\?redirect/);
  await loginThroughForm(page);
  const toggle = page.getByRole('button', {
    name: /Golden Signal #160.*favoritos/,
  });
  await expect(toggle).toBeEnabled();
  const selected = await toggle.getAttribute('aria-pressed');
  await toggle.click();
  await expect(toggle).toHaveAttribute(
    'aria-pressed',
    selected === 'true' ? 'false' : 'true'
  );
  await expect(toggle).toBeEnabled();
  await page.reload();
  await expect(toggle).toHaveAttribute(
    'aria-pressed',
    selected === 'true' ? 'false' : 'true'
  );
});

test('catalog fits viewport, assets load, and keyboard reaches card links', async ({
  page,
}, info) => {
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  const image = page.getByLabel('NFTs do catálogo').getByRole('img').first();
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
      )
    )
    .toBe(true);
  const link = page.getByRole('link', {
    name: 'Ver Golden Signal #160',
    exact: true,
  });
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByLabel('NFTs do catálogo').getByRole('link').nth(1)
  ).toBeFocused();
  await page.screenshot({
    path: `test-results/catalog-${info.project.name}.png`,
    fullPage: true,
  });
});

test('desktop sections load only at the desktop breakpoint', async ({
  page,
}, info) => {
  const desktopModuleRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/CatalogDesktopSections.tsx')) {
      desktopModuleRequests.push(request.url());
    }
  });
  await page.goto('/?q=Kurio#diario');
  const heading = page.getByRole('heading', { name: 'Diário da Cunhagem' });
  if (info.project.name === 'mobile') {
    await expect(
      page.getByRole('heading', { name: 'Início', exact: true })
    ).toBeAttached();
    await expect(heading).toHaveCount(0);
    expect(desktopModuleRequests).toHaveLength(0);
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  await expect(heading).toBeVisible();
  if (info.project.name === 'mobile') {
    await expect.poll(() => desktopModuleRequests.length).toBeGreaterThan(0);
  }
  await expect
    .poll(() =>
      heading.evaluate((element) =>
        Math.abs(element.getBoundingClientRect().top)
      )
    )
    .toBeLessThan(5);
  const navigation = page.getByRole('navigation', {
    name: 'Navegação principal',
  });
  const market = navigation.getByRole('link', { name: 'Mercado', exact: true });
  const learn = navigation.getByRole('link', { name: 'Aprenda', exact: true });
  await expect(learn).toHaveAttribute('data-status', 'active');
  await market.click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#catalogo');
  expect(new URL(page.url()).searchParams.get('q')?.replace(/^"|"$/g, '')).toBe(
    'Kurio'
  );
  await expect(market).toHaveAttribute('data-status', 'active');
  await expect(learn).not.toHaveAttribute('data-status', 'active');
  await learn.click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#diario');
  await expect(learn).toHaveAttribute('data-status', 'active');
});

test('decimal precision survives and legacy URLs select only the first collection', async ({
  page,
}, info) => {
  const response = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === '/api/nfts' && r.url().includes('minPrice=')
  );
  await page.goto(
    '/?q=160&categories=Arte+digital&categories=Arte+3D&minPrice=0.020000000000000001&maxPrice=12.30'
  );
  const params = new URL((await response).url()).searchParams;
  expect(params.get('q')).toBe('160');
  expect(params.get('minPrice')).toBe('0.020000000000000001');
  expect(params.get('maxPrice')).toBe('12.30');
  expect(params.getAll('categories')).toEqual(['Arte digital']);
  await page.reload();
  expect(new URL(page.url()).searchParams.get('q')?.replace(/^"|"$/g, '')).toBe(
    '160'
  );
  if (info.project.name === 'mobile') {
    await expect(
      page
        .getByRole('searchbox', { name: 'Buscar NFTs' })
        .filter({ visible: true })
    ).toHaveValue('160');
    await page.getByRole('button', { name: 'Abrir filtros' }).click();
  }
  await expect(
    page.getByRole('slider', { name: 'Preço mínimo' }).filter({ visible: true })
  ).toHaveAttribute('aria-valuetext', '0,020000000000000001 ETH');
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect
    .poll(() =>
      new URL(page.url()).searchParams.get('minPrice')?.replace(/^"|"$/g, '')
    )
    .toBe('0.020000000000000001');
});

test('network filters combine, persist and remain keyboard accessible', async ({
  page,
}, info) => {
  await page.goto(
    '/?categories=Arte+digital&minPrice=0.02&maxPrice=12.30&page=2'
  );
  if (info.project.name === 'mobile')
    await page.getByRole('button', { name: 'Abrir filtros' }).click();
  const panel = page
    .locator('[data-slot="catalog-filters"]')
    .filter({ visible: true });
  const ethereum = panel.getByRole('checkbox', {
    name: 'Ethereum',
    exact: true,
  });
  await expect(panel.locator('label')).toHaveCount(12);
  await expect(panel.locator('[data-slot="skeleton"]')).toHaveCount(0);
  const counts = await panel.locator('label').allTextContents();
  await ethereum.focus();
  await ethereum.press('Space');
  await expect(ethereum).toBeChecked();
  await expect
    .poll(() => new URL(page.url()).searchParams.has('page'))
    .toBe(false);
  await expect
    .poll(() => panel.locator('label').allTextContents())
    .toEqual(counts);
  await expect(
    page
      .getByRole('checkbox', { name: 'Arte digital', exact: true })
      .filter({ visible: true })
  ).toBeChecked();
  await page.reload();
  if (info.project.name === 'mobile')
    await page.getByRole('button', { name: 'Abrir filtros' }).click();
  await expect(ethereum).toBeChecked();
  await panel.getByText('Polygon', { exact: true }).click();
  await expect(
    panel.getByRole('checkbox', { name: 'Polygon', exact: true })
  ).toBeChecked();
  await page.goBack();
  await expect(
    panel.getByRole('checkbox', { name: 'Polygon', exact: true })
  ).not.toBeChecked();
  await ethereum.focus();
  await ethereum.press('Space');
  await expect
    .poll(() => new URL(page.url()).searchParams.has('networks'))
    .toBe(false);
  const category = panel.getByRole('checkbox', {
    name: 'Fotografia',
    exact: true,
  });
  await panel.getByText('Fotografia', { exact: true }).click();
  await expect(category).toBeChecked();
  await expect(
    panel.getByRole('checkbox', { name: 'Arte digital', exact: true })
  ).not.toBeChecked();
  await expect(panel.getByRole('checkbox', { checked: true })).toHaveCount(1);
  await category.focus();
  await category.press('Space');
  await expect(category).not.toBeChecked();
  await expect
    .poll(() => new URL(page.url()).searchParams.has('categories'))
    .toBe(false);
  await expect(
    panel.getByRole('button', { name: 'Limpar filtros' })
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await page.screenshot({
    path: `test-results/filter-bar-${info.project.name}.png`,
    fullPage: true,
  });
});

test('filter counts show loading, errors with retry and empty catalog zeros', async ({
  page,
}, info) => {
  const setScenario = async (id: string) =>
    page.evaluate(async (id) => {
      const moduleUrl = '/src/lib/http/client.ts';
      const { http } = await import(moduleUrl);
      await http.post('/api/_mock/scenario', { id });
    }, id);
  const open = async () => {
    if (info.project.name === 'mobile')
      await page.getByRole('button', { name: 'Abrir filtros' }).click();
  };
  await open();
  const panel = page
    .locator('[data-slot="catalog-filters"]')
    .filter({ visible: true });
  await expect(panel.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await setScenario('lento');
  await panel.getByText('Fotografia', { exact: true }).click();
  await expect(panel.locator('[data-slot="skeleton"]')).toHaveCount(12);
  await expect(panel.locator('[data-slot="skeleton"]')).toHaveCount(0, {
    timeout: 15000,
  });
  await setScenario('erro-5xx');
  await panel.getByText('Ethereum', { exact: true }).click();
  await expect(panel.getByRole('alert')).toBeVisible({ timeout: 15000 });
  await setScenario('padrao');
  await panel
    .getByRole('button', { name: 'Tentar novamente contagens' })
    .click();
  await expect(panel.getByRole('alert')).toHaveCount(0);
  await expect(panel.locator('label')).toHaveCount(12);
  await setScenario('vazio');
  await panel.getByText('Música', { exact: true }).click();
  await expect(panel.locator('label').filter({ hasText: '(0)' })).toHaveCount(
    12
  );
});
