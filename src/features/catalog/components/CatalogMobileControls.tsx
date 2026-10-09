import { SearchInput } from '@/components/shared/SearchInput';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FilterBar } from './FilterBar';
import type { CatalogControlsProps } from '../types';
import { FilterButton } from '@/components/ui/filter-button';

export function CatalogMobileControls({
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
    <div className="catalog-mobile-search mb-4 flex gap-2 md:hidden">
      <SearchInput value={filters.q ?? ''} onSearch={onSearch} />
      <Sheet>
        <SheetTrigger asChild>
          <FilterButton />
        </SheetTrigger>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>
              Combine coleções e preços para explorar NFTs.
            </SheetDescription>
          </SheetHeader>
          <FilterBar
            key={filterKey}
            filters={filters}
            onChange={onChange}
            facets={facets}
            loading={loading}
            failed={failed}
            onRetry={onRetry}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
