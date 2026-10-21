import { io, type Socket } from 'socket.io-client'
import { env } from '@/shared/config/env'
import { getSessionToken, subscribeSessionToken } from '@/shared/api/session'
import type { RealtimeEvent, RealtimeEventMap, RealtimeEventType } from './contracts'

type Handler<T extends RealtimeEventType> = (event: RealtimeEvent<T, RealtimeEventMap[T]>) => void
/** Erased handler stored in the registry; `subscribe`/`dispatch` are the only places that cast to/from it. */
type ErasedHandler = (event: RealtimeEvent) => void

const MAX_SEEN_IDS_PER_RESOURCE = 50

/**
 * Thin Socket.IO wrapper (see src/mocks/realtime/server.ts for the MSW-side adapter).
 * Owns exactly the guarantees the challenge requires:
 *  - duplicate events (same id) are dropped;
 *  - events older than the last applied version for that resource never regress state;
 *  - reconnecting with a new/absent token (login/logout) drops stale per-resource state.
 * Reconciliation with REST after reconnect is each domain's responsibility (via Query invalidation).
 */
class RealtimeClient {
  private socket: Socket | null = null
  private seenEventIds = new Map<string, string[]>()
  private lastVersion = new Map<string, number>()
  private handlers = new Map<string, Set<ErasedHandler>>()
  private reconnectListeners = new Set<() => void>()

  get isConnected() {
    return this.socket?.connected ?? false
  }

  connect() {
    this.socket?.disconnect()
    this.seenEventIds.clear()
    this.lastVersion.clear()
    const origin = new URL(env.socketUrl, location.origin).origin
    this.socket = io(origin, {
      // Query carries the session token; the mock handshake resolves it (see src/mocks/realtime/server.ts).
      query: { token: getSessionToken() ?? '' },
      transports: ['websocket'],
      reconnection: true,
    })
    this.socket.on('connect', () => this.reconnectListeners.forEach((listener) => listener()))
    this.socket.onAny((type: string, payload: unknown) => this.dispatch(type, payload))
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  subscribe<T extends RealtimeEventType>(type: T, handler: Handler<T>) {
    const erased = handler as unknown as ErasedHandler
    const set = this.handlers.get(type) ?? new Set<ErasedHandler>()
    set.add(erased)
    this.handlers.set(type, set)
    return () => {
      set.delete(erased)
    }
  }

  /** Fires after every (re)connection, including the first one — the right place to reconcile with REST. */
  onReconnect(listener: () => void) {
    this.reconnectListeners.add(listener)
    return () => this.reconnectListeners.delete(listener)
  }

  private dispatch(type: string, payload: unknown) {
    const event = payload as RealtimeEvent
    const resourceKey = `${event.resource.type}:${event.resource.id}`

    const seen = this.seenEventIds.get(resourceKey) ?? []
    if (seen.includes(event.id)) return
    seen.push(event.id)
    if (seen.length > MAX_SEEN_IDS_PER_RESOURCE) seen.shift()
    this.seenEventIds.set(resourceKey, seen)

    const lastVersion = this.lastVersion.get(resourceKey) ?? 0
    if (event.version <= lastVersion) return
    this.lastVersion.set(resourceKey, event.version)

    this.handlers.get(type)?.forEach((handler) => handler(event))
  }
}

export const realtimeClient = new RealtimeClient()

// Logout, login or switching users reconnects with the new token so stale per-resource
// dedup/version state never leaks across sessions.
subscribeSessionToken(() => {
  if (realtimeClient.isConnected) realtimeClient.connect()
})
