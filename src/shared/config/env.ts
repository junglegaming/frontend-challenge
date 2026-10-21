/** Centralised, typed access to build-time configuration. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'ws://localhost/realtime',
  /** MSW is enabled by configuration (dev, demo build and tests), never by code paths in the app. */
  enableMocks: (import.meta.env.VITE_ENABLE_MOCKS ?? 'true') === 'true',
  requestTimeoutMs: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? 8000),
} as const
