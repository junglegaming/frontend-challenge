import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import type { Order } from "../src/contracts/order";
import type { OrderUpdatedPayload } from "../src/realtime/types";

const nftName = "Bored Ape #731";

// Playwright creates a fresh browser context per test. Storage is deliberately
// not cleared on navigation/reload, so persistence and the real MSW runtime work.
async function addNftToCart(page: Page, quantity = 1, nft = { id: "nft-2", name: nftName }) {
  await page.goto("/");
  const catalog = page.getByRole("region", { name: "Catálogo de NFTs", exact: true });
  await expect(catalog.getByRole("link", { name: new RegExp(nft.name) })).toBeVisible();
  await catalog.getByRole("link", { name: new RegExp(nft.name) }).click();

  await expect(page).toHaveURL(`/nfts/${nft.id}`);
  await expect(page.getByRole("heading", { name: nft.name, exact: true })).toBeVisible();
  for (let current = 1; current < quantity; current++) {
    await page.getByRole("button", { name: "Aumentar quantidade", exact: true }).click();
  }
  await page.getByRole("button", { name: "COMPRAR", exact: true }).click();
  await expect(page).toHaveURL("/cart");
}

async function login(page: Page, email = "collector@kurio.test", name = "Mock Collector") {
  await page.goto("/login");
  await completeLogin(page, "/", email, name);
}

