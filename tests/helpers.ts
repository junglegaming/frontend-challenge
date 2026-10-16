import { expect, type Page } from "@playwright/test";
export async function start(page: Page, scenario = "standard") {
  await page.clock.install({ time: new Date("2026-10-15T12:00:00Z") });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /SEJA DONO/ })).toBeVisible();
  await page.evaluate(async (scenario) => {
    await fetch("/api/demo/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario }),
    });
  }, scenario);
  await page.reload();
  await expect(page.getByRole("heading", { name: /SEJA DONO/ })).toBeVisible();
}
export async function scenario(page: Page, value: string) {
  await page.evaluate(async (scenario) => {
    await fetch("/api/demo/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario }),
    });
  }, value);
}
export async function event(page: Page, type: string) {
  await page.evaluate(async (type) => {
    await fetch("/api/demo/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
  }, type);
}
export async function login(page: Page, email = "ana@kurio.demo") {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Kurio123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/perfil/);
  await expect(
    page.getByRole("heading", { name: "Perfil do colecionador" }),
  ).toBeVisible();
}
export async function addNFT(page: Page) {
  await page.goto("/nft/nft-1");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Adicionar ao carrinho", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "NFT adicionado ao carrinho." }),
  ).toBeVisible();
}
export async function review(page: Page) {
  await page.goto("/pagamento");
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await page.getByRole("checkbox", { name: /Entendo que esta/ }).check();
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
