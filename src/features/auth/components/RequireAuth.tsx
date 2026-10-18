import type { ReactNode } from "react";
import { Navigate, useMatch } from "@tanstack/react-router";
import { useAuth } from "../auth-context";
import { getSafeAuthRedirect } from "../redirect";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = useMatch({ strict: false, select: (match) => match.pathname });

  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: getSafeAuthRedirect(pathname) }} replace />;
  }

  return children;
}
