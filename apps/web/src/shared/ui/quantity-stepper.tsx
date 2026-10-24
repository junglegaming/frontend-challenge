import { MinusIcon, PlusIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/button'

export function QuantityStepper({
  value,
  max,
  onChange,
  itemName,
  disabled,
}: {
  value: number
  max: number
  onChange: (next: number) => void
  /** Appended to the +/- accessible names, e.g. "Diminuir quantidade de Emerald Ape #042". */
  itemName?: string
  disabled?: boolean
}) {
  const suffix = itemName ? ` de ${itemName}` : ''
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Diminuir quantidade${suffix}`}
        disabled={disabled || value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <MinusIcon aria-hidden="true" />
      </Button>
      <span aria-live="polite" className="w-6 text-center text-title font-bold tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Aumentar quantidade${suffix}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <PlusIcon aria-hidden="true" />
      </Button>
      <span className="text-caption text-muted-foreground">máx. {max}</span>
    </div>
  )
}
