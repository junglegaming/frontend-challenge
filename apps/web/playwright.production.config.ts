import { defineConfig, devices } from '@playwright/test'

// Smoke tests of the PRODUCTION build (specs/008-web-production-env). Separate from playwright.config.ts
// on purpose: the main suite runs the dev server (flags of development), so it cannot prove production
// behavior, and a second global webServer there would force a production build on every run.
//
//   pnpm --dir apps/web test:e2e:production                       # builds + serves locally on :4175
//   PLAYWRIGHT_BASE_URL=<deploy url> PROTECTION_BYPASS=<secret> \
//     pnpm --dir apps/web test:e2e:production                     # against a published (protected) preview
const PORT = 4175
const publishedUrl = process.env.PLAYWRIGHT_BASE_URL
const bypass = process.env.PROTECTION_BYPASS

export default defineConfig({
  testDir: './e2e/production',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: publishedUrl ?? `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
    ...(bypass
      ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': bypass, 'x-vercel-set-bypass-cookie': 'true' } }
      : {}),
  },
  // Only when testing locally; a published URL needs no server. Production values per
  // specs/008-web-production-env/data-model.md (coins reach the real API through /backend, specs/011).
  webServer: publishedUrl
    ? undefined
    : {
        command: `node ./node_modules/vite/bin/vite.js build && node ./node_modules/vite/bin/vite.js preview --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        env: { VITE_ENABLE_MOCKS: 'true', VITE_ENABLE_BACKEND_MOCKS: 'false' },
        reuseExistingServer: false,
        timeout: 180_000,
      },
})
