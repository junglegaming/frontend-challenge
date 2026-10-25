import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import { errorMessage } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { usePlaceOrder } from '@/hooks/useCheckout'

export function CheckoutRecovery() {
  const navigate = useNavigate()
  const placeOrder = usePlaceOrder()
  const [notice, setNotice] = useState<string | null>(null)
  const orderId = placeOrder.attempt?.orderId

  useEffect(() => {
    if (!orderId) return
    void navigate({ to: '/orders/$orderId', params: { orderId } })
  }, [orderId, navigate])

  const retry = () => {
    setNotice(null)
    void placeOrder.retry().catch((error: unknown) => {
      if (!(error instanceof ApiError)) return
      if (error.code === 'QUOTE_STALE') {
        placeOrder.clearAttempt()
        placeOrder.reset()
        setNotice('A cotação anterior expirou e o pedido não foi encontrado. Volte ao carrinho para revisar.')
        return
      }
      if (!error.isTransient) placeOrder.clearAttempt()
    })
  }

  const error = placeOrder.error
  const uncertain =
    !error || (error instanceof ApiError && (error.isTimeout || error.isNetwork || error.status >= 500))
  const hasAttempt = Boolean(placeOrder.attempt)

  return (
    <section aria-labelledby="checkout-recovery-heading" className="mx-auto w-full max-w-[578px] border border-border bg-card">
      <div className="flex flex-col gap-3 px-6 py-8">
        <h2 id="checkout-recovery-heading" className="text-base font-bold">
          {hasAttempt && uncertain ? 'Não confirmamos seu pedido ainda' : 'Tentativa de pedido encerrada'}
        </h2>

        <p aria-live="polite" className="text-sm text-muted-foreground">
          {hasAttempt && uncertain
            ? 'A rede demorou para responder. Tente novamente com segurança: vamos reenviar a mesma tentativa, sem duplicar a compra.'
            : 'Não há uma tentativa de compra em andamento. Volte ao carrinho para revisar seu pedido.'}
        </p>

        {notice && (
          <p role="alert" className="text-sm text-accent-text">
            {notice}
          </p>
        )}

        {!uncertain && error && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage(error)}
          </p>
        )}

        {hasAttempt && (
          <Button type="button" onClick={retry} disabled={placeOrder.isPending} className="mt-2 w-fit">
            {placeOrder.isPending ? (
              <>
                <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Tentando novamente…
              </>
            ) : (
              'Tentar novamente'
            )}
          </Button>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <Link to="/cart" className="text-accent-text underline-offset-4 hover:underline">
            Voltar ao carrinho
          </Link>
          <Link to="/" hash="catalogo" className="text-accent-text underline-offset-4 hover:underline">
            Voltar ao catálogo
          </Link>
        </div>
      </div>
      <div className="h-2.5 w-full bg-primary" aria-hidden="true" />
    </section>
  )
}
