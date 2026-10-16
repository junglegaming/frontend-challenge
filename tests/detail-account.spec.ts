import { test, expect } from "@playwright/test";
import { start, login, addNFT, scenario } from "./helpers";
test.beforeEach(async ({ page }) => start(page));

test("galeria ampliada e abas de avaliações funcionam com teclado", async ({
  page,
}) => {
  await page.goto("/nft/nft-3");
  await expect(page.locator(".detail-info .nft-rating")).toContainText("4.8");
  await page
    .getByRole("button", { name: "Ampliar imagem do NFT", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Vista 3", exact: true }).click();
  await expect(page.locator(".preview-art")).toHaveClass(/view-2/);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Ampliar imagem do NFT", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("tab", {
      name: "Avaliações de colecionadores (19)",
      exact: true,
    })
    .click();
  await expect(page.locator(".collector-reviews article")).toHaveCount(19);
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByRole("tab", { name: "Detalhes do NFT", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#panel-details")).toBeVisible();
});

test("editar a carteira principal preserva os campos do layout após refresh", async ({
  page,
}) => {
  await login(page);
  await page.goto("/carteiras");
  await page
    .getByLabel("Apelido da carteira", { exact: true })
    .fill("Principal revisada");
  await page
    .getByLabel("Nome do perfil *", { exact: true })
    .fill("Colecionadora Ana");
  await page
    .getByRole("button", { name: "Salvar carteira", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Carteira salva com sucesso",
  );
  await page.reload();
  await expect(
    page.getByLabel("Apelido da carteira", { exact: true }),
  ).toHaveValue("Principal revisada");
  await expect(
    page.getByLabel("Nome do perfil *", { exact: true }),
  ).toHaveValue("Colecionadora Ana");
});

test("falha de conexão da carteira permite nova tentativa sem marcar sucesso", async ({
  page,
}) => {
  await login(page);
  await addNFT(page);
  await page.goto("/pagamento");
  await expect(
    page.getByRole("radio", { name: "MetaMask", exact: true }),
  ).toBeEnabled();
  await scenario(page, "server-error");
  await page.getByRole("radio", { name: "MetaMask", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "temporariamente indisponível",
  );
  await expect(
    page.getByRole("radio", { name: "MetaMask", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Confirmar compra", exact: true }),
  ).toBeDisabled();
  await scenario(page, "standard");
  await page.getByRole("radio", { name: "MetaMask", exact: true }).check();
  await expect(page.locator(".connection-feedback")).toContainText(
    "MetaMask · Carteira conectada",
  );
});

test("avatar enviado e removido permanece correto após refresh", async ({
  page,
}) => {
  await login(page);
  await page
    .getByLabel("Alterar avatar", { exact: true })
    .setInputFiles("public/assets/ape-2.webp");
  await page
    .getByRole("button", { name: "Salvar alterações", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Perfil atualizado");
  await page.reload();
  await expect(
    page.getByAltText("Seu avatar", { exact: true }),
  ).toHaveAttribute("src", /^data:image\/webp;base64,/);
  await page.getByRole("button", { name: "Remover", exact: true }).click();
  await page
    .getByRole("button", { name: "Salvar alterações", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Perfil atualizado");
  await page.reload();
  await expect(page.getByAltText("Seu avatar", { exact: true })).toHaveCount(0);
  await expect(page.locator(".avatar-placeholder")).toBeVisible();
});
