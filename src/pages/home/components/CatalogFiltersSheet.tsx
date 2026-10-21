import { useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { MenuIcon, SearchIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import { CatalogFilters } from './CatalogFilters'

/** Mobile-only: the sidebar filters collapse into this search bar + drawer. */
export function CatalogFiltersSheet({ onSearch }: { onSearch: (q: string) => void }) {
  const search = useSearch({ from: '/' })
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <div className="relative flex-1">
        <SearchIcon aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Explorar coleções"
          placeholder="Explorar coleções"
          defaultValue={search.q ?? ''}
          className="pl-10"
          onChange={(event) => onSearch(event.currentTarget.value)}
        />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Filtros">
            <MenuIcon aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <CatalogFilters />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
