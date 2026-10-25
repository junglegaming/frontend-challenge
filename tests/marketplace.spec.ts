import { test, expect, type Page } from "@playwright/test";
async function rest(page: Page, path: string, body?: unknown) {
  // The shell is rendered only after the service worker is ready.
  await page.locator("#main").waitFor();
  return page.evaluate(
    async ({ path, body }) => {
      const r = await fetch("/api" + path, {
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: r.status, data: await r.json() };
    },
    { path, body },
  );
}
async function boot(page: Page) {
  await page.goto("/");
  await expect(page.locator(".nft-card")).toHaveCount(8);
}
async function login(page: Page, email = "alex@example.com") {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Jungle123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
async function add(page: Page) {
  await page.goto("/nft/1");
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Obra adicionada" }),
  ).toBeVisible();
}
async function checkout(page: Page) {
  await login(page);
  await add(page);
  await page.goto("/checkout");
  await page.getByLabel("Telefone").fill("11999999999");
  await page.getByLabel("Selecione sua carteira").selectOption("w1");
  await page
    .getByRole("button", { name: "Simular conexão", exact: true })
    .click();
  await page.getByRole("checkbox").check();
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-25T15:00:00-03:00") });
});
test("catálogo, filtros combinados, URL, paginação e histórico", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "Próxima" }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.reload();
  await expect(page.getByText("Página 2 de 3")).toBeVisible();
  await page.getByRole("button", { name: "Abstract", exact: true }).click();
  await expect(page).toHaveURL(/category=Abstract/);
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page
    .getByLabel("Artista", { exact: true })
    .selectOption("Lucas Martins");
  await page.getByRole("button", { name: "Ver resultados" }).click();
  await page
    .getByLabel("Ordenar por", { exact: true })
    .selectOption("price-asc");
  await expect(page.locator(".nft-card")).toHaveCount(6);
  await page.goBack();
  await expect(page.getByLabel("Ordenar por", { exact: true })).toHaveValue(
    "recent",
  );
  await page.getByLabel("Buscar obras ou artistas").fill("inexistente");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText("Nenhuma obra encontrada")).toBeVisible();
});
test("detalhe direto, quantidade, esgotado e inexistente", async ({ page }) => {
  await page.goto("/nft/1");
  await expect(
    page.getByRole("heading", { name: "Cosmic daydream." }),
  ).toBeVisible();
  await page.getByLabel("Edição", { exact: true }).selectOption("Artist proof");
  await expect(
    page.getByRole("button", { name: "Edição esgotada" }),
  ).toBeDisabled();
  await page.getByLabel("Edição", { exact: true }).selectOption("Original");
  await page.getByRole("button", { name: "Aumentar quantidade" }).click();
  await expect(page.locator("output")).toHaveText("2");
  await page.goto("/nft/8");
  await expect(
    page.getByRole("button", { name: "Edição esgotada" }),
  ).toBeDisabled();
  await page.goto("/nft/999");
  await expect(page.getByRole("alert")).toContainText("NFT não encontrado");
});
test("cadastro, conflito e isolamento entre usuários", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nome completo").fill("Nova Pessoa");
  await page.getByLabel("E-mail", { exact: true }).fill("new@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/localhost:5173\/\??/);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await page.goto("/register");
  await page.getByLabel("Nome completo").fill("Duplicado");
  await page.getByLabel("E-mail", { exact: true }).fill("new@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("já está cadastrado");
  await login(page);
  await page.goto("/nft/1");
  await page.getByRole("button", { name: "Adicionar aos favoritos" }).click();
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await login(page, "sam@example.com");
  await page.goto("/favorites");
  await expect(page.getByText("Ainda sem favoritos")).toBeVisible();
});
test("favorito otimista reverte após falha e permite nova tentativa", async ({
  page,
}) => {
  await login(page);
  await page.goto("/nft/1");
  await rest(page, "/demo/scenario", { scenario: "favorite-error" });
  await page.getByRole("button", { name: "Adicionar aos favoritos" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Não foi possível salvar" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Adicionar aos favoritos" }),
  ).toHaveAttribute("aria-pressed", "false");
  await rest(page, "/demo/scenario", { scenario: "standard" });
  await page.getByRole("button", { name: "Adicionar aos favoritos" }).click();
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos" }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos" }),
  ).toBeVisible();
});
test("carrinho persiste, mescla ao login, cupom e remoção", async ({
  page,
}) => {
  await add(page);
  await page.reload();
  await login(page);
  await page.goto("/cart");
  await expect(page.locator(".cart-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Aumentar Cosmic daydream" }).click();
  await expect(page.locator("output")).toHaveText("2");
  await page.getByLabel("Código promocional").fill("EXPIRED");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Cupom expirado" }),
  ).toBeVisible();
  await page.getByLabel("Código promocional").fill("JUNGLE10");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.locator(".summary-total")).toContainText("0.434 ETH");
  await page.reload();
  await expect(page.locator(".summary-total")).toContainText("0.434 ETH");
  await page.getByRole("button", { name: "Remover Cosmic daydream" }).click();
  await expect(
    page.getByText("Seu carrinho está esperando por arte"),
  ).toBeVisible();
});
test("compra completa, recibo imutável e refresh", async ({ page }) => {
  await login(page);
  await page
    .locator(".nft-card")
    .first()
    .getByRole("link", { name: "Ver Cosmic daydream", exact: true })
    .click();
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Obra adicionada" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ver carrinho", exact: true }).click();
  await page.getByRole("button", { name: "Continuar para pagamento" }).click();
  await page.getByLabel("Telefone").fill("11999999999");
  await page.getByLabel("Selecione sua carteira").selectOption("w1");
  await page
    .getByRole("button", { name: "Simular conexão", exact: true })
    .click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Revisar compra" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .dblclick();
  await expect(page).toHaveURL(/\/orders\//);
  await expect(
    page.getByText("Compra confirmada pela simulação."),
  ).toBeVisible();
  const reference = page.url();
  await rest(page, "/demo/event", { id: "1", kind: "price" });
  await page.reload();
  await expect(page.locator(".summary-total")).toContainText("0.242 ETH");
  await expect(page).toHaveURL(reference);
  await page.goto("/cart");
  await expect(
    page.getByText("Seu carrinho está esperando por arte"),
  ).toBeVisible();
});
test("pagamento recusado preserva carrinho", async ({ page }) => {
  await checkout(page);
  await rest(page, "/demo/scenario", { scenario: "payment-refused" });
  await page.getByRole("button", { name: "Revisar compra" }).click();
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pagamento recusado." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar ao carrinho" }).click();
  await expect(page.locator(".cart-row")).toHaveCount(1);
});
test("timeout recupera o mesmo pedido após refresh", async ({ page }) => {
  await checkout(page);
  await rest(page, "/demo/scenario", { scenario: "order-timeout" });
  await page.getByRole("button", { name: "Revisar compra" }).click();
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("A resposta demorou", {
    timeout: 15000,
  });
  await page.reload();
  await page.getByRole("button", { name: "Recuperar compra" }).click();
  await expect(page).toHaveURL(/\/orders\//);
  await expect(
    page.getByText("Compra confirmada pela simulação."),
  ).toBeVisible();
});
test("perfil, senha, avatar e carteiras persistem", async ({ page }) => {
  await login(page);
  await page.goto("/profile");
  await page.getByLabel("Nome completo").fill("Alex Colecionador");
  await page.getByLabel("Avatar", { exact: true }).setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Dados atualizados" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nome completo")).toHaveValue(
    "Alex Colecionador",
  );
  await expect(page.getByAltText("Seu avatar")).toBeVisible();
  await page.getByLabel("Senha atual", { exact: true }).fill("incorreta");
  await page.getByLabel("Nova senha", { exact: true }).fill("NewPassword123!");
  await page.getByLabel("Confirmar nova senha").fill("NewPassword123!");
  await page.getByRole("button", { name: "Atualizar senha" }).click();
  await expect(page.getByRole("alert")).toContainText("Senha atual incorreta");
  await page.getByLabel("Senha atual", { exact: true }).fill("Jungle123!");
  await page.getByRole("button", { name: "Atualizar senha" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Dados atualizados" }),
  ).toBeVisible();
  await page.goto("/wallets");
  await page.getByRole("button", { name: "Adicionar carteira" }).click();
  await page.getByLabel("Nome da carteira").fill("Carteira secundária");
  await page
    .getByLabel("Endereço", { exact: true })
    .fill("0xabcdef1234567890abcdef1234567890abcdef12");
  await page.getByLabel("Rede", { exact: true }).selectOption("Polygon");
  await page.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Carteira secundária" }),
  ).toBeVisible();
});
test("Socket.IO atualiza cotação e descarta eventos duplicados e antigos", async ({
  page,
}) => {
  await checkout(page);
  await page.getByRole("button", { name: "Revisar compra" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await rest(page, "/demo/event", { id: "1", kind: "price", duplicate: true });
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".summary-total")).toContainText("0.342 ETH");
  await rest(page, "/demo/event", { id: "1", kind: "price", old: true });
  await expect(page.locator(".summary-total")).toContainText("0.342 ETH");
  await expect(page.getByRole("alert")).toContainText("Os valores mudaram");
});
test("sessão expirada preserva contexto e carrinho", async ({ page }) => {
  await checkout(page);
  await rest(page, "/demo/event", { kind: "expire" });
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("E-mail", { exact: true }).fill("alex@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("Jungle123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.locator(".checkout-item")).toHaveCount(1);
});
test("skeleton, falha de rede, recuperação e foco de diálogo", async ({
  page,
}) => {
  await boot(page);
  await rest(page, "/demo/scenario", { scenario: "slow" });
  await page.goto("/nft/2");
  await expect(page.getByRole("status", { name: "Carregando" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The other side." }),
  ).toBeVisible();
  await rest(page, "/demo/scenario", { scenario: "server-error" });
  await page.goto("/nft/3");
  await expect(page.getByRole("alert")).toBeVisible();
  await rest(page, "/demo/scenario", { scenario: "standard" });
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    page.getByRole("heading", { name: "Quiet horizons." }),
  ).toBeVisible();
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Filtros", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
test("regressão visual e ausência de overflow", async ({ page }) => {
  await boot(page);
  await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  await page.goto("/nft/1");
  await expect(
    page.getByRole("button", { name: "Adicionar ao carrinho" }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("detail.png", { fullPage: true });
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Obra adicionada" }),
  ).toBeVisible();
  await page.goto("/cart");
  await expect(page.locator(".summary-total")).toBeVisible();
  await expect(page).toHaveScreenshot("cart.png", { fullPage: true });
  await login(page);
  await page.goto("/checkout");
  await expect(page.locator(".summary-total")).toBeVisible();
  await expect(page).toHaveScreenshot("checkout.png", { fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
