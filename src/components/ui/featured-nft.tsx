import { Link } from "@tanstack/react-router";
import type { NFT } from "@/data/nfts";

interface FeaturedNFTProps {
  nft: NFT;
}

export function FeaturedNFT({ nft }: FeaturedNFTProps) {
  return (
    <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-center gap-2 px-4 pt-4">
        <h2 className="text-xl font-bold uppercase tracking-wide text-[var(--color-primary)]">
          NFT em destaque
        </h2>
      </div>

      <div className="flex items-center justify-center gap-2 px-4 pt-2">
        <h2 className="text-sm font-bold tracking-wide text-[var(--color-text-muted)]">
          Oferta limitada
        </h2>
      </div>

      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="group flex flex-1 flex-col p-3"
      >
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg bg-[var(--color-background)]">
          <img
            src={nft.image}
            alt={nft.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>
    </section>
  );
}
