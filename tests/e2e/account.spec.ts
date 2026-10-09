import { test, expect, type Page } from '@playwright/test';
import { loginThroughForm, setScenario } from './auth-helpers';

test.setTimeout(60_000);
async function api(page: Page, method: 'get' | 'post', path: string) {
  return page.evaluate(
    async ({ method, path }) => {
      const url = '/src/lib/http/client.ts';
      const { http } = await import(url);
      return (await http.request({ method, url: path })).data;
    },
    { method, path }
  );
}
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
    page.getByRole('button', { name: 'Entrar', exact: true })
  ).toBeVisible({ timeout: 15_000 });
  await api(page, 'post', '/api/_mock/reset');
  await page.goto('/login?redirect=/profile');
  await loginThroughForm(page);
  await expect(
    page.getByRole('form', { name: 'Editar perfil', exact: true })
  ).toBeVisible();
});

test('profile and principal wallet persist; conflicts and partial password failure preserve saved fields', async ({
  page,
}) => {
  const form = page.getByRole('form', { name: 'Editar perfil', exact: true });
  await form
    .getByRole('textbox', { name: 'Nome de exibição', exact: true })
    .fill('Ana Colecionadora');
  await form
    .getByRole('textbox', { name: 'Apelido da carteira', exact: true })
    .fill('Minha principal');
  await form.getByLabel('Nome ENS', { exact: true }).fill('ana-nova.eth');
  await form.getByLabel('Senha atual', { exact: true }).fill('Incorreta123');
  await form.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123');
  await form
    .getByLabel('Confirmar nova senha', { exact: true })
    .fill('NovaSenha123');
  await form.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(
    form.getByRole('alert').filter({ hasText: 'Senha atual incorreta' })
  ).toBeVisible();
  await expect(form.getByRole('status')).toContainText('já salvo(s)');
  await form.getByLabel('Senha atual', { exact: true }).fill('Ana12345');
  await form.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(form.getByRole('status')).toContainText(
    'Senha: alterações salvas'
  );
  await expect(form.getByLabel('Senha atual', { exact: true })).toHaveValue('');
  await page.reload();
  await expect(
    form.getByRole('textbox', { name: 'Nome de exibição', exact: true })
  ).toHaveValue('Ana Colecionadora');
  await expect(
    form.getByRole('textbox', { name: 'Apelido da carteira', exact: true })
  ).toHaveValue('Minha principal');
  await expect(form.getByLabel('Nome ENS', { exact: true })).toHaveValue(
    'ana-nova.eth'
  );
  await form
    .getByRole('textbox', { name: 'Nome de usuário', exact: true })
    .fill('bruno');
  await form.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(
    form.getByRole('textbox', { name: 'Nome de usuário', exact: true })
  ).toHaveAttribute('aria-invalid', 'true');
  await expect(
    form.getByRole('alert').filter({ hasText: 'Username em uso' })
  ).toBeVisible();
  await form
    .getByRole('textbox', { name: 'Nome de usuário', exact: true })
    .fill('ana');
  await form
    .getByRole('textbox', { name: 'E-mail', exact: true })
    .fill('bruno@nft-marketplace.test');
  await form.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(
    form.getByRole('textbox', { name: 'E-mail', exact: true })
  ).toHaveAttribute('aria-invalid', 'true');
});

test('avatar preview, size/type validation, persistence and removal', async ({
  page,
}) => {
  const form = page.getByRole('form', { name: 'Editar perfil', exact: true });
  const file = form.getByLabel('Avatar (PNG/JPEG até 512 KB)', { exact: true });
  await file.setInputFiles({
    name: 'large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(512 * 1024 + 1),
  });
  await expect(form.getByRole('alert')).toContainText('até 512 KB');
  await expect(
    form.getByRole('button', { name: 'Salvar', exact: true })
  ).toBeDisabled();
  await file.setInputFiles({
    name: 'invalid.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('invalid'),
  });
  await expect(file).toHaveAttribute('aria-invalid', 'true');
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=',
    'base64'
  );
  await file.setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: png,
  });
  await expect(
    form.getByRole('img', { name: 'Preview do avatar' })
  ).toHaveAttribute('src', /^data:image\/png/);
  await form.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(form.getByRole('status')).toContainText('alterações salvas');
  await page.reload();
  await expect(
    form.getByRole('img', { name: 'Preview do avatar' })
  ).toHaveAttribute('src', /^data:image\/png/);
  await form.getByRole('button', { name: 'Remover avatar' }).click();
  await form.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(form.getByRole('status')).toContainText('alterações salvas');
  await page.reload();
  await expect(
    form.getByRole('img', { name: 'Preview do avatar' })
  ).toHaveCount(0);
});

