import { Link, useRouter } from '@tanstack/react-router'

import { ArrowLeft } from 'lucide-react'

import { networkSchema, walletProviderSchema } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { formatEth } from '@/shared/lib/money'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import { WALLET_PROVIDER_LABELS } from '../checkout-form'
import { shortAddress, walletDisplayName } from '../format'
import type { CheckoutState } from '../use-checkout'
import { QuoteChangedAlert } from './QuoteChangedAlert'
import { WalletConnectionPanel } from './WalletConnectionPanel'

const PROVIDER_INITIALS = { walletconnect: 'W', metamask: 'M', coinbase: 'C' } as const

/** Props de {@link CheckoutMobile}. */
interface CheckoutMobileProps {
  checkout: CheckoutState
}

/**
 * Pagamento mobile (Figma 414): carteiras cadastradas, rede, provedor, conexão
 * e confirmação.
 *
 * @param props - {@link CheckoutMobileProps}
 * @returns Layout mobile do checkout.
 */
export function CheckoutMobile({ checkout }: CheckoutMobileProps) {
  const router = useRouter()
  const quote = checkout.quote

  return (
    <div className="flex w-full flex-col bg-background px-7 py-8">
      <div className="mx-auto flex w-full max-w-[358px] flex-col justify-between gap-6">
        <div className="flex w-full flex-col gap-4">
          <div className="relative flex h-[44px] w-full items-center">
            <button
              type="button"
              onClick={() => router.history.back()}
              aria-label="Voltar"
              className="absolute top-1 left-0 flex size-[35px] cursor-pointer items-center justify-center rounded-full border border-field bg-surface-raised transition-colors hover:border-sand"
            >
              <ArrowLeft className="size-4 text-sand" strokeWidth={2} />
            </button>
            <h1 className="pl-[47px] font-mono text-[20px] leading-4 font-bold text-foreground">
              Pagamento com carteira
            </h1>
          </div>

          <div className="flex h-4 w-full items-center justify-between pt-1">
            <h2
              id="wallets-heading"
              className="font-mono text-[16px] leading-4 font-bold text-foreground"
            >
              Carteira conectada
            </h2>
            <Link
              to="/carteiras"
              className="font-mono text-[14px] leading-4 font-bold text-highlight transition-colors hover:underline"
            >
              Trocar carteira
            </Link>
          </div>

          {checkout.wallets.length > 0 && (
            <div
              role="radiogroup"
              aria-labelledby="wallets-heading"
              className="flex w-full flex-col gap-5 pt-1"
            >
              {checkout.wallets.map((wallet) => {
                const isSelected = checkout.selectedWallet?.id === wallet.id
                return (
                  <button
                    key={wallet.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => checkout.selectWallet(wallet.id)}
                    className={cn(
                      'relative flex min-h-[93px] w-full cursor-pointer items-start justify-between rounded-[14px] bg-surface-card p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      isSelected ? 'shadow-wallet' : 'opacity-80 hover:opacity-100',
                    )}
                  >
                    <span className="flex items-start gap-4">
                      <span
                        className={cn(
                          'mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border',
                          isSelected ? 'border-primary' : 'border-surface-dark',
                        )}
                      >
                        {isSelected && <span className="size-2 rounded-full bg-primary" />}
                      </span>
                      <span className="flex flex-col font-mono">
                        <span className="text-[16px] leading-4 font-bold text-foreground">
                          {walletDisplayName(wallet)}
                        </span>
                        <span className="mt-2 text-[14px] leading-[22px] font-normal text-text-secondary">
                          {shortAddress(wallet.address)}
                        </span>
                        <span className="text-[14px] leading-[22px] font-normal text-text-secondary">
                          Rede {wallet.network}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {checkout.selectedWallet && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mobile-network"
                className="font-mono text-[14px] font-bold text-foreground"
              >
                Rede do pagamento
              </label>
              <Select
                value={checkout.network}
                onValueChange={(value) => checkout.selectNetwork(networkSchema.parse(value))}
              >
                <SelectTrigger id="mobile-network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {networkSchema.options.map((network) => (
                    <SelectItem key={network} value={network}>
                      {network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex w-full flex-col gap-4 pt-2">
            <h2
              id="providers-heading"
              className="font-mono text-[16px] leading-4 font-bold text-foreground"
            >
              Carteira e rede
            </h2>
            <div
              role="radiogroup"
              aria-labelledby="providers-heading"
              className="flex flex-col gap-4"
            >
              {walletProviderSchema.options.map((value) => {
                const isSelected = checkout.provider === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => checkout.selectProvider(value)}
                    className={cn(
                      'flex h-[65px] w-full cursor-pointer items-center justify-between rounded-[15px] bg-surface-card px-3.5 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      isSelected ? 'shadow-option' : 'opacity-80 hover:opacity-100',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-field bg-surface-raised font-mono text-[14px] font-bold text-highlight"
                      >
                        {PROVIDER_INITIALS[value]}
                      </span>
                      <span className="font-mono text-[14px] leading-4 font-normal text-foreground">
                        {WALLET_PROVIDER_LABELS[value]}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full border',
                        isSelected ? 'border-primary' : 'border-surface-dark',
                      )}
                    >
                      {isSelected && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <WalletConnectionPanel
            wallet={checkout.selectedWallet}
            providerLabel={WALLET_PROVIDER_LABELS[checkout.provider]}
            network={checkout.network}
            status={checkout.connectionStatus}
            errorMessage={checkout.connectErrorMessage}
            onConnect={checkout.connect}
            onDisconnect={checkout.disconnect}
          />

          {checkout.isQuoteChanged && checkout.acceptedTotal && quote && (
            <QuoteChangedAlert
              reviewedTotalEth={checkout.acceptedTotal}
              currentTotalEth={quote.totalEth}
              onAccept={checkout.acceptNewTotal}
            />
          )}

          <div className="flex w-full items-center justify-end gap-7 pt-2 font-mono">
            <span className="text-[16px] leading-4 font-bold text-foreground">Total:</span>
            <span aria-live="polite" className="text-[18px] leading-4 font-bold text-highlight">
              {quote ? `${formatEth(quote.totalEth)} ETH` : '—'}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 pt-2">
          <button
            type="button"
            disabled={!checkout.canReview || checkout.isSubmitting}
            onClick={checkout.openReview}
            className="flex h-[60px] w-full cursor-pointer items-center justify-center rounded-[40px] bg-gradient-to-r from-primary to-primary/80 font-mono text-[15px] leading-4 font-bold text-ink shadow-card transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkout.isSubmitting ? 'Confirmando…' : 'Confirmar compra'}
          </button>
          {!checkout.canReview && (
            <p aria-live="polite" className="text-center font-mono text-xs text-text-secondary">
              {checkout.blockers[0]}
            </p>
          )}
          {checkout.orderErrorMessage && (
            <p role="alert" className="text-center font-mono text-xs text-coral">
              {checkout.orderErrorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
