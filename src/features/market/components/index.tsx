import type { NFT } from "@/data/nfts";
import { MarketGallery } from "./market-gallery";
import { MarketInfo } from "./market-info";
import { MarketTabs } from "./market-tabs";

interface MarketSectionProps {
  nft: NFT;
}

export function MarketSection({ nft }: MarketSectionProps) {
  return (
    <div className="min-w-0">
      <section className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8">
        <MarketGallery nft={nft} />

        <MarketInfo nft={nft} />
      </section>

      <MarketTabs nft={nft} />
    </div>
  );
}
