import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { catalogQueries, type NftSummary } from '@/domains/catalog'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

interface CollectionSummary {
  name: string
  itemCount: number
  coverImage: NftSummary['image']
}

function groupByCollection(items: NftSummary[]): CollectionSummary[] {
  const byName = new Map<string, CollectionSummary>()
  for (const item of items) {
    const existing = byName.get(item.collection)
    if (existing) existing.itemCount += 1
    else byName.set(item.collection, { name: item.collection, itemCount: 1, coverImage: item.image })
  }
  return Array.from(byName.values())
}

export function CollectionsRail() {
  const featured = useQuery(catalogQueries.featured())
  const navigate = useNavigate()
  const collections = featured.data ? groupByCollection(featured.data) : []

  function goToCollection(name: string) {
    void navigate({ to: '/', search: { q: name } })
  }

  return (
    <section aria-labelledby="market-collections-heading" className="flex flex-col gap-4">
      <h2 id="market-collections-heading" className="text-title font-bold">
        Coleções
      </h2>

      {featured.isPending && (
        <div role="status" aria-label="Carregando coleções" className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="aspect-video w-56 shrink-0" />
          ))}
        </div>
      )}

      {featured.isError && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card py-10 text-center">
          <p className="text-muted-foreground">Não foi possível carregar as coleções.</p>
          <Button size="sm" onClick={() => void featured.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {featured.data && collections.length === 0 && (
        <p className="rounded-lg border border-border bg-card px-4 py-10 text-center text-muted-foreground">
          Nenhuma coleção disponível no momento.
        </p>
      )}

      {collections.length > 0 && (
        <ul className="flex snap-x gap-4 overflow-x-auto pb-2">
          {collections.map((collection) => (
            <li key={collection.name} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => goToCollection(collection.name)}
                className="relative flex aspect-video w-56 items-end overflow-hidden rounded-lg bg-card text-left focus-visible:outline-3 focus-visible:outline-ring"
              >
                <img src={collection.coverImage.src} alt="" className="absolute inset-0 size-full object-cover" />
                <div className="relative z-10 w-full bg-gradient-to-t from-background/90 to-transparent p-3">
                  <p className="font-bold text-foreground">{collection.name}</p>
                  <p className="text-caption text-muted-foreground">{collection.itemCount} NFTs</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
