import { useMutation } from '@tanstack/react-query'
import { createOrder } from '../api/queries'

export function useCreateOrder() {
  return useMutation({ mutationFn: createOrder })
}
