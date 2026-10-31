import type { NFT, NFTEdition } from "@/data/nfts";
import { NFT_EDITIONS } from "@/data/nfts";
import { useCart } from "@/features/market/context/cart-provider";
import { Heart, Minus, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";

interface MarketInfoProps {
  nft: NFT;
}

export function MarketInfo({ nft }: MarketInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedEdition, setSelectedEdition] = useState<NFTEdition>(
    nft.edition,
  );
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setSelectedEdition(nft.edition);
    setIsFavorite(false);
  }, [nft.id, nft.edition]);

  const { addToCart } = useCart();

  const handleBuy = () => {
    addToCart(nft, quantity, selectedEdition);
  };

  return (
    <div className="w-full min-w-0 py-1">
      <h1 className="mt-2 break-words text-2xl font-black text-foreground sm:text-3xl">
        {nft.name}
      </h1>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <p className="text-xl font-bold text-primary">
          {nft.price.toFixed(2)} ETH
        </p>

        <div className="flex flex-wrap items-center gap-1">
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              size={14}
              className={
                index < Math.round(nft.rating)
                  ? "fill-primary text-primary"
                  : "text-muted"
              }
            />
          ))}

          <span className="ml-1 text-xs text-muted">
            {nft.reviewCount} avaliações de colecionadores
          </span>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm font-bold text-foreground">Sobre este NFT:</p>
        <p className="mt-2 text-sm leading-6 text-muted">{nft.description}</p>
      </div>

      <div className="mt-3">
        <p className="text-sm font-bold text-foreground">Edição:</p>

        <div className="mt-2 flex flex-nowrap gap-1.5 overflow-x-auto pb-1 sm:gap-2">
          {NFT_EDITIONS.map((edition) => (
            <button
              key={edition}
              type="button"
              onClick={() => setSelectedEdition(edition)}
              aria-pressed={selectedEdition === edition}
              className={`shrink-0 rounded-full border px-1 py-0 text-[8px] font-medium transition-colors sm:px-3 sm:py-1 sm:text-xs ${
                selectedEdition === edition
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {edition}
            </button>
          ))}
        </div>
      </div>

      {/* Quantidade */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={quantity <= 1}
          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          className="rounded-full bg-primary p-2 text-primary-foreground transition-opacity disabled:opacity-50"
        >
          <Minus size={18} />
        </button>

        <span className="min-w-4 text-center text-sm">{quantity}</span>

        <button
          type="button"
          aria-label="Aumentar quantidade"
          onClick={() => setQuantity((current) => current + 1)}
          className="rounded-full bg-primary p-2 text-primary-foreground"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Informações do NFT */}
      <div className="mt-4 space-y-2 text-sm text-muted">
        <p>ID do token: {nft.tokenId}</p>
        <p>Coleção: {nft.collection}</p>

        <p className="mb-2">
          Atributos:{" "}
          {nft.attributes.map((attribute, index) => (
            <span key={attribute}>
              {attribute}
              {index < nft.attributes.length - 1 && ", "}
            </span>
          ))}
        </p>
      </div>

      {/* Compartilhamento */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <span className="font-bold text-foreground">
          Compartilhar este NFT:
        </span>

        <button
          type="button"
          aria-label="Compartilhar no LinkedIn"
          className="text-foreground transition-colors hover:text-primary"
        >
          <FaLinkedinIn size={12} />
        </button>

        <button
          type="button"
          aria-label="Compartilhar por e-mail"
          className="text-foreground transition-colors hover:text-primary"
        >
          <MdEmail size={12} />
        </button>

        <button
          type="button"
          aria-label="Compartilhar no X"
          className="text-foreground transition-colors hover:text-primary"
        >
          <FaXTwitter size={12} />
        </button>
      </div>

      {/* Botões no final do conteúdo */}
      <div className="mt-5 flex w-full min-w-0 gap-2 lg:mt-4 lg:justify-end">
        <button
          type="button"
          onClick={handleBuy}
          className="flex-1 cursor-pointer rounded-control bg-primary px-3 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover sm:px-6 lg:flex-none"
        >
          COMPRAR
        </button>

        <button
          type="button"
          onClick={() => setIsFavorite((current) => !current)}
          aria-pressed={isFavorite}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-control border border-primary px-3 py-3 text-sm font-semibold text-primary lg:flex-none lg:px-4"
        >
          <Heart size={17} className={isFavorite ? "fill-primary" : ""} />
          {isFavorite ? "Favoritado" : "Favoritar"}
        </button>
      </div>
    </div>
  );
}
