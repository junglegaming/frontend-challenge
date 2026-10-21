import { useQuery } from '@tanstack/react-query'
import { useIsAuthenticated } from '@/shared/api/use-is-authenticated'
import { walletsQueries } from '../api/queries'

export function useWallets() {
  const authenticated = useIsAuthenticated()
  return useQuery({ ...walletsQueries.list(), enabled: authenticated })
}
