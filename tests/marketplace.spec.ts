import { test, expect } from "@playwright/test";
import { start, login, addNFT, review, scenario, event } from "./helpers";
test.beforeEach(async ({ page }) => {
  await start(page);
});
test("busca, filtros, ordenação, paginação e histórico", async ({
  page,
  isMobile,
}) => {
  await page
    .getByRole("textbox", { name: "Buscar NFTs", exact: true })
    .fill("Nomad");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page).toHaveURL(/q=Nomad/);
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(2);
  if (isMobile)
    await page.getByRole("button", { name: "Filtros", exact: true }).click();
  const panel = isMobile ? page.getByRole("dialog") : page.locator(".sidebar");
  await panel.getByRole("button", { name: /Arte digital/ }).click();
  await expect(page).toHaveURL(/category=Arte/);
  await panel.getByRole("button", { name: "Polygon", exact: true }).click();
  if (isMobile)
    await page.getByRole("button", { name: "Ver resultados" }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhuma peça por aqui" }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(9);
  await page.getByRole("button", { name: "Próxima página" }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.reload();
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(9);
  if (isMobile) {
    await page.getByRole("button", { name: "Filtros", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByLabel("Ordenar resultados")
      .selectOption("price-asc");
    await page.getByRole("button", { name: "Ver resultados" }).click();
  } else {
    await page.getByLabel("Ordenar NFTs").selectOption("price-asc");
  }
  await expect(page).toHaveURL(/sort=price-asc/);
  await page.goBack();
  await expect(page).toHaveURL(/page=2/);
});
test("acesso direto, edição indisponível e recurso inexistente", async ({
  page,
}) => {
  await page.goto("/nft/nft-1");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("option", { name: /arquivo/ })).toHaveAttribute(
    "disabled",
    "",
  );
  await page.goto("/nft/inexistente");
  await expect(
    page.getByText("NFT não encontrado.", { exact: true }),
  ).toBeVisible();
  await page.goto("/rota-inexistente");
  await expect(
    page.getByRole("heading", { name: "Esta página não existe" }),
  ).toBeVisible();
});
test("carrinho persiste e é mesclado no login; cupom e quantidade", async ({
  page,
}) => {
  await addNFT(page);
  await page.reload();
  await page.goto("/carrinho");
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await page
    .getByLabel("Quantidade de Emerald Ape #042", { exact: true })
    .selectOption("2");
  await page.getByLabel("Código promocional", { exact: true }).fill("EXPIRED");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(
    page.getByText("Este cupom expirou.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Código promocional", { exact: true }).fill("KURIO10");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.locator(".summary")).toContainText("2,147 ETH");
  await login(page);
  await page.goto("/carrinho");
  await expect(
    page.getByLabel("Quantidade de Emerald Ape #042", { exact: true }),
  ).toHaveValue("2");
  await page.getByRole("button", { name: "Remover Emerald Ape #042" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está esperando por arte" }),
  ).toBeVisible();
});
test("favorito otimista faz rollback e recupera", async ({ page }) => {
  await login(page);
  await page.goto("/nft/nft-1");
  await scenario(page, "favorite-error");
  await page
    .getByRole("button", { name: "Adicionar aos favoritos", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Não foi possível salvar o favorito.",
  );
  await expect(
    page.getByRole("button", { name: "Adicionar aos favoritos", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await scenario(page, "standard");
  await page
    .getByRole("button", { name: "Adicionar aos favoritos", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("compra completa e recibo imutável", async ({ page }) => {
  await login(page);
  await addNFT(page);
  await review(page);
  await page.getByRole("button", { name: "Confirmar compra simulada" }).click();
  await expect(page).toHaveURL(/\/pedido\//);
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  await expect(page.locator(".summary")).toContainText("1,195 ETH");
  await event(page, "price");
  await expect(page.locator(".summary")).toContainText("1,195 ETH");
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  await page.goto("/carrinho");
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está esperando por arte" }),
  ).toBeVisible();
});
test("pagamento recusado preserva carrinho", async ({ page }) => {
  await login(page);
  await addNFT(page);
  await scenario(page, "payment-declined");
  await review(page);
  await page.getByRole("button", { name: "Confirmar compra simulada" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Não foi possível concluir o pagamento.",
    }),
  ).toBeVisible();
  await page.goto("/carrinho");
  await expect(page.locator(".cart-item")).toHaveCount(1);
});
test("timeout após criação recupera exatamente o mesmo pedido", async ({
  page,
}) => {
  await login(page);
  await addNFT(page);
  await scenario(page, "order-timeout");
  await review(page);
  await page.getByRole("button", { name: "Confirmar compra simulada" }).click();
  await expect(
    page.getByRole("button", { name: "Recuperar a mesma tentativa" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Recuperar a mesma tentativa" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  await page.goto("/pedidos");
  await expect(page.locator(".order-list>a")).toHaveCount(1);
});
test("Socket.IO atualiza preço, ignora duplicatas e bloqueia revisão antiga", async ({
  page,
}) => {
  await login(page);
  await addNFT(page);
  await review(page);
  await expect(page.locator(".connection")).toContainText(
    "Atualizações ao vivo",
  );
  await event(page, "duplicate");
  await expect(page.getByRole("dialog")).toContainText(
    "A cotação foi atualizada.",
  );
  await expect(
    page.getByRole("button", { name: "Confirmar compra simulada" }),
  ).toBeDisabled();
  await event(page, "old");
  await page.getByRole("button", { name: "Fechar diálogo" }).click();
  await expect(page.locator(".summary")).toContainText("1,295 ETH");
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirmar compra simulada" }),
  ).toBeEnabled();
});
test("desconexão e refresh recuperam pedido pendente", async ({ page }) => {
  await login(page);
  await addNFT(page);
  await scenario(page, "pending-disconnect");
  await review(page);
  await page.getByRole("button", { name: "Confirmar compra simulada" }).click();
  await expect(page).toHaveURL(/\/pedido\//);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  await page.goto("/pedidos");
  await expect(page.locator(".order-list>a")).toHaveCount(1);
});
test("perfil, validação de senha e carteiras persistem", async ({ page }) => {
  await login(page);
  await page
    .getByLabel("Nome de exibição *", { exact: true })
    .fill("Ana Colecionadora");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toContainText("Perfil atualizado");
  await page.reload();
  await expect(
    page.getByLabel("Nome de exibição *", { exact: true }),
  ).toHaveValue("Ana Colecionadora");
  await page.getByLabel("Senha atual", { exact: true }).fill("Incorreta123");
  await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha123!");
  await page
    .getByLabel("Confirmar nova senha", { exact: true })
    .fill("NovaSenha123!");
  await page.getByRole("button", { name: "Atualizar senha" }).click();
  await expect(
    page.getByText("Senha atual incorreta.", { exact: true }),
  ).toBeVisible();
  await page.goto("/carteiras");
  await page.getByRole("button", { name: "Adicionar carteira" }).click();
  await page
    .getByLabel("Apelido da carteira", { exact: true })
    .fill("Minha secundária");
  await page
    .getByLabel("Endereço simulado", { exact: true })
    .fill("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
  await page.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(
    page.getByRole("heading", { name: "Minha secundária" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Minha secundária" }),
  ).toBeVisible();
});
test("expiração no checkout retoma contexto e troca de usuário isola dados", async ({
  page,
}) => {
  await login(page);
  await addNFT(page);
  await review(page);
  await event(page, "expire");
  await page.getByRole("button", { name: "Confirmar compra simulada" }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("E-mail", { exact: true }).fill("ana@kurio.demo");
  await page.getByLabel("Senha", { exact: true }).fill("Kurio123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Pagamento", exact: true }),
  ).toBeVisible();
  await page.goto("/perfil");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await login(page, "leo@kurio.demo");
  await page.goto("/carrinho");
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está esperando por arte" }),
  ).toBeVisible();
});
test("skeletons, falha de rede e recuperação", async ({ page }) => {
  await scenario(page, "slow");
  await page.goto("/nft/nft-2");
  await expect(
    page.getByRole("status", { name: "Carregando conteúdo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sage Nomad #009", exact: true }),
  ).toBeVisible();
  await scenario(page, "server-error");
  await page.goto("/nft/nft-3");
  await expect(
    page.getByRole("heading", { name: "Não conseguimos carregar agora" }),
  ).toBeVisible();
  await scenario(page, "standard");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    page.getByRole("heading", { name: "Neon Vessel #552", exact: true }),
  ).toBeVisible();
});
test("cadastro, conflito de e-mail e validação de confirmação", async ({
  page,
}) => {
  await page.goto("/cadastro");
  await page
    .getByLabel("Nome completo", { exact: true })
    .fill("Novo Colecionador");
  await page.getByLabel("E-mail", { exact: true }).fill("ana@kurio.demo");
  await page.getByLabel("Senha", { exact: true }).fill("Kurio123!");
  await page.getByLabel("Confirmar senha", { exact: true }).fill("Kurio123!");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(
    page.getByText("Este e-mail já está cadastrado.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("E-mail", { exact: true }).fill("novo@kurio.demo");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Perfil do colecionador" }),
  ).toBeVisible();
});
test("foco no diálogo, teclado e ausência de overflow", async ({ page }) => {
  await login(page);
  await addNFT(page);
  await review(page);
  const dialog = page.getByRole("dialog");
  await page.keyboard.press("Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirmar compra", exact: true }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
