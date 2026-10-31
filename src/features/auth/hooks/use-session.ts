import { useQuery } from "@tanstack/react-query";
import { authService } from "../api/auth-service";

export function useSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: authService.getSession,
    enabled: Boolean(localStorage.getItem("access_token")),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}