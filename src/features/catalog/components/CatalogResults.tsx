import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { NFTGrid } from '@/components/shared/NFTGrid';
import { Pagination } from '@/components/shared/Pagination';
import { CATALOG_PAGE_SIZE } from '../queries';
import type { CatalogController } from '../hooks/useCatalog';
import { CatalogToolbar } from './CatalogToolbar';

export function CatalogResults({ catalog }: { catalog: CatalogController }) {
  const { query, filters, favorites } = catalog;
  return (
    <div className="min-w-0">
      <CatalogToolbar
        sort={filters.sort}
        onSortChange={(sort) => catalog.onFiltersChange({ sort })}
      />
      {query.isError && (
        <ErrorState
          title="Erro ao carregar NFTs"
          description="Não foi possível carregar o catálogo. Tente novamente."
          onRetry={catalog.onRetry}
        />
      )}
      {!query.isPending && !query.isError && query.data.items.length === 0 && (
        <EmptyState
          title={
            filters.favoritesOnly
              ? 'Nenhum favorito encontrado'
              : 'Nenhum NFT encontrado'
          }
          description={
            filters.favoritesOnly
              ? 'Favorite NFTs ou remova os filtros para ver mais resultados.'
              : 'Experimente outra busca ou remova os filtros.'
          }
          actionLabel="Limpar filtros"
          onAction={catalog.onClear}
        />
      )}
      {!query.isError && (
        <div
          className={query.isFetching && !query.isPending ? 'opacity-70' : ''}
        >
          <NFTGrid
            items={query.data?.items ?? []}
            loading={query.isPending}
            skeletonCount={CATALOG_PAGE_SIZE}
          />
        </div>
      )}
      {favorites.isError && catalog.userId && (
        <ErrorState
          variant="compact"
          title="Não foi possível carregar seus favoritos."
          actionLabel="Recarregar favoritos"
          onRetry={catalog.onFavoritesRetry}
        />
      )}
      {query.data && query.data.total > 0 && (
        <Pagination
          page={filters.page}
          total={query.data.total}
          pageSize={query.data.pageSize}
          onChange={catalog.onPageChange}
        />
      )}
    </div>
  );
}
