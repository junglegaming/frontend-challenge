import { useEffect, useSyncExternalStore } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getStoredSession, subscribeSession } from '@/lib/session/storage';
import type { Nft } from '@/types/api';
import { catalogOptions } from '../queries';
import { useFavorites } from '@/features/favorites/queries';
import type { CatalogFilterState } from '../search-params';
import { openAuth } from '@/features/auth/navigation';
import { useRouter } from '@tanstack/react-router';
import { useSession } from '@/lib/session/state';

// Access route state without importing its module into the lazy page chunk.
const catalogRoute = getRouteApi('/');

export function useCatalog() {
  const router = useRouter();
  const filters = catalogRoute.useSearch();
  const navigate = catalogRoute.useNavigate();
  const { isHydrating } = useSession();
  const userId = useSyncExternalStore(
    subscribeSession,
    () => getStoredSession()?.user.id,
    () => undefined
  );
  const query = useQuery({
    ...catalogOptions(filters, userId),
    enabled: !filters.favoritesOnly || !!userId,
  });
  useEffect(() => {
    if (!isHydrating && !userId && filters.favoritesOnly) {
      void navigate({
        search: (previous) => ({
          ...previous,
          favoritesOnly: undefined,
          page: 1,
        }),
        replace: true,
      });
    }
  }, [isHydrating, userId, filters.favoritesOnly, navigate]);
  const { favorites, mutation } = useFavorites(userId);

  function onFiltersChange(next: Partial<CatalogFilterState>) {
    void navigate({
      search: (previous) => ({ ...previous, ...next, page: 1 }),
    });
  }

  function onFavorite(nft: Nft) {
    if (mutation.isPending) return;
    if (!userId) {
      void openAuth(router);
      return;
    }
    mutation.mutate({
      id: nft.id,
      token: getStoredSession()!.token,
      selected: favorites.data?.ids.includes(nft.id) ?? false,
    });
  }

  function onPageChange(page: number) {
    void navigate({ search: (previous) => ({ ...previous, page }) });
    document
      .getElementById('catalogo')
      ?.scrollIntoView({ behavior: 'instant' });
  }

  return {
    filters,
    query,
    favorites,
    userId,
    favoriteIds: favorites.data?.ids ?? [],
    isFavoritePending: mutation.isPending || (!!userId && !favorites.data),
    onFavorite,
    onFiltersChange,
    onPageChange,
    onSearch: (q: string) => onFiltersChange({ q: q || undefined }),
    onClear: () => {
      void navigate({ search: { sort: 'relevance', page: 1 } });
    },
    onRetry: () => {
      void query.refetch();
    },
    onFavoritesRetry: () => {
      void favorites.refetch();
    },
  };
}

export type CatalogController = ReturnType<typeof useCatalog>;
