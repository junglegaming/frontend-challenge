import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  test: {
    environment: 'node',
    include: ['tests/contract/**/*.spec.ts'],
    setupFiles: ['tests/contract/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
})
