import { createFileRoute } from '@tanstack/react-router';
import { nftDetailFilterSchema } from '@/features/nft-detail/search-params';
import { NftDetailPage } from '@/features/nft-detail/components/NftDetailPage';
export const Route = createFileRoute('/nfts/$nftId')({
  validateSearch: (search) => nftDetailFilterSchema.parse(search),
  component: NftDetailPage,
});
