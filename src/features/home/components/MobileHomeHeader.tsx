import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { CatalogSortOption } from "@/features/home/components/CatalogToolbar";

interface MobileHomeHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  minPrice: string;
  maxPrice: string;
  onApplyPrice: (min: string, max: string) => void;
  sort: CatalogSortOption;
  onSortChange: (value: CatalogSortOption) => void;
}

export function MobileHomeHeader({
  searchTerm,
  onSearchChange,
  minPrice,
  maxPrice,
  onApplyPrice,
  sort,
  onSortChange,
}: MobileHomeHeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyPrice(localMin, localMax);
    setIsFilterOpen(false);
  };

  const handleClear = () => {
    setLocalMin("");
    setLocalMax("");
    onApplyPrice("", "");
    setIsFilterOpen(false);
  };

  return (
    <header className="block lg:hidden px-4 pt-3 pb-1">
      {/* Search Bar + Filter Button */}
      <div className="flex items-center gap-2.5">
        {/* Search input container */}
        <div className="relative flex-1">
          <label htmlFor="mobile-search-input" className="sr-only">
            Explorar coleções
          </label>
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8a7265]"
            aria-hidden="true"
          />
          <input
            id="mobile-search-input"
            type="search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Explorar coleções"
            className="w-full h-11 rounded-xl bg-[#241612]/90 border border-[#3e2417] pl-10 pr-4 text-xs font-mono text-zinc-100 placeholder:text-[#8a7265] focus:outline-none focus:border-[#d4893f] transition-colors"
          />
        </div>

        {/* Filter button */}
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          aria-label="Abrir filtros de preço e ordenação"
          aria-expanded={isFilterOpen}
          className={`flex size-11 items-center justify-center rounded-xl bg-[#c88243] hover:bg-[#d4893f] text-[#140d0a] shadow-md transition-colors shrink-0 ${
            isFilterOpen ? "ring-2 ring-[#e29d5b]" : ""
          }`}
        >
          <SlidersHorizontal className="size-5" aria-hidden="true" />
        </button>
      </div>

      {/* Collapsible Mobile Filter Panel */}
      {isFilterOpen && (
        <div
          role="region"
          aria-label="Filtros do catálogo mobile"
          className="mt-3 rounded-2xl border border-[#3a2416] bg-[#241612] p-4 text-xs shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between border-b border-[#3a2416] pb-2 mb-3">
            <span className="font-bold text-zinc-100">Filtros e ordenação</span>
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              aria-label="Fechar filtros"
              className="text-zinc-400 hover:text-zinc-200"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleApply} className="space-y-4">
            {/* Price range */}
            <div>
              <span className="block text-[11px] font-bold text-zinc-200 mb-2">Faixa de preço (ETH)</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Mín"
                  value={localMin}
                  onChange={(e) => setLocalMin(e.target.value)}
                  className="h-8 rounded-lg bg-[#140d0a] border border-[#3a2416] px-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4893f]"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Máx"
                  value={localMax}
                  onChange={(e) => setLocalMax(e.target.value)}
                  className="h-8 rounded-lg bg-[#140d0a] border border-[#3a2416] px-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4893f]"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="mobile-sort-select" className="block text-[11px] font-bold text-zinc-200 mb-2">
                Ordenar por
              </label>
              <select
                id="mobile-sort-select"
                value={sort}
                onChange={(e) => onSortChange(e.target.value as CatalogSortOption)}
                className="w-full h-8 rounded-lg bg-[#140d0a] border border-[#3a2416] px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-[#d4893f]"
              >
                <option value="recent">Mais recentes</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="name-asc">Nome (A-Z)</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-[#d4893f] py-2 text-center text-xs font-bold text-[#140d0a] hover:bg-[#e09a52]"
              >
                Aplicar filtros
              </button>
              {(minPrice || maxPrice) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg border border-[#3a2416] px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Limpar
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
