import { AlertIcon, SpinnerIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/button'

export function PendingOutcome({ orderId }: { orderId: string }) {
  return (
    <section aria-busy="true" className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-6 py-16 text-center">
      <SpinnerIcon aria-hidden="true" className="size-8 animate-spin text-primary" />
      <h2 id="outcome-heading" tabIndex={-1} className="text-title font-bold outline-none">
        Processando pagamento
      </h2>
      <p className="max-w-sm text-muted-foreground">
        Aguardando a confirmação da carteira. Você pode recarregar a página: o mesmo pedido será retomado.
      </p>
      <p className="text-caption break-all text-muted-foreground">Pedido {orderId}</p>
    </section>
  )
}

export function DeclinedOutcome({ reason, onRetry }: { reason: string; onRetry: () => void }) {
  return (
    <section role="alert" className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-6 py-16 text-center">
      <AlertIcon aria-hidden="true" className="size-8 text-destructive" />
      <h2 id="outcome-heading" tabIndex={-1} className="text-title font-bold outline-none">
        Pagamento recusado
      </h2>
      <p className="max-w-sm text-muted-foreground">{reason}</p>
      <p className="max-w-sm text-caption text-muted-foreground">Seus itens continuam no carrinho.</p>
      <Button type="button" onClick={onRetry}>
        Tentar novamente
      </Button>
    </section>
  )
}
