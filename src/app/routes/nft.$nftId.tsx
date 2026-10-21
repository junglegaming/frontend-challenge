import { createFileRoute } from '@tanstack/react-router'
import { NftDetailPage } from '@/pages/nft-detail'

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailRoute,
})

function NftDetailRoute() {
  const { nftId } = Route.useParams()
  return <NftDetailPage nftId={nftId} />
}
