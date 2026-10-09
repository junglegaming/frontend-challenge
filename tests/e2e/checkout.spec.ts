import { test, expect, type Page } from '@playwright/test';
import { loginThroughForm, setScenario } from './auth-helpers';
import { displayEth } from '../../src/lib/money';
test.setTimeout(60_000);
async function api(
  page: Page,
  method: 'get' | 'post' | 'patch',
  path: string,
  data?: unknown
) {
  return page.evaluate(
    async ({ method, path, data }) => {
      const url = '/src/lib/http/client.ts';
      const { http } = await import(url);
      return (await http.request({ method, url: path, data })).data;
    },
    { method, path, data }
  );
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('gm_scenario'))
      localStorage.setItem('gm_scenario', 'padrao');
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent =
        '[aria-label="Controle dos mocks"] { display:none } html { scroll-behavior: auto !important }';
      document.head.append(style);
    });
  });
  await page.goto('/login?redirect=/cart');
  await expect(
    page.getByRole('form', { name: 'Formulário de login' })
  ).toBeVisible();
  await api(page, 'post', '/api/_mock/reset');
  await loginThroughForm(page);
  await expect(page).toHaveURL(/\/cart$/);
  await api(page, 'post', '/api/cart/items', {
    nftId: 'emerald-ape-042',
    qty: 2,
  });
});
async function checkout(page: Page) {
  await page.goto('/checkout');
  await expect(
    page.getByRole('button', { name: 'Confirmar compra', exact: true })
  ).toBeEnabled();
}
async function submit(page: Page) {
  await confirmPurchase(page);
  await page.getByRole('button', { name: 'Autorizar', exact: true }).click();
}
async function confirmPurchase(page: Page) {
  const button = page.getByRole('button', {
    name: 'Confirmar compra',
    exact: true,
  });
  await expect(button).toBeEnabled();
  await button.focus();
  await button.press('Enter');
}
async function secondary(page: Page) {
  await page.getByRole('checkbox', { name: 'Usar outra carteira?' }).check();
  await page
    .getByRole('combobox', { name: 'Carteira cadastrada', exact: true })
    .click();
  await page
    .getByRole('option', { name: 'Carteira secundária', exact: true })
    .click();
}

test('purchase confirms with the unchanged default referral code', async ({
  page,
}) => {
  await checkout(page);
  await expect(
    page.getByRole('textbox', { name: 'Código de indicação', exact: true })
  ).toHaveValue('NFT Marketplace');
  await submit(page);
  await expect(page).toHaveURL(/\/orders\/ord_/);
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible({ timeout: 15_000 });
  const profile = (await api(page, 'get', '/api/profile')) as {
    referralCode: string;
  };
  expect(profile.referralCode).toBe('NFT Marketplace');
  const order = (await api(
    page,
    'get',
    '/api/orders/' + page.url().split('/orders/')[1]
  )) as {
    status: string;
    collector: { referralCode: string };
  };
  expect(order.status).toBe('confirmed');
  expect(order.collector.referralCode).toBe('NFT Marketplace');
});

test('foreign order emitted through mock control does not change UI or current cache', async ({
  page,
}) => {
  await page
    .getByRole('button', { name: 'Sair', exact: true })
    .filter({ visible: true })
    .click();
  await page.goto('/login?redirect=/cart');
  await loginThroughForm(page, 'bruno@nft-marketplace.test', 'Bruno1234');
  await page.evaluate(async () => {
    const { socket } = await import(String('/src/lib/socket/client.ts'));
    if (!socket.connected)
      await new Promise<void>((resolve) => socket.once('connect', resolve));
    for (const event of ['connect', 'nft.updated', 'order.updated'] as const)
      if (socket.listeners(event).length !== 1)
        throw new Error(`Listener duplicado ou ausente: ${event}`);
  });
  await api(page, 'post', '/api/_mock/emit', {
    type: 'order.updated',
    resourceId: 'ord_seed_pending',
    version: 10,
    payload: { status: 'confirmed' },
  });
  // A public NFT event is a delivery barrier for the preceding private event.
  await api(page, 'post', '/api/_mock/emit', {
    type: 'nft.updated',
    resourceId: 'emerald-ape-042',
    version: 10,
    payload: { price: '2', previousPrice: '1.19', available: 8 },
  });
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Preço e disponibilidade do NFT atualizados.' })
  ).toBeVisible();
  expect(
    await page.evaluate(async () => {
      const { queryClient } = await import(String('/src/lib/query/client.ts'));
      const { keyFactory } = await import(String('/src/lib/query/keys.ts'));
      return queryClient.getQueryData(
        keyFactory.order('usr_bruno', 'ord_seed_pending')
      );
    })
  ).toBeUndefined();
  await expect(
    page.getByRole('heading', { name: 'Pagamento confirmado' })
  ).toHaveCount(0);
});

