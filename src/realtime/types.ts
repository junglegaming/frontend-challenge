import type { Nft } from "@/contracts/nft";

export interface NftUpdatedPayload {
  id: string;
  changes: Partial<Pick<Nft, "price" | "name" | "imageUrl">>;
}

export type OrderUpdatedPayload = {
  id: string;
  updatedAt: string;
} & (
  | { status: "confirmed"; transactionId: string }
  | { status: "rejected"; transactionId?: never }
);

export interface ServerToClientEvents {
  "nft.updated": (payload: NftUpdatedPayload) => void;
  "order.updated": (payload: OrderUpdatedPayload) => void;
}
