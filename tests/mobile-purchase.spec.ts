import { test, expect } from "@playwright/test";
import { start, login } from "./helpers";

test("desktop alinha ações de compra e mantém edições da referência", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await start(page);
  await page.goto("/nft/nft-1");
  const buy = page.getByRole("button", { name: "Comprar NFT", exact: true });
  await expect(buy).toBeVisible();
  const favorite = page.locator(".desktop-purchase-favorite .favorite-button");
  const cart = page.getByRole("button", {
    name: "Adicionar ao carrinho",
    exact: true,
  });
  const boxes = await Promise.all([
    buy.boundingBox(),
    favorite.boundingBox(),
    cart.boundingBox(),
  ]);
  for (const box of boxes) {
    expect(box!.height).toBe(boxes[0]!.height);
    expect(Math.abs(box!.y - boxes[0]!.y)).toBeLessThan(2);
  }
  await expect(page.locator(".edition-options label")).toHaveText([
    "1/10",
    "1/10",
    "1/50",
  ]);
  await expect(page.locator(".edition-status")).toHaveText("ABERTA");
  await expect(cart.locator(".lucide-shopping-cart")).toBeVisible();
  await page.screenshot({
    path: "reports/refinement/detail-actions-desktop.png",
  });
});

test("mobile mantém compra e resumo fixos e passa pelo carrinho", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await login(page);
  await page.goto("/nft/nft-1");
  const purchase = page.locator(".detail-purchase-panel");
  await expect(purchase).toBeVisible();
  await page
    .getByRole("button", { name: "Aumentar quantidade", exact: true })
    .click();
  await expect(page.locator(".mobile-purchase-price")).toContainText(
    "2,38 ETH",
  );
  const before = await purchase.boundingBox();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const after = await purchase.boundingBox();
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(2);
  expect(after!.y + after!.height).toBeCloseTo(844, 0);
  await page.screenshot({ path: "reports/refinement/detail-fixed-mobile.png" });
  await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
  await expect(page).toHaveURL(/\/carrinho/);
  const summary = page.locator(".cart-purchase-panel");
  await expect(summary).toBeVisible();
  await page.getByLabel("Código promocional", { exact: true }).fill("INVALIDO");
  await summary.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(summary.getByRole("alert")).toBeVisible();
  const cartBefore = await summary.boundingBox();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const cartAfter = await summary.boundingBox();
  expect(Math.abs(cartAfter!.y - cartBefore!.y)).toBeLessThan(2);
  expect(cartAfter!.y + cartAfter!.height).toBeCloseTo(844, 0);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({ path: "reports/refinement/cart-fixed-mobile.png" });
  await page.getByRole("link", { name: /Conectar e finalizar/ }).click();
  await expect(page).toHaveURL(/\/pagamento/);
});
