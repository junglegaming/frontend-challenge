import type { CatalogFilter, CatalogSort } from "../hooks/use-catalog";

interface CatalogTabsProps {
  activeFilter: CatalogFilter;
  sortBy: CatalogSort;
  onFilterChange: (filter: CatalogFilter) => void;
  onSortChange: (sort: CatalogSort) => void;
}

const filters: { value: CatalogFilter; label: string }[] = [
  { value: "all", label: "Todos os NFTs" },
  { value: "launch", label: "Novos lançamentos" },
  { value: "popular", label: "Em alta" },
];

export function CatalogTabs({
  activeFilter,
  sortBy,
  onFilterChange,
  onSortChange,
}: CatalogTabsProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border-b border-[var(--color-border)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full min-w-0 items-stretch gap-2 sm:w-auto sm:gap-1">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onFilterChange(filter.value)}
            className={`cursor-pointer min-w-0 flex-1 whitespace-nowrap border-b-2 px-0 py-3 text-center text-[6px] font-medium transition-colors min-[360px]:text-[7px] min-[400px]:text-[8px] sm:flex-none sm:shrink-0 sm:px-3 sm:text-sm ${
              activeFilter === filter.value
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <label className="hidden shrink-0 items-center gap-2 pb-3 text-sm text-[var(--color-text-muted)] sm:flex sm:pb-0">
        Ordenar por:
        <select
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as CatalogSort)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
        >
          <option value="recent">Recentes</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
        </select>
      </label>
    </div>
  );
}
