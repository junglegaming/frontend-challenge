import type { NftUpdated, OrderUpdated } from '@/lib/socket/events'

export type SocketEventType = NftUpdated['type'] | OrderUpdated['type']

export type SocketEventPayload = NftUpdated | OrderUpdated

type SocketEmitFn = (type: SocketEventType, payload: SocketEventPayload) => void

let emitter: SocketEmitFn | null = null

export const setSocketEmit = (fn: SocketEmitFn | null): void => {
  emitter = fn
}

export const emitSocketEvent = (
  type: SocketEventType,
  payload: SocketEventPayload,
): void => {
  emitter?.(type, payload)
}
