import { queryOptions } from '@tanstack/react-query';

import { http } from '@/lib/http/client';
import { endpoints } from '@/lib/http/endpoints';
import { nftListResponseSchema } from '@/lib/http/schemas';

import { keyFactory } from '@/lib/query/keys';
import { queryClient } from '@/lib/query/client';
import { newestNft } from '@/lib/socket/nft-cache';
import type { CatalogFilterState } from './search-params';

export const CATALOG_PAGE_SIZE = 9;

export const catalogOptions = (filters: CatalogFilterState, userId?: string) =>
  queryOptions({
    queryKey: keyFactory.nfts.list(
      { ...filters, pageSize: CATALOG_PAGE_SIZE },
      userId
    ),
    queryFn: async ({ signal }) => {
      const result = nftListResponseSchema.parse(
        (
          await http.get<unknown>(endpoints.nfts, {
            params: { ...filters, pageSize: CATALOG_PAGE_SIZE },
            signal,
          })
        ).data
      );
      return {
        ...result,
        items: result.items.map((nft) => newestNft(queryClient, nft)),
      };
    },
  });
