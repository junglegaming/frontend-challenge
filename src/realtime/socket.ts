import type { Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'wss://realtime.kurio.mock'

/**
 * Um socket por sessão. Token vai na query (o binding de mocks não lê o `auth` do handshake).
 * Só WebSocket: o MSW intercepta WebSocket, não long-polling.
 * Import sob demanda: o engine.io-client captura `globalThis.WebSocket` ao ser avaliado, então
 * ele só pode carregar depois do MSW; e sai do bundle crítico da primeira renderização.
 */
export async function createSocket(token: string | null): Promise<Socket> {
  const { io } = await import('socket.io-client')
  return io(SOCKET_URL, {
    // Sem isso o io() reaproveita o Manager em cache para a mesma URL e a query antiga (sem token) seria reutilizada.
    forceNew: true,
    transports: ['websocket'],
    query: token ? { token } : {},
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
  })
}
