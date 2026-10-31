import type { useCart } from "@/features/market/context/cart-provider";
import { Minus, Plus, Trash2 } from "lucide-react";

type CartItemData = ReturnType<typeof useCart>["items"][number];

interface CartItemProps {
  item: CartItemData;
  onUpdateQuantity: (item: CartItemData, quantity: number) => void;
  onRemove: (item: CartItemData) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_100px_120px_100px_32px] items-center gap-3 bg-surface-raised p-2 max-md:grid-cols-[minmax(0,1fr)_75px_85px_28px] max-sm:grid-cols-[minmax(0,1fr)_28px]">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={item.nft.image}
          alt={item.nft.name}
          className="size-[70px] shrink-0 rounded-control object-cover max-sm:size-12"
        />

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {item.nft.name}
          </p>

          <p className="mt-1 text-xs text-muted">
            ID do token: #{item.nft.tokenId}
          </p>

          <p className="text-xs text-muted sm:hidden">
            {item.nft.price.toFixed(2)} ETH
          </p>
        </div>
      </div>

      <span className="text-sm font-semibold text-muted max-sm:hidden">
        {item.nft.price.toFixed(2)} ETH
      </span>

      <div className="flex items-center gap-2 max-sm:hidden">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={item.quantity <= 1}
          onClick={() => onUpdateQuantity(item, item.quantity - 1)}
          className="rounded-full bg-primary p-1.5 text-primary-foreground disabled:opacity-50"
        >
          <Minus size={14} />
        </button>

        <span className="min-w-4 text-center text-sm text-foreground">
          {item.quantity}
        </span>

        <button
          type="button"
          aria-label="Aumentar quantidade"
          onClick={() => onUpdateQuantity(item, item.quantity + 1)}
          className="rounded-full bg-primary p-1.5 text-primary-foreground"
        >
          <Plus size={14} />
        </button>
      </div>

      <span className="text-sm font-bold text-primary max-sm:hidden">
        {(item.nft.price * item.quantity).toFixed(2)} ETH
      </span>

      <button
        type="button"
        aria-label={`Remover ${item.nft.name} do carrinho`}
        onClick={() => onRemove(item)}
        className="flex items-center justify-center text-muted transition-colors hover:text-primary"
      >
        <Trash2 size={17} />
      </button>

      <div className="col-span-2 flex items-center justify-between border-t border-border pt-2 sm:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={item.quantity <= 1}
            onClick={() => onUpdateQuantity(item, item.quantity - 1)}
            className="rounded-full bg-primary p-1.5 text-primary-foreground disabled:opacity-50"
          >
            <Minus size={12} />
          </button>

          <span className="text-sm text-foreground">{item.quantity}</span>

          <button
            type="button"
            aria-label="Aumentar quantidade"
            onClick={() => onUpdateQuantity(item, item.quantity + 1)}
            className="rounded-full bg-primary p-1.5 text-primary-foreground"
          >
            <Plus size={12} />
          </button>
        </div>

        <span className="text-sm font-bold text-primary">
          {(item.nft.price * item.quantity).toFixed(2)} ETH
        </span>
      </div>

      <p className="col-span-full text-xs text-muted sm:hidden">
        Edição: {item.edition}
      </p>
    </div>
  );
}
