import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface NftQuantityStepperProps {
  quantity: number
  max: number
  onChange: (quantity: number) => void
  disabled?: boolean
  /** Compacto para a barra de compra mobile (Qtd. − 1 +). */
  variant?: 'default' | 'compact'
  className?: string
}

export function NftQuantityStepper({
  quantity,
  max,
  onChange,
  disabled = false,
  variant = 'default',
  className,
}: NftQuantityStepperProps) {
  const inputId = useId()
  const limitId = useId()
  const atLimit = max > 0 && quantity >= max
  const soldOut = max <= 0

  const update = (next: number) => {
    if (soldOut) return
    onChange(Math.min(Math.max(1, Math.trunc(next)), max))
  }

  const limitMessage = soldOut ? 'Edição esgotada.' : atLimit ? `Quantidade máxima: ${max}.` : ''

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <span className="text-sm leading-5" aria-hidden="true">
          Qtd.
        </span>
        <div className="flex items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            Quantidade
          </label>
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={disabled || soldOut || quantity <= 1}
            onClick={() => update(quantity - 1)}
            className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <Input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(1, max)}
            value={quantity}
            disabled={disabled || soldOut}
            aria-describedby={limitId}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (Number.isFinite(next)) update(next)
            }}
            className="h-7 w-5 rounded-none border-0 bg-transparent p-0 text-center text-base font-bold focus-visible:ring-1"
          />
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={disabled || soldOut || atLimit}
            onClick={() => update(quantity + 1)}
            className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p id={limitId} aria-live="polite" className="sr-only">
          {limitMessage}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-3">
        <label htmlFor={inputId} className="sr-only">
          Quantidade
        </label>
        <Button
          type="button"
          size="icon"
          className="size-6 rounded-full"
          aria-label="Diminuir quantidade"
          disabled={disabled || soldOut || quantity <= 1}
          onClick={() => update(quantity - 1)}
        >
          <Minus className="size-3.5" aria-hidden="true" />
        </Button>
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={1}
          max={Math.max(1, max)}
          value={quantity}
          disabled={disabled || soldOut}
          aria-describedby={limitId}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (Number.isFinite(next)) update(next)
          }}
          className="h-7 w-6 rounded-none border-0 bg-transparent p-0 text-center text-xl font-bold focus-visible:ring-1"
        />
        <Button
          type="button"
          size="icon"
          className="size-6 rounded-full"
          aria-label="Aumentar quantidade"
          disabled={disabled || soldOut || atLimit}
          onClick={() => update(quantity + 1)}
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
      <p id={limitId} aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
        {limitMessage}
      </p>
    </div>
  )
}
