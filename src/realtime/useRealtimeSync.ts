import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { queryKeys } from '@/hooks/query-keys'
import { useSession } from '@/hooks/useSession'
import { pendingOrderStore, tokenStore } from '@/lib/storage'
import type { Cart } from '@/schemas/cart'
import { nftUpdatedEventSchema, orderUpdatedEventSchema } from '@/schemas/events'
import type { Nft } from '@/schemas/nft'
import type { Order } from '@/schemas/order'
import { realtimeEvents } from './events'
import type { Socket } from 'socket.io-client'
import { createSocket } from './socket'

/** Recursos que recebem eventos e precisam ser reconciliados com o REST a cada conexão. */
const RECONCILED = new Set(['nfts', 'nft', 'cart', 'order'])

/**
 * Liga o Socket.IO ao cache do TanStack Query. Recriado a cada troca de usuário:
 * listeners, versões vistas e conexão da sessão anterior são descartados no cleanup.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const { user, isLoading } = useSession()
  const userId = user?.id ?? null

  useEffect(() => {
    if (isLoading) return
    let socket: Socket | null = null
    let disposed = false
    const seenEvents = new Set<string>()
    const lastVersion = new Map<string, number>()

    /** Duplicata (mesmo eventId) ou versão <= já aplicada: ignora sem reaplicar efeitos. */
    const isFresh = (eventId: string, resource: string, version: number, cachedVersion?: number) => {
      if (seenEvents.has(eventId)) return false
      seenEvents.add(eventId)
      const known = Math.max(lastVersion.get(resource) ?? 0, cachedVersion ?? 0)
      if (version <= known) return false
      lastVersion.set(resource, version)
      return true
    }

    const bind = (socket: Socket) => {
      socket.on('nft.updated', (payload: unknown) => {
        const parsed = nftUpdatedEventSchema.safeParse(payload)
        if (!parsed.success) return
        const event = parsed.data
        const nftId = event.resource.id
        const cached = queryClient.getQueryData<Nft>(queryKeys.nft(nftId))
        if (!isFresh(event.eventId, `nft:${nftId}`, event.version, cached?.version)) return

        if (cached) queryClient.setQueryData<Nft>(queryKeys.nft(nftId), { ...cached, editions: event.data.editions, version: event.version })
        queryClient.invalidateQueries({ queryKey: queryKeys.nft(nftId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.nftLists })

        const cartKey = queryKeys.cart(userId ? `user:${userId}` : 'guest')
        const cart = queryClient.getQueryData<Cart>(cartKey)
        const inCart = cart?.items.find((item) => item.nftId === nftId)
        if (inCart) {
          queryClient.invalidateQueries({ queryKey: cartKey })
          toast.info(`${inCart.name}: preço ou disponibilidade atualizados. Revise o resumo.`)
        }
        realtimeEvents.emit('nft.updated', event)
      })

      socket.on('order.updated', (payload: unknown) => {
        const parsed = orderUpdatedEventSchema.safeParse(payload)
        if (!parsed.success || !userId) return
        const event = parsed.data
        const key = queryKeys.order(userId, event.resource.id)
        const cached = queryClient.getQueryData<Order>(key)
        if (!isFresh(event.eventId, `order:${event.resource.id}`, event.version, cached?.version)) return

        if (cached) queryClient.setQueryData<Order>(key, { ...cached, status: event.data.status, version: event.version })
        queryClient.invalidateQueries({ queryKey: key })

        if (event.data.status !== 'pending') {
          const store = pendingOrderStore(userId)
          if (store.get()?.orderId === event.resource.id) store.set(null)
          queryClient.invalidateQueries({ queryKey: queryKeys.cart(`user:${userId}`) })
          if (event.data.status === 'confirmed') toast.success('Pagamento confirmado! Seus NFTs estão na sua carteira.')
          else toast.error('Pagamento recusado. Seus itens continuam no carrinho.')
        }
        realtimeEvents.emit('order.updated', event)
      })

      // Reconexão: eventos perdidos durante a queda são reconciliados com a API REST.
      // Conexão (inicial ou reconexão): eventos emitidos entre o último fetch REST e este momento
      // não chegaram. Reconcilia só os recursos ativos cujo dado é anterior à conexão.
      socket.on('connect', () => {
        const connectedAt = Date.now()
        void queryClient.invalidateQueries({
          predicate: (query) =>
            RECONCILED.has(String(query.queryKey[0])) &&
            query.state.dataUpdatedAt > 0 &&
            query.state.dataUpdatedAt < connectedAt,
        })
      })

    }

    void createSocket(tokenStore.get()).then((created) => {
      if (disposed) {
        created.disconnect()
        return
      }
      socket = created
      bind(created)
    })

    return () => {
      disposed = true
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [queryClient, userId, isLoading])
}

