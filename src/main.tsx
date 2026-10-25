import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { queryClient } from "./api";
import "./styles.css";
async function main() {
  const application = import("./router");
  if (import.meta.env.VITE_MOCKS !== "false") {
    const { startMocks } = await import("./mocks/browser");
    await startMocks();
  }
  const { router } = await application;
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
main().catch(() => {
  document.getElementById("root")!.innerHTML =
    "<main><h1>Não foi possível iniciar a demonstração.</h1><p>Recarregue a página para tentar novamente.</p></main>";
});
