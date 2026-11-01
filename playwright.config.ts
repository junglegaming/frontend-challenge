import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 4,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    // Trace de toda falha (inclusive local, sem retry) para diagnóstico.
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      // Fluxos principais também no viewport mobile (Chromium).
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      testMatch: ['checkout.spec.ts', 'realtime.spec.ts', 'catalog.spec.ts', 'a11y.spec.ts'],
    },
  ],
})
