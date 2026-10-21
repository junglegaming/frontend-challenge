import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clearGuestCartId, peekGuestCartId } from '../api/guest-cart-id'
import { CART_QUERY_KEY, mergeCart } from '../api/queries'

/** Call after a successful login/signup: folds the visitor's guest cart into the account's cart. */
export function useMergeGuestCart() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: mergeCart,
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart)
      clearGuestCartId()
    },
  })

  return function mergeGuestCartIfAny() {
    const guestCartId = peekGuestCartId()
    if (guestCartId) mutation.mutate(guestCartId)
  }
}
