import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addCartItem, CART_QUERY_KEY } from '../api/queries'

export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart)
    },
  })
}
