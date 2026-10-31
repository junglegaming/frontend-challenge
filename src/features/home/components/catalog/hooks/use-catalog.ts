import { useMemo, useState } from "react";
import { NFT_CATEGORIES, nfts } from "../../../../../data/nfts";

export type CatalogFilter = "all" | "launch" | "popular";
export type CatalogSort = "recent" | "price-asc" | "price-desc";

export function useCatalog() {
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>("all");
  const [sortBy, setSortBy] = useState<CatalogSort>("recent");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [maxPrice, setMaxPrice] = useState(15);

  const categories = useMemo(() => [...NFT_CATEGORIES], []);

  const networks = useMemo(
    () => [...new Set(nfts.map((nft) => nft.network))],
    [],
  );

  const filteredNFTs = useMemo(() => {
    const result = nfts.filter((nft) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "launch" && nft.launch) ||
        (activeFilter === "popular" && nft.originalPrice !== undefined);

      const matchesCategory =
        !selectedCategory || nft.category === selectedCategory;

      const matchesNetwork =
        !selectedNetwork || nft.network === selectedNetwork;

      const matchesPrice = nft.price <= maxPrice;

      return matchesFilter && matchesCategory && matchesNetwork && matchesPrice;
    });

    switch (sortBy) {
      case "price-asc":
        return result.sort((a, b) => a.price - b.price);

      case "price-desc":
        return result.sort((a, b) => b.price - a.price);

      default:
        return result;
    }
  }, [activeFilter, selectedCategory, selectedNetwork, maxPrice, sortBy]);

  return {
    nfts: filteredNFTs,
    categories,
    networks,
    activeFilter,
    setActiveFilter,
    sortBy,
    setSortBy,
    selectedCategory,
    setSelectedCategory,
    selectedNetwork,
    setSelectedNetwork,
    maxPrice,
    setMaxPrice,
  };
}
