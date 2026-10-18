import { skipToken, useQuery } from "@tanstack/react-query";
import type { CartItem } from "@/features/cart/types";
import { getOrderById } from "./api";

export interface StoredOrderReceipt {
  id: string;
  purchasedItems: CartItem[];
  selectedWallet: string;
  cartCleared: boolean;
}

export function readLastOrder(): StoredOrderReceipt | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem("lastOrder") ?? "null");
    if (typeof value !== "object" || value === null) return null;
    if (!("id" in value) || typeof value.id !== "string") return null;
    if (!("selectedWallet" in value) || typeof value.selectedWallet !== "string") return null;
    if (!("purchasedItems" in value) || !Array.isArray(value.purchasedItems)) return null;

    const items: CartItem[] = [];
    for (const item of value.purchasedItems as unknown[]) {
      if (typeof item !== "object" || item === null) return null;
      if (
        !("quantity" in item) || typeof item.quantity !== "number" ||
        !Number.isSafeInteger(item.quantity) || item.quantity <= 0
      ) return null;
      if (!("nft" in item) || typeof item.nft !== "object" || item.nft === null) return null;
      const nft = item.nft;
      if (
        !("id" in nft) || typeof nft.id !== "string" ||
        !("name" in nft) || typeof nft.name !== "string" ||
        !("price" in nft) || typeof nft.price !== "string" ||
        !("imageUrl" in nft) || typeof nft.imageUrl !== "string"
      ) return null;
      items.push({
        nft: { id: nft.id, name: nft.name, price: nft.price, imageUrl: nft.imageUrl },
        quantity: item.quantity,
      });
    }

    return {
      id: value.id,
      selectedWallet: value.selectedWallet,
      purchasedItems: items,
      cartCleared: "cartCleared" in value && value.cartCleared === true,
    };
  } catch {
    return null;
  }
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: orderId ? ({ signal }) => getOrderById(orderId, signal) : skipToken,
    enabled: Boolean(orderId),
    staleTime: 0,
    retry: false,
  });
}
