import { useState } from 'react'

import { Link } from '@tanstack/react-router'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, type UseFormRegisterReturn, useForm } from 'react-hook-form'

import {
  DEFAULT_NFT_LIST_QUERY,
  type Profile,
  networkSchema,
  walletProviderSchema,
} from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { formatEth, mul } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import {
  type CollectorForm,
  ENS_DOMAINS,
  WALLET_PROVIDER_LABELS,
  collectorFormSchema,
  ensDomainSchema,
} from '../checkout-form'
import { formatTokenId, shortAddress, walletDisplayName } from '../format'
import type { CheckoutState } from '../use-checkout'
import { QuoteChangedAlert } from './QuoteChangedAlert'
import { WalletConnectionPanel } from './WalletConnectionPanel'

const labelClass =
  'flex h-[29px] items-center font-mono text-[15px] leading-[15px] font-normal text-foreground'
const requiredMark = <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
const errorClass = 'mt-1 font-mono text-[12px] leading-4 text-coral'

function defaultsFrom(profile: Profile | undefined): CollectorForm {
  const name = profile?.name ?? ''
  return {
    displayName: name,
    username: name.toLowerCase().replace(/[^a-z0-9._]/g, ''),
    profileName: name,
    email: profile?.email ?? '',
    secondaryWallet: '',
    referralCode: '',
    ensDomain: '.eth',
    collectorNote: '',
  }
}

/** Props de {@link CheckoutDesktop}. */
interface CheckoutDesktopProps {
  checkout: CheckoutState
}

/**
 * Pagamento desktop (Figma 1440): perfil do colecionador validado à esquerda;
 * itens, totais, carteira e confirmação à direita.
 *
 * @param props - {@link CheckoutDesktopProps}
 * @returns Layout desktop do checkout.
 */
