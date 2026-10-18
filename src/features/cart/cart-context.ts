import { createContext, useContext } from "react";
import type { Nft } from "@/contracts/nft";
import type { CartItem } from "./types";

export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (nft: Nft, quantity?: number) => void;
  removeItem: (nftId: string) => void;
  updateQuantity: (nftId: string, quantity: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}