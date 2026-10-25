import { useCallback } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'
import { useCatalogSearch } from './useCatalogSearch'

interface CatalogSearchBarProps {
  activeFilters: number
  onOpenFilters: () => void
}

/** Busca + botão de filtros do topo da home no mobile (no desktop a busca fica na lupa do header). */
export function CatalogSearchBar({ activeFilters, onOpenFilters }: CatalogSearchBarProps) {
  const { search, update } = useCatalogSearch()
  const apply = useCallback((q: string) => update({ q: q || undefined }, { replace: true }), [update])
  const { value, setValue, commit } = useDebouncedSearch(search.q ?? '', apply)

  return (
    <form
      role="search"
      aria-label="Buscar no catálogo"
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        commit()
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-[22px] -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="catalog-search" className="sr-only">
          Explorar coleções
        </label>
        <Input
          id="catalog-search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Explorar coleções"
          className="h-[45px] rounded-full border-0 bg-card pr-4 pl-10 text-sm placeholder:text-subtle"
          autoComplete="off"
          maxLength={80}
        />
      </div>
      <Button
        type="button"
        onClick={onOpenFilters}
        className="relative size-[45px] shrink-0 rounded-xl p-0 md:hidden"
        aria-label={activeFilters > 0 ? `Abrir filtros, ${activeFilters} ativos` : 'Abrir filtros'}
      >
        <SlidersHorizontal className="size-[22px]" aria-hidden="true" />
        {activeFilters > 0 && (
          <span
            className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-background px-1 text-[10px] leading-4 font-bold text-foreground"
            aria-hidden="true"
          >
            {activeFilters}
          </span>
        )}
      </Button>
    </form>
  )
}
