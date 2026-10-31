import type { useCart } from "@/features/market/context/cart-provider";
import { CartItem } from "./cart-item";

type CartItemData = ReturnType<typeof useCart>["items"][number];

interface CartListProps {
  items: CartItemData[];
  onUpdateQuantity: (item: CartItemData, quantity: number) => void;
  onRemove: (item: CartItemData) => void;
}

export function CartList({ items, onUpdateQuantity, onRemove }: CartListProps) {
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-[minmax(0,1fr)_100px_120px_100px_32px] items-center gap-3 border-b border-border pb-2 text-sm font-semibold text-foreground max-md:grid-cols-[minmax(0,1fr)_75px_85px_28px] max-sm:grid-cols-[minmax(0,1fr)_28px]">
        <span>NFTs</span>
        <span className="max-sm:hidden">Preço</span>
        <span className="max-sm:hidden">Edições</span>
        <span className="max-sm:hidden">Total</span>
        <span />
      </div>

      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <CartItem
            key={`${item.nft.id}-${item.edition}`}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
