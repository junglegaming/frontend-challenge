import { useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { CheckoutContent } from '@/components/checkout/CheckoutContent'
import { CheckoutRecovery } from '@/components/checkout/CheckoutRecovery'
import { CheckoutSkeleton } from '@/components/checkout/CheckoutSkeleton'
import { MobileBackLink } from '@/components/cart/MobileBackLink'
import { PageBreadcrumbs } from '@/components/cart/PageBreadcrumbs'
import { useProfile, useWallets } from '@/hooks/useAccount'
import { useCart } from '@/hooks/useCart'
import { checkoutDraftStore, pendingOrderStore } from '@/lib/storage'

export const Route = createFileRoute('/_auth/checkout')({
  component: Page,
})

function Page() {
  const { user } = Route.useRouteContext()
  const cart = useCart()
  const wallets = useWallets()
  const profile = useProfile()
  const navigate = useNavigate()
  const storedAttempt = pendingOrderStore(user.id).get()
  const savedOrderId = storedAttempt?.orderId ?? null
  const hasUnresolvedAttempt = Boolean(storedAttempt && !storedAttempt.orderId)

  useEffect(() => {
    if (!savedOrderId) return
    checkoutDraftStore(user.id).set(null)
    void navigate({ to: '/orders/$orderId', params: { orderId: savedOrderId } })
  }, [savedOrderId, user.id, navigate])

  if (cart.isPending || wallets.isPending || profile.isPending) {
    return (
      <CheckoutShell>
        <CheckoutSkeleton />
      </CheckoutShell>
    )
  }

  if (cart.isError) {
    return (
      <CheckoutShell>
        <ErrorState
          error={cart.error}
          title="Não foi possível carregar o carrinho"
          onRetry={() => void cart.refetch()}
          isRetrying={cart.isFetching}
        />
      </CheckoutShell>
    )
  }

  if (wallets.isError) {
    return (
      <CheckoutShell>
        <ErrorState
          error={wallets.error}
          title="Não foi possível carregar suas carteiras"
          onRetry={() => void wallets.refetch()}
          isRetrying={wallets.isFetching}
        />
      </CheckoutShell>
    )
  }

  if (!cart.data || !wallets.data) {
    return (
      <CheckoutShell>
        <CheckoutSkeleton />
      </CheckoutShell>
    )
  }

  if (savedOrderId) {
    return (
      <CheckoutShell>
        <CheckoutSkeleton />
      </CheckoutShell>
    )
  }

  if (cart.data.items.length === 0) {
    if (hasUnresolvedAttempt) {
      return (
        <CheckoutShell>
          <CheckoutRecovery />
        </CheckoutShell>
      )
    }
    return (
      <CheckoutShell>
        <EmptyState
          title="Seu carrinho está vazio"
          description="Adicione NFTs ao carrinho para revisar o pagamento."
          action={
            <Button asChild>
              <Link to="/" hash="catalogo">
                Explorar NFTs
              </Link>
            </Button>
          }
        />
      </CheckoutShell>
    )
  }

  return (
    <CheckoutShell>
      <CheckoutContent cart={cart.data} wallets={wallets.data} profile={profile.data ?? null} user={user} />
    </CheckoutShell>
  )
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer className="px-7 py-8">
      <div className="hidden md:block">
        <PageBreadcrumbs current="Pagamento" />
      </div>
      <header className="mb-7 flex h-11 items-center gap-6 md:hidden">
        <MobileBackLink to="/cart" label="Voltar ao carrinho" />
        <h1 className="text-lg font-bold whitespace-nowrap min-[400px]:text-xl">Pagamento com carteira</h1>
      </header>
      <h1 className="sr-only hidden md:block">Pagamento</h1>
      {children}
    </PageContainer>
  )
}
