import { AlertIcon, SpinnerIcon, WalletIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/button'
import type { WalletConnectionState } from '../hooks/use-wallet-connection'

/** Status always has text + icon, never color alone (FR-020). Announced through the page live region. */
export function WalletConnectionStatus({
  state,
  canConnect,
  onConnect,
  onDisconnect,
}: {
  state: WalletConnectionState
  /** A wallet and a compatible network are selected. */
  canConnect: boolean
  onConnect: () => void
  onDisconnect: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite" className="flex items-center gap-2 text-body">
        {state.status === 'connecting' && <SpinnerIcon aria-hidden="true" className="size-4 animate-spin text-primary" />}
        {state.status === 'connected' && <WalletIcon aria-hidden="true" className="size-4 text-success" />}
        {state.status === 'rejected' && <AlertIcon aria-hidden="true" className="size-4 text-destructive" />}
        <span>
          <span className="text-muted-foreground">Status da carteira: </span>
          <span className="font-bold">
            {state.status === 'idle' && 'Desconectada'}
            {state.status === 'connecting' && 'Conectando…'}
            {state.status === 'connected' && 'Conectada'}
            {state.status === 'rejected' && 'Recusada'}
          </span>
        </span>
      </p>

      {state.status === 'connected' ? (
        <Button type="button" variant="outline" size="sm" onClick={onDisconnect}>
          Desconectar
        </Button>
      ) : (
        <Button type="button" size="sm" disabled={!canConnect || state.status === 'connecting'} onClick={onConnect}>
          {state.status === 'rejected' ? 'Tentar novamente' : 'Conectar'}
        </Button>
      )}

      {state.status === 'rejected' && (
        <p role="alert" className="text-caption text-destructive sm:basis-full">
          {state.message}
        </p>
      )}
    </div>
  )
}
