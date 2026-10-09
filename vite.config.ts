import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  define: {
    'import.meta.env.VITE_MOCKS': JSON.stringify(
      process.env.VITE_MOCKS ??
        loadEnv(mode, process.cwd(), 'VITE_').VITE_MOCKS ??
        (command === 'serve' ? 'true' : 'false')
    ),
  },
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    svgr()
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
}));
