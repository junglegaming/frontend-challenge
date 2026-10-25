import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { formatEth, fromWei, toWei } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { collectionIdSchema, type CollectionId, type NftListResponse } from '@/schemas/nft'
import { networkSchema, type Network } from '@/schemas/common'
import { CatalogSort } from './CatalogSort'
import { toggleValue, useCatalogSearch } from './useCatalogSearch'

const STEPS = 1000

function stepFromPrice(price: string | undefined, min: string, max: string, fallback: number) {
  if (!price) return fallback
  const low = toWei(min)
  const high = toWei(max)
  if (high <= low) return fallback
  const value = toWei(price)
  if (value <= low) return 0
  if (value >= high) return STEPS
  const ratio = ((value - low) * BigInt(STEPS)) / (high - low)
  return Number(ratio)
}

function priceAtStep(min: string, max: string, step: number) {
  const low = toWei(min)
  const high = toWei(max)
  if (high <= low) return min
  return fromWei(low + ((high - low) * BigInt(step)) / BigInt(STEPS))
}

interface FilterItemProps {
  label: string
  count: number
  active: boolean
  onToggle: () => void
}

function FilterItem({ label, count, active, onToggle }: FilterItemProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={count === 0 && !active}
      onClick={onToggle}
      className={cn(
        'flex w-full items-baseline justify-between gap-2 text-left text-sm leading-5 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40',
        active && 'text-primary hover:text-primary',
      )}
    >
      <span>{label}</span>
      <span aria-hidden="true">({count})</span>
      <span className="sr-only">{count} itens</span>
    </button>
  )
}

interface PriceRangeFilterProps {
  min: string
  max: string
}

function PriceRangeFilter({ min, max }: PriceRangeFilterProps) {
  const { search, update } = useCatalogSearch()
  const [range, setRange] = useState<[number, number]>(() => [
    stepFromPrice(search.minPrice, min, max, 0),
    stepFromPrice(search.maxPrice, min, max, STEPS),
  ])

  const lowPrice = priceAtStep(min, max, range[0])
  const highPrice = priceAtStep(min, max, range[1])

  return (
    <div className="flex flex-col items-start">
      <Slider
        min={0}
        max={STEPS}
        step={1}
        value={range}
        onValueChange={(values) => setRange([values[0] ?? 0, values[1] ?? STEPS])}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        aria-label="Faixa de preço"
        className="mt-2"
      />
      <p className="mt-4 text-sm leading-5 text-muted-foreground">
        Preço: {formatEth(lowPrice)} – {formatEth(highPrice)}
      </p>
      <Button
        size="sm"
        className="mt-3 h-9 px-3 text-sm"
        onClick={() =>
          update({
            minPrice: range[0] > 0 ? lowPrice : undefined,
            maxPrice: range[1] < STEPS ? highPrice : undefined,
          })
        }
      >
        Aplicar
      </Button>
    </div>
  )
}

interface CatalogFiltersProps {
  facets: NftListResponse['facets']
  showSort?: boolean
}

export function CatalogFilters({ facets, showSort = false }: CatalogFiltersProps) {
  const { search, update, reset } = useCatalogSearch()
  const id = useId()
  const collections = search.collections ?? []
  const networks = search.networks ?? []
  const activeFilters = collections.length + networks.length + (search.minPrice || search.maxPrice ? 1 : 0)

  const toggleCollection = (id: CollectionId) => {
    const next = toggleValue(collections, id)
    update({ collections: next.length > 0 ? next : undefined })
  }

  const toggleNetwork = (id: Network) => {
    const next = toggleValue(networks, id)
    update({ networks: next.length > 0 ? next : undefined })
  }

  return (
    <div className="flex flex-col gap-12">
      {showSort && (
        <section aria-labelledby={`${id}-sort`}>
          <h3 id={`${id}-sort`} className="mb-3 text-base font-normal leading-6">
            Ordenar por
          </h3>
          <CatalogSort
            value={search.sort ?? 'recent'}
            onChange={(sort) => update({ sort: sort === 'recent' ? undefined : sort })}
            layout="stacked"
          />
        </section>
      )}

      <section aria-labelledby={`${id}-collections`}>
        <h3 id={`${id}-collections`} className="text-base font-bold leading-6">
          Coleções
        </h3>
        <div className="mt-5 flex flex-col gap-5">
          {facets.collections.map((facet) => {
            const parsed = collectionIdSchema.safeParse(facet.id)
            if (!parsed.success) return null
            return (
              <FilterItem
                key={facet.id}
                label={facet.label}
                count={facet.count}
                active={collections.includes(parsed.data)}
                onToggle={() => toggleCollection(parsed.data)}
              />
            )
          })}
        </div>
      </section>

      <section aria-labelledby={`${id}-price`}>
        <h3 id={`${id}-price`} className="text-base font-bold leading-6">
          Faixa de preço
        </h3>
        <PriceRangeFilter
          key={`${facets.priceRange.min}:${facets.priceRange.max}:${search.minPrice ?? ''}:${search.maxPrice ?? ''}`}
          min={facets.priceRange.min}
          max={facets.priceRange.max}
        />
      </section>

      <section aria-labelledby={`${id}-networks`} className="-mt-3">
        <h3 id={`${id}-networks`} className="text-base font-bold leading-6">
          Rede
        </h3>
        <div className="mt-5 flex flex-col gap-5">
          {facets.networks.map((facet) => {
            const parsed = networkSchema.safeParse(facet.id)
            if (!parsed.success) return null
            return (
              <FilterItem
                key={facet.id}
                label={facet.label}
                count={facet.count}
                active={networks.includes(parsed.data)}
                onToggle={() => toggleNetwork(parsed.data)}
              />
            )
          })}
        </div>
      </section>

      {activeFilters > 0 && (
        <Button variant="link" size="sm" className="w-fit px-0" onClick={reset}>
          Limpar filtros
        </Button>
      )}
    </div>
  )
}

export function CatalogFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-12" aria-hidden="true">
      <div>
        <Skeleton className="h-6 w-24" />
        <div className="mt-4 flex flex-col gap-5">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full max-w-[220px]" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-2 h-3.5 w-full" />
        <Skeleton className="mt-4 h-5 w-44" />
        <Skeleton className="mt-3 h-9 w-20" />
      </div>
      <div>
        <Skeleton className="h-6 w-16" />
        <div className="mt-4 flex flex-col gap-5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full max-w-[160px]" />
          ))}
        </div>
      </div>
    </div>
  )
}
