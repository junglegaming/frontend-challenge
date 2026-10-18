import type { Nft } from "@/contracts/nft";
import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

interface NftCardProps {
  nft: Nft;
}

export function NftCard({ nft }: NftCardProps) {
  const isRare =
    nft.name.toLowerCase().includes("baron") ||
    nft.id === "3" ||
    nft.id === "088";

  return (
    <article className="w-full lg:w-64.5 flex flex-col gap-2 lg:gap-3">
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="flex flex-col gap-2 lg:gap-3 group"
      >
        <div className="w-full lg:w-64.5 bg-[#241612] p-1 flex items-center justify-center rounded-2xl lg:rounded-none relative overflow-hidden">
          {/* Favorite button on mobile */}
          <button
            type="button"
            aria-label={`Favoritar ${nft.name}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full bg-[#140d0a]/70 text-zinc-300 backdrop-blur-sm lg:hidden hover:text-[#d4893f]"
          >
            <Heart className="size-3.5" aria-hidden="true" />
          </button>

          {/* Rarity badge on mobile */}
          {isRare && (
            <span className="absolute top-2 left-2 z-10 rounded-sm bg-[#d4893f] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#1a110d] lg:hidden">
              RARO
            </span>
          )}

          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="aspect-square w-full lg:w-62.5 lg:h-62.5 rounded-[15px] object-cover transition-transform duration-200 group-hover:scale-102"
          />
        </div>

        <h2 className="text-xs lg:text-base font-normal leading-4 tracking-normal text-zinc-100 truncate">
          {nft.name}
        </h2>

        <p className="text-xs lg:text-lg font-bold leading-4 tracking-normal text-amber-500">
          {nft.price} ETH
        </p>
      </Link>
    </article>
  );
}