import { queryOptions } from '@tanstack/react-query';
import { http } from '@/lib/http/client';
import { endpoints } from '@/lib/http/endpoints';
import { nftSchema, nftListResponseSchema } from '@/lib/http/schemas';
import { keyFactory } from '@/lib/query/keys';
import { queryClient } from '@/lib/query/client';
import { newestNft } from '@/lib/socket/nft-cache';

export const nftDetailOptions = (id: string) =>
  queryOptions({
    queryKey: keyFactory.nfts.detail(id),
    queryFn: async ({ signal }) =>
      newestNft(
        queryClient,
        nftSchema.parse(
          (await http.get<unknown>(endpoints.nft(id), { signal })).data
        )
      ),
    retry: (attempt, error) =>
      !(
        'status' in error &&
        typeof error.status === 'number' &&
        error.status < 500
      ) && attempt < 2,
  });

export const collectionOptions = (collection: string, userId?: string) => {
  const params = {
    q: collection,
    sort: 'relevance' as const,
    page: 1,
    pageSize: 48,
  };
  return queryOptions({
    queryKey: keyFactory.nfts.list(params, userId),
    queryFn: async ({ signal }) => {
      const result = nftListResponseSchema.parse(
        (await http.get<unknown>(endpoints.nfts, { params, signal })).data
      );
      return {
        ...result,
        items: result.items.map((nft) => newestNft(queryClient, nft)),
      };
    },
  });
};
