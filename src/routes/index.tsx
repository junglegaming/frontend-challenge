import { useEffect, useRef, useState } from 'react'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'

import { Search, SlidersHorizontal, X } from 'lucide-react'

import { nftsQueryOptions } from '@/features/catalog/api'
import { Blog } from '@/features/catalog/components/Blog'
import { FilterSidebar } from '@/features/catalog/components/FilterSidebar'
import { Hero } from '@/features/catalog/components/Hero'
import { NftGrid } from '@/features/catalog/components/NftGrid'
import { Pagination } from '@/features/catalog/components/Pagination'
import { Promos } from '@/features/catalog/components/Promos'
import { SortSelect } from '@/features/catalog/components/SortSelect'
import { favoritesQueryOptions } from '@/features/favorites/api'
import { useFavoriteToggle } from '@/features/favorites/use-favorite-toggle'
import { CatalogSkeleton } from '@/shared/components/skeletons/CatalogSkeleton'
import { DEFAULT_NFT_LIST_QUERY, type NftListQuery, nftListQuerySchema } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { useBodyScrollLock } from '@/shared/lib/useBodyScrollLock'
import { useFocusTrap } from '@/shared/lib/useFocusTrap'

export const Route = createFileRoute('/')({
  // URL inválida não deve derrubar a tela: aplica os padrões do catálogo.
  validateSearch: (search: Record<string, unknown>): NftListQuery => {
    const parsed = nftListQuerySchema.safeParse(search)
    return parsed.success ? parsed.data : DEFAULT_NFT_LIST_QUERY
  },
  search: {
    // Mantém a URL limpa: / em vez de /?page=1&pageSize=9.
    middlewares: [stripSearchParams({ page: 1, pageSize: 9 })],
  },
  component: HomePage,
})

function HomePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const filtersDialogRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(isMobileFiltersOpen)
  useFocusTrap(filtersDialogRef, isMobileFiltersOpen)

  useEffect(() => {
    if (!isMobileFiltersOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsMobileFiltersOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileFiltersOpen])

  // Ao trocar filtros, o resultado anterior fica visível enquanto o novo carrega.
  const catalog = useQuery({ ...nftsQueryOptions(search), placeholderData: keepPreviousData })
  const facets = catalog.data?.facets
  const favorites = useQuery(favoritesQueryOptions())
  const { toggleFavorite } = useFavoriteToggle()

  const favoriteIds = new Set(favorites.data?.items.map((item) => item.nftId) ?? [])

  function updateSearch(patch: Partial<NftListQuery>) {
    navigate({ search: (prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }) })
  }

  function handleToggleFavorite(nftId: string, favorite: boolean) {
    toggleFavorite(nftId, favorite)
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 pt-10 pb-8 sm:px-6 md:gap-[96px] md:px-6 md:pt-0 md:pb-0 xl:px-0">
      {/* Mobile Search Bar: 366px x 45px (Figma Mobile / Início) */}
      <div className="mx-auto flex w-full max-w-[366px] items-center gap-2 lg:hidden">
        {/* Frame 404: Search Input */}
        <div className="flex h-[45px] flex-1 items-center gap-2 rounded-[10px] bg-[#241612] px-3.5">
          <Search className="size-[18px] shrink-0 text-[#B39463]" strokeWidth={2.5} />
          <input
            type="search"
            value={search.q ?? ''}
            onChange={(e) => updateSearch({ q: e.target.value })}
            placeholder="Explorar coleções"
            aria-label="Explorar coleções"
            className="w-full bg-transparent font-mono text-[14px] font-bold leading-4 text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none"
          />
        </div>

        {/* Frame 402: Filter Button with Sliders Icon */}
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(true)}
          aria-label="Abrir filtros"
          className="flex size-[45px] shrink-0 cursor-pointer items-center justify-center rounded-[14px] shadow-sm transition-transform active:scale-95"
          style={{
            background: 'linear-gradient(137.05deg, rgba(210, 138, 76, 0.45) -24.6%, #D28A4C 100%)',
          }}
        >
          <SlidersHorizontal className="size-5 text-[#140D0A]" strokeWidth={2.5} />
        </button>
      </div>

      {/* Hero Banner (Mobile & Desktop) */}
      <Hero />

      {/* Mobile Tabs: Todos os NFTs / Novos lançamentos / Em alta */}
      <div className="mx-auto flex w-full max-w-[366px] items-center gap-4 overflow-x-auto pb-1 font-mono text-[14px] leading-4 scrollbar-none md:hidden">
        <button
          type="button"
          onClick={() => updateSearch({ sort: undefined })}
          className={cn(
            'relative cursor-pointer py-1 whitespace-nowrap transition-colors',
            !search.sort ? 'font-bold text-[#E89B55]' : 'font-normal text-[#F5F1EB]',
          )}
        >
          Todos os NFTs
          {!search.sort && (
            <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#D28A4C]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => updateSearch({ sort: 'newest' })}
          className={cn(
            'cursor-pointer py-1 whitespace-nowrap transition-colors',
            search.sort === 'newest' ? 'font-bold text-[#E89B55]' : 'font-normal text-[#F5F1EB]',
          )}
        >
          Novos lançamentos
        </button>
        <button
          type="button"
          onClick={() => updateSearch({ sort: 'price_desc' })}
          className={cn(
            'cursor-pointer py-1 whitespace-nowrap transition-colors',
            search.sort === 'price_desc'
              ? 'font-bold text-[#E89B55]'
              : 'font-normal text-[#F5F1EB]',
          )}
        >
          Em alta
        </button>
      </div>

      {/* Mobile Filter Modal */}
      {isMobileFiltersOpen && (
        <div
          ref={filtersDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Filtros de coleções e redes"
          className="fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto overscroll-contain bg-[#140D0A]/95 p-6 backdrop-blur-md lg:hidden"
        >
          <div>
            <div className="flex items-center justify-between border-b border-[#3F2319] pb-4">
              <h3 className="font-mono text-lg font-bold text-[#F5F1EB]">Filtros</h3>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-[#241612] text-[#F5F1EB]"
                aria-label="Fechar filtros"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="py-4">
              <FilterSidebar
                facets={facets}
                hideBanner
                namePrefix="mobile"
                searchQuery={search.q ?? ''}
                onSearchChange={(q) => updateSearch({ q })}
                value={{
                  collection: search.collection,
                  network: search.network,
                  priceMin: search.priceMin,
                  priceMax: search.priceMax,
                }}
                onChange={(patch) => updateSearch(patch)}
              />
            </div>
          </div>

          <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 border-t border-[#3F2319] bg-[#140D0A]/95 p-4 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="flex h-[45px] w-full cursor-pointer items-center justify-center rounded-[6px] bg-primary font-mono text-[16px] font-bold text-ink shadow-button transition-colors hover:bg-highlight"
            >
              Ver resultados
            </button>
          </div>
        </div>
      )}

      <section id="catalogo-section" aria-labelledby="catalogo" className="relative">
        <h2 id="catalogo" className="sr-only">
          Catálogo
        </h2>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block">
            <FilterSidebar
              facets={facets}
              namePrefix="desktop"
              searchQuery={search.q ?? ''}
              onSearchChange={(q) => updateSearch({ q })}
              value={{
                collection: search.collection,
                network: search.network,
                priceMin: search.priceMin,
                priceMax: search.priceMax,
              }}
              onChange={(patch) => updateSearch(patch)}
            />
          </div>

          {/* Product Grid: 842px wide, gap: 88px to Pagination */}
          <div className="flex w-full min-w-0 flex-1 flex-col items-end gap-8 sm:gap-12 lg:gap-[88px] xl:w-[842px] xl:shrink-0">
            {/* Frame 233: 842px wide, gap: 32px */}
            <div className="flex w-full flex-col items-start gap-8">
              {/* Desktop Toolbar: 842px x 18px */}
              <div className="hidden w-full flex-wrap items-center justify-between gap-x-4 gap-y-5 md:flex">
                {/* Tabs: 376px x 16px, gap: 20px */}
                <nav
                  aria-label="Abas do catálogo"
                  className="relative flex items-center gap-5 font-mono text-[15px] font-medium leading-4 whitespace-nowrap"
                >
                  {[
                    { label: 'Todos os NFTs', sort: undefined, active: !search.sort },
                    {
                      label: 'Novos lançamentos',
                      sort: 'newest' as const,
                      active: search.sort === 'newest',
                    },
                    {
                      label: 'Em alta',
                      sort: 'price_desc' as const,
                      active: search.sort === 'price_desc',
                    },
                  ].map((tab) => (
                    <button
                      key={tab.label}
                      type="button"
                      aria-pressed={tab.active}
                      onClick={() => updateSearch({ sort: tab.sort })}
                      className={cn(
                        'relative cursor-pointer py-1 transition-colors duration-150',
                        tab.active
                          ? 'font-bold text-highlight'
                          : 'text-foreground hover:text-highlight',
                      )}
                    >
                      {tab.label}
                      {tab.active && (
                        <span className="absolute -bottom-[10px] left-0 h-[2px] w-full bg-primary" />
                      )}
                    </button>
                  ))}
                </nav>

                <div className="ml-auto flex items-center gap-4">
                  {/* Entre md e lg a sidebar não cabe; os filtros abrem no mesmo modal do mobile. */}
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(true)}
                    aria-haspopup="dialog"
                    className="inline-flex h-[35px] cursor-pointer items-center gap-2 rounded-[6px] border border-primary px-3 font-mono text-[15px] leading-4 font-medium text-highlight transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
                  >
                    <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={2.5} />
                    Filtros
                  </button>
                  <SortSelect value={search.sort} onChange={(sort) => updateSearch({ sort })} />
                </div>
              </div>

              <p role="status" className="sr-only">
                {catalog.isPlaceholderData ? 'Atualizando resultados…' : ''}
              </p>
              {catalog.isLoading ? (
                <CatalogSkeleton />
              ) : catalog.isError ? (
                <div
                  role="alert"
                  className="w-full rounded-[16px] border border-error/40 bg-error/10 p-6 text-sm"
                >
                  <p className="font-mono text-base font-bold text-foreground">
                    Não foi possível carregar o catálogo.
                  </p>
                  <p className="mt-1 font-mono text-xs text-text-secondary">
                    Ocorreu uma falha na conexão ou os parâmetros da busca precisam ser restaurados.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void catalog.refetch()}
                      className="cursor-pointer rounded-[5px] bg-primary px-4 py-2 font-mono text-sm font-bold text-ink transition-colors hover:bg-highlight"
                    >
                      Tentar novamente
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate({ to: '/', search: DEFAULT_NFT_LIST_QUERY })}
                      className="cursor-pointer rounded-[5px] border border-primary px-4 py-2 font-mono text-sm font-medium text-highlight transition-colors hover:bg-primary/10"
                    >
                      Limpar busca e filtros
                    </button>
                  </div>
                </div>
              ) : catalog.data && catalog.data.items.length === 0 ? (
                <div
                  role="status"
                  className="w-full rounded-[16px] border border-border bg-card p-6 text-sm text-muted-foreground"
                >
                  Nenhum NFT encontrado com esses filtros.
                </div>
              ) : catalog.data ? (
                <div
                  aria-busy={catalog.isPlaceholderData}
                  className={cn(
                    'w-full transition-opacity',
                    catalog.isPlaceholderData && 'opacity-60',
                  )}
                >
                  <NftGrid
                    nfts={catalog.data.items}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              ) : null}
            </div>

            {catalog.data && catalog.data.pagination.totalPages > 1 ? (
              <div className="flex w-full justify-center pt-2 pb-6 md:py-0 lg:justify-end">
                <Pagination
                  pagination={catalog.data.pagination}
                  onChange={(page) => updateSearch({ page })}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="hidden md:flex md:flex-col md:gap-[96px]">
        <Promos />
        <Blog />
      </div>
    </div>
  )
}
