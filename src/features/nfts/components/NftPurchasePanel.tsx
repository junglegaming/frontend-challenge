import { Heart, Mail, Minus, Plus, Star } from "lucide-react";
import type { Nft } from "@/contracts/nft";
import { useCart } from "@/features/cart/cart-context";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

interface NftPurchasePanelProps {
  nft: Nft;
}

const editions = ["1/1", "1/10", "1/50", "ABERTA"];
const activeEdition = "1/50";

function formatTokenId(id: string) {
  const digits = id.replace(/\D/g, "");
  return `#${digits.padStart(4, "0")}`;
}

export function NftPurchasePanel({ nft }: NftPurchasePanelProps) {

  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  return (
    <div className="text-xs">
      <h1 className="text-2xl font-bold text-zinc-100">{nft.name}</h1>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#3a2416] pb-3">
        <p className="text-lg font-bold text-[#d4893f]">{nft.price} ETH</p>
        <p className="flex items-center gap-2 text-[11px] text-zinc-300">
          <span className="flex gap-0.5 text-[#d4893f]" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((star) => (
              <Star key={star} className="size-3 fill-current" />
            ))}
          </span>
          <span>19 avaliações de colecionadores</span>
        </p>
      </div>

      <h2 className="mt-4 font-bold text-zinc-100">Sobre este NFT:</h2>
      <p className="mt-2 leading-relaxed text-[#cdb79e]">
        Um colecionável digital finalizado à mão da coleção Kurio Editions,
        verificado na Ethereum, com arte desbloqueável e acesso para
        colecionadores.
      </p>

      <h2 className="mt-4 font-bold text-zinc-100">Edição:</h2>
      <ul className="mt-2 flex flex-wrap gap-2 text-[10px]">
        {editions.map((edition) => (
          <li key={edition}>
            <button
              type="button"
              aria-pressed={edition === activeEdition}
              className={`rounded-full border px-2 py-0.5 ${
                edition === activeEdition
                  ? "border-[#d4893f] text-zinc-100"
                  : "border-[#3a2416] text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {edition}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#3a2416] pb-4">
        <div className="flex items-center gap-4" role="group" aria-label="Quantidade">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            className="flex size-7 items-center justify-center rounded-full bg-[#d4893f] text-[#1a110d] hover:bg-[#e09a52]"
            onClick={() =>
                setQuantity((currentQuantity) =>
                  Math.max(1, currentQuantity - 1),
                )
              }
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </button>
          <span
              className="text-sm text-zinc-100"
              aria-live="polite"
            >
              {quantity}
          </span>
          <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() =>
                setQuantity((currentQuantity) => currentQuantity + 1)
              }
              className="flex size-7 items-center justify-center rounded-full bg-[#d4893f] text-[#1a110d] hover:bg-[#e09a52]"
            >
              <Plus className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
                addItem(nft, quantity);

                navigate({
                  to: "/cart",
              });
            }}
            className="rounded-sm bg-[#d4893f] px-10 py-2 text-[11px] font-medium text-[#1a110d] hover:bg-[#e09a52]"
          >
            COMPRAR
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-sm border border-[#d4893f] px-3 py-2 text-[11px] text-zinc-100 hover:bg-[#241612]"
          >
            <Heart className="size-3.5" aria-hidden="true" />
            Favoritar
          </button>
        </div>
      </div>

      <dl className="mt-4 space-y-3 text-[11px] text-zinc-400">
        <div className="flex gap-1">
          <dt>ID do token:</dt>
          <dd>{formatTokenId(nft.id)}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Coleção:</dt>
          <dd>Kurio Apes</dd>
        </div>
        <div className="flex gap-1">
          <dt>Atributos:</dt>
          <dd>Óculos, Esmeralda, Raro</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center gap-3 text-[11px]">
        <span className="font-bold text-zinc-100">Compartilhar este NFT:</span>
        <ul className="flex items-center gap-2 text-zinc-100">
          <li>
            <a href="#" aria-label="Compartilhar no LinkedIn" className="font-bold hover:text-[#d4893f]">
              in
            </a>
          </li>
          <li>
            <a href="#" aria-label="Compartilhar por e-mail" className="hover:text-[#d4893f]">
              <Mail className="size-3.5" aria-hidden="true" />
            </a>
          </li>
          <li>
            <a href="#" aria-label="Compartilhar no X" className="font-bold hover:text-[#d4893f]">
              X
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
