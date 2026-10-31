import { useEffect, useState, type ReactNode } from "react";
import type { NFT } from "@/data/nfts";
import { CatalogPagination } from "./catalog-pagination";
import { NFTCard } from "@/components/ui/nft-card";

interface CatalogGridProps {
  nfts: NFT[];
  onResetFilters: () => void;
  sidebar: ReactNode;
  tabs: ReactNode;
}

const ITEMS_PER_PAGE = 9;

export function CatalogGrid({
  nfts,
  onResetFilters,
  sidebar,
  tabs,
}: CatalogGridProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(nfts.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [nfts]);

  const paginatedNFTs = nfts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (nfts.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div>{sidebar}</div>

        <section className="min-w-0 space-y-6">
          {tabs}

          <div className="flex min-h-60 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
            <h2 className="font-semibold text-[var(--color-text)]">
              Nenhum NFT encontrado
            </h2>

            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Tente alterar os filtros para encontrar outros NFTs.
            </p>

            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-on-primary)] transition-opacity hover:opacity-90"
            >
              Limpar filtros
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-0 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="min-w-0 lg:row-start-1">{sidebar}</div>

      <section className="min-w-0 space-y-6 lg:row-start-1">
        {tabs}

        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
          {paginatedNFTs.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      </section>

      {totalPages > 1 && (
        <div className="mt-8 lg:col-start-2 lg:row-start-2">
          <CatalogPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
