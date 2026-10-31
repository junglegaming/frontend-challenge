import { FeaturedNFT } from "@/components/ui/featured-nft";
import type { NFT } from "@/data/nfts";
import { CatalogCategories } from "./catalog-categories";

interface CatalogSidebarProps {
  categories: string[];
  networks: string[];
  selectedCategory: string;
  selectedNetwork: string;
  maxPrice: number;
  onCategoryChange: (category: string) => void;
  onNetworkChange: (network: string) => void;
  onMaxPriceChange: (price: number) => void;
  featuredNFT: NFT | undefined;
}

export function CatalogSidebar({
  categories,
  networks,
  selectedCategory,
  selectedNetwork,
  maxPrice,
  onCategoryChange,
  onNetworkChange,
  onMaxPriceChange,
  featuredNFT,
}: CatalogSidebarProps) {
  return (
    <aside className="hidden h-full flex-col gap-6 md:flex">
      <CatalogCategories
        categories={categories}
        networks={networks}
        selectedCategory={selectedCategory}
        selectedNetwork={selectedNetwork}
        maxPrice={maxPrice}
        onCategoryChange={onCategoryChange}
        onNetworkChange={onNetworkChange}
        onMaxPriceChange={onMaxPriceChange}
      />

      {featuredNFT && (
        <div className="flex min-h-0 flex-1 flex-col">
          <FeaturedNFT nft={featuredNFT} />
        </div>
      )}
    </aside>
  );
}
