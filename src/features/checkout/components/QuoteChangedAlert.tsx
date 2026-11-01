import { formatEth } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'

/** Props de {@link QuoteChangedAlert}. */
interface QuoteChangedAlertProps {
  /** Total que o usuário tinha revisado. */
  reviewedTotalEth: string
  /** Total atual da cotação. */
  currentTotalEth: string
  /** Aceita o novo total como revisado. */
  onAccept: () => void
}

/**
 * Aviso de cotação alterada (preço, estoque, cupom ou taxa) antes da compra.
 * A confirmação fica bloqueada até o usuário aceitar o novo total.
 *
 * @param props - {@link QuoteChangedAlertProps}
 * @returns Alerta com o total antigo, o novo e a ação de aceite.
 */
export function QuoteChangedAlert({
  reviewedTotalEth,
  currentTotalEth,
  onAccept,
}: QuoteChangedAlertProps) {
  return (
    <div
      role="alert"
      className="flex w-full flex-col gap-3 rounded-[6px] border border-coral/60 bg-coral/10 p-3 font-mono"
    >
      <p className="text-[14px] leading-5 text-foreground">
        Os valores mudaram enquanto você revisava. O total passou de{' '}
        <span className="line-through">{formatEth(reviewedTotalEth)} ETH</span> para{' '}
        <strong className="text-highlight">{formatEth(currentTotalEth)} ETH</strong>.
      </p>
      <Button type="button" size="sm" variant="outline" onClick={onAccept}>
        Revisei, aceitar novo total
      </Button>
    </div>
  )
}
