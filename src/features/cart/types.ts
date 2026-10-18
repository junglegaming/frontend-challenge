import type { Nft } from "@/contracts/nft";

export interface CartItem {
  nft: Nft;
  quantity: number;
}

