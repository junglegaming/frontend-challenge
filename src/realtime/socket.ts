// This module must only be loaded after worker.start() has resolved.
import { io, type Socket } from "socket.io-client";
import { queryClient } from "@/app/query-client";
import type { Nft } from "@/contracts/nft";
import type { NftUpdatedPayload, ServerToClientEvents } from "./types";

let socket: Socket<ServerToClientEvents> | undefined;

export function startRealtime() {
  if (socket) return;

  socket = io(window.location.origin, {
    transports: ["websocket"],
    autoConnect: false,
  });

  socket.on("connect", () => {
    console.info("[realtime] connected");
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
  });

  socket.on("nft.updated", async ({ id, changes }: NftUpdatedPayload) => {
    await queryClient.cancelQueries({ queryKey: ["nfts"] });

    queryClient.setQueryData<Nft[]>(["nfts"], (current) =>
      current?.map((nft) => nft.id === id ? { ...nft, ...changes } : nft),
    );
    queryClient.setQueryData<Nft>(["nfts", id], (current) =>
      current ? { ...current, ...changes } : current,
    );

    console.info("[realtime] nft.updated", { id, changes });
  });

  socket.on("order.updated", (event) => {
    void queryClient.invalidateQueries({ queryKey: ["orders", event.id], exact: true });
    console.info("[realtime] order.updated", event);
  });

  socket.connect();
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = undefined;
  });
}
