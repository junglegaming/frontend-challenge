import { useSession } from "@/features/auth/hooks/use-session";
import { CartProvider } from "@/features/market/context/cart-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./router";
import "./styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppProviders() {
  const { data: session } = useSession();

  const userId = session?.user.id ?? null;

  return (
    <CartProvider key={userId ?? "guest"} userId={userId}>
      <RouterProvider router={router} />
    </CartProvider>
  );
}

async function enableMocking() {
  console.log("[MSW] Iniciando...");

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker não é suportado neste navegador.");
  }

  const { worker } = await import("./mocks/browser");

  console.log("[MSW] Registrando Service Worker...");

  await worker.start({
    serviceWorker: {
      url: "/mockServiceWorker.js",
      options: {
        scope: "/",
      },
    },
  });

  console.log("[MSW] Inicializado com sucesso.");

  const registrations = await navigator.serviceWorker.getRegistrations();

  console.log(
    "[MSW] Service Workers registrados:",
    registrations.map((registration) => ({
      scope: registration.scope,
      active: registration.active?.scriptURL,
      state: registration.active?.state,
    })),
  );

  console.log(
    "[MSW] Controller:",
    navigator.serviceWorker.controller?.scriptURL ?? null,
  );
}

async function bootstrap() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Elemento root não encontrado.");
  }

  try {
    await enableMocking();
  } catch (error) {
    console.error("[MSW] Erro ao inicializar:", error);
  }

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppProviders />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
