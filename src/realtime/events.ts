import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/schemas/events'

type EventMap = { 'nft.updated': NftUpdatedEvent; 'order.updated': OrderUpdatedEvent }
type Listener<K extends keyof EventMap> = (event: EventMap[K]) => void

const listeners: { [K in keyof EventMap]: Set<Listener<K>> } = {
  'nft.updated': new Set(),
  'order.updated': new Set(),
}

/** Eventos já validados e deduplicados, republicados para telas que precisam reagir (ex.: checkout). */
export const realtimeEvents = {
  emit<K extends keyof EventMap>(type: K, event: EventMap[K]) {
    for (const listener of listeners[type]) listener(event)
  },
  on<K extends keyof EventMap>(type: K, listener: Listener<K>) {
    listeners[type].add(listener)
    return () => {
      listeners[type].delete(listener)
    }
  },
}
