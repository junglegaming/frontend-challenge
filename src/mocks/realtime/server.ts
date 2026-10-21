import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws, type WebSocketHandler } from 'msw'
import type { RealtimeEvent, RealtimeEventType } from '@/shared/realtime/contracts'
import type { Audience, EventPublisher, TypedEvent } from './publisher'

/** Port: resolves the user behind the token sent in the Socket.IO handshake query. */
export type SocketIdentityResolver = (token: string | null) => string | null

interface Connection {
  id: number
  userId: string | null
  emit: (event: RealtimeEvent) => void
  close: () => void
}

/** Socket.IO expects a server ping within pingInterval + pingTimeout; the binding doesn't send it. */
const PING_INTERVAL_MS = 20_000

/**
 * Socket.IO adapter of the `EventPublisher` port, built on MSW's WebSocket interception and
 * `@mswjs/socket.io-binding`. Limitations (documented in ARCHITECTURE.md): default namespace only,
 * no rooms/acks, handshake `auth` is ignored — the session token travels in the handshake query.
 */
export class MockRealtimeServer implements EventPublisher {
  readonly handler: WebSocketHandler
  private connections = new Map<number, Connection>()
  private nextId = 1
  private recentEvents: Array<{ event: RealtimeEvent; audience: Audience }> = []
  private blocked = false

  private readonly resolveIdentity: SocketIdentityResolver

  constructor(origin: string, resolveIdentity: SocketIdentityResolver) {
    this.resolveIdentity = resolveIdentity
    const link = ws.link(`${origin}/socket.io/`)
    this.handler = link.addEventListener('connection', (connection) => {
      if (this.blocked) {
        connection.client.close(1013, 'realtime offline')
        return
      }
      const token = connection.client.url.searchParams.get('token')
      const io = toSocketIo(connection)
      const id = this.nextId++
      const ping = setInterval(() => connection.client.send('2'), PING_INTERVAL_MS)

      this.connections.set(id, {
        id,
        userId: this.resolveIdentity(token),
        emit: (event) => io.client.emit(event.type, event),
        close: () => connection.client.close(),
      })

      connection.client.addEventListener('close', () => {
        clearInterval(ping)
        this.connections.delete(id)
      })
    })
  }

  publish<T extends RealtimeEventType>(event: TypedEvent<T>, audience: Audience) {
    this.recentEvents = [...this.recentEvents.slice(-49), { event, audience }]
    this.deliver(event, audience)
  }

  // ---- Controls used by the scenario panel and Playwright (window.__nftMock) ----

  /** Re-sends the last event of a type with the same id (client must drop it as a duplicate). */
  replayLast(type?: RealtimeEventType) {
    const entry = [...this.recentEvents].reverse().find((e) => !type || e.event.type === type)
    if (entry) this.deliver(entry.event, entry.audience)
    return entry?.event ?? null
  }

  /** Sends a fresh event id carrying an older version (client must not regress its state). */
  sendStale(type?: RealtimeEventType) {
    const entry = [...this.recentEvents].reverse().find((e) => !type || e.event.type === type)
    if (!entry) return null
    const stale = { ...entry.event, id: `${entry.event.id}_stale`, version: entry.event.version - 1 }
    this.deliver(stale, entry.audience)
    return stale
  }

  /** Drops every open connection (clients reconnect automatically). */
  disconnectAll() {
    this.connections.forEach((connection) => connection.close())
  }

  /** While blocked, new connections are refused — simulates the realtime server being down. */
  setBlocked(blocked: boolean) {
    this.blocked = blocked
    if (blocked) this.disconnectAll()
  }

  get connectionCount() {
    return this.connections.size
  }

  private deliver(event: RealtimeEvent, audience: Audience) {
    this.connections.forEach((connection) => {
      if (audience.kind === 'user' && connection.userId !== audience.userId) return
      connection.emit(event)
    })
  }
}
