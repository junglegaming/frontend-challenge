import type { EditionId } from '@/schemas/nft'
import { addEth } from '@/lib/eth'
import { bus } from './bus'
import { db } from './db'
import { findEdition, findNft, nftUpdatedEvent, orderUpdatedEvent, resolveOrder } from './domain'
import { getScenario } from './scenarios'

/** Altera uma edição no "servidor" e publica `nft.updated` — usado por cenários e pelo DevPanel. */
export function changeEdition(nftId: string, editionId: EditionId, patch: { price?: string; available?: number }) {
  const nft = db.update((state) => {
    const target = findNft(state, nftId)
    const edition = findEdition(state, nftId, editionId)
    if (patch.price !== undefined) edition.price = patch.price
    if (patch.available !== undefined) edition.available = patch.available
    target.version += 1
    return target
  })
  bus.emit(nftUpdatedEvent(nft))
}

let scenarioTriggered = false

/** price-change / sold-out: dispara uma vez por carregamento, 3 s após o carrinho ou a cotação serem consultados. */
export function triggerCartScenario(firstItem: { nftId: string; editionId: EditionId; unitPrice: string } | undefined) {
  const scenario = getScenario()
  if (scenarioTriggered || !firstItem || (scenario !== 'price-change' && scenario !== 'sold-out')) return
  scenarioTriggered = true
  setTimeout(() => {
    if (scenario === 'price-change') changeEdition(firstItem.nftId, firstItem.editionId, { price: addEth(firstItem.unitPrice, '0.10') })
    else changeEdition(firstItem.nftId, firstItem.editionId, { available: 0 })
  }, 3000)
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function scheduleOrder(orderId: string) {
  const record = db.state.orders.find((item) => item.order.id === orderId)
  if (!record || record.order.status !== 'pending' || timers.has(orderId)) return
  const timer = setTimeout(() => {
    timers.delete(orderId)
    const result = db.update((state) => {
      const current = state.orders.find((item) => item.order.id === orderId)
      return current ? resolveOrder(state, current) : null
    })
    if (!result) return
    for (const nft of result.changedNfts) bus.emit(nftUpdatedEvent(nft))
    bus.emit(orderUpdatedEvent(result.order), { userId: record.userId })
  }, Math.max(0, record.resolveAt - Date.now()))
  timers.set(orderId, timer)
}

/** Pedidos pendentes sobrevivem ao refresh: reagenda a resolução ao subir o mock. */
export function resumePendingOrders() {
  for (const record of db.state.orders) scheduleOrder(record.order.id)
}
