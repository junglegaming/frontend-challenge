import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { NftCard } from '@/components/common/NftCard'
import { NftCardSkeleton } from '@/components/common/NftCardSkeleton'
import { CatalogBlog } from '@/components/catalog/CatalogBlog'
import { CatalogFilters, CatalogFiltersSkeleton } from '@/components/catalog/CatalogFilters'
import { CatalogPagination } from '@/components/catalog/CatalogPagination'
import { CatalogPromos } from '@/components/catalog/CatalogPromos'
import { CatalogSearchBar } from '@/components/catalog/CatalogSearchBar'
import { CatalogSort } from '@/components/catalog/CatalogSort'
import { CatalogTabs } from '@/components/catalog/CatalogTabs'
import { FeaturedNftCard } from '@/components/catalog/FeaturedNftCard'
import { HeroBanner } from '@/components/catalog/HeroBanner'
import { useCatalogSearch } from '@/components/catalog/useCatalogSearch'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useNfts } from '@/hooks/useNfts'
import { nftListParamsSchema, type NftTab, type NftSummary } from '@/schemas/nft'

export const Route = createFileRoute('/')({
  validateSearch: nftListParamsSchema,
  component: Page,
})

function Page() {
  const { search, update, reset } = useCatalogSearch()
  const isDesktop = useIsDesktop()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const query = useNfts({ ...search, pageSize: search.pageSize ?? 9 })
  const data = query.data
  const tab = search.tab ?? 'all'
  const activeFilters =
    (search.collections?.length ?? 0) + (search.networks?.length ?? 0) + (search.minPrice || search.maxPrice ? 1 : 0)
  const loading = query.isPlaceholderData || (query.isPending && !data)
  const featured = data?.items.find((item) => item.compareAtPrice !== null) ?? data?.items[0]

  useEffect(() => {
    if (!data || data.totalPages === 0) return
    if (data.page <= data.totalPages) return
    update({ page: undefined }, { keepPage: true, replace: true })
  }, [data, update])

  const changeTab = (next: NftTab) => update({ tab: next === 'all' ? undefined : next })

  return (
    <PageContainer className="px-6 pt-10 md:px-6 md:pt-0 xl:px-0">
      <div className="mb-4 md:hidden">
        <CatalogSearchBar activeFilters={activeFilters} onOpenFilters={() => setFiltersOpen(true)} />
      </div>

      <HeroBanner />

      <div id="busca" className="scroll-mt-6" />
      <section id="catalogo" aria-labelledby="catalog-title" className="mt-4 scroll-mt-6 md:mt-24">
        <h2 id="catalog-title" className="sr-only">
          Catálogo de NFTs
        </h2>
        <div className="grid gap-10 md:grid-cols-[260px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12">
          <aside className="hidden flex-col gap-6 md:flex" aria-label="Filtros do catálogo">
            {query.isPending && !data && (
              <>
                <div className="bg-card px-4 pt-4 pb-7">
                  <CatalogFiltersSkeleton />
                </div>
                <SkeletonFeatured />
              </>
            )}
            {data && (
              <>
                <div className="bg-card px-4 pt-4 pb-7">
                  <CatalogFilters facets={data.facets} />
                </div>
                {featured && <FeaturedNftCard nft={featured} />}
              </>
            )}
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-5 md:mb-6 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-10 md:gap-y-4 xl:flex-nowrap">
              <CatalogTabs value={tab} onChange={changeTab} />
              <CatalogSort
                value={search.sort ?? 'recent'}
                onChange={(sort) => update({ sort: sort === 'recent' ? undefined : sort })}
                className="hidden md:flex"
              />
            </div>

            <div className="sr-only" aria-live="polite">
              {loading ? 'Carregando NFTs…' : ''}
            </div>

            {loading && (
              isDesktop ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:gap-y-12 lg:grid-cols-3 lg:gap-x-[34px] lg:gap-y-[72px]">
                  {Array.from({ length: 9 }, (_, index) => (
                    <NftCardSkeleton key={index} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex items-start gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-6">
                    {Array.from({ length: 5 }, (_, index) => (
                      <NftCardSkeleton key={index} />
                    ))}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-6 pt-8">
                    {Array.from({ length: 4 }, (_, index) => (
                      <NftCardSkeleton key={index} />
                    ))}
                  </div>
                </div>
              )
            )}

            {query.isError && !data && (
              <ErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />
            )}

            {query.isError && data && (
              <div className="mb-6">
                <ErrorState
                  error={query.error}
                  title="Não foi possível atualizar o catálogo"
                  onRetry={() => query.refetch()}
                  isRetrying={query.isFetching}
                />
              </div>
            )}

            {!loading && data && data.items.length === 0 && (
              <EmptyState
                title="Nenhum NFT encontrado"
                description="Ajuste a busca ou os filtros para descobrir outras obras."
                action={
                  <Button
                    onClick={() => {
                      reset()
                      setFiltersOpen(false)
                    }}
                  >
                    Limpar filtros
                  </Button>
                }
              />
            )}

            {!loading && data && data.items.length > 0 && (
              <>
                {isDesktop ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:gap-y-12 lg:grid-cols-3 lg:gap-x-[34px] lg:gap-y-[72px]">
                    {data.items.map((nft, index) => (
                      <NftCard key={nft.id} nft={nft} priority={index < 3} />
                    ))}
                  </div>
                ) : (
                  <MasonryGrid items={data.items} />
                )}
                <CatalogPagination
                  page={data.page}
                  totalPages={data.totalPages}
                  onChange={(page) => update({ page: page === 1 ? undefined : page }, { keepPage: true })}
                />
              </>
            )}
          </div>
        </div>
      </section>

      <CatalogPromos />
      <CatalogBlog />

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="overflow-y-auto bg-card">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="text-lg font-bold">Filtros</SheetTitle>
            <SheetDescription>Refine o catálogo por coleção, preço e rede.</SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-4">
            {data ? <CatalogFilters facets={data.facets} showSort /> : <CatalogFiltersSkeleton />}
          </div>
          <SheetFooter className="sticky bottom-0 border-t border-border bg-card p-6">
            <Button onClick={() => setFiltersOpen(false)}>Ver resultados</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
  )
}

/** Grade masonry de duas colunas do Figma mobile: a direita começa 32px mais abaixo. */
function MasonryGrid({ items }: { items: NftSummary[] }) {
  const left = items.filter((_, index) => index % 2 === 0)
  const right = items.filter((_, index) => index % 2 === 1)

  return (
    <div className="mt-4 flex items-start gap-4 md:hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* primeira dobra do mobile: os 2 primeiros de cada coluna (o LCP costuma ser um deles) */}
        {left.map((nft, index) => (
          <NftCard key={nft.id} nft={nft} priority={index < 2} />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-6 pt-8">
        {right.map((nft, index) => (
          <NftCard key={nft.id} nft={nft} priority={index < 2} />
        ))}
      </div>
    </div>
  )
}

function SkeletonFeatured() {
  return (
    <div className="pt-6" aria-hidden="true">
      <Skeleton className="mx-5 h-8 w-44" />
      <Skeleton className="mx-auto mt-4 h-4 w-36" />
      <Skeleton className="mt-4 aspect-[310/368] w-full rounded-2xl" />
    </div>
  )
}
