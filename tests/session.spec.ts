import { test, expect } from "@playwright/test";
import { start, login } from "./helpers";

test.beforeEach(async ({ page }) => start(page));

test("refresh de sessão com nome ausente mantém aplicação utilizável", async ({
  page,
}) => {
  await login(page);
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem("kurio:db:v1")!);
    delete db.users.find(
      (user: { id: string }) => user.id === db.session.userId,
    ).name;
    localStorage.setItem("kurio:db:v1", JSON.stringify(db));
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Perfil do colecionador" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Nome de exibição *", { exact: true }),
  ).toHaveValue("Colecionador");
  await expect(
    page.getByText("Something went wrong!", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Nome de exibição *", { exact: true })
    .fill("Ana Recuperada");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toContainText("Perfil atualizado");
  await page.reload();
  await expect(
    page.getByLabel("Nome de exibição *", { exact: true }),
  ).toHaveValue("Ana Recuperada");
});

test("login de conta persistida sem nome não derruba cabeçalho", async ({
  page,
}) => {
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem("kurio:db:v1")!);
    delete db.users.find((user: { id: string }) => user.id === "ana").name;
    localStorage.setItem("kurio:db:v1", JSON.stringify(db));
  });
  await login(page);
  await expect(
    page.getByLabel("Nome de exibição *", { exact: true }),
  ).toHaveValue("Colecionador");
  await expect(
    page.getByRole("link", { name: /^(Meu perfil|Minha conta)$/ }),
  ).toBeVisible();
});

test("sessão continua válida ao retornar após inatividade", async ({
  page,
}) => {
  await login(page);
  await page.clock.fastForward(35000);
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/session") && r.request().method() === "GET",
  );
  await page.evaluate(() =>
    window.dispatchEvent(new Event("visibilitychange")),
  );
  expect((await response).status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Perfil do colecionador" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /^(Meu perfil|Minha conta)$/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Something went wrong!", { exact: true }),
  ).toHaveCount(0);
});

test("sessão expirada durante inatividade pede login e preserva carrinho", async ({
  page,
}) => {
  await login(page);
  await page.goto("/nft/nft-1");
  await page
    .getByRole("button", { name: "Adicionar ao carrinho", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "NFT adicionado ao carrinho.",
  );
  await page.goto("/perfil");
  await expect(
    page.getByRole("heading", { name: "Perfil do colecionador" }),
  ).toBeVisible();
  await page.clock.fastForward(3600001);
  await page.evaluate(() =>
    window.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByText("Something went wrong!", { exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("E-mail", { exact: true }).fill("ana@kurio.demo");
  await page.getByLabel("Senha", { exact: true }).fill("Kurio123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Perfil do colecionador" }),
  ).toBeVisible();
  await page.goto("/carrinho");
  await expect(page.locator(".cart-item")).toHaveCount(1);
});
