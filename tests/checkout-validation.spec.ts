import { test, expect } from "@playwright/test";
import { start, login, addNFT } from "./helpers";

test("checkout aceita usuário com pontos e identifica os campos obrigatórios", async ({
  page,
}) => {
  await start(page);
  await login(page);
  await addNFT(page);
  await page.goto("/pagamento");
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await page.getByRole("checkbox", { name: /Entendo que esta/ }).check();
  await page.locator(".collector-section").evaluate((node) => {
    (node as HTMLDetailsElement).open = true;
  });
  const username = page.getByLabel("Nome de usuário *", { exact: true });
  await username.fill("usuário inválido!");
  await page.getByLabel("Nome do perfil *", { exact: true }).fill("");
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(username).toHaveAttribute("aria-invalid", "true");
  await expect(username).toBeFocused();
  await expect(
    page.getByText("Informe o nome do perfil com pelo menos 2 caracteres.", {
      exact: true,
    }),
  ).toBeVisible();
  await username.fill("weldon.dev.engineer");
  await page
    .getByLabel("Nome do perfil *", { exact: true })
    .fill("Coleção Weldon");
  await page
    .getByLabel("Nome completo *", { exact: true })
    .fill("Nome em edição");
  await page.clock.fastForward(35000);
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/session") && r.request().method() === "GET",
  );
  await page.evaluate(() =>
    window.dispatchEvent(new Event("visibilitychange")),
  );
  await response;
  await expect(page.getByLabel("Nome completo *", { exact: true })).toHaveValue(
    "Nome em edição",
  );
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  const review = page.getByRole("dialog");
  await expect(review).toBeVisible();
  await review
    .getByRole("button", { name: "Confirmar compra simulada", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
});
