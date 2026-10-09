import { SearchInput } from '@/components/shared/SearchInput';
import { FilterBar } from './FilterBar';
import type { CatalogControlsProps } from '../types';

export function CatalogSidebar({
  filters,
  onChange,
  onSearch,
  facets,
  loading,
  failed,
  onRetry,
}: CatalogControlsProps) {
  const filterKey = JSON.stringify([filters.minPrice, filters.maxPrice]);
  return (
    <aside className="hidden md:block" aria-label="Filtros do catálogo">
      <div className="mb-5 md:hidden">
        <SearchInput value={filters.q ?? ''} onSearch={onSearch} />
      </div>
      <FilterBar
        key={filterKey}
        filters={filters}
        onChange={onChange}
        facets={facets}
        loading={loading}
        failed={failed}
        onRetry={onRetry}
      />
      <div className="bg-surface-card mt-6">
        <h2 className="text-h2 text-text-accent px-5 pt-6 font-bold">
          NFT EM DESTAQUE
        </h2>
        <p className="text-title mt-4 text-center font-bold">OFERTA LIMITADA</p>
        <img
          src="/assets/nft/sage-nomad-009.png"
          alt="Sage Nomad, NFT em destaque"
          className="mt-4 h-92 w-full rounded-[22px] object-cover"
          width={310}
          height={368}
        />
      </div>
    </aside>
  );
}
