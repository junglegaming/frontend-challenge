import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { queryClient } from "./api"; 
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "./styles.css";
async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== "false") {
    const { startMocks } = await import("./constants/mocks/browser");
    await startMocks();
  }
  const { router } = await import("./routes/router");
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
bootstrap().catch((error) => {
  console.error(error);
  document.getElementById("root")!.textContent =
    "Não foi possível iniciar a aplicação. Recarregue a página.";
});
