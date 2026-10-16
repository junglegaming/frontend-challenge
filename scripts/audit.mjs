import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
const base = process.env.AUDIT_URL ?? "http://127.0.0.1:5181";
await mkdir("reports/lighthouse", { recursive: true });
const summary = [];
const browser = await chromium.launch({
  args: ["--remote-debugging-port=9229"],
});
try {
  for (const page of ["inicio", "detalhe"])
    for (const profile of ["mobile", "desktop"]) {
      const runs = [];
      for (let run = 1; run <= 3; run++) {
        const result = await lighthouse(
          `${base}${page === "inicio" ? "/" : "/nft/nft-1"}`,
          {
            port: 9229,
            output: ["html", "json"],
            logLevel: "error",
            onlyCategories: [
              "performance",
              "accessibility",
              "best-practices",
              "seo",
            ],
            ...(profile === "desktop"
              ? {
                  formFactor: "desktop",
                  screenEmulation: {
                    mobile: false,
                    width: 1440,
                    height: 1000,
                    deviceScaleFactor: 1,
                    disabled: false,
                  },
                  throttling: {
                    rttMs: 40,
                    throughputKbps: 10240,
                    cpuSlowdownMultiplier: 1,
                  },
                }
              : {}),
          },
        );
        if (!result) throw new Error("Lighthouse não produziu resultado");
        const prefix = `reports/lighthouse/${page}-${profile}-${run}`;
        await writeFile(`${prefix}.html`, result.report[0]);
        await writeFile(`${prefix}.json`, result.report[1]);
        const categories = Object.fromEntries(
          Object.entries(result.lhr.categories).map(([key, value]) => [
            key,
            Math.round(value.score * 100),
          ]),
        );
        const metrics = Object.fromEntries(
          [
            "largest-contentful-paint",
            "cumulative-layout-shift",
            "total-blocking-time",
          ].map((key) => [key, result.lhr.audits[key].numericValue]),
        );
        runs.push({ ...categories, ...metrics });
        console.log(page, profile, run, JSON.stringify(categories));
      }
      const median = Object.fromEntries(
        Object.keys(runs[0]).map((key) => [
          key,
          runs.map((r) => r[key]).sort((a, b) => a - b)[1],
        ]),
      );
      summary.push({ page, profile, median, runs });
      await writeFile(
        "reports/lighthouse/summary.json",
        JSON.stringify(
          {
            environment: {
              os: `${os.type()} ${os.release()}`,
              cpu: os.cpus()[0].model,
              node: process.version,
              lighthouse: (
                await import("lighthouse/package.json", {
                  with: { type: "json" },
                })
              ).default.version,
              browser: chromium.executablePath(),
              date: new Date().toISOString(),
              base,
              scenario: "standard",
              build: "production",
              notes:
                "Sem simplificações exclusivas; imagens, fontes, MSW e Socket.IO ativos.",
            },
            results: summary,
          },
          null,
          2,
        ),
      );
    }
} finally {
  await browser.close();
}
