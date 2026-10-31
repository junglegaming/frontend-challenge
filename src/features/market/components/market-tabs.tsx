import type { NFT } from "@/data/nfts";
import { useState } from "react";
import { NFTDetails } from "./nft-details";
import { NFTReviews } from "./nft-reviews";

interface MarketTabsProps {
  nft: NFT;
}

type MarketTab = "details" | "reviews";

export function MarketTabs({ nft }: MarketTabsProps) {
  const [activeTab, setActiveTab] = useState<MarketTab>("details");

  return (
    <section className="mt-12 hidden w-full min-w-0 sm:block">
      <div className="flex gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`border-b-2 px-1 pb-3 text-sm ${
            activeTab === "details"
              ? "border-primary font-bold text-primary"
              : "border-transparent text-muted"
          }`}
        >
          Detalhes do NFT
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`border-b-2 px-1 pb-3 text-sm ${
            activeTab === "reviews"
              ? "border-primary font-bold text-primary"
              : "border-transparent text-muted"
          }`}
        >
          Avaliações de colecionadores ({nft.reviewCount})
        </button>
      </div>

      {activeTab === "details" ? (
        <NFTDetails nft={nft} />
      ) : (
        <NFTReviews nft={nft} />
      )}
    </section>
  );
}
