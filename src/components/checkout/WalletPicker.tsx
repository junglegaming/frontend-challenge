import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Loader2, Unplug } from 'lucide-react'
import { errorMessage } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useConnectWallet, useDisconnectWallet } from '@/hooks/useAccount'
import { WALLET_PROVIDER_LABELS, type Wallet } from '@/schemas/wallet'
import { cn } from '@/lib/utils'

interface WalletPickerProps {
  wallets: Wallet[]
  selectedId: string | null
  onSelect: (wallet: Wallet) => void
  onDisconnect?: (wallet: Wallet) => void
  disabled?: boolean
}

export function WalletPicker({ wallets, selectedId, onSelect, onDisconnect, disabled = false }: WalletPickerProps) {
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const [actionError, setActionError] = useState<string | null>(null)

  if (wallets.length === 0) {
    return (
      <section aria-labelledby="wallet-picker-heading" className="flex flex-col gap-3">
        <h2 id="wallet-picker-heading" className="text-center text-base leading-4 font-bold">
          Carteira e rede
        </h2>
        <div className="rounded-sm border border-dashed border-border-soft p-4">
          <p className="font-bold">Nenhuma carteira cadastrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre uma carteira para pagar com segurança. Você volta direto para o pagamento depois.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/wallets" search={{ redirect: '/checkout' }}>
              Cadastrar carteira
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  const handleConnect = (wallet: Wallet) => {
    setActionError(null)
    connect.mutate(wallet.id, {
      onError: (error) => {
        setActionError(errorMessage(error))
      },
    })
  }

  const handleDisconnect = (wallet: Wallet) => {
    setActionError(null)
    disconnect.mutate(wallet.id, {
      onSuccess: (updated) => onDisconnect?.(updated),
      onError: (error) => setActionError(errorMessage(error)),
    })
  }

  return (
    <section aria-labelledby="wallet-picker-heading" className="flex flex-col gap-4">
      <h2 id="wallet-picker-heading" className="text-center text-base leading-4 font-bold">
        Carteira e rede
      </h2>
      <p className="sr-only">Escolha a carteira conectada que assinará a compra.</p>

      <RadioGroup
        value={selectedId ?? ''}
        onValueChange={(value) => {
          const wallet = wallets.find((item) => item.id === value)
          if (wallet) onSelect(wallet)
        }}
        disabled={disabled}
        aria-label="Carteira e rede"
        className="gap-4"
      >
        {wallets.map((wallet) => {
          const isSelected = wallet.id === selectedId
          const isConnecting = connect.isPending && connect.variables === wallet.id
          const isDisconnecting = disconnect.isPending && disconnect.variables === wallet.id
          return (
            <div
              key={wallet.id}
              className={cn(
                'flex min-h-[60px] items-center gap-3 rounded-sm border px-4 py-2',
                isSelected ? 'border-primary' : 'border-border',
              )}
            >
              <RadioGroupItem value={wallet.id} id={`wallet-${wallet.id}`} />
              <Label htmlFor={`wallet-${wallet.id}`} className="min-w-0 flex-1 truncate text-base font-medium">
                {WALLET_PROVIDER_LABELS[wallet.provider]}
                <span className="sr-only"> — {wallet.slot === 'primary' ? 'carteira principal' : 'carteira secundária'}</span>
              </Label>
              {wallet.connected ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-xs whitespace-nowrap text-subtle">Conectada</span>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Desconectar ${WALLET_PROVIDER_LABELS[wallet.provider]}`}
                    disabled={disabled || isConnecting || isDisconnecting}
                    onClick={() => handleDisconnect(wallet)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : (
                      <Unplug aria-hidden="true" />
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={disabled || isConnecting || isDisconnecting}
                  onClick={() => handleConnect(wallet)}
                  className="shrink-0 text-accent-text hover:text-accent-text"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      <span className="sr-only">Conectando…</span>
                    </>
                  ) : (
                    'Conectar'
                  )}
                </Button>
              )}
            </div>
          )
        })}
      </RadioGroup>

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
    </section>
  )
}
