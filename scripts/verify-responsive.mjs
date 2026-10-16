import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("reports/screenshots", { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.goto("http://127.0.0.1:5180/");
    await expect(page.locator(".nft-grid .nft-card")).toHaveCount(9);
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    if (overflow) throw new Error(`Overflow em ${width}px`);
    await page.screenshot({
      path: `reports/screenshots/inicio-${width}.png`,
      fullPage: true,
    });
    await page.goto("http://127.0.0.1:5180/nft/nft-1");
    await expect(
      page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
    ).toBeVisible();
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw new Error(`Overflow no detalhe ${width}px`);
    await page.screenshot({
      path: `reports/screenshots/detalhe-${width}.png`,
      fullPage: true,
    });
    results.push({
      width,
      catalog: "passed",
      detail: "passed",
      horizontalOverflow: false,
    });
    await page.close();
  }
  await writeFile("reports/responsive.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
