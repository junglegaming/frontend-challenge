import { HeroSection } from "@/features/home/components/hero-section";
import { nfts as allNFTs } from "../../data/nfts";
import { CatalogGrid } from "./components/catalog/components/catalog-grid";
import { CatalogSidebar } from "./components/catalog/components/catalog-sidebar";
import { CatalogTabs } from "./components/catalog/components/catalog-tabs";
import { useCatalog } from "./components/catalog/hooks/use-catalog";

export function HomePage() {
  const catalog = useCatalog();

  const featuredNFT = allNFTs.find((nft) => nft.id === "sage-nomad-009");

  function resetFilters() {
    catalog.setActiveFilter("all");
    catalog.setSelectedCategory("");
    catalog.setSelectedNetwork("");
    catalog.setMaxPrice(15);
    catalog.setSortBy("recent");
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10">
        <HeroSection />
      </div>

      <CatalogGrid
        nfts={catalog.nfts}
        onResetFilters={resetFilters}
        sidebar={
          <CatalogSidebar
            categories={catalog.categories}
            networks={catalog.networks}
            selectedCategory={catalog.selectedCategory}
            selectedNetwork={catalog.selectedNetwork}
            maxPrice={catalog.maxPrice}
            onCategoryChange={catalog.setSelectedCategory}
            onNetworkChange={catalog.setSelectedNetwork}
            onMaxPriceChange={catalog.setMaxPrice}
            featuredNFT={featuredNFT}
          />
        }
        tabs={
          <CatalogTabs
            activeFilter={catalog.activeFilter}
            onFilterChange={catalog.setActiveFilter}
            sortBy={catalog.sortBy}
            onSortChange={catalog.setSortBy}
          />
        }
      />
    </main>
  );
}

export default HomePage;
