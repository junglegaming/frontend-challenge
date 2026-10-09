import { test, expect } from '@playwright/test';
import { loginThroughForm, setScenario } from './auth-helpers';

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
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Início', exact: true })
  ).toBeVisible();
  await page.evaluate(async () => {
    const path = '/src/lib/http/client.ts';
    const { http } = await import(path);
    await http.post('/api/_mock/reset');
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Início', exact: true })
  ).toBeVisible();
});

test('modal preserves background filters, history, switching and trigger focus', async ({
  page,
  isMobile,
}) => {
  await page.goto('/?q=Golden#catalogo');
  const trigger = page
    .getByRole('button', { name: 'Entrar', exact: true })
    .filter({ visible: true });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Login' })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/login');
  expect(new URL(page.url()).searchParams.get('redirect')).toBe(
    '/?q=Golden#catalogo'
  );
  expect(
    await page.evaluate(async () => {
      const path = '/src/router.tsx';
      const { router } = await import(path);
      return router.state.location.search.q;
    })
  ).toBe('Golden');
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goForward();
  await expect(page.getByRole('dialog', { name: 'Login' })).toBeVisible();
  if (isMobile) {
    await expect(
      page.getByRole('button', {
        name: 'Criar conta',
        exact: true,
        includeHidden: true,
      })
    ).toBeHidden();
  } else {
    await page
      .getByRole('button', { name: 'Criar conta', exact: true })
      .click();
    await expect(page.getByRole('dialog', { name: 'Cadastro' })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/signup');
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(
      '/?q=Golden#catalogo'
    );
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\?q=Golden#catalogo$/);
  await expect(trigger).toBeFocused();
  await trigger.press('Enter');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(trigger).toBeFocused();
});

test('local errors, password visibility and keyboard focus are accessible', async ({
  page,
}) => {
  await page.goto('/login');
  const dialog = page.getByRole('dialog', { name: 'Login' });
  const form = dialog.getByRole('form');
  await form.getByLabel('E-mail', { exact: true }).fill('');
  await form.getByLabel('Senha', { exact: true }).fill('');
  await form.getByRole('button', { name: 'Entrar', exact: true }).click();
  const email = form.getByLabel('E-mail', { exact: true });
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  const errorId = await email.getAttribute('aria-describedby');
  await expect(page.locator(`[id="${errorId}"]`)).toContainText(
    'E-mail inválido'
  );
  await email.fill('ana@nft-marketplace.test');
  await form.getByLabel('Senha', { exact: true }).fill('wrong');
  await form.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(form.getByLabel('Senha', { exact: true })).toHaveAttribute(
    'type',
    'text'
  );
  await form.getByRole('button', { name: 'Ocultar senha' }).click();
  await expect(form.getByLabel('Senha', { exact: true })).toHaveAttribute(
    'type',
    'password'
  );
  await form.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText(
    '⚠ E-mail ou senha incorretos'
  );
  await expect(email).toHaveAttribute('aria-invalid', 'false');
  await expect(
    dialog.getByRole('button', { name: 'Continuar com Google' })
  ).toBeDisabled();
  for (let index = 0; index < 14; index++) {
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]')
      )
    ).toBe(true);
  }
});

test('signup validates confirmation, maps API conflict and creates a session', async ({
  page,
}) => {
  await page.goto('/signup?redirect=/profile');
  const form = page.getByRole('form', { name: 'Formulário de cadastro' });
  await form.getByLabel('Nome', { exact: true }).fill('Carlos Colecionador');
  await form.getByLabel('E-mail', { exact: true }).fill('ana@nft-marketplace.test');
  await form.getByLabel('Senha', { exact: true }).fill('Carlos1234');
  await form
    .getByLabel('Confirmar senha', { exact: true })
    .fill('Different123');
  await form.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(
    form.getByLabel('Confirmar senha', { exact: true })
  ).toBeFocused();
  await expect(form.getByText('As senhas devem ser iguais')).toBeVisible();
  await form.getByLabel('Confirmar senha', { exact: true }).fill('Carlos1234');
  await form.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(form.getByText('E-mail já cadastrado')).toBeVisible();
  await expect(form.getByLabel('E-mail', { exact: true })).toBeFocused();
  await form
    .getByLabel('E-mail', { exact: true })
    .fill('CARLOS@nft-marketplace.test');
  await form.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('gm_session')!).user.email
    )
  ).toBe('carlos@nft-marketplace.test');
});

