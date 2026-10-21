import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { useApplyCoupon, useCartQuote } from '@/domains/cart'
import { isApiError } from '@/shared/api/http'
import { useIsAuthenticated } from '@/shared/api/use-is-authenticated'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'
import { eth } from '@/shared/lib/eth'

export function CartSummary() {
  const quote = useCartQuote()
  const applyCoupon = useApplyCoupon()
  const authenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [couponError, setCouponError] = useState<string>()

  function handleApplyCoupon() {
    if (!code.trim()) return
    setCouponError(undefined)
    applyCoupon.mutate(
      { code: code.trim() },
      { onError: (error) => setCouponError(isApiError(error) ? error.message : 'Cupom inválido.') },
    )
  }

  function goToCheckout() {
    if (!quote.data?.purchasable) {
      toast.error('Revise seu carrinho: alguns itens não podem ser finalizados.')
      return
    }
    void navigate(authenticated ? { to: '/checkout' } : { to: '/login', search: { redirect: '/checkout' } })
  }

  if (quote.isPending) return <Skeleton className="h-80 w-full" />
  if (quote.isError || !quote.data) return null
  const q = quote.data

  return (
    <aside className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
      <h2 className="text-title font-bold">Resumo da carteira</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="coupon-code" className="text-body font-bold">
          Código promocional
        </label>
        <div className="flex gap-2">
          <Input
            id="coupon-code"
            placeholder="Digite o código promocional..."
            value={code}
            onChange={(event) => setCode(event.currentTarget.value)}
            aria-invalid={couponError ? true : undefined}
            aria-describedby={couponError ? 'coupon-error' : undefined}
          />
          <Button type="button" variant="secondary" disabled={applyCoupon.isPending} onClick={handleApplyCoupon}>
            Aplicar
          </Button>
        </div>
        {couponError && (
          <p id="coupon-error" role="alert" className="text-caption text-destructive">
            {couponError}
          </p>
        )}
      </div>

      <dl className="flex flex-col gap-2 text-body" aria-live="polite">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{eth.format(q.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Desconto do lançamento</dt>
          <dd>{eth.isZero(q.discount) ? '(-) 0.00' : `(-) ${eth.format(q.discount)}`}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Taxa de rede</dt>
          <dd>{eth.format(q.networkFee)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-title font-bold">
          <dt>Total</dt>
          <dd>{eth.format(q.total)}</dd>
        </div>
      </dl>

      <Button size="lg" disabled={q.lines.length === 0} onClick={goToCheckout}>
        Conectar e finalizar
      </Button>
      <Button variant="link" asChild>
        <Link to="/">Continuar explorando</Link>
      </Button>
    </aside>
  )
}
