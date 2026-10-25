import { useId } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { FieldError } from '@/components/common/FieldError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApplyCoupon, useRemoveCoupon } from '@/hooks/useCart'
import { useSession } from '@/hooks/useSession'
import { couponInputSchema, type Cart, type CouponInput } from '@/schemas/cart'
import { SummaryLines } from './SummaryLines'

interface CartSummaryProps {
  cart: Cart
}

export function CartSummary({ cart }: CartSummaryProps) {
  const { isAuthenticated } = useSession()
  const applyCoupon = useApplyCoupon()
  const removeCoupon = useRemoveCoupon()
  const codeErrorId = useId()
  const blockedId = useId()

  const form = useForm<CouponInput>({
    resolver: zodResolver(couponInputSchema),
    defaultValues: { code: '' },
  })

  const blocked = cart.items.some((item) => item.available === 0 || item.quantity > item.available)

  const handleApply = form.handleSubmit((values) => {
    applyCoupon.mutate(values.code, {
      onSuccess: () => {
        toast.success('Cupom aplicado ao carrinho')
        form.reset()
      },
      onError: (error) => {
        if (error instanceof ApiError && (error.code === 'COUPON_INVALID' || error.code === 'COUPON_EXPIRED')) {
          form.setError('code', { message: error.message })
          return
        }
        toast.error(error instanceof ApiError ? error.message : 'Não foi possível aplicar o cupom')
      },
    })
  })

  const handleRemove = () => {
    removeCoupon.mutate(undefined, {
      onSuccess: () => toast.success('Cupom removido'),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Não foi possível remover o cupom'),
    })
  }

  const checkoutButton = blocked ? (
    <Button disabled aria-describedby={blockedId} variant="cta" size="cta">
      Conectar e finalizar
    </Button>
  ) : isAuthenticated ? (
    <Button asChild variant="cta" size="cta">
      <Link to="/checkout">Conectar e finalizar</Link>
    </Button>
  ) : (
    <Button asChild variant="cta" size="cta">
      <Link to="/login" search={{ redirect: '/checkout' }}>
        Conectar e finalizar
      </Link>
    </Button>
  )

  return (
    <section
      aria-labelledby="cart-summary-heading"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-h-[85dvh] w-full max-w-[480px] flex-col overflow-y-auto rounded-t-[32px] bg-card px-6 pt-6 pb-9 md:static md:z-auto md:max-h-none md:w-auto md:max-w-none md:overflow-visible md:rounded-none md:bg-transparent md:p-0"
    >
      <h2
        id="cart-summary-heading"
        className="sr-only text-base leading-4 font-bold md:not-sr-only md:block md:border-b md:border-border md:pb-3"
      >
        Resumo da carteira
      </h2>

      <div className="md:mt-6">
        {cart.coupon ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-border-soft bg-background/40 px-4 py-2.5 md:rounded-sm md:py-2">
            <p className="text-sm">
              Cupom <span className="font-bold text-accent-text">{cart.coupon.code}</span> aplicado
              <span className="block text-xs text-muted-foreground">{cart.coupon.percent}% de desconto</span>
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={removeCoupon.isPending}>
              {removeCoupon.isPending ? (
                <>
                  <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  Removendo…
                </>
              ) : (
                'Remover'
              )}
            </Button>
          </div>
        ) : (
          <form noValidate onSubmit={handleApply} className="flex flex-col gap-2">
            <Label htmlFor="coupon-code" className="sr-only leading-4 md:not-sr-only md:flex">
              Código promocional
            </Label>
            <div className="flex h-[50px] items-stretch overflow-hidden rounded-full border border-input md:h-10 md:rounded-sm">
              <Input
                id="coupon-code"
                placeholder="Digite o código promocional…"
                autoComplete="off"
                aria-invalid={Boolean(form.formState.errors.code)}
                aria-describedby={form.formState.errors.code ? codeErrorId : undefined}
                className="h-full flex-1 rounded-none border-0 bg-transparent px-4 text-sm placeholder:text-subtle focus-visible:border-0 focus-visible:ring-0 md:px-2 md:text-[13px]"
                {...form.register('code')}
              />
              <Button
                type="submit"
                className="h-full w-[97px] shrink-0 rounded-full px-0 text-sm md:w-[102px] md:rounded-none"
                disabled={applyCoupon.isPending}
              >
                {applyCoupon.isPending ? (
                  <>
                    <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    <span className="sr-only">Aplicando…</span>
                  </>
                ) : (
                  'Aplicar'
                )}
              </Button>
            </div>
            <FieldError id={codeErrorId} message={form.formState.errors.code?.message} />
          </form>
        )}
      </div>

      <div className="mt-3 md:mt-6">
        <SummaryLines summary={cart.summary} />
      </div>

      <div className="mt-7 flex flex-col gap-3 md:mt-5">
        {checkoutButton}
        {blocked && (
          <p id={blockedId} role="alert" className="text-xs text-destructive">
            Remova os itens esgotados ou ajuste as quantidades indisponíveis para finalizar a compra.
          </p>
        )}
        <Link
          to="/"
          className="sr-only text-center text-sm text-accent-text underline-offset-4 hover:underline md:not-sr-only md:block"
        >
          Continuar explorando
        </Link>
      </div>
    </section>
  )
}