test('reconnect reconciles a pending purchase using REST without another POST', async ({
  page,
}) => {
  await page.clock.install();
  await checkout(page);
  await submit(page);
  await expect(
    page.getByRole('heading', { name: 'Pedido pendente' })
  ).toBeVisible();
  const id = page.url().split('/orders/')[1];
  await page.evaluate(async () => {
    const { socket } = await import(String('/src/lib/socket/client.ts'));
    socket.disconnect();
  });
  await api(page, 'post', '/api/_mock/emit', {
    type: 'order.updated',
    resourceId: id,
    version: 10,
    payload: { status: 'confirmed' },
  });
  await expect(
    page.getByRole('heading', { name: 'Pedido pendente' })
  ).toBeVisible();
  let posts = 0;
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname === '/api/orders'
    )
      posts++;
  });
  await page.evaluate(async () => {
    const { socket } = await import(String('/src/lib/socket/client.ts'));
    socket.connect();
  });
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible();
  expect(posts).toBe(0);
});

test('checkout announces a live price change and requires fresh authorization', async ({
  page,
}) => {
  await checkout(page);
  await confirmPurchase(page);
  await expect(
    page.getByRole('dialog', { name: 'Autorizar conexão simulada' })
  ).toBeVisible();
  await api(page, 'post', '/api/_mock/emit', {
    type: 'nft.updated',
    resourceId: 'emerald-ape-042',
    version: 10,
    payload: { price: '2.19', previousPrice: '1.19', available: 8 },
  });
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Revise os valores antes de confirmar.' })
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Revisão do pedido', includeHidden: true })
  ).toContainText('4.38 ETH');
  await expect(
    page.getByRole('button', { name: 'Autorizar', exact: true })
  ).toBeDisabled();
  expect(
    await page.evaluate(() => localStorage.getItem('gm_pending_order'))
  ).toBeNull();
  await page.getByRole('button', { name: 'Rejeitar', exact: true }).click();
  await confirmPurchase(page);
  await expect(
    page.getByRole('button', { name: 'Autorizar', exact: true })
  ).toBeEnabled();
});

test('shared NFT list renders cart review and immutable order items', async ({
  page,
}) => {
  await checkout(page);
  const review = page.getByRole('region', { name: 'Revisão do pedido' });
  await expect(
    review.getByRole('listitem').filter({ hasText: 'Emerald Ape #042' })
  ).toContainText('(x 2)');

  const order = (await api(page, 'get', '/api/orders/ord_seed_confirmed')) as {
    items: { name: string; qty: number; lineTotal: string }[];
  };
  await page.goto('/orders/ord_seed_confirmed');
  const receipt = page.getByRole('region', { name: 'Recibo', exact: true });
  await expect(receipt.getByRole('listitem')).toHaveCount(order.items.length);
  for (const item of order.items) {
    const row = receipt.getByRole('listitem').filter({ hasText: item.name });
    await expect(
      row.getByRole('img', { name: `NFT ${item.name}`, exact: true })
    ).toBeVisible();
    await expect(row).toContainText(`(x ${item.qty})`);
    await expect(row).toContainText(displayEth(item.lineTotal));
  }
  const snapshot = await receipt.innerText();
  await page.reload();
  await expect(receipt).toHaveText(snapshot, { useInnerText: true });
});

