import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
mkdirSync("reports/lighthouse", { recursive: true });
const metadata = {
  date: new Date().toISOString(),
  node: process.version,
  platform: os.platform(),
  release: os.release(),
  cpu: os.cpus()[0]?.model,
  memory: os.totalmem(),
  base: process.env.AUDIT_URL || "http://localhost:4173",
  versions: Object.fromEntries(
    ["lighthouse", "vite", "msw", "@playwright/test"].map((name) => [
      name,
      JSON.parse(readFileSync(`node_modules/${name}/package.json`, "utf8"))
        .version,
    ]),
  ),
  conditions:
    "Optimized Vite preview, standard MSW, local WebP assets, no external fonts, 3 sequential runs per route and profile. Mobile uses Lighthouse default simulated throttling; desktop uses provided unthrottled local connection.",
};
const medians = [];
for (const route of ["/", "/nft/1"])
  for (const formFactor of ["mobile", "desktop"]) {
    const results = [];
    for (let run = 1; run <= 3; run++) {
      const chrome = await launch({
        chromeFlags: ["--headless=new", "--no-sandbox"],
        chromePath:
          process.env.CHROME_PATH ||
          "C:/Program Files/Google/Chrome/Application/chrome.exe",
      });
      try {
        const result = await lighthouse(metadata.base + route, {
          port: chrome.port,
          output: ["html", "json"],
          logLevel: "error",
          onlyCategories: [
            "performance",
            "accessibility",
            "best-practices",
            "seo",
          ],
          ...(formFactor === "desktop"
            ? {
                formFactor: "desktop",
                screenEmulation: {
                  mobile: false,
                  width: 1440,
                  height: 1000,
                  deviceScaleFactor: 1,
                  disabled: false,
                },
                throttlingMethod: "provided",
              }
            : {}),
        });
        const prefix = `reports/lighthouse/${route === "/" ? "home" : "detail"}-${formFactor}-${run}`;
        metadata.chrome = result.lhr.environment.hostUserAgent;
        writeFileSync(prefix + ".html", result.report[0]);
        writeFileSync(prefix + ".json", result.report[1]);
        results.push({
          scores: Object.fromEntries(
            Object.entries(result.lhr.categories).map(([key, value]) => [
              key,
              Math.round(value.score * 100),
            ]),
          ),
          lcp: result.lhr.audits["largest-contentful-paint"].numericValue,
          cls: result.lhr.audits["cumulative-layout-shift"].numericValue,
          tbt: result.lhr.audits["total-blocking-time"].numericValue,
        });
        console.log(prefix, results.at(-1));
      } finally {
        await chrome.kill();
      }
    }
    const median = (arr) => arr.sort((a, b) => a - b)[1];
    medians.push({
      route,
      formFactor,
      scores: Object.fromEntries(
        Object.keys(results[0].scores).map((key) => [
          key,
          median(results.map((r) => r.scores[key])),
        ]),
      ),
      lcp: median(results.map((r) => r.lcp)),
      cls: median(results.map((r) => r.cls)),
      tbt: median(results.map((r) => r.tbt)),
    });
  }
writeFileSync(
  "reports/lighthouse/summary.json",
  JSON.stringify({ metadata, medians }, null, 2),
);
