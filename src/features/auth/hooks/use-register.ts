import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../api/auth-service";
import type { RegisterDTO } from "../types/auth.types";

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterDTO) => authService.register(data),

    onSuccess: (response) => {
      localStorage.setItem("access_token", response.token);

      queryClient.setQueryData(["auth", "session"], {
        user: response.user,
      });
    },
  });
}
