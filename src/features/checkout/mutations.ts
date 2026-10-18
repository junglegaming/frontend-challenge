import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createOrder } from "./api";

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      queryClient.setQueryData(["orders", order.id], order);
    },
  });
}
