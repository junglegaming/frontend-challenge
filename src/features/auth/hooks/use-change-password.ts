import { useMutation } from "@tanstack/react-query";
import type { ChangePasswordDTO } from "../api/auth-service";
import { authService } from "../api/auth-service";

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordDTO) => authService.changePassword(data),
  });
}
