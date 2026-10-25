import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AddCartItemInput, Cart } from '@/schemas/cart'
import { cartService } from '@/services/cart'
import { queryKeys } from './query-keys'
import { useSession } from './useSession'

function useCartKey() {
  const { user } = useSession()
  return queryKeys.cart(user ? `user:${user.id}` : 'guest')
}

export function useCart() {
  const { isLoading } = useSession()
  return useQuery({
    queryKey: useCartKey(),
    queryFn: ({ signal }) => cartService.get(signal),
    staleTime: 0,
    enabled: !isLoading,
  })
}

/** Toda mutation devolve o carrinho recalculado pela API; o cache recebe exatamente essa resposta. */
function useCartMutation<TInput>(mutationFn: (input: TInput) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const key = useCartKey()
  return useMutation({
    mutationFn,
    onSuccess: (cart) => queryClient.setQueryData(key, cart),
  })
}

export const useAddToCart = () => useCartMutation((input: AddCartItemInput) => cartService.addItem(input))
export const useUpdateCartItem = () =>
  useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) => cartService.updateItem(itemId, quantity))
export const useRemoveCartItem = () => useCartMutation((itemId: string) => cartService.removeItem(itemId))
export const useApplyCoupon = () => useCartMutation((code: string) => cartService.applyCoupon(code))
export const useRemoveCoupon = () => useCartMutation(() => cartService.removeCoupon())
