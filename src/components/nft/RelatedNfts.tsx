import { useId, useRef, useState } from 'react'
import { NftCard } from '@/components/common/NftCard'
import { NftCardSkeleton } from '@/components/common/NftCardSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { cn } from '@/lib/utils'
import type { CollectionId } from '@/schemas/nft'
import { useNfts } from '@/hooks/useNfts'

interface RelatedNftsProps {
  collection: CollectionId
  currentNftId: string
}

export function RelatedNfts({ collection, currentNftId }: RelatedNftsProps) {
  const scrollerId = useId()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const query = useNfts({ collections: [collection], pageSize: 6 })
  // ponytail: o mock tem só 4 NFTs por coleção; completa com o catálogo até os 5 do Figma, mesma coleção primeiro
  const fill = useNfts({ pageSize: 8 })
  const items = [...(query.data?.items ?? []), ...(fill.data?.items ?? [])]
    .filter((nft, index, all) => nft.id !== currentNftId && all.findIndex((other) => other.id === nft.id) === index)
    .slice(0, 5)

  const scrollTo = (index: number) => {
    const container = scrollerRef.current
    const card = container?.children[index]
    if (!container || !(card instanceof HTMLElement)) return
    container.scrollTo({
      left: card.offsetLeft,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  return (
    <section aria-labelledby="related-title" className="mt-16 md:mt-24">
      <h2 id="related-title" className="border-b border-border pb-3 text-base leading-4 font-bold text-accent-text">
        Mais desta coleção
      </h2>

      {query.isPending && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-5 lg:gap-[26px]">
          {Array.from({ length: 5 }, (_, index) => (
            <NftCardSkeleton key={index} />
          ))}
        </div>
      )}

      {query.isError && (
        <div className="mt-8">
          <ErrorState error={query.error} title="Não foi possível carregar a coleção" onRetry={() => query.refetch()} isRetrying={query.isFetching} />
        </div>
      )}

      {!query.isPending && !query.isError && items.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">Nenhum outro NFT desta coleção no momento.</p>
      )}

      {items.length > 0 && (
        <>
          <div
            ref={scrollerRef}
            id={scrollerId}
            onScroll={(event) => {
              const container = event.currentTarget
              const containerLeft = container.getBoundingClientRect().left
              let nearest = 0
              let distance = Number.POSITIVE_INFINITY
              Array.from(container.children).forEach((child, index) => {
                if (!(child instanceof HTMLElement)) return
                const nextDistance = Math.abs(child.getBoundingClientRect().left - containerLeft)
                if (nextDistance < distance) {
                  distance = nextDistance
                  nearest = index
                }
              })
              setActive(nearest)
            }}
            className="relative mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible lg:grid-cols-5 lg:gap-[26px]"
          >
            {items.map((nft) => (
              <div key={nft.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-auto">
                <NftCard nft={nft} />
              </div>
            ))}
          </div>

          {items.length > 1 && (
            <div className="mt-4 flex justify-center md:hidden">
              {items.map((nft, index) => (
                <button
                  key={nft.id}
                  type="button"
                  aria-label={`Ir para ${nft.name}`}
                  aria-pressed={index === active}
                  aria-controls={scrollerId}
                  onClick={() => scrollTo(index)}
                  className="grid size-6 place-items-center"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-2.5 rounded-full border border-primary transition-colors',
                      index === active ? 'bg-primary' : 'bg-transparent',
                    )}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 hidden justify-center gap-2 md:flex" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className={cn(
                  'size-3 rounded-full border border-primary',
                  dot === 0 ? 'bg-primary' : 'bg-transparent',
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
