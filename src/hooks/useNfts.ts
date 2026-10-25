import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import type { NftListParams } from '@/schemas/nft'
import { nftService } from '@/services/nfts'
import { queryKeys } from './query-keys'

const nftsQueryOptions = (params: NftListParams) =>
  queryOptions({
    queryKey: queryKeys.nfts(params),
    queryFn: ({ signal }) => nftService.list(params, signal),
    placeholderData: keepPreviousData,
  })

const nftQueryOptions = (nftId: string) =>
  queryOptions({
    queryKey: queryKeys.nft(nftId),
    queryFn: ({ signal }) => nftService.get(nftId, signal),
  })

/** Respostas obsoletas: o `signal` cancela a requisição anterior e cada combinação de filtros tem sua própria chave. */
export function useNfts(params: NftListParams) {
  return useQuery(nftsQueryOptions(params))
}

export function useNft(nftId: string) {
  return useQuery(nftQueryOptions(nftId))
}
