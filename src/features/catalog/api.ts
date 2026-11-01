import { queryOptions } from '@tanstack/react-query'

import { getJson } from '@/shared/api/http-client'
import { queryKeys } from '@/shared/api/query-keys'
import { type NftListQuery, nftPageSchema, nftReviewsSchema, nftSchema } from '@/shared/contracts'

/**
 * Consulta paginada do catálogo. A query key inclui todos os parâmetros, o que
 * isola o cache por combinação de busca/filtros/ordenação/página.
 *
 * @param query - Parâmetros da listagem (validados a partir da URL).
 * @returns Opções do TanStack Query para o catálogo.
 */
export function nftsQueryOptions(query: NftListQuery) {
  return queryOptions({
    queryKey: queryKeys.nfts.list(query),
    // O signal cancela a requisição quando os filtros mudam: resposta antiga não sobrescreve a nova.
    queryFn: ({ signal }) => getJson(nftPageSchema, '/nfts', { params: query, signal }),
  })
}

/**
 * Consulta do detalhe de um NFT.
 *
 * @param id - Identificador do NFT.
 * @returns Opções do TanStack Query para o detalhe.
 */
export function nftQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.nfts.detail(id),
    queryFn: ({ signal }) => getJson(nftSchema, `/nfts/${id}`, { signal }),
  })
}

/**
 * Avaliações de um NFT (resumo e mais recentes).
 *
 * @param id - Identificador do NFT.
 * @returns Opções do TanStack Query para as avaliações.
 */
export function nftReviewsQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.nfts.reviews(id),
    queryFn: ({ signal }) => getJson(nftReviewsSchema, `/nfts/${id}/reviews`, { signal }),
  })
}
