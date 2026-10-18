import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/features/cart/types";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (nftId: string, quantity: number) => void;
  onRemove: (nftId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const lineSubtotal = (Number(item.nft.price) * item.quantity).toFixed(2);

  return (
    <article
      aria-label={item.nft.name}
      className="rounded-2xl lg:rounded-sm bg-[#241612] border border-[#3a2416] p-3 lg:px-4 lg:py-3 text-xs grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_90px_100px_90px_36px] items-center gap-3"
    >
      {/* NFT Info */}
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={item.nft.imageUrl}
          alt={item.nft.name}
          className="size-16 lg:size-12 shrink-0 rounded-xl lg:rounded-md object-cover"
        />
        <div className="min-w-0">
          <h2 className="truncate text-xs font-bold text-zinc-100">{item.nft.name}</h2>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            Edição: 1/50
          </p>
          <div className="mt-1 text-xs font-bold text-[#d4893f] lg:hidden">
            {Number(item.nft.price).toFixed(2)} ETH
          </div>
        </div>
      </div>

      {/* Unit Price (desktop only) */}
      <div className="hidden text-xs text-zinc-200 lg:block">
        {Number(item.nft.price).toFixed(2)} ETH
      </div>

      {/* Quantity Control (unified single instance) */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label={`Diminuir quantidade de ${item.nft.name}`}
          onClick={() => onUpdateQuantity(item.nft.id, item.quantity - 1)}
          className="flex size-6 lg:size-5 items-center justify-center rounded-full bg-[#352119] lg:bg-[#d4893f] text-zinc-400 lg:text-[#1a110d] hover:text-zinc-100 lg:hover:bg-[#e09a52] transition-colors"
        >
          <Minus className="size-3" strokeWidth={3} aria-hidden="true" />
        </button>
        <span className="min-w-4 text-center font-medium text-zinc-100" aria-live="polite">
          {item.quantity}
        </span>
        <button
          type="button"
          aria-label={`Aumentar quantidade de ${item.nft.name}`}
          onClick={() => onUpdateQuantity(item.nft.id, item.quantity + 1)}
          className="flex size-6 lg:size-5 items-center justify-center rounded-full bg-[#352119] lg:bg-[#d4893f] text-zinc-400 lg:text-[#1a110d] hover:text-zinc-100 lg:hover:bg-[#e09a52] transition-colors"
        >
          <Plus className="size-3" strokeWidth={3} aria-hidden="true" />
        </button>
      </div>

      {/* Line Total (desktop only) */}
      <div className="hidden text-xs font-bold text-[#d4893f] lg:block">
        {lineSubtotal} ETH
      </div>

      {/* Remove Button (desktop only) */}
      <div className="hidden lg:flex justify-end">
        <button
          type="button"
          aria-label={`Remover ${item.nft.name} do carrinho`}
          onClick={() => onRemove(item.nft.id)}
          className="text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
