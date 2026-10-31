import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../api/auth-service";
import type { LoginDTO } from "../types/auth.types";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginDTO) => authService.login(data),

    onSuccess: (response) => {
      localStorage.setItem("access_token", response.token);

      queryClient.setQueryData(["auth", "session"], {
        user: response.user,
      });
    },
  });
}
