import { compareEth, formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

interface EthPriceProps {
  value: string
  /** Preço anterior: exibido riscado quando diferente (alteração em tempo real ou preço "de"). */
  previous?: string | null
  className?: string
}

export function EthPrice({ value, previous, className }: EthPriceProps) {
  const changed = previous != null && compareEth(previous, value) !== 0
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2 font-bold text-primary', className)}>
      <span>{formatEth(value)}</span>
      {changed && (
        <span className="text-[0.9em] font-normal text-muted-foreground line-through">
          <span className="sr-only">antes </span>
          {formatEth(previous)}
        </span>
      )}
    </span>
  )
}
