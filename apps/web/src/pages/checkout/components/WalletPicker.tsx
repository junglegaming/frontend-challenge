import { useState } from 'react'
import { useWallets, WalletForm, type Wallet } from '@/domains/wallets'
import { Checkbox } from '@/shared/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Skeleton } from '@/shared/ui/skeleton'

export function WalletPicker({
  selectedWalletId,
  onSelect,
}: {
  selectedWalletId: string | null
  onSelect: (walletId: string) => void
}) {
  const wallets = useWallets()
  const [useOtherWallet, setUseOtherWallet] = useState(false)
  const nextSlot = wallets.data?.some((w) => w.slot === 'primary')
    ? wallets.data.some((w) => w.slot === 'secondary')
      ? null
      : 'secondary'
    : 'primary'

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-title font-bold">Carteira e rede</h2>

      {wallets.isPending && <Skeleton className="h-24 w-full" />}

      {wallets.data && wallets.data.length > 0 && !useOtherWallet && (
        <RadioGroup value={selectedWalletId ?? undefined} onValueChange={onSelect} aria-label="Escolha a carteira">
          {wallets.data.map((wallet: Wallet) => (
            <label key={wallet.id} htmlFor={`wallet-${wallet.id}`} className="flex cursor-pointer items-center gap-3 rounded-sm border border-border p-3 text-body">
              <RadioGroupItem id={`wallet-${wallet.id}`} value={wallet.id} />
              {wallet.label} — {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </label>
          ))}
        </RadioGroup>
      )}

      {wallets.data && wallets.data.length === 0 && !useOtherWallet && (
        <p className="text-muted-foreground">Você ainda não tem uma carteira salva. Adicione uma abaixo para continuar.</p>
      )}

      {nextSlot && (
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
    </div>
  )
}
