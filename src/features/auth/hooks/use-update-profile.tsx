import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateProfileDTO } from "../api/auth-service";
import { authService } from "../api/auth-service";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileDTO) => authService.updateProfile(data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["auth", "session"],
      });
    },
  });
}
