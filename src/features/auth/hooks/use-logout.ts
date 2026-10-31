import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem("access_token");
    },

    onSuccess: async () => {
      queryClient.setQueryData(["auth", "session"], null);

      await queryClient.cancelQueries({
        queryKey: ["auth"],
      });

      queryClient.removeQueries({
        queryKey: ["auth"],
      });

      await navigate({ to: "/" });
    },
  });
}