test('confirmed receipt and snapshot, cart subtracts only purchased quantities', async ({
  page,
}) => {
  await checkout(page);
  await submit(page);
  await expect(page).toHaveURL(/\/orders\/ord_/);
  await expect(
    page.getByRole('heading', { name: 'Pedido pendente' })
  ).toBeVisible();
  await expect(page.getByLabel('Recibo', { exact: true })).toHaveCount(0);
  await api(page, 'patch', '/api/cart/items/emerald-ape-042', { qty: 3 });
  await api(page, 'post', '/api/cart/items', {
    nftId: 'golden-signal-160',
    qty: 1,
  });
  await expect(
    page.getByRole('heading', { name: 'Pagamento confirmado' })
  ).toBeVisible();
  const receipt = page.getByLabel('Recibo', { exact: true });
  await expect(
    page.getByRole('dialog', { name: 'Pagamento confirmado' })
  ).toBeVisible();
  await expect(page.locator('header')).toHaveCount(0);
  await expect(page.locator('footer')).toHaveCount(0);
  await expect(receipt).toContainText('2 unidade(s)');
  const snapshot = await receipt.innerText();
  const cart = (await api(page, 'get', '/api/cart')) as {
    items: { nftId: string; qty: number }[];
  };
  expect(cart.items.find((item) => item.nftId === 'emerald-ape-042')?.qty).toBe(
    1
  );
  expect(
    cart.items.find((item) => item.nftId === 'golden-signal-160')?.qty
  ).toBe(1);
  await page.reload();
  await expect(receipt).toHaveText(snapshot, { useInnerText: true });
  expect(
    await page.evaluate(() => localStorage.getItem('gm_pending_order'))
  ).toBeNull();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
});
test('declined keeps cart and offers exit', async ({ page }) => {
  const before = await api(page, 'get', '/api/cart');
  await setScenario(page, 'pagamento-recusado');
  await checkout(page);
  await submit(page);
  await expect(
    page.getByRole('heading', { name: 'Pagamento recusado' })
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'Transação recusada pela carteira'
  );
  await expect(page.getByLabel('Recibo', { exact: true })).toHaveCount(0);
  const cart = (await api(page, 'get', '/api/cart')) as { itemCount: number };
  expect(cart).toEqual(before);
  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click();
  await expect(page).toHaveURL(/\/cart$/);
});
test('timeout retry and refresh without id replay the same purchase', async ({
  page,
}) => {
  await setScenario(page, 'timeout-pedido');
  await checkout(page);
  await submit(page);
  await expect(
    page.getByRole('button', { name: 'Consultar tentativa' })
  ).toBeDisabled();
  const original = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('gm_pending_order')!)
  );
  await expect(
    page.getByRole('button', { name: 'Tentar novamente', exact: true })
  ).toBeVisible({ timeout: 20_000 });
  await page.reload();
  await expect(page).toHaveURL(/\/orders\/ord_/);
  await expect(
    page.getByRole('heading', { name: 'Pagamento confirmado' })
  ).toBeVisible();
  const id = page.url().split('/orders/')[1];
  const order = (await api(page, 'get', `/api/orders/${id}`)) as {
    idempotencyKey: string;
  };
  expect(order.idempotencyKey).toBe(original.key);
  const replay = await page.evaluate(async (value) => {
    const url = '/src/lib/http/client.ts';
    const { http } = await import(url);
    return (
      await http.post('/api/orders', value.payload, {
        headers: { 'Idempotency-Key': value.key },
      })
    ).data.id;
  }, original);
  expect(replay).toBe(id);
});
test('refresh pending with id and polling without socket', async ({ page }) => {
  await checkout(page);
  await submit(page);
  await expect(
    page.getByRole('heading', { name: 'Pedido pendente' })
  ).toBeVisible();
  const url = page.url();
  await page.reload();
  await page.evaluate(async () => {
    const url = '/src/lib/socket/client.ts';
    const { socket } = await import(url);
    socket.disconnect();
  });
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible({ timeout: 15_000 });
  expect(page.url()).toBe(url);
});
test('terminal order ignores stale socket updates and another user cannot view receipt', async ({
  page,
}) => {
  await checkout(page);
  await submit(page);
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible();
  const url = page.url();
  const id = url.split('/orders/')[1];
  await api(page, 'post', '/api/_mock/emit', {
    type: 'order.updated',
    resourceId: id,
    version: 1,
    payload: { status: 'pending' },
  });
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page
    .getByRole('button', { name: 'Sair', exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole('button', { name: 'Entrar', exact: true })
    .filter({ visible: true })
    .click();
  await loginThroughForm(page, 'bruno@nft-marketplace.test', 'Bruno1234');
  await page.goto(url);
  await expect(
    page.getByRole('heading', { name: 'Não foi possível consultar o pedido' })
  ).toBeVisible();
  await expect(page.getByLabel('Recibo', { exact: true })).toHaveCount(0);
});
test('expiration preserves uncertain key and reauthentication recovers original order', async ({
  page,
}) => {
  await setScenario(page, 'timeout-pedido');
  await checkout(page);
  await submit(page);
  const original = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('gm_pending_order')!)
  );
  await expect(
    page.getByRole('button', { name: 'Tentar novamente', exact: true })
  ).toBeVisible({ timeout: 20_000 });
  await page.evaluate(async () => {
    const url = '/src/lib/session/storage.ts';
    const { storeSession } = await import(url);
    storeSession(null);
  });
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('gm_pending_order')!).key
    )
  ).toBe(original.key);
  await loginThroughForm(page);
  await expect(
    page.getByRole('heading', { name: 'Pagamento confirmado' })
  ).toBeVisible();
  const order = (await api(
    page,
    'get',
    '/api/orders/' + page.url().split('/orders/')[1]
  )) as { idempotencyKey: string };
  expect(order.idempotencyKey).toBe(original.key);
});

