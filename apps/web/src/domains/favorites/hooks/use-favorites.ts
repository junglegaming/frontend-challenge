import { useQuery } from '@tanstack/react-query'
import { useIsAuthenticated } from '@/shared/api/use-is-authenticated'
import { favoritesQueries } from '../api/queries'

/** Favorites only exist for authenticated users; visitors get an empty, non-fetching result. */
export function useFavorites() {
  const authenticated = useIsAuthenticated()
  return useQuery({ ...favoritesQueries.list(), enabled: authenticated })
}
