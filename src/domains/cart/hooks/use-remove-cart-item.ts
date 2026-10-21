import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CART_QUERY_KEY, CART_QUOTE_QUERY_KEY, removeCartItem } from '../api/queries'

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart)
      void queryClient.invalidateQueries({ queryKey: CART_QUOTE_QUERY_KEY })
    },
  })
}
