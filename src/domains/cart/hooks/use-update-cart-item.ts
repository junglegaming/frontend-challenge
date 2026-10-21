import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Cart } from '../model/contracts'
import { CART_QUERY_KEY, CART_QUOTE_QUERY_KEY, updateCartItem } from '../api/queries'

/**
 * Optimistic quantity change with rollback (the project's required optimistic interaction,
 * docs/TEAMS.md / research.md D5): the stepper updates immediately and reverts on failure
 * (e.g. the new quantity exceeds stock), restoring exactly the previous cart.
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCartItem,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY })
      const previous = queryClient.getQueryData<Cart>(CART_QUERY_KEY)
      if (previous && variables.quantity !== undefined) {
        queryClient.setQueryData<Cart>(CART_QUERY_KEY, {
          ...previous,
          items: previous.items.map((item) => (item.id === variables.itemId ? { ...item, quantity: variables.quantity! } : item)),
        })
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(CART_QUERY_KEY, context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: CART_QUOTE_QUERY_KEY })
    },
  })
}