async function completeLogin(page: Page, destination: string, email = "collector@kurio.test", name = "Mock Collector") {
  await page.getByRole("textbox", { name: "E-mail", exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(destination);
  await expect(page.getByRole("banner").getByText(name, { exact: true })).toBeVisible();
}

test("marketplace → detalhe → carrinho com a quantidade selecionada", async ({ page }) => {
  await addNftToCart(page, 2);

  const item = page.getByRole("article", { name: nftName, exact: true });
  await expect(item.getByRole("heading", { name: nftName, exact: true })).toBeVisible();
  await expect(item.getByText("2", { exact: true })).toBeVisible();
  await expect(item.getByText("4.90 ETH", { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Carrinho com 2 item(ns)", exact: true })).toBeVisible();

  // Exercise the existing desktop navigation from another route and on Home.
  const navigation = page.getByRole("navigation", { name: "Navegação principal", exact: true });
  for (const destination of [
    { label: "Mercado", hash: "catalog-section" },
    { label: "Criadores", hash: "criadores" },
    { label: "Aprenda", hash: "aprenda" },
  ]) {
    await navigation.getByRole("link", { name: destination.label, exact: true }).click();
    await expect(page).toHaveURL(`/#${destination.hash}`);
    await expect(page.locator(`#${destination.hash}`)).toBeInViewport();
  }
  await navigation.getByRole("link", { name: "Início", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  const catalog = page.getByRole("region", { name: "Catálogo de NFTs", exact: true });
  const search = page.getByRole("searchbox", { name: "Buscar NFTs", exact: true });
  const sort = page.getByLabel("Ordenar NFTs", { exact: true });
  const sidebar = page.getByRole("complementary", { name: "Filtros do catálogo", exact: true });
  const apply = sidebar.getByRole("button", { name: "Aplicar", exact: true });
  async function expectNoJump(previousScroll: number) {
    await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - previousScroll)).toBeLessThan(80);
    await expect(catalog).toBeInViewport();
    expect(new URL(page.url()).hash).toBe("");
  }

  await navigation.getByRole("link", { name: "Aprenda", exact: true }).click();
  await search.scrollIntoViewIfNeeded();
  const beforeSearch = await page.evaluate(() => window.scrollY);
  await search.fill("ape");
  await expect(page).toHaveURL(/q=ape/);
  await expectNoJump(beforeSearch);

  await navigation.getByRole("link", { name: "Criadores", exact: true }).click();
  await sort.scrollIntoViewIfNeeded();
  const beforeSort = await page.evaluate(() => window.scrollY);
  await sort.selectOption("price-asc");
  await expect(page).toHaveURL(/sort=price-asc/);
  await expectNoJump(beforeSort);

  await navigation.getByRole("link", { name: "Aprenda", exact: true }).click();
  await sidebar.getByLabel("Mín.", { exact: true }).fill("2");
  await sidebar.getByLabel("Máx.", { exact: true }).fill("3");
  await apply.scrollIntoViewIfNeeded();
  const beforeFilter = await page.evaluate(() => window.scrollY);
  await apply.click();
  await expect(page).toHaveURL(/min=2&max=3/);
  await expect(catalog.getByRole("link", { name: /Bored Ape #731/ })).toBeVisible();
  await expect(catalog.getByRole("link", { name: /Bored Ape #925/ })).toHaveCount(0);
  await expectNoJump(beforeFilter);

  const tabs = page.getByRole("navigation", { name: "Abas do catálogo", exact: true });
  await navigation.getByRole("link", { name: "Criadores", exact: true }).click();
  await tabs.getByRole("button", { name: "Em alta", exact: true }).scrollIntoViewIfNeeded();
  const beforeTab = await page.evaluate(() => window.scrollY);
  await tabs.getByRole("button", { name: "Em alta", exact: true }).click();
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(tabs.getByRole("button", { name: "Em alta", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expectNoJump(beforeTab);

  await sidebar.getByLabel("Mín.", { exact: true }).fill("");
  await sidebar.getByLabel("Máx.", { exact: true }).fill("");
  await apply.click();
  await tabs.getByRole("button", { name: "Todos os NFTs", exact: true }).click();
  await navigation.getByRole("link", { name: "Aprenda", exact: true }).click();
  await page.getByRole("navigation", { name: "Paginação", exact: true }).getByRole("button", { name: "2", exact: true }).click();
  await expect(page).toHaveURL(/page=2#catalog-section$/);
  await expect(catalog).toBeInViewport();
  await expect(catalog.getByRole("link", { name: /Bored Ape #843/ })).toBeVisible();
});

test("carrinho preserva item, quantidade alterada e subtotal após F5", async ({ page }) => {
  await addNftToCart(page);
  const item = page.getByRole("article", { name: nftName, exact: true });
  await item.getByRole("button", { name: `Aumentar quantidade de ${nftName}`, exact: true }).click();
  await item.getByRole("button", { name: `Aumentar quantidade de ${nftName}`, exact: true }).click();
  await expect(item.getByText("3", { exact: true })).toBeVisible();

  await page.reload();

  await expect(item.getByText("3", { exact: true })).toBeVisible();
  await expect(item.getByText("7.35 ETH", { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Carrinho com 3 item(ns)", exact: true })).toBeVisible();
});

test("checkout acompanha pending → order.updated → confirmed e só então esvazia o carrinho", async ({ page }) => {
  await addNftToCart(page);
  await page.getByRole("link", { name: "Conectar e finalizar", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(new URL(page.url()).searchParams.get("redirect")).toBe("/checkout");
  await completeLogin(page, "/checkout");
  await expect(page).toHaveURL("/checkout");
  await expect(page.getByRole("article", { name: nftName, exact: true })).toBeVisible();

  await page.getByLabel("Nome de exibição", { exact: false }).fill("E2E Collector");
  await page.getByLabel("Nome de usuário", { exact: false }).fill("e2e-collector");
  await page.getByLabel("Rede", { exact: false }).selectOption("ethereum");
  await page.getByLabel("Nome do perfil", { exact: false }).fill("E2E Collector");
  await page.getByLabel("Endereço da carteira", { exact: false }).fill("0x0000000000000000000000000000000000000001");
  await page.getByLabel("Tipo de carteira", { exact: false }).selectOption("coinbase");
  await page.getByLabel("Código de indicação", { exact: false }).fill("E2E");
  await page.getByRole("textbox", { name: "E-mail*", exact: true }).fill("e2e@kurio.test");

  // Observe the real POST and the existing socket listener; never inject events.
  const createdResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/orders" && response.request().method() === "POST",
  );
  const updatedMessage = page.waitForEvent("console", {
    predicate: (message) => message.text().startsWith("[realtime] order.updated"),
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Confirmar compra", exact: true }).click();

  const response = await createdResponse;
  expect(response.status()).toBe(201);
  const pending: Order = await response.json();
  expect(pending.status).toBe("pending");
  expect(pending.transactionId).toBeUndefined();
  await expect(page).toHaveURL("/order-confirmation");
  await expect(page.getByRole("status")).toHaveText("Seu pedido está sendo processado");
  await expect(page.getByText("Aguardando confirmação", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("kurio-cart:user-collector") ?? "[]"))).toHaveLength(1);

  const event = await (await updatedMessage).args()[1].jsonValue() as OrderUpdatedPayload;
  expect(event).toMatchObject({ id: pending.id, status: "confirmed" });
  if (event.status !== "confirmed") throw new Error("Expected a confirmed order.updated event");

  await expect(page.getByRole("status")).toHaveText("Seus NFTs agora estão na sua carteira");
  await expect(page.getByTitle(event.transactionId, { exact: true })).toBeVisible();

  // Browser fetch passes through the application's MSW handlers (APIRequestContext would not).
  const reconciled = await page.evaluate(async (id) => {
    const result = await fetch(`/api/orders/${encodeURIComponent(id)}`);
    return { status: result.status, order: await result.json() };
  }, pending.id);
  expect(reconciled.status).toBe(200);
  expect(reconciled.order).toMatchObject({ id: pending.id, status: "confirmed", transactionId: event.transactionId });

  await page.getByRole("link", { name: "Fechar e voltar ao marketplace", exact: true }).click();
  await page.getByRole("link", { name: "Carrinho com 0 item(ns)", exact: true }).click();
  await expect(page).toHaveURL("/cart");
  await expect(page.getByRole("region", { name: "Itens do carrinho", exact: true }).getByRole("article")).toHaveCount(0);
  await expect(page.getByText("Carrinho vazio.", { exact: true })).toBeVisible();
});

test("login autentica e mantém a sessão visível após F5", async ({ page }) => {
  await login(page);
  await page.reload();

  const header = page.getByRole("banner");
  await expect(header.getByText("Mock Collector", { exact: true })).toBeVisible();
  await expect(header.getByRole("button", { name: "Sair", exact: true })).toBeVisible();
  await expect(header.getByRole("link", { name: "Entrar", exact: true })).toHaveCount(0);
  await header.getByRole("link", { name: "Mock Collector", exact: true }).click();
  await expect(page).toHaveURL("/profile");
  await expect(page.getByRole("heading", { name: "Perfil do colecionador", exact: true })).toBeVisible();
  const sidebar = page.getByRole("complementary", { name: "Menu do perfil", exact: true });
  await expect(sidebar.getByRole("link", { name: "Dados do perfil", exact: true })).toHaveAttribute("aria-current", "page");
  await sidebar.getByRole("link", { name: "Carteiras", exact: true }).click();
  await expect(page).toHaveURL("/profile/wallets");
  await expect(sidebar.getByRole("link", { name: "Carteiras", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: "Salvar carteira", exact: true })).toHaveAttribute("data-slot", "button");
  await sidebar.getByRole("link", { name: "Dados do perfil", exact: true }).click();
  await expect(page).toHaveURL("/profile");
  const saveProfile = page.getByRole("button", { name: "Salvar", exact: true });
  await expect(saveProfile).toHaveAttribute("data-slot", "button");
  await saveProfile.click();
  await expect(page.getByRole("status")).toHaveText("Dados do perfil salvos com sucesso!");

  await addNftToCart(page, 2);
  await page.goto("/profile");
  for (const [width, height] of [[375, 812], [390, 844], [414, 896], [430, 932], [1440, 1080]]) {
    await page.setViewportSize({ width, height });
    await header.getByRole("link", { name: "Mock Collector", exact: true }).click();
    await expect(page).toHaveURL("/profile");
    for (const destination of ["Carteiras", "Dados do perfil"]) {
      await sidebar.getByRole("link", { name: destination, exact: true }).click();
      await expect(page).toHaveURL(destination === "Carteiras" ? "/profile/wallets" : "/profile");
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(header.getByRole("link", { name: "Mock Collector", exact: true })).toBeInViewport();
      await expect(header.getByRole("button", { name: "Sair", exact: true })).toBeInViewport();
      const cart = header.getByRole("link", { name: "Carrinho com 2 item(ns)", exact: true });
      await expect(cart).toBeInViewport();
      await expect(cart.getByText("2", { exact: true })).toBeVisible();
    }
  }
  await page.getByRole("navigation", { name: "Breadcrumb", exact: true }).getByRole("link", { name: "Início", exact: true }).click();
  await expect(page).toHaveURL("/");
  await header.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(header.getByRole("link", { name: "Entrar", exact: true })).toBeVisible();
});

test("cadastro valida confirmação da senha e autentica uma conta nova", async ({ page }) => {
  const name = "E2E Collector";
  const email = `collector-${randomUUID()}@kurio.test`;
  await page.goto("/register");
  await page.getByRole("textbox", { name: "Nome de usuário", exact: true }).fill(name);
  await page.getByRole("textbox", { name: "Digite seu e-mail", exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("123456");
  await page.getByLabel("Confirmar senha", { exact: true }).fill("654321");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("As senhas não coincidem.");
  await expect(page).toHaveURL("/register");

  await page.getByLabel("Confirmar senha", { exact: true }).fill("123456");
  const registeredResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/auth/register" && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  expect((await registeredResponse).status()).toBe(201);
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("banner").getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("button", { name: "Sair", exact: true })).toBeVisible();
});

test("guest é mesclado uma vez e carrinhos privados permanecem isolados", async ({ page }) => {
  await login(page);
  const header = page.getByRole("banner");
  const collectorNft = { id: "nft-3", name: "Bored Ape #186" };
  const guestNft = { id: "nft-1", name: "Bored Ape #402" };
  await addNftToCart(page, 2);
  await addNftToCart(page, 1, collectorNft);
  await header.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page.getByText("Carrinho vazio.", { exact: true })).toBeVisible();

  await addNftToCart(page, 2, guestNft);
  await addNftToCart(page, 1);
  await page.reload();
  await expect(page.getByRole("article", { name: guestNft.name, exact: true }).getByText("2", { exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: nftName, exact: true }).getByText("1", { exact: true })).toBeVisible();
  await login(page);
  await expect(header.getByText("Mock Collector", { exact: true })).toBeVisible();
  await header.getByRole("link", { name: "Carrinho com 6 item(ns)", exact: true }).click();
  await expect(page.getByRole("article", { name: guestNft.name, exact: true }).getByText("2", { exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: nftName, exact: true }).getByText("3", { exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: collectorNft.name, exact: true })).toBeVisible();
  await page.reload();
  await expect(header.getByRole("link", { name: "Carrinho com 6 item(ns)", exact: true })).toBeVisible();
  await header.getByRole("button", { name: "Sair", exact: true }).click();

  await expect(header.getByRole("link", { name: "Entrar", exact: true })).toBeVisible();
  await expect(header.getByText("Mock Collector", { exact: true })).toHaveCount(0);
  await expect(header.getByRole("button", { name: "Sair", exact: true })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Carrinho com 0 item(ns)", exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: collectorNft.name, exact: true })).toHaveCount(0);
  await expect(page.getByText("Carrinho vazio.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Entrar", exact: true })).toBeVisible();
  await expect(page.getByText("Carrinho vazio.", { exact: true })).toBeVisible();

  await login(page, "creator@kurio.test", "Mock Creator");
  await expect(header.getByRole("link", { name: "Carrinho com 0 item(ns)", exact: true })).toBeVisible();
  await header.getByRole("link", { name: "Carrinho com 0 item(ns)", exact: true }).click();
  await expect(page.getByText("Carrinho vazio.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(header.getByText("Mock Creator", { exact: true })).toBeVisible();
  await expect(page.getByText("Carrinho vazio.", { exact: true })).toBeVisible();
  await header.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(header.getByRole("link", { name: "Carrinho com 0 item(ns)", exact: true })).toBeVisible();

  await login(page);
  await header.getByRole("link", { name: "Carrinho com 6 item(ns)", exact: true }).click();
  await expect(page.getByRole("article", { name: collectorNft.name, exact: true }).getByText("1", { exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: nftName, exact: true }).getByText("3", { exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: guestNft.name, exact: true }).getByText("2", { exact: true })).toBeVisible();
});

test("rotas privadas exigem login, preservam retorno e rejeitam redirects externos", async ({ page }) => {
  for (const path of ["/checkout", "/profile", "/order-confirmation", "/profile/wallets"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?redirect=/);
    expect(new URL(page.url()).searchParams.get("redirect")).toBe(path);
    await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
  }
  await completeLogin(page, "/profile/wallets");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Carteira principal", exact: true })).toBeVisible();
  await page.getByRole("complementary", { name: "Menu do perfil", exact: true }).getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?redirect=/);

  for (const invalid of ["https://example.com", "//example.com", "/\\example.com"]) {
    await page.goto(`/login?redirect=${encodeURIComponent(invalid)}`);
    await completeLogin(page, "/");
    await page.getByRole("banner").getByRole("button", { name: "Sair", exact: true }).click();
  }
});
