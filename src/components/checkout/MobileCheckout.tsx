import { Link } from '@tanstack/react-router'
import { Loader2, MoreVertical, WalletMinimal } from 'lucide-react'
import { useState } from 'react'
import { errorMessage } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useConnectWallet, useDisconnectWallet } from '@/hooks/useAccount'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import type { Cart } from '@/schemas/cart'
import { NETWORK_LABELS } from '@/schemas/common'
import { WALLET_PROVIDER_LABELS, type Wallet, type WalletProvider } from '@/schemas/wallet'
import { PlaceErrorPanel, ReviewErrorPanel } from './CheckoutErrorPanels'
import { QuoteDiff } from './QuoteDiff'
import { QuoteReview } from './QuoteReview'
import type { useCheckoutFlow } from './useCheckoutFlow'

const PROVIDERS: { id: WalletProvider; badge: React.ReactNode }[] = [
  { id: 'walletconnect', badge: 'W' },
  { id: 'metamask', badge: 'M' },
  { id: 'coinbase', badge: <WalletMinimal className="size-5" aria-hidden="true" /> },
]

interface MobileCheckoutProps {
  cart: Cart
  wallets: Wallet[]
  flow: ReturnType<typeof useCheckoutFlow>
}

/** Pagamento mobile do Figma: carteiras cadastradas, provedor derivado da carteira e um único botão no rodapé. */
export function MobileCheckout({ cart, wallets, flow }: MobileCheckoutProps) {
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const [walletError, setWalletError] = useState<string | null>(null)
  const selected = flow.selectedWallet
  const total = flow.quote?.total ?? cart.summary.total
  const showPlaceError = Boolean(flow.placeError || flow.unconfirmedAttempt)

  const connectWallet = (wallet: Wallet) => {
    setWalletError(null)
    connect.mutate(wallet.id, {
      onError: (error) => setWalletError(errorMessage(error)),
    })
  }
  const disconnectWallet = (wallet: Wallet) => {
    setWalletError(null)
    disconnect.mutate(wallet.id, { onSuccess: flow.disconnectWallet, onError: (error) => setWalletError(errorMessage(error)) })
  }

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl bg-card p-5">
        <p className="text-sm text-muted-foreground">Cadastre uma carteira para pagar.</p>
        <Button asChild className="rounded-full">
          <Link to="/wallets" search={{ redirect: '/checkout' }}>
            Cadastrar carteira
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-32" aria-busy={flow.busy}>
      {flow.notice && (
        <p role="status" aria-live="polite" className="rounded-xl border border-border-soft px-4 py-3 text-sm text-accent-text">
          {flow.notice}
        </p>
      )}

      <section aria-labelledby="mobile-wallets-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="mobile-wallets-heading" className="text-base font-bold">
            Carteira conectada
          </h2>
          <Link to="/wallets" search={{ redirect: '/checkout' }} className="text-base font-bold text-accent-text">
            Trocar carteira
          </Link>
        </div>

        <div role="radiogroup" aria-labelledby="mobile-wallets-heading" className="flex flex-col gap-5">
          {wallets.map((wallet) => {
            const checked = wallet.id === selected?.id
            const busy = (connect.isPending && connect.variables === wallet.id) || (disconnect.isPending && disconnect.variables === wallet.id)
            return (
              <div key={wallet.id} className="relative flex items-center gap-4 rounded-2xl bg-card py-4 pr-3 pl-4">
                <button
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={`${wallet.nickname}, rede ${NETWORK_LABELS[wallet.network]}`}
                  disabled={flow.isSubmitting}
                  onClick={() => flow.selectWallet(wallet)}
                  className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
                >
                  <Radio checked={checked} />
                </button>
                <div className="min-w-0 flex-1 text-sm leading-6">
                  <p className="text-base font-bold">{wallet.nickname}</p>
                  <p className="truncate text-muted-foreground">
                    {wallet.ensName ? `${wallet.ensName}.eth` : `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`}
                  </p>
                  <p className="text-muted-foreground">
                    Rede {wallet.slot === 'primary' ? 'principal ' : ''}
                    {NETWORK_LABELS[wallet.network]}
                    {wallet.connected && <span className="ml-2 text-xs text-accent-text">Conectada</span>}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Opções da carteira ${wallet.nickname}`} className="relative z-10 text-primary">
                      {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <MoreVertical aria-hidden="true" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {wallet.connected ? (
                      <DropdownMenuItem onSelect={() => disconnectWallet(wallet)}>Desconectar</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => connectWallet(wallet)}>Conectar</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
        {walletError && (
          <p role="alert" className="text-sm text-destructive">
            {walletError}
          </p>
        )}
      </section>

      <section aria-labelledby="mobile-provider-heading" className="flex flex-col gap-4">
        <h2 id="mobile-provider-heading" className="text-base font-bold">
          Carteira e rede
        </h2>
        <div role="radiogroup" aria-labelledby="mobile-provider-heading" className="flex flex-col gap-4">
          {PROVIDERS.map(({ id, badge }) => {
            // O provedor é o da carteira escolhida; escolher outro seleciona a carteira cadastrada nele, se houver.
            const owner = wallets.find((wallet) => wallet.provider === id)
            const checked = selected?.provider === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={checked}
                disabled={!owner || flow.isSubmitting}
                onClick={() => owner && flow.selectWallet(owner)}
                className="flex h-16 items-center gap-4 rounded-2xl bg-card px-4 text-left text-base disabled:cursor-not-allowed"
              >
                <span className="grid size-10 place-items-center rounded-full bg-surface-dark/60 font-bold text-accent-text" aria-hidden="true">
                  {badge}
                </span>
                <span className="flex-1">{WALLET_PROVIDER_LABELS[id]}</span>
                <Radio checked={checked} />
              </button>
            )
          })}
        </div>
      </section>

      {flow.quote && (
        <div className="flex flex-col gap-5 rounded-2xl bg-card p-4">
          {flow.staleDiff && <QuoteDiff previous={flow.staleDiff.previous} next={flow.staleDiff.next} />}
          <QuoteReview quote={flow.quote} />
        </div>
      )}
      {showPlaceError && flow.step !== 'submitting' && (
        <PlaceErrorPanel error={flow.placeError} uncertain={!flow.placeError || flow.uncertain} onRetry={flow.retry} isRetrying={flow.isSubmitting} />
      )}
      {flow.reviewError && <ReviewErrorPanel error={flow.reviewError} />}

      <p className="flex items-baseline justify-end gap-6 text-lg font-bold">
        Total: <span className="text-xl text-accent-text">{formatEth(total)}</span>
      </p>

      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 bg-background px-7 pt-3 pb-6">
        {flow.reason && <p className="text-center text-xs text-muted-foreground">{flow.reason}</p>}
        {!selected?.connected ? (
          <Button
            type="button"
            onClick={() => selected && connectWallet(selected)}
            disabled={!selected || connect.isPending}
            variant="cta" size="cta"
          >
            {connect.isPending ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : 'Conectar carteira'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={flow.quote ? flow.confirm : () => flow.review(flow.initialValues)}
            disabled={!flow.canProceed || flow.isReviewing || flow.isSubmitting}
            variant="cta" size="cta"
          >
            {flow.isReviewing || flow.isSubmitting ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
            {flow.quote ? 'Confirmar compra' : flow.isReviewing ? 'Revisando…' : 'Revisar pedido'}
          </Button>
        )}
        {flow.quote && (
          <Button type="button" variant="ghost" onClick={flow.backToEdit} disabled={flow.isSubmitting} className="text-accent-text">
            Voltar
          </Button>
        )}
      </div>
    </div>
  )
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn('grid size-6 place-items-center rounded-full border-2', checked ? 'border-primary' : 'border-border-soft')}
    >
      {checked && <span className="size-3 rounded-full bg-primary" />}
    </span>
  )
}
