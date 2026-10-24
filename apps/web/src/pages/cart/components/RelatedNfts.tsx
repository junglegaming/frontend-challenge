import { useQuery } from '@tanstack/react-query'
import { catalogQueries, NftCard } from '@/domains/catalog'

export function RelatedNfts() {
  const featured = useQuery(catalogQueries.featured())
  if (!featured.data || featured.data.length === 0) return null

  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-4">
      <h2 id="related-title" className="text-title font-bold">
        Colecionadores também viram
      </h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {featured.data.slice(0, 5).map((nft) => (
          <NftCard key={nft.id} nft={nft} />
        ))}
      </div>
    </section>
  )
}