test('API field errors override local validation feedback', async ({
  page,
}) => {
  await setScenario(page, 'validacao-api');
  await page.goto('/signup');
  const form = page.getByRole('form');
  await form.getByLabel('Nome', { exact: true }).fill('Carlos');
  await form
    .getByLabel('E-mail', { exact: true })
    .fill('carlos@nft-marketplace.test');
  await form.getByLabel('Senha', { exact: true }).fill('Carlos1234');
  await form.getByLabel('Confirmar senha', { exact: true }).fill('Carlos1234');
  await form.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(form.getByLabel('E-mail', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true'
  );
  await expect(form.getByRole('alert')).toHaveCount(1);
});

test('network failure allows explicit retry and pending submit is sent once', async ({
  page,
}) => {
  await page.goto('/login');
  await expect(page.getByRole('dialog', { name: 'Login' })).toBeVisible();
  await setScenario(page, 'offline');
  const form = page.getByRole('form');
  await form.getByLabel('E-mail', { exact: true }).fill('ana@nft-marketplace.test');
  await form.getByLabel('Senha', { exact: true }).fill('Ana12345');
  await form.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText(
    'Não foi possível conectar'
  );
  await setScenario(page, 'lento');
  let submissions = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/auth/login') submissions++;
  });
  await form.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(form.getByRole('button', { name: 'Entrando…' })).toBeDisabled();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(submissions).toBe(1);
});

test('refresh validates session once; failed hydration blocks private UI until retry', async ({
  page,
}) => {
  await page.goto('/login?redirect=/profile');
  await loginThroughForm(page);
  let hydrations = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/auth/session') hydrations++;
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Perfil', exact: true })
  ).toBeVisible();
  expect(hydrations).toBe(1);
  await setScenario(page, 'offline');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Não foi possível validar a sessão' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Perfil', exact: true })
  ).toHaveCount(0);
  expect(await page.evaluate(() => !!localStorage.getItem('gm_session'))).toBe(
    true
  );
  await setScenario(page, 'padrao');
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Perfil', exact: true })
  ).toBeVisible();
});

test('invalid login credentials cannot expire an existing authenticated session', async ({
  page,
}) => {
  await page.goto('/login');
  await loginThroughForm(page);
  const token = await page.evaluate(
    () => JSON.parse(localStorage.getItem('gm_session')!).token
  );
  await page.goto('/login');
  const form = page.getByRole('form');
  await form.getByLabel('E-mail', { exact: true }).fill('ana@nft-marketplace.test');
  await form.getByLabel('Senha', { exact: true }).fill('wrong');
  await form.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText(
    'E-mail ou senha incorretos'
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('gm_session')!).token
    )
  ).toBe(token);
});

test('checkout expiration preserves draft and restores only its owner', async ({
  page,
}) => {
  await page.goto('/login?redirect=/checkout?draft=abc%23review');
  await loginThroughForm(page);
  const checkoutForm = page.getByRole('form', {
    name: 'Perfil do colecionador',
  });
  await checkoutForm
    .getByLabel('Observação do colecionador (opcional)', { exact: true })
    .fill('Rascunho antes de expirar');
  const draft = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('gm_checkout_draft')!)
  );
  const destination = page.url().slice(new URL(page.url()).origin.length);
  await setScenario(page, 'sessao-expirada');
  await page.evaluate(async () => {
    const path = '/src/lib/http/client.ts';
    const { http } = await import(path);
    await http.get('/api/wallets').catch(() => undefined);
  });
  await expect(page.getByRole('dialog', { name: 'Login' })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('redirect')).toBe(destination);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('gm_checkout_draft')!)
    )
  ).toEqual(draft);
  await setScenario(page, 'padrao');
  await loginThroughForm(page);
  await expect(
    checkoutForm.getByLabel('Observação do colecionador (opcional)', {
      exact: true,
    })
  ).toHaveValue('Rascunho antes de expirar');
  expect(page.url().endsWith(destination)).toBe(true);
  expect(
    await page.evaluate(async () => {
      const path = '/src/features/checkout/draft.ts';
      const { restoreCheckoutDraft } = await import(path);
      return restoreCheckoutDraft('usr_ana');
    })
  ).toEqual(draft);
});