test('remote validation maps to accessible fields in profile and wallets', async ({
  page,
}) => {
  await setScenario(page, 'validacao-api');
  const form = page.getByRole('form', { name: 'Editar perfil', exact: true });
  await form
    .getByRole('textbox', { name: 'Nome de exibição', exact: true })
    .fill('Nome local válido');
  await form.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(
    form.getByRole('alert').filter({ hasText: 'Nome rejeitado pela API' })
  ).toBeVisible();
  await expect(
    form.getByRole('textbox', { name: 'Nome de exibição', exact: true })
  ).toBeFocused();
  await expect(
    form.getByRole('textbox', { name: 'Nome de exibição', exact: true })
  ).toHaveAttribute('aria-describedby', /error/);
  await page
    .getByRole('navigation', { name: 'Minha conta' })
    .getByRole('link', { name: 'Carteiras', exact: true })
    .click();
  await page
    .getByRole('article')
    .first()
    .getByRole('button', { name: 'Editar', exact: true })
    .click();
  const wallet = page.getByRole('form', {
    name: 'Editar carteira',
    exact: true,
  });
  await wallet
    .getByRole('textbox', { name: 'Apelido da carteira', exact: true })
    .fill('Nome válido');
  await wallet.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(
    wallet.getByRole('alert').filter({ hasText: 'Nome rejeitado' })
  ).toBeVisible();
  await expect(
    wallet.getByRole('textbox', { name: 'Apelido da carteira', exact: true })
  ).toHaveAttribute('aria-invalid', 'true');
});

