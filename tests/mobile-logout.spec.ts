import { test, expect } from "@playwright/test";
import { start, login } from "./helpers";

test("Sair no menu mobile encerra a sessão e protege o perfil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await login(page);
  await page
    .getByRole("button", { name: "Abrir navegação", exact: true })
    .click();
  const menu = page.getByRole("dialog", { name: "Explore o KURIO" });
  await menu.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(menu).not.toBeVisible();
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await page.reload();
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/login/);
});