test('required defaults, separate review and radio selection below it', async ({
  page,
}) => {
  await checkout(page);
  await expect(
    page.getByRole('textbox', { name: 'Código de indicação', exact: true })
  ).toHaveValue('NFT Marketplace');
  await expect(
    page.getByRole('combobox', { name: 'Nome ENS', exact: true })
  ).toContainText('.eth');
  await expect(
    page.getByRole('textbox', { name: 'Nome ENS', exact: true })
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Salvar dados' })).toHaveCount(
    0
  );
  await expect(
    page.getByRole('button', { name: 'Conectar carteira' })
  ).toHaveCount(0);
  const review = page.getByRole('region', { name: 'Revisão do pedido' });
  await expect(
    review.getByRole('heading', { name: 'Seus NFTs' })
  ).toBeVisible();
  const cart = (await api(page, 'get', '/api/cart')) as { items: unknown[] };
  await expect(review.getByRole('img', { name: /NFT/ })).toHaveCount(
    cart.items.length
  );
  await expect(review).toContainText('(x 2)');
  await expect(review).toContainText('Desconto do lançamento');
  const radios = page.getByRole('radiogroup', { name: 'Carteira e rede' });
  expect((await radios.boundingBox())!.y).toBeGreaterThan(
    (await review.boundingBox())!.y
  );
  await expect(radios.getByRole('radio')).toHaveCount(3);
  await expect(
    radios.getByRole('radio', {
      name: 'METAMASK • WALLETCONNECT • COINBASE',
      exact: true,
    })
  ).toBeVisible();
  await expect(
    radios.getByRole('radio', { name: 'MetaMask', exact: true })
  ).toBeChecked();
  await secondary(page);
  await page
    .getByRole('radio', { name: 'Coinbase Wallet', exact: true })
    .click();
  await expect(
    page.getByRole('combobox', { name: 'Tipo de carteira', exact: true })
  ).toContainText('Coinbase Wallet');
  await page
    .getByRole('combobox', { name: 'Tipo de carteira', exact: true })
    .click();
  await page.getByRole('option', { name: 'MetaMask', exact: true }).click();
  await expect(
    page.getByRole('radio', { name: 'MetaMask', exact: true })
  ).toBeChecked();
  await page.getByRole('radio', { name: 'MetaMask', exact: true }).focus();
  await page.keyboard.down('ArrowDown');
  await expect(
    page.getByRole('radio', { name: 'Coinbase Wallet', exact: true })
  ).toBeChecked();
  await page.keyboard.up('ArrowDown');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});

test('reject and dismiss authorization never create an order', async ({
  page,
}) => {
  let orderPosts = 0;
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname === '/api/orders'
    )
      orderPosts++;
  });
  await checkout(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await page.getByRole('button', { name: 'Rejeitar', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Autorizar conexão simulada' })
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem('gm_pending_order'))
  ).toBeNull();
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await page
    .getByRole('dialog', { name: 'Autorizar conexão simulada' })
    .waitFor();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', { name: 'Autorizar conexão simulada' })
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem('gm_pending_order'))
  ).toBeNull();
  expect(orderPosts).toBe(0);
});

