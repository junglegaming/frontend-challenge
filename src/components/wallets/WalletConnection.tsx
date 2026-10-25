import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { useConnectWallet, useDisconnectWallet } from '@/hooks/useAccount'
import type { Wallet } from '@/schemas/wallet'

interface WalletConnectionProps {
  wallet: Wallet
}

/** Status discreto da conexão, ao lado do título da carteira. */
export function WalletConnection({ wallet }: WalletConnectionProps) {
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const [actionError, setActionError] = useState<string | null>(null)
  const pending = connect.isPending || disconnect.isPending

  const onConnect = () => {
    setActionError(null)
    connect.mutate(wallet.id, {
      onSuccess: () => toast.success('Carteira conectada'),
      onError: (error) => {
        setActionError(errorMessage(error))
      },
    })
  }

  const onDisconnect = () => {
    setActionError(null)
    disconnect.mutate(wallet.id, {
      onSuccess: () => toast.success('Carteira desconectada'),
      onError: (error) => setActionError(errorMessage(error)),
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <p role="status" className="flex items-center gap-2 text-sm">
        <span className={`size-2 rounded-full ${wallet.connected ? 'bg-primary' : 'bg-muted-foreground'}`} aria-hidden="true" />
        {wallet.connected ? 'Conectada' : 'Desconectada'}
      </p>
      {wallet.connected ? (
        <Button type="button" size="sm" variant="outline" onClick={onDisconnect} disabled={pending}>
          {disconnect.isPending ? 'Desconectando…' : 'Desconectar'}
        </Button>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={onConnect} disabled={pending}>
          {connect.isPending ? 'Conectando…' : 'Conectar'}
        </Button>
      )}

      {actionError && (
        <div role="alert" className="flex w-full items-start gap-2 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}
    </div>
  )
}