export function CheckoutDesktop({ checkout }: CheckoutDesktopProps) {
  const form = useForm<CollectorForm>({
    resolver: zodResolver(collectorFormSchema),
    defaultValues: defaultsFrom(checkout.profile),
  })
  const { errors } = form.formState
  const [showPromoInput, setShowPromoInput] = useState(false)
  const [couponInput, setCouponInput] = useState('')

  const otherWallet = checkout.wallets.find((w) => w.id !== checkout.selectedWallet?.id)
  const isUsingOtherWallet = Boolean(checkout.selectedWallet && !checkout.selectedWallet.isPrimary)
  const providerLabel = WALLET_PROVIDER_LABELS[checkout.provider]

  function fieldA11y(name: keyof CollectorForm) {
    return {
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby': errors[name] ? `${name}-error` : undefined,
    }
  }

  function renderError(name: keyof CollectorForm) {
    const message = errors[name]?.message
    return message ? (
      <p id={`${name}-error`} className={errorClass}>
        {message}
      </p>
    ) : null
  }

  function textField(
    name: keyof CollectorForm,
    label: string,
    registration: UseFormRegisterReturn,
    options: { type?: string; required?: boolean } = {},
  ) {
    return (
      <div className="flex flex-col">
        <label htmlFor={name} className={labelClass}>
          {label}
          {options.required !== false && requiredMark}
        </label>
        <Input id={name} type={options.type ?? 'text'} {...registration} {...fieldA11y(name)} />
        {renderError(name)}
      </div>
    )
  }

  const quote = checkout.quote
  const totalText = quote ? `${formatEth(quote.totalEth)} ETH` : '—'

  return (
    <div className="mx-auto flex w-full max-w-[1248px] flex-col gap-[96px] px-4 py-6 sm:px-6">
      <section aria-label="Página de Pagamento" className="flex w-full flex-col gap-8">
        <nav
          aria-label="Breadcrumb"
          className="flex h-4 items-center gap-2 font-mono text-[15px] leading-4 font-bold text-foreground"
        >
          <Link
            to="/"
            search={DEFAULT_NFT_LIST_QUERY}
            className="transition-colors hover:text-primary"
          >
            Início
          </Link>
          <span>/</span>
          <Link
            to="/"
            search={DEFAULT_NFT_LIST_QUERY}
            className="transition-colors hover:text-primary"
          >
            Mercado
          </Link>
          <span>/</span>
          <span>Pagamento</span>
        </nav>
        <h1 className="sr-only">Pagamento</h1>

        <form
          noValidate
          onSubmit={form.handleSubmit(() => checkout.openReview())}
          className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-8"
        >
          {/* Perfil do colecionador (763px) */}
          <div className="flex w-full flex-1 flex-col gap-3 lg:max-w-[763px]">
            <h2 className="font-mono text-[17px] leading-4 font-bold text-foreground">
              Perfil do colecionador
            </h2>

            <div className="flex flex-col gap-6">
              <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-3">
                  {textField('displayName', 'Nome de exibição', form.register('displayName'))}

                  <div className="flex flex-col">
                    <label htmlFor="network" className={labelClass}>
                      Rede{requiredMark}
                    </label>
                    <Select
                      value={checkout.network}
                      onValueChange={(value) => checkout.selectNetwork(networkSchema.parse(value))}
                    >
                      <SelectTrigger id="network">
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

                  <div className="flex flex-col">
                    <label htmlFor="walletId" className={labelClass}>
                      Endereço da carteira{requiredMark}
                    </label>
                    {checkout.wallets.length > 0 ? (
                      <Select
                        value={checkout.selectedWallet?.id ?? ''}
                        onValueChange={checkout.selectWallet}
                      >
                        <SelectTrigger id="walletId">
                          <SelectValue placeholder="Selecione uma carteira" />
                        </SelectTrigger>
                        <SelectContent>
                          {checkout.wallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {shortAddress(wallet.address)} · {walletDisplayName(wallet)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Link
                        id="walletId"
                        to="/carteiras"
                        className="flex h-[40px] items-center rounded-[3px] border border-field px-3 font-mono text-[14px] text-highlight hover:border-primary"
                      >
                        Cadastre uma carteira para pagar
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="provider" className={labelClass}>
                      Tipo de carteira{requiredMark}
                    </label>
                    <Select
                      value={checkout.provider}
                      onValueChange={(value) =>
                        checkout.selectProvider(walletProviderSchema.parse(value))
                      }
                    >
                      <SelectTrigger id="provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WALLET_PROVIDER_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {textField('email', 'E-mail', form.register('email'), { type: 'email' })}
                </div>

                <div className="flex flex-col gap-3">
                  {textField('username', 'Nome de usuário', form.register('username'))}
                  {textField('profileName', 'Nome do perfil', form.register('profileName'))}

                  <div className="flex flex-col justify-end sm:min-h-[69px]">
                    <label htmlFor="secondaryWallet" className="sr-only">
                      ENS ou carteira secundária (opcional)
                    </label>
                    <Input
                      id="secondaryWallet"
                      placeholder="ENS ou carteira secundária (opcional)"
                      {...form.register('secondaryWallet')}
                      {...fieldA11y('secondaryWallet')}
                    />
                    {renderError('secondaryWallet')}
                  </div>

                  {textField('referralCode', 'Código de indicação', form.register('referralCode'))}

                  <div className="flex flex-col">
                    <label htmlFor="ensDomain" className={labelClass}>
                      Nome ENS{requiredMark}
                    </label>
                    <Controller
                      control={form.control}
                      name="ensDomain"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(ensDomainSchema.parse(value))}
                        >
                          <SelectTrigger id="ensDomain" className="w-[78px] px-2.5 text-[15px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ENS_DOMAINS.map((domain) => (
                              <SelectItem key={domain} value={domain}>
                                {domain}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isUsingOtherWallet}
                disabled={!otherWallet}
                title={otherWallet ? undefined : 'Cadastre outra carteira para alternar'}
                onClick={() => {
                  const primary = checkout.wallets.find((w) => w.isPrimary)
                  const target = isUsingOtherWallet ? primary : otherWallet
                  if (target) checkout.selectWallet(target.id)
                }}
                className="flex w-fit cursor-pointer items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span
                  className={cn(
                    'flex size-[15px] items-center justify-center rounded-full border-2 border-primary transition-colors',
                    isUsingOtherWallet ? 'bg-primary' : 'bg-transparent',
                  )}
                >
                  {isUsingOtherWallet && <span className="size-1 rounded-full bg-ink" />}
                </span>
                <span className="font-mono text-[15px] leading-5 font-normal text-foreground">
                  Usar outra carteira?
                </span>
              </button>

              <div className="flex flex-col gap-3">
                <label
                  htmlFor="collectorNote"
                  className="font-mono text-[15px] leading-[15px] font-normal text-foreground"
                >
                  Observação do colecionador (opcional)
                </label>
                <textarea
                  id="collectorNote"
                  rows={5}
                  {...form.register('collectorNote')}
                  {...fieldA11y('collectorNote')}
                  className="h-[152px] w-[350px] max-w-full resize-none rounded-[3px] border border-field bg-transparent p-3 font-mono text-[14px] text-foreground placeholder:text-sand focus:border-primary focus:outline-none"
                />
                {renderError('collectorNote')}
              </div>
            </div>
          </div>

          {/* Seus NFTs (405px) */}
          <div className="flex w-full flex-col gap-3 lg:w-[405px] lg:shrink-0">
            <h2 className="font-mono text-[17px] leading-4 font-bold text-foreground">Seus NFTs</h2>

            <div className="flex flex-col gap-3">
              <div className="flex h-4 items-center justify-between font-mono">
                <span className="text-[16px] leading-4 font-bold text-foreground">NFTs</span>
                <span className="text-[16px] leading-4 font-medium text-foreground">Subtotal</span>
              </div>
              <div className="w-full border-b-[0.3px] border-primary" />
            </div>

            <ul className="flex flex-col gap-3">
              {checkout.items.map((item) => (
                <li
                  key={item.id}
                  className="flex h-[70px] w-full items-center justify-between rounded-[8px] bg-surface-card pr-4 pl-1"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      width={70}
                      height={70}
                      className="size-[70px] shrink-0 rounded-[8px] object-cover"
                    />
                    <div className="flex min-w-0 flex-col gap-1.5 font-mono">
                      <span className="truncate text-[16px] leading-4 font-bold text-foreground">
                        {item.name}
                      </span>
                      <span className="text-[14px] leading-4 font-normal whitespace-nowrap text-sand">
                        ID do token: {formatTokenId(item.nftId)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 font-mono">
                    <span className="text-right text-[14px] leading-4 font-normal whitespace-nowrap text-text-secondary">
                      (x {item.quantity})
                    </span>
                    <span className="text-right text-[18px] leading-4 font-bold whitespace-nowrap text-highlight">
                      {formatEth(mul(item.priceEth, String(item.quantity)))} ETH
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col items-center gap-3 pt-3 font-mono">
              {checkout.appliedCoupon ? (
                <div className="flex w-full items-center justify-between rounded-[3px] border border-field bg-surface-card px-3 py-2 text-[14px]">
                  <span className="font-bold text-highlight">Cupom: {checkout.appliedCoupon}</span>
                  <button
                    type="button"
                    onClick={checkout.removeCoupon}
                    className="cursor-pointer text-[12px] text-text-secondary underline hover:text-foreground"
                  >
                    Remover
                  </button>
                </div>
              ) : showPromoInput ? (
                <div className="flex w-full gap-2">
                  <label htmlFor="couponCode" className="sr-only">
                    Código do cupom
                  </label>
                  <Input
                    id="couponCode"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && couponInput.trim()) {
                        e.preventDefault()
                        checkout.applyCoupon(couponInput)
                      }
                    }}
                    placeholder="Código do cupom"
                    className="h-[36px] flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!couponInput.trim()}
                    onClick={() => checkout.applyCoupon(couponInput)}
                  >
                    Aplicar
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPromoInput(true)}
                  className="cursor-pointer text-[14px] leading-4 font-normal text-foreground transition-colors hover:text-highlight"
                >
                  Tem um código promocional? Aplique aqui
                </button>
              )}
              {checkout.couponError && (
                <p role="alert" className="text-xs text-coral">
                  {checkout.couponError.code === 'COUPON_EXPIRED'
                    ? 'Cupom expirado.'
                    : 'Cupom inválido.'}
                </p>
              )}

              <div className="flex w-full items-center justify-between">
                <span className="text-[15px] leading-5 font-normal text-foreground">Subtotal</span>
                <span className="text-right text-[18px] leading-4 font-normal text-foreground">
                  {quote ? `${formatEth(quote.subtotalEth)} ETH` : '—'}
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <span className="text-[15px] leading-5 font-normal text-foreground">
                  Desconto do lançamento
                </span>
                <span className="text-right text-[15px] leading-5 font-normal text-foreground">
                  {quote ? `(-) ${formatEth(quote.discountEth)}` : '—'}
                </span>
              </div>
              <div className="flex w-full items-center justify-between">
                <span className="text-[15px] leading-5 font-normal text-foreground">
                  Taxa de rede
                </span>
                <span className="text-right text-[18px] leading-4 font-normal text-foreground">
                  {quote ? `${formatEth(quote.networkFeeEth)} ETH` : '—'}
                </span>
              </div>
              <span className="w-full text-center text-[12px] leading-4 font-normal text-highlight">
                Taxa estimada
              </span>
              <div className="w-full border-b-[0.3px] border-primary" />
              <div className="flex w-full items-center justify-between">
                <span className="text-[16px] leading-4 font-bold text-foreground">Total</span>
                <span
                  aria-live="polite"
                  className="text-right text-[18px] leading-4 font-bold text-highlight"
                >
                  {totalText}
                </span>
              </div>

              {checkout.isQuoteChanged && checkout.acceptedTotal && quote && (
                <QuoteChangedAlert
                  reviewedTotalEth={checkout.acceptedTotal}
                  currentTotalEth={quote.totalEth}
                  onAccept={checkout.acceptNewTotal}
                />
              )}
            </div>

            <div className="flex flex-col gap-5 pt-3">
              <h3
                id="wallet-provider-heading"
                className="w-full text-center font-mono text-[17px] leading-4 font-bold text-foreground"
              >
                Carteira e rede
              </h3>

              <div
                role="radiogroup"
                aria-labelledby="wallet-provider-heading"
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
                        'flex h-[45px] w-full cursor-pointer items-center gap-2.5 rounded-[3px] border px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                        isSelected ? 'border-primary' : 'border-field',
                      )}
                    >
                      <span className="flex size-4 items-center justify-center rounded-full border-[1.2px] border-primary">
                        {isSelected && <span className="size-2.5 rounded-full bg-primary" />}
                      </span>
                      {value === 'walletconnect' ? (
                        <span className="flex h-[26px] items-center rounded-[6px] border border-surface-dark bg-surface-dark px-2 font-mono text-[9px] leading-3 font-bold tracking-[0.1px] text-highlight">
                          METAMASK &nbsp;•&nbsp; WALLETCONNECT &nbsp;•&nbsp; COINBASE
                          <span className="sr-only"> (WalletConnect)</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[15px] leading-5 font-normal text-foreground">
                          {WALLET_PROVIDER_LABELS[value]}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <WalletConnectionPanel
                wallet={checkout.selectedWallet}
                providerLabel={providerLabel}
                network={checkout.network}
                status={checkout.connectionStatus}
                errorMessage={checkout.connectErrorMessage}
                onConnect={checkout.connect}
                onDisconnect={checkout.disconnect}
              />

              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={!checkout.canReview || checkout.isSubmitting}>
                  {checkout.isSubmitting ? 'Confirmando…' : 'Confirmar compra'}
                </Button>
                {!checkout.canReview && (
                  <p
                    aria-live="polite"
                    className="text-center font-mono text-xs text-text-secondary"
                  >
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
        </form>
      </section>
    </div>
  )
}
