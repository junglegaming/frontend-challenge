import { useQuery } from '@tanstack/react-query'
import { catalogQueries } from '../api/queries'

export function useNft(nftId: string) {
  return useQuery(catalogQueries.detail(nftId))
}
