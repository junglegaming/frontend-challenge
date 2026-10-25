import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { AccountSidebar } from '@/components/profile/AccountSidebar'
import { Button } from '@/components/ui/button'
import { WalletCard } from '@/components/wallets/WalletCard'
import { WalletSkeleton } from '@/components/wallets/WalletSkeleton'
import { useWallets } from '@/hooks/useAccount'
import { redirectSearchSchema } from '@/lib/redirect'

export const Route = createFileRoute('/_auth/wallets')({
  validateSearch: redirectSearchSchema,
  component: Page,
})

function Page() {
  const { redirect } = Route.useSearch()
  const wallets = useWallets()
  const [justSaved, setJustSaved] = useState(false)
  const fromCheckout = Boolean(redirect?.startsWith('/checkout'))
  const primary = wallets.data?.find((wallet) => wallet.slot === 'primary')
  const secondary = wallets.data?.find((wallet) => wallet.slot === 'secondary')

  return (
    <PageContainer className="pt-8 pb-16">
      <h1 className="sr-only">Carteiras</h1>
      <div className="grid grid-cols-1 gap-7 md:grid-cols-[310px_minmax(0,1fr)]">
        <AccountSidebar />
        <div className="flex flex-col gap-8">
          {fromCheckout && justSaved && (
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary/40 bg-card px-4 py-3">
              <p className="text-sm">Carteira salva. Você já pode voltar ao pagamento.</p>
              <Button asChild variant="outline">
                <Link to="/checkout">Voltar ao pagamento</Link>
              </Button>
            </div>
          )}

          {wallets.isPending && <WalletSkeleton />}
          {wallets.isError && (
            <ErrorState
              error={wallets.error}
              title="Não foi possível carregar suas carteiras"
              onRetry={() => void wallets.refetch()}
              isRetrying={wallets.isFetching}
            />
          )}
          {wallets.data && (
            <>
              <WalletCard
                slot="primary"
                title="Carteira principal"
                description="Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados."
                wallet={primary}
                onSaved={() => setJustSaved(true)}
              />
              <WalletCard
                slot="secondary"
                title="Carteira secundária"
                emptyMessage="Você ainda não adicionou uma carteira secundária."
                wallet={secondary}
                source={primary}
                onSaved={() => setJustSaved(true)}
              />
            </>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
