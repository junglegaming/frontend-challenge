import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { catalogQueries } from '@/domains/catalog'
import { PageContainer } from '@/shared/ui/page-container'
import { CatalogFilters } from './components/CatalogFilters'
import { CatalogFiltersSheet } from './components/CatalogFiltersSheet'
import { CatalogPagination } from './components/CatalogPagination'
import { HeroBanner } from './components/HeroBanner'
import { NftGrid, NftGridEmpty, NftGridError, NftGridSkeleton } from './components/NftGrid'
import { SortBar } from './components/SortBar'

export function HomePage() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const catalog = useQuery(catalogQueries.search(search))

  function clearFilters() {
    void navigate({ search: {} })
  }

  function setQuery(q: string) {
    void navigate({ search: (prev) => ({ ...prev, q: q || undefined, page: undefined }) })
  }

  return (
    <PageContainer className="flex flex-col gap-8 py-8">
      <HeroBanner />

      <CatalogFiltersSheet onSearch={setQuery} />

      <div id="catalogo" className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <CatalogFilters />
        </aside>

        <div className="flex flex-col gap-6">
          <SortBar />

          {catalog.isPending && <NftGridSkeleton />}
          {catalog.isError && <NftGridError onRetry={() => catalog.refetch()} />}
          {catalog.data && catalog.data.items.length === 0 && <NftGridEmpty onClearFilters={clearFilters} />}
          {catalog.data && catalog.data.items.length > 0 && (
            <>
              <NftGrid items={catalog.data.items} />
              <CatalogPagination page={catalog.data.page} totalPages={catalog.data.totalPages} />
            </>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
