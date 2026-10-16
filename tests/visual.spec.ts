import { test, expect } from "@playwright/test";
import { start, login, addNFT } from "./helpers";
test("início, detalhe, carrinho e pagamento", async ({ page, isMobile }) => {
  await start(page);
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(9);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("inicio.png", {
    fullPage: true,
    mask: [page.locator(".connection")],
  });
  await page.goto("/nft/nft-1");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".related-grid .nft-card")).toHaveCount(5);
  await expect(page).toHaveScreenshot("detalhe.png", {
    fullPage: true,
    mask: [page.locator(".connection")],
  });
  await login(page);
  await addNFT(page);
  await page.goto("/carrinho");
  await expect(page.locator(".summary")).toBeVisible();
  await expect(page).toHaveScreenshot("carrinho.png", {
    fullPage: true,
    mask: [page.locator(".connection"), page.locator(".toast")],
  });
  await page.goto("/pagamento");
  await expect(
    page.getByRole("heading", { name: "Carteira e rede" }),
  ).toBeVisible();
  await expect(
    page.locator(isMobile ? ".mobile-payment-total" : ".summary"),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("pagamento.png", {
    fullPage: true,
    mask: [page.locator(".connection")],
  });
});
