import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { RealtimeEvent } from '@/schemas/events'
import { bus } from './bus'
import { findSession } from './http'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'wss://realtime.kurio.mock'

const realtime = ws.link(`${SOCKET_URL}/*`)

interface Client {
  io: ReturnType<typeof toSocketIo>
  userId: string | null
  drop: () => void
}

const clients = new Set<Client>()
let lastDelivery: { event: RealtimeEvent; audience: { userId: string | null } } | null = null

function deliver(event: RealtimeEvent, audience: { userId: string | null }) {
  for (const client of clients) {
    // Eventos privados (pedido) só chegam às conexões autenticadas do dono.
    if (audience.userId && client.userId !== audience.userId) continue
    client.io.client.emit(event.type, event)
  }
}

bus.on((event, audience) => {
  lastDelivery = { event, audience }
  deliver(event, audience)
})

/**
 * Servidor Socket.IO simulado. O binding só confirma o handshake; ping e
 * autenticação (token na query, já que o binding ignora o `auth` do CONNECT) ficam aqui.
 */
export const socketHandler = realtime.addEventListener('connection', (connection) => {
  const { client } = connection
  const token = new URL(client.url).searchParams.get('token')
  const entry: Client = {
    io: toSocketIo(connection),
    userId: findSession(token)?.userId ?? null,
    drop: () => client.close(4000, 'mock: conexão derrubada'),
  }
  clients.add(entry)
  // Engine.IO: sem ping do servidor o cliente encerra a conexão após pingInterval + pingTimeout.
  const ping = setInterval(() => client.send('2'), 20_000)
  client.addEventListener('close', () => {
    clearInterval(ping)
    clients.delete(entry)
  })
})

/** Diagnóstico: usuário de cada conexão aberta (null = visitante). */
export function connectedUsers() {
  return [...clients].map((client) => client.userId)
}

export function dropConnections() {
  for (const client of clients) client.drop()
}

/** Reenvia o último evento com o mesmo eventId/versão — o cliente deve ignorar. */
export function redeliverLastEvent() {
  if (lastDelivery) deliver(lastDelivery.event, lastDelivery.audience)
}

export function deliverRaw(event: RealtimeEvent, audience: { userId: string | null } = { userId: null }) {
  deliver(event, audience)
}
