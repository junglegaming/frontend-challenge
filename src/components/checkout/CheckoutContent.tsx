import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { CheckoutForm } from './CheckoutForm'
import { CheckoutSidebar } from './CheckoutSidebar'
import { PlaceErrorPanel, ReviewErrorPanel } from './CheckoutErrorPanels'
import { QuoteDiff } from './QuoteDiff'
import { MobileCheckout } from './MobileCheckout'
import { QuoteReview } from './QuoteReview'
import { useCheckoutFlow } from './useCheckoutFlow'
import type { Cart } from '@/schemas/cart'
import type { Profile } from '@/schemas/profile'
import type { User } from '@/schemas/auth'
import type { Wallet } from '@/schemas/wallet'

const FORM_ID = 'checkout-form'
const REASON_ID = 'checkout-cta-reason'

interface CheckoutContentProps {
  cart: Cart
  wallets: Wallet[]
  profile: Profile | null
  user: User
}

export function CheckoutContent({ cart, wallets, profile, user }: CheckoutContentProps) {
  const flow = useCheckoutFlow({ cart, wallets, profile, user })
  const showPlaceError = Boolean(flow.placeError || flow.unconfirmedAttempt)
  const placeUncertain = !flow.placeError || flow.uncertain
  const isDesktop = useIsDesktop()

  if (!isDesktop) return <MobileCheckout cart={cart} wallets={wallets} flow={flow} />

  return (
    <div
      className="grid gap-8 md:mt-6 xl:grid-cols-[minmax(0,1fr)_332px] xl:gap-x-[86px]"
      aria-busy={flow.busy}
    >
      <div className="flex flex-col gap-6">
        {flow.notice && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-sm border border-border-soft bg-background/40 px-4 py-3 text-sm text-accent-text"
          >
            {flow.notice}
          </p>
        )}

        {flow.blockedItem && (
          <div role="alert" className="rounded-sm border border-destructive/50 px-4 py-3 text-sm text-destructive">
            <p className="font-bold">Item indisponível no carrinho</p>
            <p className="mt-1">
              {flow.blockedItem.name} está esgotado ou com quantidade acima do estoque.{' '}
              <Link to="/cart" className="underline underline-offset-4">
                Voltar ao carrinho
              </Link>{' '}
              para ajustar.
            </p>
          </div>
        )}

        {flow.quote ? (
          <div className="flex flex-col gap-6">
            {flow.staleDiff && <QuoteDiff previous={flow.staleDiff.previous} next={flow.staleDiff.next} />}
            <QuoteReview quote={flow.quote} />
            {showPlaceError && flow.step !== 'submitting' && (
              <PlaceErrorPanel
                error={flow.placeError}
                uncertain={placeUncertain}
                onRetry={flow.retry}
                isRetrying={flow.isSubmitting}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <CheckoutForm
              formId={FORM_ID}
              defaultValues={flow.initialValues}
              wallet={flow.selectedWallet}
              otherWallet={flow.otherWallet}
              usingOtherWallet={flow.usingOtherWallet}
              onToggleOtherWallet={flow.toggleOtherWallet}
              disabled={flow.isReviewing}
              onValuesChange={flow.persistDraft}
              onSubmit={flow.review}
            />
            {showPlaceError && (
              <PlaceErrorPanel
                error={flow.placeError}
                uncertain={placeUncertain}
                onRetry={flow.retry}
                isRetrying={flow.isSubmitting}
              />
            )}
            {flow.reviewError && <ReviewErrorPanel error={flow.reviewError} />}
          </div>
        )}
      </div>

      <CheckoutSidebar
        cart={cart}
        wallets={wallets}
        selectedWalletId={flow.selectedWalletId}
        onSelectWallet={flow.selectWallet}
        onDisconnectWallet={flow.disconnectWallet}
        walletDisabled={flow.isSubmitting}
      >
        {wallets.length > 0 && (
          <div className="flex flex-col gap-3">
            {flow.quote ? (
              <>
                <Button
                  type="button"
                  onClick={flow.confirm}
                  disabled={!flow.canProceed || flow.isSubmitting}
                  aria-describedby={flow.reason ? REASON_ID : undefined}
                  variant="cta" size="cta"
                >
                  {flow.isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      Confirmando…
                    </>
                  ) : (
                    'Confirmar compra'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={flow.backToEdit}
                  disabled={flow.isSubmitting}
                  className="h-12 w-full rounded-full text-base md:h-10 md:rounded-sm md:text-sm"
                >
                  Voltar e editar
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                form={FORM_ID}
                disabled={!flow.canProceed || flow.isReviewing || flow.isSubmitting}
                aria-describedby={flow.reason ? REASON_ID : undefined}
                variant="cta" size="cta"
              >
                {flow.isReviewing ? (
                  <>
                    <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    Revisando…
                  </>
                ) : (
                  'Revisar pedido'
                )}
              </Button>
            )}
            {flow.reason && (
              <p id={REASON_ID} className="text-xs text-muted-foreground">
                {flow.reason}
              </p>
            )}
            <Link to="/cart" className="text-center text-sm text-accent-text underline-offset-4 hover:underline">
              Voltar ao carrinho
            </Link>
          </div>
        )}
      </CheckoutSidebar>
    </div>
  )
}
