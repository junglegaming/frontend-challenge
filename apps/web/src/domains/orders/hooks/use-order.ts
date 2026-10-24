import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { realtimeClient } from '@/shared/realtime/client'
import { orderKeys, orderQueryOptions } from '../api/queries'
import type { Order } from '../model/contracts'

const TERMINAL_STATUSES = new Set<Order['status']>(['confirmed', 'declined'])

export function useOrder(orderId: string) {
  const queryClient = useQueryClient()
  const query = useQuery(orderQueryOptions(orderId))

  useEffect(() => {
    const unsubscribeEvent = realtimeClient.subscribe('order.updated', (event) => {
      if (event.payload.orderId !== orderId) return
      queryClient.setQueryData<Order>(orderKeys.detail(orderId), (current) =>
        current && current.version < event.version
          ? { ...current, status: event.payload.status, transaction: event.payload.transaction, declineReason: event.payload.declineReason, version: event.version }
          : current,
      )
    })
    // A pending order keeps settling server-side; reconnecting mid-wait must re-sync via REST.
    const unsubscribeReconnect = realtimeClient.onReconnect(() => {
      if (query.data && !TERMINAL_STATUSES.has(query.data.status)) {
        void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      }
    })
    return () => {
      unsubscribeEvent()
      unsubscribeReconnect()
    }
  }, [orderId, queryClient, query.data])

  return query
}
