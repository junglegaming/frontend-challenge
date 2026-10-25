import { api } from '@/api/client'
import { nftListResponseSchema, nftSchema, type Nft, type NftListParams, type NftListResponse } from '@/schemas/nft'

export const nftService = {
  async list(params: NftListParams, signal?: AbortSignal): Promise<NftListResponse> {
    const { data } = await api.get('/nfts', { params, signal })
    return nftListResponseSchema.parse(data)
  },
  async get(nftId: string, signal?: AbortSignal): Promise<Nft> {
    const { data } = await api.get(`/nfts/${encodeURIComponent(nftId)}`, { signal })
    return nftSchema.parse(data)
  },
}
