import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  server: {
    watch: {
      ignored: [
        "**/reports/**",
        "**/playwright-report/**",
        "**/test-results/**",
      ],
    },
  },
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          query: ["@tanstack/react-query"],
          mocks: ["msw", "@mswjs/socket.io-binding"],
        },
      },
    },
  },
});
