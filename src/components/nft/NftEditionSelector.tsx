import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { EDITION_LABELS, type Edition, type EditionId } from '@/schemas/nft'

interface NftEditionSelectorProps {
  editions: Edition[]
  value: EditionId
  onChange: (edition: EditionId) => void
}

export function NftEditionSelector({ editions, value, onChange }: NftEditionSelectorProps) {
  const labelId = useId()

  return (
    <div className="flex flex-col">
      <p id={labelId} className="text-sm leading-4 font-bold">
        Edição:
      </p>
      <RadioGroup
        aria-labelledby={labelId}
        value={value}
        onValueChange={(next) => {
          const edition = editions.find((item) => item.id === next)
          if (edition && edition.available > 0) onChange(edition.id)
        }}
        orientation="horizontal"
        className="mt-3 flex flex-wrap gap-3 md:gap-1.5"
      >
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const active = !soldOut && edition.id === value
          const itemId = `${labelId}-${edition.id.replace('/', '-')}`
          return (
            <div key={edition.id} className="relative">
              <RadioGroupItem
                id={itemId}
                value={edition.id}
                disabled={soldOut}
                className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
              />
              <Label
                htmlFor={itemId}
                className={cn(
                  'inline-flex h-7 cursor-pointer items-center rounded-full border border-border px-1.5 text-sm leading-none font-normal text-muted-foreground transition-colors',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
                  active && 'border-primary font-bold text-accent-text',
                  soldOut && 'cursor-not-allowed opacity-60',
                )}
              >
                {EDITION_LABELS[edition.id]}
                {soldOut && <span className="sr-only">, esgotada</span>}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}
