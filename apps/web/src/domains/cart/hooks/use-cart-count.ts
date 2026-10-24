import { useQuery } from '@tanstack/react-query'
import { cartQueries } from '../api/queries'

/** Units in the cart for the header badge; 0 while loading or when the cart can't be read. */
export function useCartCount(): number {
  const { data } = useQuery({ ...cartQueries.view(), select: (cart) => cart.itemCount })
  return data ?? 0
}
