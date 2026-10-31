import type { NFT } from "@/data/nfts";
import { Link } from "@tanstack/react-router";

interface NFTCardProps {
  nft: NFT;
}

export function NFTCard({ nft }: NFTCardProps) {
  return (
    <article className="min-w-0">
      <Link
        to="/market"
        search={{ nftId: nft.id }}
        className="group block overflow-hidden rounded-card bg-surface transition-colors hover:bg-surface-hover"
      >
        <div className="relative overflow-hidden">
          <img
            src={nft.image}
            alt={nft.name}
            loading="lazy"
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="p-3">
          <h3 className="mt-1 truncate text-sm font-semibold text-foreground">
            {nft.name}
          </h3>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-primary">
              {nft.price.toFixed(2)} ETH
            </span>

            {nft.originalPrice !== undefined && (
              <span className="text-xs text-muted-foreground line-through">
                {nft.originalPrice.toFixed(2)} ETH
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-muted">{nft.network}</p>
        </div>
      </Link>
    </article>
  );
}
