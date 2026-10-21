import { useNft } from '@/domains/catalog'
import { isApiError } from '@/shared/api/http'
import { NftDetailSkeleton } from './components/NftDetailSkeleton'
import { NftDetailView } from './components/NftDetailView'
import { NftLoadError } from './components/NftLoadError'
import { NftNotFound } from './components/NftNotFound'

export function NftDetailPage({ nftId }: { nftId: string }) {
  const query = useNft(nftId)

  if (query.isPending) return <NftDetailSkeleton />

  if (query.isError) {
    if (isApiError(query.error) && query.error.code === 'NOT_FOUND') return <NftNotFound />
    return <NftLoadError onRetry={() => void query.refetch()} />
  }

  return <NftDetailView nft={query.data} />
}
