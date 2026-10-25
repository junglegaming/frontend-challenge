import { test, expect, type Page } from "@playwright/test";
async function control(page: Page, path: string, body: unknown) {
  await page.evaluate(
    async ({ path, body }) => {
      await fetch("/api" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    { path, body },
  );
}
async function prepare(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("alex@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("Jungle123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto("/nft/1");
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Obra adicionada" }),
  ).toBeVisible();
  await page.goto("/checkout");
  await page.getByLabel("Telefone").fill("11999999999");
  await page.getByLabel("Selecione sua carteira").selectOption("w1");
  await page
    .getByRole("button", { name: "Simular conexão", exact: true })
    .click();
  await page.getByRole("checkbox").check();
}
test("pedido pendente retoma após desconexão Socket.IO e refresh", async ({
  page,
}) => {
  await prepare(page);
  await control(page, "/demo/scenario", { scenario: "order-pending" });
  await page.getByRole("button", { name: "Revisar compra" }).click();
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(page).toHaveURL(/\/orders\//);
  const url = page.url();
  await expect(
    page.getByRole("heading", { name: "Seu pedido está sendo processado." }),
  ).toBeVisible();
  await control(page, "/demo/event", { kind: "disconnect" });
  await page.reload();
  await expect(page.getByText("Compra confirmada pela simulação.")).toBeVisible(
    { timeout: 15000 },
  );
  await expect(page).toHaveURL(url);
});
test("mudança de preço ao enviar exige revisão e estoque esgotado impede compra", async ({
  page,
}) => {
  await prepare(page);
  await control(page, "/demo/scenario", { scenario: "price-change" });
  await page.getByRole("button", { name: "Revisar compra" }).click();
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Revise a nova cotação");
  await expect(page.locator(".summary-total")).toContainText("0.342 ETH");
  await control(page, "/demo/scenario", { scenario: "sold-out" });
  await page.getByRole("button", { name: "Revisar compra" }).click();
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(page.getByRole("alert").first()).toContainText(
    /Preço ou disponibilidade|edição esgotou/i,
  );
  await expect(page).toHaveURL(/\/checkout/);
});
test("tablet 768px e navegação por teclado sem overflow", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await expect(page.locator(".nft-card")).toHaveCount(8);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Pular para o conteúdo" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await page.goto("/nft/1");
  await expect(
    page.getByRole("button", { name: "Adicionar ao carrinho" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
