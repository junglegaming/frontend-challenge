import { Link, createFileRoute, redirect } from '@tanstack/react-router'

import { WALLET_PROVIDER_LABELS } from '@/features/checkout/checkout-form'
import { CheckoutDesktop } from '@/features/checkout/components/CheckoutDesktop'
import { CheckoutMobile } from '@/features/checkout/components/CheckoutMobile'
import { OrderReviewDialog } from '@/features/checkout/components/OrderReviewDialog'
import { shortAddress, walletDisplayName } from '@/features/checkout/format'
import { useCheckout } from '@/features/checkout/use-checkout'
import { CartSummarySkeleton } from '@/shared/components/skeletons/CartSummarySkeleton'
import { DEFAULT_NFT_LIST_QUERY } from '@/shared/contracts'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import { getToken } from '@/shared/session'

export const Route = createFileRoute('/pagamento')({
  beforeLoad: ({ location }) => {
    if (!getToken()) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: CheckoutPage,
})

function CheckoutPage() {
  const checkout = useCheckout()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // O formulário nasce com os dados do perfil: só monta depois que eles chegam.
  if (
    checkout.cartQuery.isLoading ||
    checkout.walletsQuery.isLoading ||
    checkout.isProfileLoading
  ) {
    return (
      <div className="mx-auto w-full max-w-[1248px] px-4 py-8 sm:px-6">
        <CartSummarySkeleton />
      </div>
    )
  }

  if (checkout.items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1248px] px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center justify-center rounded-[12px] border border-field bg-surface-card px-6 py-16 text-center">
          <h1 className="font-mono text-2xl font-bold text-foreground">Seu carrinho está vazio</h1>
          <p className="mt-2 font-mono text-sm text-text-secondary">
            Adicione NFTs ao carrinho para finalizar uma compra.
          </p>
          <Link
            to="/"
            search={DEFAULT_NFT_LIST_QUERY}
            className="mt-6 inline-flex rounded-[6px] bg-primary px-6 py-2.5 font-mono text-sm font-bold text-ink transition-colors hover:bg-highlight"
          >
            Explorar NFTs
          </Link>
        </div>
      </div>
    )
  }

  const wallet = checkout.selectedWallet

  return (
    <>
      {isDesktop ? <CheckoutDesktop checkout={checkout} /> : <CheckoutMobile checkout={checkout} />}
      {checkout.quote && wallet && (
        <OrderReviewDialog
          open={checkout.isReviewOpen}
          onOpenChange={(open) => {
            if (!open) checkout.closeReview()
          }}
          items={checkout.items}
          quote={checkout.quote}
          walletDescription={`${walletDisplayName(wallet)} (${shortAddress(wallet.address)}) · ${checkout.network} via ${WALLET_PROVIDER_LABELS[checkout.provider]}`}
          isSubmitting={checkout.isSubmitting}
          onConfirm={checkout.submitOrder}
        />
      )}
    </>
  )
}
