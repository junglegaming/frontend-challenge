import type { NftEdition } from '@/domains/catalog'
import { cn } from '@/shared/lib/cn'
import { eth } from '@/shared/lib/eth'

const STATUS_LABEL: Record<NftEdition['status'], string> = {
  available: '',
  sold_out: 'Esgotada',
  unavailable: 'Indisponível',
}

export function EditionPicker({
  editions,
  selectedId,
  onSelect,
}: {
  editions: NftEdition[]
  selectedId: string
  onSelect: (editionId: string) => void
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-foreground">Edição</legend>
      <div role="radiogroup" className="mt-2 flex flex-wrap gap-2">
        {editions.map((edition) => {
          const disabled = edition.status !== 'available'
          const statusLabel = STATUS_LABEL[edition.status]
          return (
            <label
              key={edition.id}
              className={cn(
                'flex cursor-pointer flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-sm transition-colors',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                selectedId === edition.id ? 'border-primary bg-primary/10' : 'border-border',
                disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/60',
              )}
            >
              <input
                type="radio"
                name="edition"
                value={edition.id}
                checked={selectedId === edition.id}
                disabled={disabled}
                onChange={() => onSelect(edition.id)}
                className="sr-only"
              />
              <span className="font-medium text-foreground">
                {edition.name}
                {statusLabel ? ` · ${statusLabel}` : ''}
              </span>
              <span className="text-muted-foreground">{eth.format(edition.price)}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
