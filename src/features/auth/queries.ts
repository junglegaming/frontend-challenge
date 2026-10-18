import { skipToken, useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "./api";

export function useCurrentUser(token: string | null | undefined) {
  return useQuery({
    queryKey: ["auth", "me", token ?? null],
    queryFn: token ? () => getCurrentUser(token) : skipToken,
    enabled: Boolean(token),
    retry: false,
  });
}
