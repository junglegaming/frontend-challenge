/** Centralised, typed access to build-time configuration. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'ws://localhost/realtime',
  /**
   * MSW is enabled by configuration (dev, demo build and tests), never by code paths in the app.
   * Production keeps it `true`: the product is a mock-driven demo (constitution, Principle V).
   */
  enableMocks: (import.meta.env.VITE_ENABLE_MOCKS ?? 'true') === 'true',
  /**
   * Whether MSW also answers `/backend/*` (the real `apps/api`). `true` in dev and e2e; `false` by
   * default in a production build, so forgetting the variable never hides the real backend behind a mock.
   * Production/preview: `false`. Only the string `'true'` turns it on.
   */
  enableBackendMocks: (import.meta.env.VITE_ENABLE_BACKEND_MOCKS ?? (import.meta.env.DEV ? 'true' : 'false')) === 'true',
  requestTimeoutMs: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? 8000),
  /**
   * Same-origin path of the Vercel/Blob backend (`apps/api`, specs/007-monorepo-vercel-blob). Deliberately
   * NOT under `/api`: MSW owns that whole prefix, so a distinct one keeps mocked and real traffic apart.
   * Vite (dev/preview) and `vercel.json` (prod) proxy `/backend/*` to the API's `/api/*`.
   */
  backendBaseUrl: import.meta.env.VITE_BACKEND_BASE_URL ?? '/backend',
} as const
