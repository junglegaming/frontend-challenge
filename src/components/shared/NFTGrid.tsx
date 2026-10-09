import type { Nft } from '@/types/api';
import { NFTCardSkeleton } from './NFTCardSkeleton';
import { NFTCard } from './NFTCard';

export function NFTGrid({
  items,
  loading,
  skeletonCount = 9,
}: {
  items: Nft[];
  loading: boolean;
  skeletonCount?: number;
}) {
  return (
    <div
      className="nft-grid grid grid-cols-1 gap-x-4 gap-y-6 min-[360px]:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-10 min-[360px]:max-md:[&>.nft-card:nth-child(even)]:transform-[translateY(32px)]"
      aria-label="NFTs do catálogo"
      aria-busy={loading}
    >
      {loading
        ? Array.from({ length: skeletonCount }, (_, index) => (
            <NFTCardSkeleton key={index} />
          ))
        : items.map((nft) => <NFTCard key={nft.id} nft={nft} />)}
    </div>
  );
}
