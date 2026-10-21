import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useEffectEvent } from 'react'
import { CART_QUERY_KEY } from '@/domains/cart'
import { useOrder } from '@/domains/orders'
import { clearDraft } from '../model/checkout-draft'

/**
 * Follows a pending order (`order.updated` + REST fallback live in `useOrder`). Confirmed → receipt;
 * declined → the page shows the reason and keeps the cart (research.md R5).
 */
export function useOrderOutcome(orderId: string, onDeclined: (reason: string) => void) {
  const order = useOrder(orderId)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const status = order.data?.status
  const declineReason = order.data?.declineReason
  const declined = useEffectEvent(onDeclined)

  useEffect(() => {
    if (!status || status === 'pending') return
    // The cart changed server-side either way (items bought, or reserved stock released).
    void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
    if (status === 'confirmed') {
      clearDraft()
      void navigate({ to: '/orders/$orderId', params: { orderId } })
    } else {
      declined(declineReason ?? 'O pagamento foi recusado.')
    }
  }, [status, declineReason, orderId, queryClient, navigate])

  return order
}