test('logout failure clears private cache, draft and socket; another user stays isolated from old 401', async ({
  page,
}) => {
  await page.goto('/login?redirect=/profile');
  await loginThroughForm(page);
  const previous = await page.evaluate(async () => {
    const queryPath = '/src/lib/query/client.ts';
    const keyPath = '/src/lib/query/keys.ts';
    const { queryClient } = await import(queryPath);
    const { keyFactory } = await import(keyPath);
    queryClient.setQueryData(keyFactory.profile('usr_ana'), {
      name: 'Private Ana',
    });
    localStorage.setItem(
      'gm_checkout_draft',
      JSON.stringify({ userId: 'usr_ana', walletId: 'wal_principal' })
    );
    localStorage.setItem('gm_pending_order', 'pending');
    return JSON.parse(localStorage.getItem('gm_session')!).token;
  });
  await setScenario(page, 'offline');
  await page
    .getByRole('button', { name: 'Sair', exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole('dialog', { name: 'Login' })).toBeVisible();
  const state = await page.evaluate(async () => {
    const queryPath = '/src/lib/query/client.ts';
    const keyPath = '/src/lib/query/keys.ts';
    const socketPath = '/src/lib/socket/client.ts';
    const { queryClient } = await import(queryPath);
    const { keyFactory } = await import(keyPath);
    const { socket } = await import(socketPath);
    return {
      session: localStorage.getItem('gm_session'),
      draft: localStorage.getItem('gm_checkout_draft'),
      pending: localStorage.getItem('gm_pending_order'),
      privateQueries: queryClient
        .getQueryCache()
        .getAll()
        .filter((query: { queryKey: readonly unknown[] }) =>
          keyFactory.belongsToUser(query.queryKey, 'usr_ana')
        ).length,
      socketAuth: socket.auth,
      connected: socket.connected,
    };
  });
  expect(state).toEqual({
    session: null,
    draft: null,
    pending: null,
    privateQueries: 0,
    socketAuth: {},
    connected: false,
  });
  await setScenario(page, 'padrao');
  await loginThroughForm(page, 'bruno@nft-marketplace.test', 'Bruno1234');
  await page.evaluate(async (previous) => {
    const path = '/src/lib/http/client.ts';
    const { http } = await import(path);
    await http
      .get('/api/wallets', {
        headers: { Authorization: `Bearer ${previous}.invalid` },
      })
      .catch(() => undefined);
  }, previous);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('gm_session')!).user.id
    )
  ).toBe('usr_bruno');
  await expect(page.getByText('Private Ana')).toHaveCount(0);
});

test('guest cart merges at login and logout starts with an empty anonymous cart', async ({
  page,
}) => {
  await page.evaluate(async () => {
    const path = '/src/lib/http/client.ts';
    const { http } = await import(path);
    await http.post('/api/cart/items', { nftId: 'golden-signal-160', qty: 1 });
  });
  await page.goto('/login');
  await loginThroughForm(page);
  const cart = await page.evaluate(async () => {
    const path = '/src/lib/http/client.ts';
    const { http } = await import(path);
    return (await http.get('/api/cart')).data;
  });
  expect(cart.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ nftId: 'golden-signal-160' }),
    ])
  );
  await page
    .getByRole('button', { name: 'Sair', exact: true })
    .filter({ visible: true })
    .click();
  const anonymous = await page.evaluate(async () => {
    const path = '/src/lib/http/client.ts';
    const { http } = await import(path);
    return (await http.get('/api/cart')).data;
  });
  expect(anonymous.items).toEqual([]);
});

test('expiration timer redirects with context and foreign drafts are discarded', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/login?redirect=/wallets');
  await loginThroughForm(page);
  await page.evaluate(() =>
    localStorage.setItem(
      'gm_checkout_draft',
      JSON.stringify({ userId: 'usr_ana', network: 'ethereum' })
    )
  );
  await page.clock.fastForward(2 * 60 * 60 * 1000 + 1);
  await expect(page.getByRole('dialog', { name: 'Login' })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/wallets');
  await loginThroughForm(page, 'bruno@nft-marketplace.test', 'Bruno1234');
  expect(
    await page.evaluate(() => localStorage.getItem('gm_checkout_draft'))
  ).toBeNull();
});

test('responsive auth captures have no horizontal overflow and respect reduced motion', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [path, name] of [
    ['/login', 'Login'],
    ['/signup', 'Cadastro'],
  ]) {
    await page.goto(path);
    const dialog = page.getByRole('dialog', { name });
    await expect(dialog).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: `test-results/auth-${name.toLowerCase()}-${info.project.name}.png`,
    });
  }
});
