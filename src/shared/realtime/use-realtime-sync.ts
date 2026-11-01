import { useEffect } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { io } from 'socket.io-client'
import { toast } from 'sonner'

import { queryKeys } from '@/shared/api/query-keys'
import { type Cart, nftUpdatedEventSchema, orderUpdatedEventSchema } from '@/shared/contracts'
import { formatEth } from '@/shared/lib/money'
import { getOwnerKey } from '@/shared/session'

import { createEventGate } from './event-gate'
import { REALTIME_URL } from './url'

/**
 * Mantém o cache sincronizado com o tempo real (Socket.IO) durante toda a
 * navegação. A API REST continua sendo a fonte de verdade: cada evento aceito
 * invalida as queries afetadas, que se reconciliam com o servidor.
 *
 * - `nft.updated`: catálogo, detalhe, carrinho e cotação; avisa se o NFT está
 *   no carrinho.
 * - `order.updated`: só pedidos desta sessão (presentes no cache do dono).
 * - Duplicatas e versões antigas são descartadas ({@link createEventGate}).
 * - Após reconectar, todas as queries ativas são revalidadas.
 *
 * Uma conexão por sessão: trocar de usuário fecha o socket anterior, então
 * eventos de uma sessão não alcançam os dados de outra.
 *
 * @param sessionScope - Identifica a sessão atual (muda no login/logout).
 * @example
 * useRealtimeSync(session.data?.user.id ?? 'visitante')
 */
export function useRealtimeSync(sessionScope: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const ownerKey = getOwnerKey()
    const gate = createEventGate()
    const socket = io(REALTIME_URL, { transports: ['websocket'] })

    socket.on('nft.updated', (raw: unknown) => {
      const parsed = nftUpdatedEventSchema.safeParse(raw)
      if (!parsed.success) return
      const event = parsed.data
      if (!gate.accept(`nft:${event.nftId}`, event.version, event.eventId)) return

      const cart = queryClient.getQueryData<Cart>(queryKeys.cart.all(ownerKey))
      const cartItem = cart?.items.find((item) => item.nftId === event.nftId)

      void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all(ownerKey) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.quote.all })

      if (cartItem) {
        const message =
          cartItem.priceEth === event.priceEth
            ? `A disponibilidade de ${cartItem.name} mudou. Confira seu carrinho.`
            : `O preço de ${cartItem.name} mudou para ${formatEth(event.priceEth)} ETH. Confira seu carrinho.`
        toast.info(message)
      }
    })

    socket.on('order.updated', (raw: unknown) => {
      const parsed = orderUpdatedEventSchema.safeParse(raw)
      if (!parsed.success) return
      const event = parsed.data
      const orderKey = queryKeys.orders.detail(ownerKey, event.orderId)
      // Pedido que esta sessão não conhece não é dela: ignora sem consumir a versão.
      if (queryClient.getQueryData(orderKey) === undefined) return
      if (!gate.accept(`order:${event.orderId}`, event.version, event.eventId)) return
      void queryClient.invalidateQueries({ queryKey: orderKey })
      // Confirmado: o servidor tirou do carrinho só o que foi comprado.
      if (event.status === 'confirmed') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all(ownerKey) })
      }
    })

    // Eventos perdidos durante a queda: a REST reconstrói o estado atual.
    socket.io.on('reconnect', () => {
      void queryClient.invalidateQueries({ type: 'active' })
    })

    return () => {
      socket.io.off('reconnect')
      socket.removeAllListeners()
      socket.close()
    }
  }, [queryClient, sessionScope])
}
