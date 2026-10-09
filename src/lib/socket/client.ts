import { io, type Socket } from 'socket.io-client';
import type { NftUpdated, OrderUpdated } from '@/types/api';

interface ServerEvents {
  'nft.updated': (event: NftUpdated) => void;
  'order.updated': (event: OrderUpdated) => void;
}

export const socket: Socket<ServerEvents> = io(
  import.meta.env.VITE_API_BASE_URL || undefined,
  {
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 5_000,
  }
);

export function connectSocket(token?: string): void {
  socket.disconnect();
  socket.auth = token ? { token } : {};
  socket.connect();
}

export function disconnectSocket(): void {
  socket.disconnect();
  socket.auth = {};
}
