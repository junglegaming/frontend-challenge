import { SortSelect } from '@/components/shared/SortSelect';
import { CatalogButton } from '@/components/ui/catalog-button';
import type { CatalogFilterState } from '../search-params';

interface CatalogToolbarProps {
  sort: CatalogFilterState['sort'];
  onSortChange: (sort: CatalogFilterState['sort']) => void;
}

const sortOptions = [
  ['relevance', 'Todos os NFTs'],
  ['recent', 'Novos lançamentos'],
  ['popular', 'Em alta'],
] as const;

export function CatalogToolbar({ sort, onSortChange }: CatalogToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4 md:mb-8">
      <div role="group" aria-label="Seleção de catálogo" className="flex gap-4">
        {sortOptions.map(([optionSort, label]) => (
          <CatalogButton
            key={optionSort}
            active={sort === optionSort}
            onClick={() => onSortChange(optionSort)}
          >
            {label}
          </CatalogButton>
        ))}
      </div>
      <SortSelect value={sort} onChange={onSortChange} />
    </div>
  );
}
