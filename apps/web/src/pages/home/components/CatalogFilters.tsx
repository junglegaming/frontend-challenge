import { useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { CATEGORY_LABELS, NFT_CATEGORIES, type NftCategory } from '@/domains/catalog'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import { Slider } from '@/shared/ui/slider'

const MAX_PRICE = 15

export function CatalogFilters() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })

  const [range, setRange] = useState<[number, number]>([
    search.minPrice ? Number(search.minPrice) : 0,
    search.maxPrice ? Number(search.maxPrice) : MAX_PRICE,
  ])

  function toggleCategory(category: NftCategory, checked: boolean) {
    const current = search.category ?? []
    const next = checked ? [...current, category] : current.filter((c) => c !== category)
    void navigate({ search: (prev) => ({ ...prev, category: next.length > 0 ? next : undefined, page: undefined }) })
  }

  function applyPriceRange() {
    void navigate({
      search: (prev) => ({
        ...prev,
        minPrice: range[0] > 0 ? String(range[0]) : undefined,
        maxPrice: range[1] < MAX_PRICE ? String(range[1]) : undefined,
        page: undefined,
      }),
    })
  }

  function toggleAvailability(onlyAvailable: boolean) {
    void navigate({
      search: (prev) => ({ ...prev, availability: onlyAvailable ? 'available' : undefined, page: undefined }),
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="mb-3 text-title font-bold">Coleções</legend>
        <div className="flex flex-col gap-3">
          {NFT_CATEGORIES.map((category) => (
            <label key={category} htmlFor={`category-${category}`} className="flex cursor-pointer items-center gap-2 text-body">
              <Checkbox
                id={`category-${category}`}
                checked={(search.category ?? []).includes(category)}
                onCheckedChange={(checked) => toggleCategory(category, checked === true)}
              />
              {CATEGORY_LABELS[category]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label className="mb-3 block font-bold">Faixa de preço</Label>
        <Slider
          min={0}
          max={MAX_PRICE}
          step={0.1}
          value={range}
          onValueChange={(value) => setRange(value as [number, number])}
        />
        <p className="mt-2 text-body text-muted-foreground">
          Preço: {range[0].toFixed(2)} - {range[1].toFixed(2)} ETH
        </p>
        <Button size="sm" variant="outline" className="mt-2" onClick={applyPriceRange}>
          Aplicar
        </Button>
      </div>

      <label htmlFor="availability-only" className="flex cursor-pointer items-center gap-2 text-body">
        <Checkbox
          id="availability-only"
          checked={search.availability === 'available'}
          onCheckedChange={(checked) => toggleAvailability(checked === true)}
        />
        Somente disponíveis
      </label>
    </div>
  )
}
