import { useQuery } from '@tanstack/react-query'
import { catalogQueries, NftCard } from '@/domains/catalog'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export function TrendingRail() {
  const featured = useQuery(catalogQueries.featured())

  return (
    <section aria-labelledby="market-trending-heading" className="flex flex-col gap-4">
      <h2 id="market-trending-heading" className="text-title font-bold">
        Em alta
      </h2>

      {featured.isPending && (
        <div role="status" aria-label="Carregando NFTs em alta" className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-square w-40 shrink-0 sm:w-48" />
          ))}
        </div>
      )}

      {featured.isError && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card py-10 text-center">
          <p className="text-muted-foreground">Não foi possível carregar os NFTs em alta.</p>
          <Button size="sm" onClick={() => void featured.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {featured.data && featured.data.length === 0 && (
        <p className="rounded-lg border border-border bg-card px-4 py-10 text-center text-muted-foreground">
          Nenhum NFT em alta no momento.
        </p>
      )}

      {featured.data && featured.data.length > 0 && (
        <div className="flex snap-x gap-4 overflow-x-auto pb-2">
          {featured.data.map((nft) => (
            <div key={nft.id} className="w-40 shrink-0 snap-start sm:w-48">
              <NftCard nft={nft} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
