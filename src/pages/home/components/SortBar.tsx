import { useNavigate, useSearch } from '@tanstack/react-router'
import { CATALOG_SORTS, SORT_LABELS, type CatalogSort } from '@/domains/catalog'
import { Button } from '@/shared/ui/button'
import { Select } from '@/shared/ui/select'

const QUICK_FILTERS: { id: string; label: string; sort?: CatalogSort }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'recent', label: 'Novos lançamentos', sort: 'recent' },
  { id: 'trending', label: 'Em alta', sort: 'price_desc' },
]

export function SortBar() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const activeFilter = QUICK_FILTERS.find((filter) => filter.sort === search.sort)?.id ?? 'all'

  function setSort(sort: CatalogSort | undefined) {
    void navigate({ search: (prev) => ({ ...prev, sort, page: undefined }) })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div role="group" aria-label="Filtro rápido do catálogo" className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => (
          <Button
            key={filter.id}
            type="button"
            variant={filter.id === activeFilter ? 'default' : 'ghost'}
            size="sm"
            aria-pressed={filter.id === activeFilter}
            onClick={() => setSort(filter.sort)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-body text-muted-foreground">
        Ordenar por
        <Select aria-label="Ordenar por" value={search.sort ?? 'recent'} onChange={(event) => setSort(event.currentTarget.value as CatalogSort)}>
          {CATALOG_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </Select>
      </label>
    </div>
  )
}
