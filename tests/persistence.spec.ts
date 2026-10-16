import { test, expect } from "@playwright/test";
import { start, login, addNFT, scenario } from "./helpers";

test.beforeEach(async ({ page }) => start(page));

for (const mode of ["invalid-catalog", "invalid-response"]) {
  test(`resposta ${mode} após inatividade mostra erro recuperável`, async ({
    page,
  }) => {
    await scenario(page, mode);
    await page.clock.fastForward(35000);
    await page.reload();
    await expect(
      page.getByText(
        mode === "invalid-catalog"
          ? "O catálogo retornou dados inválidos. Tente novamente."
          : "O serviço retornou uma resposta inválida. Tente novamente.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("Something went wrong!", { exact: true }),
    ).toHaveCount(0);
    await scenario(page, "standard");
    await page.getByRole("button", { name: /Tentar novamente/ }).click();
    await expect(page.locator(".nft-grid .nft-card")).toHaveCount(9);
  });
}

test("banco legado incompleto recupera coleções sem apagar perfil e carrinho", async ({
  page,
}) => {
  await login(page);
  await addNFT(page);
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem("kurio:db:v1")!);
    const user = db.users.find(
      (entry: { id: string }) => entry.id === db.session.userId,
    );
    user.name = "Perfil preservado";
    delete user.favorites;
    delete user.wallets;
    delete db.guest;
    delete db.quotes;
    localStorage.setItem("kurio:db:v1", JSON.stringify(db));
  });
  await page.reload();
  await page.goto("/perfil");
  await expect(
    page.getByLabel("Nome de exibição *", { exact: true }),
  ).toHaveValue("Perfil preservado");
  await page.goto("/carteiras");
  await expect(
    page.getByLabel("Apelido da carteira", { exact: true }),
  ).toHaveValue("Carteira principal");
  await page.goto("/carrinho");
  await expect(page.locator(".cart-item")).toHaveCount(1);
});

test("snapshot corrompido recupera backup sem zerar conta nem carrinho", async ({
  page,
}) => {
  await login(page);
  await addNFT(page);
  await page.evaluate(() => localStorage.setItem("kurio:db:v1", "{incompleto"));
  await page.reload();
  await page.goto("/perfil");
  await expect(
    page.getByLabel("Nome de exibição *", { exact: true }),
  ).toHaveValue("Ana Oliveira");
  await page.goto("/carrinho");
  await expect(page.locator(".cart-item")).toHaveCount(1);
});

test("cotações temporárias não crescem sem limite e selects usam tema escuro", async ({
  page,
}) => {
  await login(page);
  await addNFT(page);
  const count = await page.evaluate(async () => {
    for (let i = 0; i < 24; i++)
      await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupon: "" }),
      });
    return Object.keys(JSON.parse(localStorage.getItem("kurio:db:v1")!).quotes)
      .length;
  });
  expect(count).toBeLessThanOrEqual(20);
  await page.goto("/carteiras");
  await expect(page.getByLabel("Rede", { exact: true })).toHaveCSS(
    "color-scheme",
    "dark",
  );
  await expect(
    page.getByLabel("Rede", { exact: true }).locator("option").nth(1),
  ).toHaveCSS("background-color", "rgb(40, 25, 18)");
});
