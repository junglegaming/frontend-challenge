import { useNavigate } from '@tanstack/react-router'
import { useLogout } from '@/domains/auth'
import { useWallets, WalletForm } from '@/domains/wallets'
import { AccountSideMenu } from '@/shared/ui/account-side-menu'
import { PageContainer } from '@/shared/ui/page-container'
import { Skeleton } from '@/shared/ui/skeleton'
import { SecondaryWalletSection } from './components/SecondaryWalletSection'

export function WalletsPage() {
  const wallets = useWallets()
  const logout = useLogout()
  const navigate = useNavigate()
  const primary = wallets.data?.find((w) => w.slot === 'primary')
  const secondary = wallets.data?.find((w) => w.slot === 'secondary')

  async function handleLogout() {
    try {
      await logout.mutateAsync()
    } catch {
      // The local session is dropped regardless (useLogout's onSettled).
    }
    await navigate({ to: '/' })
  }

  return (
    <PageContainer className="grid gap-8 py-8 lg:grid-cols-[310px_1fr]">
      <AccountSideMenu active="wallets" onLogout={handleLogout} />
      <section aria-labelledby="wallets-title" className="flex flex-col gap-6">
        <div>
          <h1 id="wallets-title" className="text-title font-bold">
            Carteira principal
          </h1>
          <p className="text-muted-foreground">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
        </div>

        {wallets.isPending && <Skeleton className="h-64 w-full" />}
        {wallets.data && <WalletForm key={primary?.id ?? 'new'} slot="primary" wallet={primary} />}

        {wallets.data && <SecondaryWalletSection primary={primary} secondary={secondary} />}
      </section>
    </PageContainer>
  )
}
