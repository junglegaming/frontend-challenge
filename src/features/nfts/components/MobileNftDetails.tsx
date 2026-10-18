import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Heart, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import type { Nft } from "@/contracts/nft";
import { useCart } from "@/features/cart/cart-context";

interface MobileNftDetailsProps {
  nft: Nft;
}

const editions = ["1/10", "1/10", "1/50", "ABERTA"];

function formatTokenId(id: string) {
  const digits = id.replace(/\D/g, "");
  return `#${digits.padStart(4, "0")}`;
}

export function MobileNftDetails({ nft }: MobileNftDetailsProps) {
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [selectedEdition, setSelectedEdition] = useState("1/50");
  const [isFavorited, setIsFavorited] = useState(false);

  const handleBuy = () => {
    addItem(nft, quantity);
    navigate({ to: "/cart" });
  };

  const handleAddToCart = () => {
    addItem(nft, quantity);
  };

  return (
    <div className="block lg:hidden min-h-screen bg-[#140d0a] font-mono text-zinc-100 pb-8">
      {/* 2.1 Hero do Detalhe: Top Bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        {/* Botão voltar circular */}
        <Link
          to="/"
          aria-label="Voltar para o início"
          className="flex size-9 items-center justify-center rounded-full border border-[#3a2416] bg-[#1c120e] text-zinc-300 hover:text-[#d4893f] transition-colors shadow-sm"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>

        {/* Botão favoritar circular */}
        <button
          type="button"
          onClick={() => setIsFavorited(!isFavorited)}
          aria-label={isFavorited ? "Remover dos favoritos" : "Favoritar NFT"}
          aria-pressed={isFavorited}
          className={`flex size-9 items-center justify-center rounded-full border border-[#3a2416] bg-[#1c120e] transition-colors shadow-sm ${
            isFavorited ? "text-[#d4893f]" : "text-zinc-300 hover:text-[#d4893f]"
          }`}
        >
          <Heart className={`size-4 ${isFavorited ? "fill-current text-[#d4893f]" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {/* 2.1 Hero do Detalhe: Imagem principal do NFT */}
      <div className="px-4 pt-1 pb-4">
        <div className="overflow-hidden rounded-3xl bg-[#241612] p-1.5 shadow-2xl">
          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="aspect-square w-full rounded-[22px] object-cover"
          />
        </div>
      </div>

      {/* 2.2 Details Sheet: Área de informações com topo fortemente arredondado */}
      <div className="relative -mt-3 rounded-t-[32px] border-t border-[#3a2416] bg-[#1f1410] px-5 pt-6 pb-6 shadow-2xl">
        {/* Linha 1: Nome + Avaliação */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-bold text-zinc-100 tracking-tight truncate">
            {nft.name}
          </p>

          <div className="flex items-center gap-1 rounded-full border border-[#d4893f]/40 bg-[#2b1912] px-2.5 py-0.5 text-xs font-mono text-[#d4893f] shrink-0">
            <Star className="size-3 fill-current text-[#d4893f]" aria-hidden="true" />
            <span className="font-bold">4.8</span>
            <span className="text-zinc-400 text-[10px]">(19)</span>
          </div>
        </div>

        {/* Descrição */}
        <p className="mt-2.5 text-[11px] leading-relaxed text-[#cdb79e]">
          Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na Ethereum.
        </p>

        {/* Seção Edição */}
        <div className="mt-4">
          <h2 className="text-xs font-bold text-zinc-200 mb-2">Edição:</h2>
          <div className="flex flex-wrap gap-2 text-[10px]" role="group" aria-label="Edições disponíveis">
            {editions.map((edition, idx) => {
              const isSelected = edition === selectedEdition && (edition !== "1/10" || idx === 1);
              return (
                <button
                  key={`${edition}-${idx}`}
                  type="button"
                  onClick={() => setSelectedEdition(edition)}
                  aria-pressed={isSelected}
                  className={`rounded-full border px-3 py-1 font-mono transition-colors ${
                    isSelected
                      ? "border-[#d4893f] bg-[#2b1912] text-[#d4893f] font-bold"
                      : "border-[#3a2416] bg-[#1a0e09] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {edition}
                </button>
              );
            })}
          </div>
        </div>

        {/* Metadados: ID, Coleção, Atributos */}
        <dl className="mt-4 space-y-1.5 text-xs text-zinc-400">
          <div className="flex gap-1.5">
            <dt className="text-zinc-300">ID do token:</dt>
            <dd className="text-zinc-400">{formatTokenId(nft.id)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-zinc-300">Coleção:</dt>
            <dd className="text-zinc-400">Kurio Apes</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-zinc-300">Atributos:</dt>
            <dd className="text-zinc-400">Óculos, Esmeralda, Raro</dd>
          </div>
        </dl>

        {/* 2.3 Compra no Detalhe */}
        <div className="mt-6 pt-4 border-t border-[#3a2416]/60 space-y-4">
          {/* Linha de Quantidade + Preço */}
          <div className="flex items-center justify-between">
            {/* Quantidade */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-300 font-medium">Qtd.</span>
              <div className="flex items-center gap-2.5" role="group" aria-label="Seletor de quantidade">
                <button
                  type="button"
                  aria-label="Diminuir quantidade mobile"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex size-6 items-center justify-center rounded-full bg-[#d4893f] text-[#140d0a] hover:bg-[#e09a52] transition-colors"
                >
                  <Minus className="size-3 font-bold" strokeWidth={3} aria-hidden="true" />
                </button>
                <span className="min-w-4 text-center text-xs font-bold text-zinc-100" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade mobile"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex size-6 items-center justify-center rounded-full bg-[#d4893f] text-[#140d0a] hover:bg-[#e09a52] transition-colors"
                >
                  <Plus className="size-3 font-bold" strokeWidth={3} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Preço */}
            <div className="text-base font-bold text-[#d4893f] font-mono">
              {nft.price} ETH
            </div>
          </div>

          {/* Linha de Ações: Comprar NFT + Carrinho */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleBuy}
              className="flex-1 rounded-full bg-[#c88243] hover:bg-[#d4893f] py-3.5 text-center text-xs font-bold uppercase tracking-wide text-[#140d0a] shadow-lg transition-colors cursor-pointer"
            >
              Comprar NFT
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              aria-label="Adicionar ao carrinho"
              className="flex size-12 items-center justify-center rounded-full border border-[#3a2416] bg-[#2a1a13] text-zinc-200 hover:text-[#d4893f] transition-colors shadow-md shrink-0 cursor-pointer"
            >
              <ShoppingCart className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
