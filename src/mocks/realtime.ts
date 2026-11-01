import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import type { NftUpdatedEvent, OrderStatus, OrderUpdatedEvent } from '@/shared/contracts'
import { REALTIME_URL } from '@/shared/realtime/url'

const realtime = ws.link(REALTIME_URL)

type SocketClient = ReturnType<typeof toSocketIo>['client']
type Connected = { client: SocketClient; close: () => void }

const ENGINE_IO_PING = '2'
const PING_MS = 25_000

let clients: Connected[] = []

function broadcast(event: string, payload: unknown): void {
  clients.forEach((c) => c.client.emit(event, payload))
}

/**
 * Identidade estável do evento: o mesmo recurso na mesma versão gera o mesmo
 * id, então reenvios chegam como duplicatas reconhecíveis.
 */
function eventIdFor(resource: string, id: string, version: number): string {
  return `${resource}:${id}:v${version}`
}

/**
 * Emite `nft.updated` (preço/disponibilidade) para todos os clientes.
 *
 * @param event - Recurso e versão; `eventId` é derivado quando omitido.
 */
export function emitNftUpdated(
  event: Omit<NftUpdatedEvent, 'eventId'> & { eventId?: string },
): void {
  const payload: NftUpdatedEvent = {
    ...event,
    eventId: event.eventId ?? eventIdFor('nft', event.nftId, event.version),
  }
  broadcast('nft.updated', payload)
}

/**
 * Emite `order.updated` (estado do pedido) para todos os clientes.
 *
 * @param event - Pedido, estado e versão; `eventId` é derivado quando omitido.
 */
export function emitOrderUpdated(event: {
  orderId: string
  status: OrderStatus
  version: number
  eventId?: string
}): void {
  const payload: OrderUpdatedEvent = {
    ...event,
    eventId: event.eventId ?? eventIdFor('order', event.orderId, event.version),
  }
  broadcast('order.updated', payload)
}

/**
 * Derruba todas as conexões ativas, simulando queda de rede. O
 * `socket.io-client` reconecta sozinho e o app reconcilia com a API REST.
 */
export function dropRealtimeConnections(): void {
  clients.forEach((c) => c.close())
}

export const realtimeHandler = realtime.addEventListener('connection', (connection) => {
  const { client } = toSocketIo(connection)
  const connected: Connected = { client, close: () => connection.client.close() }
  clients.push(connected)

  const pingTimer = window.setInterval(() => connection.client.send(ENGINE_IO_PING), PING_MS)

  connection.client.addEventListener('close', () => {
    window.clearInterval(pingTimer)
    clients = clients.filter((c) => c !== connected)
  })
})
