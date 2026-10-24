import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

interface VercelHeaderRule {
  source: string
  headers: { key: string; value: string }[]
}

/**
 * The security headers production serves (`vercel.json`, source `/(.*)`), reused by `vite preview` so the
 * local production smoke tests run under the real Content-Security-Policy. One source of truth: editing
 * the policy in vercel.json is enough. Deliberately NOT applied to the dev server (HMR needs inline scripts).
 */
function productionSecurityHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync(path.resolve(__dirname, 'vercel.json'), 'utf8')) as { headers?: VercelHeaderRule[] }
  const rule = config.headers?.find((entry) => entry.source === '/(.*)')
  return Object.fromEntries((rule?.headers ?? []).map(({ key, value }) => [key, value]))
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')

  // `/backend/*` -> the Vercel/Blob API's `/api/*` (apps/api). Same-origin from the browser's point of
  // view, so no CORS; production does the equivalent with a rewrite in vercel.json.
  const backendProxy = {
    '/backend': {
      target: env.BACKEND_PROXY_TARGET ?? 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/backend/, '/api'),
    },
  }

  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: './src/app/routes',
        generatedRouteTree: './src/app/routeTree.gen.ts',
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    build: {
      rollupOptions: {
        output: {
          // `src/shared/config/zod.ts` (jitless, needed under the production CSP) must run before any
          // schema is created. Dependency chunks execute before the entry chunk's own body, so the config
          // lives IN the zod chunk: it then runs right after the library and before every importer.
          manualChunks(id: string) {
            if (id.includes('/node_modules/zod/') || id.endsWith('/src/shared/config/zod.ts')) return 'zod'
          },
        },
      },
    },
    server: { proxy: backendProxy },
    preview: { proxy: backendProxy, headers: productionSecurityHeaders() },
  }
})