test('validation associates required referral and ENS errors and blocks purchase', async ({
  page,
}) => {
  await checkout(page);
  for (const name of ['Nome de exibição', 'Código de indicação'])
    await page.getByRole('textbox', { name, exact: true }).fill('');
  await page
    .getByRole('textbox', { name: 'E-mail', exact: true })
    .fill('invalid');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  for (const name of ['Nome de exibição', 'Código de indicação', 'E-mail']) {
    const input = page.getByRole('textbox', { name, exact: true });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    const ids = (await input.getAttribute('aria-describedby'))!.split(' ');
    await expect(page.locator(`[id="${ids.at(-1)}"]`)).toBeVisible();
  }
  await expect(
    page.getByRole('dialog', { name: 'Autorizar conexão simulada' })
  ).toHaveCount(0);
  expect(
    await page.evaluate(async () => {
      const { collectorFormSchema } = await import(
        String('/src/features/checkout/form-schema.ts')
      );
      const draft = JSON.parse(localStorage.getItem('gm_checkout_draft')!);
      return collectorFormSchema.safeParse({
        ...draft.collector,
        name: 'Ana',
        email: 'ana@example.test',
        referralCode: 'TEST',
        ensName: '',
      }).success;
    })
  ).toBe(false);
});

test('account updates at confirmation and receipt keeps immutable snapshot', async ({
  page,
}) => {
  await checkout(page);
  await secondary(page);
  await page
    .getByRole('textbox', { name: 'Nome de exibição', exact: true })
    .fill('Ana Editada');
  await page
    .getByRole('textbox', { name: 'E-mail', exact: true })
    .fill('ana.nova@nft-marketplace.test');
  await page
    .getByRole('textbox', { name: 'Código de indicação', exact: true })
    .fill('KURIO_2026');
  await page
    .getByRole('radio', { name: 'Coinbase Wallet', exact: true })
    .click();
  await page.getByRole('combobox', { name: 'Nome ENS', exact: true }).click();
  await page
    .getByRole('option', { name: 'nft-marketplace.eth', exact: true })
    .click();
  await submit(page);
  await expect(
    page.getByRole('heading', { name: 'Pagamento confirmado' })
  ).toBeVisible();
  expect(await api(page, 'get', '/api/profile')).toMatchObject({
    name: 'Ana Editada',
    email: 'ana.nova@nft-marketplace.test',
    referralCode: 'KURIO_2026',
  });
  const wallets = (await api(page, 'get', '/api/wallets')) as {
    items: { id: string; provider: string; ensName: string }[];
  };
  expect(wallets.items.find((w) => w.id === 'wal_ana_ens')).toMatchObject({
    provider: 'coinbase',
    ensName: 'nft-marketplace.eth',
  });
  const receipt = page.getByLabel('Recibo', { exact: true });
  await expect(receipt).toContainText('Ana Editada');
  await api(page, 'patch', '/api/profile', { name: 'Outra Ana' });
  await page.reload();
  await expect(receipt).toContainText('Ana Editada');
  await expect(receipt).not.toContainText('Outra Ana');
});

test('preco-muda requires a new confirmation after stale quote', async ({
  page,
}) => {
  await page.clock.install();
  await api(page, 'post', '/api/cart/items', {
    nftId: 'golden-signal-160',
    qty: 1,
  });
  await setScenario(page, 'preco-muda');
  await checkout(page);
  await page.evaluate(async () => {
    const { socket } = await import(String('/src/lib/socket/client.ts'));
    socket.disconnect();
  });
  await page.clock.fastForward(6500);
  await submit(page);
  await expect(
    page.getByText('Cotação alterada. Revise os valores e confirme novamente.')
  ).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Autorizar conexão simulada' })
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem('gm_pending_order'))
  ).toBeNull();
  await submit(page);
  await page.clock.fastForward(10000);
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
  ).toBeVisible();
});

