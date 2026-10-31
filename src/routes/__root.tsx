import { AppHeader } from "@/components/layout/app-header";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <Outlet />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
