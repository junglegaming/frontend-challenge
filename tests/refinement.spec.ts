import { test, expect } from "@playwright/test";
import { start, login, addNFT } from "./helpers";

test.beforeEach(async ({ page }) => start(page));

test("favoritos do catálogo persistem e a navegação abre a lista", async ({
  page,
  isMobile,
}) => {
  await login(page);
  await page.goto("/");
  const favorite = page
    .locator(".nft-grid .nft-card")
    .filter({
      has: page.getByRole("link", { name: "Emerald Ape #042", exact: true }),
    })
    .getByRole("button", {
      name: "Adicionar aos favoritos: Emerald Ape #042",
      exact: true,
    });
  if (!isMobile) await favorite.locator("..").hover();
  await favorite.click();
  await expect(
    page.getByRole("button", {
      name: "Remover dos favoritos: Emerald Ape #042",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  if (isMobile)
    await page
      .getByRole("navigation", { name: "Navegação inferior" })
      .getByRole("link", { name: "Favoritos", exact: true })
      .click();
  else
    await page
      .locator(".site-footer")
      .getByRole("link", { name: "Lista de interesse", exact: true })
      .click();
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Remover dos favoritos: Emerald Ape #042",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Nenhuma peça por aqui" }),
  ).toBeVisible();
});

for (const provider of ["WalletConnect", "MetaMask", "Coinbase Wallet"]) {
  test(`pagamento com ${provider} aparece no recibo e sobrevive a refresh`, async ({
    page,
  }) => {
    await login(page);
    await addNFT(page);
    await page.goto("/pagamento");
    await page.getByRole("radio", { name: provider, exact: true }).check();
    await expect(page.locator(".connection-feedback")).toContainText(
      `${provider} · Carteira conectada`,
    );
    await page.getByRole("checkbox", { name: /Entendo que esta/ }).check();
    await page
      .getByRole("button", { name: "Confirmar compra", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar compra simulada", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Seus NFTs agora estão na sua carteira",
      }),
    ).toBeVisible();
    await expect(page.locator(".receipt-meta")).toContainText(
      `${provider} · Ethereum`,
    );
    await page.reload();
    await expect(page.locator(".receipt-meta")).toContainText(
      `${provider} · Ethereum`,
    );
    if (provider === "WalletConnect") {
      await page.screenshot({
        path: `reports/refinement/recibo-${test.info().project.name}.png`,
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Ver no Etherscan", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toContainText(
        "não corresponde a uma transação real",
      );
      await page.keyboard.press("Escape");
    }
  });
}

test("conector recusa e desconecta; os campos do checkout continuam acessíveis", async ({
  page,
  isMobile,
}) => {
  await login(page);
  await addNFT(page);
  await page.goto("/pagamento");
  await page.getByRole("radio", { name: "MetaMask", exact: true }).check();
  await page.getByRole("button", { name: "Desconectar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Confirmar compra", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Simular recusa", exact: true })
    .click();
  await expect(page.locator(".connection-feedback")).toContainText(
    "Conexão recusada",
  );
  if (isMobile) await page.locator(".collector-section > summary").click();
  await expect(
    page.getByLabel("Nome completo *", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Nome de usuário *", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Rede", { exact: true }).selectOption("Polygon");
  await page
    .getByRole("radio", { name: "Coinbase Wallet", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("rede selecionada");
});

test("login social e recuperação explicam o escopo sem simular autenticação", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Continuar com Google", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "não faz parte da simulação",
  );
  await page.getByRole("button", { name: "Entendi", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page
    .getByRole("button", { name: "Esqueceu a senha?", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Recuperação de senha");
});

test("telas refinadas em 390, 414, 768 e 1440 sem overflow", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Um único projeto verifica os quatro tamanhos.",
  );
  await login(page);
  await addNFT(page);
  for (const width of [390, 414, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 896 : 1000 });
    for (const [name, route, ready] of [
      ["inicio", "/", ".nft-grid .nft-card"],
      ["detalhe", "/nft/nft-1", ".detail-info"],
      ["carrinho", "/carrinho", ".cart-item"],
      ["pagamento", "/pagamento", ".provider-option"],
      ["perfil", "/perfil", ".avatar-field"],
      ["carteiras", "/carteiras", ".wallet-editor"],
      ["login", "/login", ".auth-form-panel"],
      ["cadastro", "/cadastro", ".auth-form-panel"],
    ]) {
      await page.goto(route);
      await expect(page.locator(ready).first()).toBeVisible();
      if (name === "pagamento")
        await expect(page.locator(".summary")).toBeAttached();
      if (name === "detalhe")
        await expect(page.locator(".related-grid .nft-card")).toHaveCount(5);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${name} em ${width}px`,
      ).toBe(true);
      await page.screenshot({
        path: `reports/refinement/${name}-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
  }
});