test('unfinished draft survives refresh and expiration with fresh authorization', async ({
  page,
}) => {
  await checkout(page);
  await page
    .getByRole('textbox', { name: 'Nome de exibição', exact: true })
    .fill('Rascunho da Ana');
  await page
    .getByRole('textbox', { name: 'E-mail', exact: true })
    .fill('incompleto@');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const draft = JSON.parse(localStorage.getItem('gm_checkout_draft')!);
        return draft.collector.email;
      })
    )
    .toBe('incompleto@');
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'E-mail', exact: true })
  ).toHaveValue('incompleto@');
  await page.evaluate(async () => {
    const { storeSession } = await import(
      String('/src/lib/session/storage.ts')
    );
    storeSession(null);
  });
  await loginThroughForm(page);
  await expect(
    page.getByRole('textbox', { name: 'Nome de exibição', exact: true })
  ).toHaveValue('Rascunho da Ana');
  await expect(
    page.getByRole('dialog', { name: 'Autorizar conexão simulada' })
  ).toHaveCount(0);
  await page
    .getByRole('textbox', { name: 'E-mail', exact: true })
    .fill('ana@nft-marketplace.test');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Autorizar conexão simulada' })
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('gm_pending_order'))
  ).toBeNull();
});

test('empty wallets offers account setup exit', async ({ page }) => {
  await page
    .getByRole('button', { name: 'Sair', exact: true })
    .filter({ visible: true })
    .click();
  await page.goto('/login?redirect=/cart');
  await loginThroughForm(page, 'bruno@nft-marketplace.test', 'Bruno1234');
  await api(page, 'post', '/api/cart/items', {
    nftId: 'emerald-ape-042',
    qty: 1,
  });
  await page.goto('/checkout');
  await expect(
    page.getByRole('heading', { name: 'Nenhuma carteira cadastrada' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Confirmar compra' })
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Cadastre em Carteiras' }).click();
  await expect(page).toHaveURL(/\/wallets$/);
});

test('coupon survives checkout and repeated confirmation sends one POST', async ({
  page,
}) => {
  await page.goto('/checkout?coupon=LAUNCH10');
  await expect(
    page.getByText('Código promocional: LAUNCH10', { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Confirmar compra', exact: true })
  ).toBeEnabled();
  await page.evaluate(async () => {
    const { http } = await import(String('/src/lib/http/client.ts'));
    (window as unknown as { orderPosts: number }).orderPosts = 0;
    http.interceptors.request.use((config: { url: string }) => {
      if (config.url === '/api/orders')
        (window as unknown as { orderPosts: number }).orderPosts++;
      return config;
    });
    const button = [...document.querySelectorAll('button')].find(
      (node) => node.textContent === 'Confirmar compra'
    )!;
    button.click();
    button.click();
  });
  await page.getByRole('button', { name: 'Autorizar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Pagamento confirmado' })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as unknown as { orderPosts: number }).orderPosts
    )
  ).toBe(1);
  await expect(page.getByLabel('Recibo', { exact: true })).toContainText(
    'Cupom: LAUNCH10'
  );
});

test('stock failure blocks confirmation and preserves correction exit', async ({
  page,
}) => {
  await checkout(page);
  await setScenario(page, 'estoque-esgotado');
  await submit(page);
  await expect(
    page.getByRole('button', { name: 'Confirmar compra' })
  ).toBeDisabled();
  await expect(page.getByLabel('Recibo', { exact: true })).toHaveCount(0);
  await page
    .getByRole('link', {
      name: 'Tem um código promocional? Aplique aqui',
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/cart$/);
});

test('network identity conflict prevents authorization; secondary wallet can update', async ({
  page,
}) => {
  await checkout(page);
  await page.getByRole('combobox', { name: 'Rede', exact: true }).click();
  await page.getByRole('option', { name: 'Sepolia', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(
    page.getByText(/Não foi possível atualizar todos os dados da conta/)
  ).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Autorizar conexão simulada' })
  ).toHaveCount(0);
  await secondary(page);
  await page.getByRole('combobox', { name: 'Rede', exact: true }).click();
  await page.getByRole('option', { name: 'Ethereum', exact: true }).click();
  await submit(page);
  await expect(
    page.getByRole('heading', { name: 'Pagamento confirmado' })
  ).toBeVisible();
  await expect(page.getByLabel('Recibo', { exact: true })).toContainText(
    'Rede: ethereum'
  );
});

test('remote field conflict keeps data editable until corrected', async ({
  page,
}) => {
  await checkout(page);
  const username = page.getByRole('textbox', {
    name: 'Nome de usuário',
    exact: true,
  });
  await username.fill('bruno');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(username).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toContainText('Username em uso');
  await expect(
    page.getByRole('dialog', { name: 'Autorizar conexão simulada' })
  ).toHaveCount(0);
  await username.fill('ana.nova');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Autorizar conexão simulada' })
  ).toBeVisible();
});
