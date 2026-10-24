import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Cart } from '../model/contracts'
import { applyCoupon, CART_QUERY_KEY, CART_QUOTE_QUERY_KEY, removeCoupon } from '../api/queries'

function onCartMutated(queryClient: ReturnType<typeof useQueryClient>, cart: Cart) {
  queryClient.setQueryData(CART_QUERY_KEY, cart)
  void queryClient.invalidateQueries({ queryKey: CART_QUOTE_QUERY_KEY })
}

export function useApplyCoupon() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: applyCoupon, onSuccess: (cart) => onCartMutated(queryClient, cart) })
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: removeCoupon, onSuccess: (cart) => onCartMutated(queryClient, cart) })
}
