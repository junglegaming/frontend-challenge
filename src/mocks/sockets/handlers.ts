import { ws } from 'msw';
import { toSocketIo } from '@mswjs/socket.io-binding';
import { setSocketEmit } from './emit';
import { getDb } from '../db/store';
import { scenarioIs } from '../scenarios';
import { schedule } from '../scenarios/timers';
const connections = new Set<{
  io: ReturnType<typeof toSocketIo>;
  token?: string;
  close: () => void;
}>();
export function closeMockSockets() {
  for (const connection of connections) connection.close();
  connections.clear();
}
setSocketEmit((type, event) => {
  for (const connection of connections) {
    const session = getDb().sessions.find(
      (s) =>
        s.token === connection.token && Date.parse(s.expiresAt) > Date.now()
    );
    if (
      type === 'order.updated' &&
      (!session ||
        getDb().flags.forceSessionExpired ||
        getDb().orders.find((o) => o.id === event.resourceId)?.userId !==
          session.userId)
    )
      continue;
    connection.io.client.emit(type, event);
  }
});
// MSW normalizes the Socket.IO path to the origin root when matching handlers.
export const socketHandlers = [
  ws
    .link(/^wss?:\/\/[^/]+(?:\/socket\.io\/?(?:\?.*)?|\/?(?:\?.*)?)$/)
    .addEventListener('connection', (connection) => {
      if (new URL(connection.client.url).pathname !== '/socket.io/') {
        connection.server.connect();
        return;
      }
      const io = toSocketIo(connection);
      const entry: { io: typeof io; token?: string; close: () => void } = {
        io,
        close: () => connection.client.close(),
      };
      connections.add(entry);
      connection.client.addEventListener('message', (event) => {
        const message = String(event.data);
        if (message.startsWith('40')) {
          try {
            entry.token = (
              JSON.parse(message.slice(2) || '{}') as { token?: string }
            ).token;
          } catch {
            entry.token = undefined;
          }
          if (scenarioIs('offline')) {
            entry.close();
            return;
          }
          if (scenarioIs('socket-queda')) schedule(entry.close, 1500);
        }
      });
      const ping = () => {
        if (!connections.has(entry)) return;
        if (scenarioIs('offline')) {
          entry.close();
          return;
        }
        connection.client.send('2');
        schedule(ping, 20000);
      };
      schedule(ping, 20000);
      connection.client.addEventListener('close', () =>
        connections.delete(entry)
      );
    }),
];
