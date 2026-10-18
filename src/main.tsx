import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './app/query-client.ts'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './app/router.tsx'
import { worker } from './mocks/browser.ts'
import { CartProvider } from "@/features/cart/CartProvider";
import { AuthProvider } from "@/features/auth/AuthProvider";
import './index.css'

async function bootstrap() {
  await worker.start({
    onUnhandledRequest: "bypass",
  });

  const { startRealtime } = await import("./realtime/socket");
  startRealtime();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

bootstrap();
