import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { errorMessage } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'

interface PlaceErrorPanelProps {
  error: unknown
  uncertain: boolean
  onRetry: () => void
  isRetrying: boolean
}

export function PlaceErrorPanel({ error, uncertain, onRetry, isRetrying }: PlaceErrorPanelProps) {
  if (uncertain) {
    return (
      <div role="alert" className="rounded-sm border border-accent-text/60 bg-background/40 px-4 py-4 text-sm">
        <p className="font-bold text-accent-text">Não confirmamos seu pedido ainda</p>
        <p className="mt-1 text-muted-foreground">
          A rede demorou para responder. Tente novamente com segurança: vamos reenviar a mesma tentativa, sem duplicar a compra.
        </p>
        <Button type="button" onClick={onRetry} disabled={isRetrying} className="mt-4">
          {isRetrying ? (
            <>
              <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Tentando novamente…
            </>
          ) : (
            'Tentar novamente'
          )}
        </Button>
      </div>
    )
  }

  return (
    <div role="alert" className="rounded-sm border border-destructive/50 px-4 py-4 text-sm">
      <p className="font-bold">Não foi possível confirmar a compra</p>
      <p className="mt-1 text-muted-foreground">{errorMessage(error, 'Tente novamente em instantes.')}</p>
    </div>
  )
}

export function ReviewErrorPanel({ error }: { error: unknown }) {
  return (
    <div role="alert" className="rounded-sm border border-destructive/50 px-4 py-3 text-sm">
      <p className="font-bold">Não foi possível revisar o pedido</p>
      <p className="mt-1 text-muted-foreground">{errorMessage(error, 'Tente novamente em instantes.')}</p>
      <Button asChild variant="outline" size="sm" className="mt-3">
        <Link to="/cart">Revisar carrinho</Link>
      </Button>
    </div>
  )
}
