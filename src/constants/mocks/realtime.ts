import { ws } from "msw";
import { toSocketIo } from "@mswjs/socket.io-binding";
import type { NFT, Order } from "../../types";
import { currentUser } from "./db";
// MSW 2.11 normalizes the Socket.IO prefix to `/` before matching.
const channel = ws.link(
  `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/`,
);
const connections = new Set<{
  socket: ReturnType<typeof toSocketIo>;
  userId?: string;
}>();
export const realtimeHandler = channel.addEventListener(
  "connection",
  (connection) => {
    const socket = toSocketIo(connection);
    const entry = { socket, userId: currentUser()?.id };
    connections.add(entry);
    const heartbeat = setInterval(() => connection.client.send("2"), 20000);
    connection.client.addEventListener("close", () => {
      clearInterval(heartbeat);
      connections.delete(entry);
    });
  },
);
export function emitNFT(nft: NFT, old = false) {
  const event = {
    eventId: `nft:${nft.id}:${nft.version}`,
    resourceId: nft.id,
    version: old ? Math.max(0, nft.version - 1) : nft.version,
  };
  for (const { socket } of connections)
    socket.client.emit("nft.updated", event);
}
export function emitOrder(order: Order) {
  for (const { socket, userId } of connections)
    if (userId === order.userId)
      socket.client.emit("order.updated", {
        eventId: `order:${order.id}:${order.version}`,
        resourceId: order.id,
        version: order.version,
        userId: order.userId,
      });
}
export function disconnectClients() {
  for (const { socket } of connections)
    socket.rawClient.close(1001, "Simulação de desconexão");
  connections.clear();
}
