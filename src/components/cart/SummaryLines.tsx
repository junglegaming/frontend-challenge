import { EthPrice } from '@/components/common/EthPrice'
import { formatEth } from '@/lib/eth'
import type { Summary } from '@/schemas/common'
import { cn } from '@/lib/utils'

interface SummaryLinesProps {
  summary: Summary
  networkFeeHint?: boolean
  /** Linha divisória acima do total (Pagamento e recibo). */
  totalDivider?: boolean
  className?: string
}

export function SummaryLines({ summary, networkFeeHint = true, totalDivider = false, className }: SummaryLinesProps) {
  const discount = formatEth(summary.discount).replace(' ETH', '')
  return (
    <dl className={cn('flex flex-col gap-3 text-base leading-5', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatEth(summary.subtotal)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt>Desconto do lançamento</dt>
        <dd className="tabular-nums">(-) {discount === '0.00' ? '00.00' : discount}</dd>
      </div>
      <div className="flex items-start justify-between gap-4">
        <dt>Taxa de rede</dt>
        <dd className="flex flex-col items-end gap-0 tabular-nums md:gap-3">
          <span>{formatEth(summary.networkFee)}</span>
          {networkFeeHint && <span className="text-[10px] leading-4 tracking-wide text-accent-text">Taxa estimada</span>}
        </dd>
      </div>
      <div
        className={cn(
          'flex items-baseline justify-between gap-4',
          totalDivider ? 'border-t border-border pt-3' : 'md:mt-3',
        )}
      >
        <dt className="text-lg leading-5 font-bold">Total</dt>
        <dd>
          <EthPrice value={summary.total} className="text-lg leading-5 text-accent-text" />
        </dd>
      </div>
    </dl>
  )
}
