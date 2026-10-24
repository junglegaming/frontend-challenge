import { Link } from '@tanstack/react-router'
import { AlertIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/button'

export function DeclinedState({ reason }: { reason: string | null }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card py-16 text-center">
      <AlertIcon aria-hidden="true" className="size-8 text-destructive" />
      <p className="text-title font-bold">Pagamento recusado</p>
      <p className="max-w-sm text-muted-foreground">{reason ?? 'Não foi possível confirmar esta compra.'}</p>
      <Button asChild>
        <Link to="/cart">Voltar ao carrinho</Link>
      </Button>
    </div>
  )
}
