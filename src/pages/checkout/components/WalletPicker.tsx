import { useEffect, useState } from 'react'
import { NETWORK_LABELS, PROVIDER_LABELS, useWallets, WalletForm, type Network, type Wallet } from '@/domains/wallets'
import { Checkbox } from '@/shared/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Skeleton } from '@/shared/ui/skeleton'
import type { WalletConnectionState } from '../hooks/use-wallet-connection'
import { WalletConnectionStatus } from './WalletConnectionStatus'

export function WalletPicker({
  selectedWalletId,
  network,
  connection,
  error,
  onSelect,
  onConnect,
  onDisconnect,
}: {
  selectedWalletId: string | null
  network: Network | null
  connection: WalletConnectionState
  error?: string
  onSelect: (walletId: string) => void
  onConnect: () => void
  onDisconnect: () => void
}) {
  const wallets = useWallets()
  const [useOtherWallet, setUseOtherWallet] = useState(false)
  const nextSlot = wallets.data?.some((w) => w.slot === 'primary')
    ? wallets.data.some((w) => w.slot === 'secondary')
      ? null
      : 'secondary'
    : 'primary'
  const selected = wallets.data?.find((w) => w.id === selectedWalletId)
  const incompatible = selected !== undefined && network !== null && !selected.networks.includes(network)

  // The primary wallet comes preselected (spec US2, scenario 1).
  useEffect(() => {
    if (selectedWalletId || !wallets.data?.length) return
    const primary = wallets.data.find((w) => w.slot === 'primary') ?? wallets.data[0]
    if (primary) onSelect(primary.id)
  }, [selectedWalletId, wallets.data, onSelect])

  return (
    <section aria-labelledby="wallet-heading" className="flex flex-col gap-4">
      <h2 id="wallet-heading" tabIndex={-1} className="text-title font-bold outline-none">
        Carteira e rede
      </h2>

      {wallets.isPending && <Skeleton className="h-24 w-full" />}

      {wallets.data && wallets.data.length > 0 && !useOtherWallet && (
        <RadioGroup
          value={selectedWalletId ?? undefined}
          onValueChange={onSelect}
          aria-label="Escolha a carteira"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'wallet-error' : undefined}
        >
          {wallets.data.map((wallet: Wallet) => (
            <label
              key={wallet.id}
              htmlFor={`wallet-${wallet.id}`}
              className="flex cursor-pointer items-start gap-3 rounded-sm border border-border p-3 text-body"
            >
              <RadioGroupItem id={`wallet-${wallet.id}`} value={wallet.id} className="mt-0.5" />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="break-words">
                  {wallet.label} — {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
                </span>
                <span className="text-caption text-muted-foreground">
                  {PROVIDER_LABELS[wallet.provider]} · {wallet.slot === 'primary' ? 'Principal' : 'Secundária'} · Redes:{' '}
                  {wallet.networks.map((n) => NETWORK_LABELS[n]).join(', ')}
                </span>
              </span>
            </label>
          ))}
        </RadioGroup>
      )}

      {error && (
        <p id="wallet-error" role="alert" className="text-caption text-destructive">
          {error}
        </p>
      )}

      {incompatible && (
        <p role="alert" className="text-caption text-destructive">
          Esta carteira não suporta a rede selecionada. Escolha outra rede ou outra carteira.
        </p>
      )}

      {wallets.data && wallets.data.length === 0 && !useOtherWallet && (
        <p className="text-muted-foreground">Você ainda não tem uma carteira salva. Adicione uma abaixo para continuar.</p>
      )}

      {selected && !useOtherWallet && (
        <WalletConnectionStatus
          state={connection}
          canConnect={network !== null && !incompatible}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      )}

      {nextSlot && wallets.data && wallets.data.length > 0 && (
        <label htmlFor="use-other-wallet" className="flex cursor-pointer items-center gap-2 text-body">
          <Checkbox id="use-other-wallet" checked={useOtherWallet} onCheckedChange={(checked) => setUseOtherWallet(checked === true)} />
          Usar outra carteira?
        </label>
      )}

      {nextSlot && (useOtherWallet || wallets.data?.length === 0) && (
        <WalletForm
          slot={nextSlot}
          onSaved={(wallet) => {
            onSelect(wallet.id)
            setUseOtherWallet(false)
          }}
        />
      )}
    </section>
  )
}
