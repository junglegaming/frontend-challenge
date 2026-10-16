import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { WebSocket as WebSocketTransport } from "engine.io-client";
import type { Catalog, NFT, Order, RealtimeEvent } from "../types";

import { invalidateCommerce, queryClient } from "../api";

class InterceptableWebSocket extends WebSocketTransport {
  createSocket(uri: string, protocols?: string | string[]) {
    return protocols
      ? new globalThis.WebSocket(uri, protocols)
      : new globalThis.WebSocket(uri);
  }
}
export function useRealtime(
  userId: string | undefined,
  onChange: (message: string) => void,
) {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const socket = io(location.origin, {
      transports: [InterceptableWebSocket],
      reconnectionDelay: 750,
      reconnectionDelayMax: 2000,
    });
    const versions = new Map<string, number>();
    const accept = (type: string, event: RealtimeEvent) => {
      if (event.userId && event.userId !== userId) return false;
      const key = `${type}:${event.resourceId}`;
      let cachedVersion =
        type === "nft"
          ? (queryClient.getQueryData<NFT>(["nft", event.resourceId])
              ?.version ?? 0)
          : (queryClient.getQueryData<Order>([
              "private",
              userId,
              "order",
              event.resourceId,
            ])?.version ?? 0);
      if (type === "nft")
        for (const [, catalog] of queryClient.getQueriesData<Catalog>({
          queryKey: ["catalog"],
        })) {
          cachedVersion = Math.max(
            cachedVersion,
            catalog?.items?.find((n) => n.id === event.resourceId)?.version ??
              0,
          );
        }
      if (Math.max(versions.get(key) ?? 0, cachedVersion) >= event.version)
        return false;
      versions.set(key, event.version);
      return true;
    };
    socket.on("connect_error", (e) =>
      console.warn("Realtime connection:", e.message),
    );
    socket.on("connect", () => {
      setConnected(true);
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      void queryClient.invalidateQueries({ queryKey: ["nft"] });
      void queryClient.invalidateQueries({
        queryKey: ["private", userId, "order"],
      });
      void invalidateCommerce();
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("nft.updated", (event: RealtimeEvent) => {
      if (!accept("nft", event)) return;
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      void queryClient.invalidateQueries({
        queryKey: ["nft", event.resourceId],
      });
      void invalidateCommerce();
      onChange(
        "Preço ou disponibilidade atualizado. Revise sua cotação antes de comprar.",
      );
    });
    socket.on("order.updated", (event: RealtimeEvent) => {
      if (!accept("order", event)) return;
      void queryClient.invalidateQueries({
        queryKey: ["private", userId, "order", event.resourceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["private", userId, "orders"],
      });
      void invalidateCommerce();
    });
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  }, [userId, onChange]);
  return connected;
}