test('wallet edit, promotion and pending network conflict', async ({
  page,
}) => {
  await page.goto('/wallets');
  const principal = page.getByRole('article').filter({
    has: page.getByRole('heading', {
      name: 'Carteira principal',
      exact: true,
    }),
  });
  await principal.getByRole('button', { name: 'Editar', exact: true }).click();
  const form = page.getByRole('form', { name: 'Editar carteira', exact: true });
  await expect(
    form.getByRole('textbox', { name: 'Endereço', exact: true })
  ).toHaveAttribute('readonly', '');
  await form.getByLabel('Rede', { exact: true }).click();
  await page.getByRole('option', { name: 'Sepolia', exact: true }).click();
  await form.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(form.getByRole('status')).toContainText('pedido pendente');
  await form.getByRole('button', { name: 'Cancelar', exact: true }).click();
  const secondary = page.getByRole('article').filter({
    has: page.getByRole('heading', {
      name: 'Carteira secundária',
      exact: true,
    }),
  });
  const label = await secondary.getAttribute('aria-label');
  await secondary.getByRole('button', { name: 'Editar', exact: true }).click();
  await form
    .getByLabel('Observação (opcional)', { exact: true })
    .fill('Carteira para arte');
  await form.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(form).toHaveCount(0);
  await page.getByRole('button', { name: 'Tornar principal' }).click();
  await expect(page.getByRole('status')).toContainText('promovida');
  await page.reload();
  await expect(
    page
      .getByRole('article', { name: label!, exact: true })
      .getByRole('heading')
  ).toHaveText('Carteira principal');
  await expect(
    page.getByText('Carteira para arte', { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Cadastrar carteira', exact: true })
  ).toBeDisabled();
});

test('empty account creates wallets, rejects duplicate and preserves after refresh', async ({
  page,
}) => {
  await page
    .getByRole('navigation', { name: 'Minha conta' })
    .getByRole('button', { name: 'Sair', exact: true })
    .click();
  await page.goto('/login?redirect=/wallets');
  await loginThroughForm(page, 'bruno@nft-marketplace.test', 'Bruno1234');
  await page
    .getByRole('button', { name: 'Cadastrar carteira', exact: true })
    .click();
  const form = page.getByRole('form', {
    name: 'Cadastrar carteira',
    exact: true,
  });
  await form
    .getByRole('textbox', { name: 'Apelido da carteira', exact: true })
    .fill('Bruno principal');
  await form
    .getByRole('textbox', { name: 'Endereço', exact: true })
    .fill('invalid');
  await form.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(
    form.getByRole('textbox', { name: 'Endereço', exact: true })
  ).toHaveAttribute('aria-invalid', 'true');
  await form
    .getByRole('textbox', { name: 'Endereço', exact: true })
    .fill(`0x${'a'.repeat(40)}`);
  await form.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(form).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Cadastrar carteira', exact: true })
    .click();
  await form
    .getByRole('textbox', { name: 'Apelido da carteira', exact: true })
    .fill('Bruno secundária');
  await form
    .getByRole('textbox', { name: 'Endereço', exact: true })
    .fill(`0x${'a'.repeat(40)}`);
  await form.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(
    form.getByRole('alert').filter({ hasText: 'Endereço já cadastrado' })
  ).toBeVisible();
  await form
    .getByRole('textbox', { name: 'Endereço', exact: true })
    .fill(`0x${'b'.repeat(40)}`);
  await form.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(form).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.goto('/profile');
  await expect(
    page.getByText('Carteiras cadastradas: 2', { exact: true })
  ).toBeVisible();
});

test('loading, retry and responsive account/receipt without overflow', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  await setScenario(page, 'lento');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('status', { name: 'Carregando conta' })
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole('form', { name: 'Editar perfil', exact: true })
  ).toBeVisible();
  await setScenario(page, 'offline');
  await page.goto('/wallets');
  await expect(
    page.getByRole('button', { name: 'Tentar novamente', exact: true })
  ).toBeVisible();
  await setScenario(page, 'padrao');
  await page
    .getByRole('button', { name: 'Tentar novamente', exact: true })
    .click();
  await expect(page.getByRole('article')).toHaveCount(2);
  const orders = await api(page, 'get', '/api/wallets');
  expect(orders.items).toHaveLength(2);
  for (const width of [390, 414, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      '/profile',
      '/wallets',
      '/orders/ord_seed_confirmed',
    ]) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
        timeout: 15_000,
      });
      if (route === '/profile')
        await expect(
          page.getByRole('form', { name: 'Editar perfil', exact: true })
        ).toBeVisible();
      if (route === '/wallets')
        await expect(page.getByRole('article')).toHaveCount(2);
      if (route.startsWith('/orders'))
        await expect(
          page.getByRole('heading', {
            name: 'Pagamento confirmado',
            exact: true,
          })
        ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
    }
  }
  await page.goto('/profile');
  await expect(
    page.getByRole('form', { name: 'Editar perfil', exact: true })
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('profile-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 414, height: 896 });
  await page.screenshot({
    path: testInfo.outputPath('profile-mobile.png'),
    fullPage: true,
  });
  await page.goto('/wallets');
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.screenshot({
    path: testInfo.outputPath('wallets-mobile.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 720, height: 450 });
  await page.goto('/profile');
  await page
    .getByRole('textbox', { name: 'Nome de exibição', exact: true })
    .focus();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('textbox', { name: 'Nome de usuário', exact: true })
  ).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    document.body.style.zoom = '2';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});

test('local password validation prevents partial writes and refetch preserves unsaved edits', async ({
  page,
}) => {
  const form = page.getByRole('form', { name: 'Editar perfil', exact: true });
  await form
    .getByRole('textbox', { name: 'Nome de exibição', exact: true })
    .fill('Edição não salva');
  await form.getByLabel('Nova senha', { exact: true }).fill('curta');
  await form
    .getByLabel('Confirmar nova senha', { exact: true })
    .fill('diferente');
  await form.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(form.getByLabel('Senha atual', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true'
  );
  await expect(form.getByLabel('Nova senha', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true'
  );
  await expect(
    form.getByLabel('Confirmar nova senha', { exact: true })
  ).toHaveAttribute('aria-invalid', 'true');
  expect((await api(page, 'get', '/api/profile')).name).not.toBe(
    'Edição não salva'
  );
  await page.evaluate(async () => {
    const queryUrl = '/src/lib/query/client.ts';
    const { queryClient } = await import(queryUrl);
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
  });
  await expect(
    form.getByRole('textbox', { name: 'Nome de exibição', exact: true })
  ).toHaveValue('Edição não salva');
});
