import type { CartItem, Quote } from '@/shared/contracts'
import { formatEth, mul } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

/** Props de {@link OrderReviewDialog}. */
interface OrderReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  quote: Quote
  /** Descrição da carteira conectada (nome, endereço, rede e provedor). */
  walletDescription: string
  isSubmitting: boolean
  onConfirm: () => void
}

/**
 * Revisão final do pedido antes do envio: itens, valores da cotação e carteira.
 * O foco fica preso no diálogo e volta ao gatilho ao fechar (Radix).
 *
 * @param props - {@link OrderReviewDialogProps}
 * @returns Diálogo de revisão com a confirmação da compra.
 */
export function OrderReviewDialog({
  open,
  onOpenChange,
  items,
  quote,
  walletDescription,
  isSubmitting,
  onConfirm,
}: OrderReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revise sua compra</DialogTitle>
          <DialogDescription>
            Confira os itens, os valores e a carteira antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2 text-[14px] leading-5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">
                {item.name} <span className="text-text-secondary">(x {item.quantity})</span>
              </span>
              <span className="shrink-0 font-bold text-highlight">
                {formatEth(mul(item.priceEth, String(item.quantity)))} ETH
              </span>
            </li>
          ))}
        </ul>

        <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-t border-field pt-3 text-[14px] leading-5">
          <dt>Subtotal</dt>
          <dd className="text-right">{formatEth(quote.subtotalEth)} ETH</dd>
          <dt>Desconto</dt>
          <dd className="text-right">(-) {formatEth(quote.discountEth)} ETH</dd>
          <dt>Taxa de rede</dt>
          <dd className="text-right">{formatEth(quote.networkFeeEth)} ETH</dd>
          <dt className="font-bold">Total</dt>
          <dd className="text-right font-bold text-highlight">{formatEth(quote.totalEth)} ETH</dd>
        </dl>

        <p className="text-[14px] leading-5">
          <span className="font-bold">Pagamento com:</span> {walletDescription}
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Voltar e editar
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? 'Confirmando…' : 'Confirmar e pagar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
