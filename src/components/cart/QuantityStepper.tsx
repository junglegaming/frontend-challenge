import { useId } from 'react'
import { Loader2, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  max: number
  onChange: (quantity: number) => void
  label: string
  pending?: boolean
  describedBy?: string
  className?: string
}

export function QuantityStepper({ value, max, onChange, label, pending = false, describedBy, className }: QuantityStepperProps) {
  const inputId = useId()
  const disabled = pending || max <= 0

  const commit = (input: HTMLInputElement) => {
    const parsed = Number.parseInt(input.value, 10)
    if (!Number.isFinite(parsed)) {
      input.value = String(value)
      return
    }
    const next = Math.min(Math.max(parsed, 1), max)
    input.value = String(next)
    if (next !== value) onChange(next)
  }

  const buttonClass =
    'grid size-6 shrink-0 place-items-center rounded-full border border-border-soft bg-background/40 text-accent-text transition-colors hover:bg-background/70 disabled:cursor-not-allowed disabled:opacity-40 md:size-5 md:border-transparent md:bg-primary md:text-primary-foreground md:hover:bg-primary/80'

  return (
    <div className={cn('flex items-center gap-0', className)}>
      <button
        type="button"
        aria-label={`Diminuir quantidade de ${label}`}
        disabled={disabled || value <= 1}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onChange(value - 1)}
        className={buttonClass}
      >
        <Minus className="size-3 md:size-3" aria-hidden="true" />
      </button>
      <label htmlFor={inputId} className="sr-only">
        Quantidade de {label}
      </label>
      <input
        key={value}
        id={inputId}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        defaultValue={value}
        disabled={disabled}
        aria-busy={pending}
        aria-describedby={describedBy}
        onChange={(event) => {
          event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '')
        }}
        onBlur={(event) => commit(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          }
        }}
        className="h-6 w-[33px] rounded-sm border border-transparent bg-transparent text-center text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60 md:h-5 md:w-[35px] md:text-sm"
      />
      <button
        type="button"
        aria-label={`Aumentar quantidade de ${label}`}
        disabled={disabled || value >= max}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onChange(value + 1)}
        className={buttonClass}
      >
        <Plus className="size-3 md:size-3" aria-hidden="true" />
      </button>
      {pending && (
        <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <span className="sr-only">Atualizando</span>
        </span>
      )}
    </div>
  )
}
