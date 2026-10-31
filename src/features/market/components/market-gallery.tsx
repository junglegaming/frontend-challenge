import type { NFT } from "@/data/nfts";
import { nfts } from "@/data/nfts";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MarketSidebar } from "./market-sidebar";

interface MarketGalleryProps {
  nft: NFT;
}

export function MarketGallery({ nft }: MarketGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(nft.image);

  useEffect(() => {
    setSelectedImage(nft.image);
  }, [nft.id, nft.image]);

  const images = useMemo(
    () =>
      [...nfts]
        .filter((item) => item.id !== nft.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          image: item.image,
        })),
    [nft.id],
  );

  return (
    <div className="flex w-full min-w-0 items-stretch justify-center gap-2 sm:gap-3">
      <div className="flex w-full min-w-0 items-stretch justify-center gap-2 sm:gap-3">
        <MarketSidebar
          nftId={nft.id}
          nftName={nft.name}
          images={images}
          selectedImage={selectedImage}
          onSelectImage={setSelectedImage}
        />

        <div className="relative aspect-square w-full min-w-0 max-w-[474px] overflow-hidden rounded-card bg-surface p-2 sm:p-3">
          <img
            src={selectedImage}
            alt={nft.name}
            draggable={false}
            className="size-full rounded-card object-cover"
          />

          <div className="absolute right-3 top-3 rounded-full bg-background/80 p-2 text-foreground sm:right-5 sm:top-5">
            <Search size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
