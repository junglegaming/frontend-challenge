import { Link } from '@tanstack/react-router'

import type { Wallet } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'

import { shortAddress, walletDisplayName } from '../format'
import type { WalletConnectionStatus } from '../use-checkout'

/** Props de {@link WalletConnectionPanel}. */
interface WalletConnectionPanelProps {
  /** Carteira cadastrada escolhida (null se o usuário não tem nenhuma). */
  wallet: Wallet | null
  /** Rótulo do provedor escolhido (ex.: MetaMask). */
  providerLabel: string
  /** Rede escolhida para a conexão. */
  network: string
  status: WalletConnectionStatus
  /** Mensagem da última falha de conexão. */
  errorMessage: string | null
  onConnect: () => void
  onDisconnect: () => void
}

/**
 * Conexão simulada da carteira no checkout: conectar, recusa e desconexão.
 * O estado é anunciado para leitores de tela (`aria-live`).
 *
 * @param props - {@link WalletConnectionPanelProps}
 * @returns Painel com o estado da conexão e a ação disponível.
 */
export function WalletConnectionPanel({
  wallet,
  providerLabel,
  network,
  status,
  errorMessage,
  onConnect,
  onDisconnect,
}: WalletConnectionPanelProps) {
  if (!wallet) {
    return (
      <div className="flex flex-col gap-2 rounded-[6px] border border-field p-3 font-mono text-[14px] leading-5">
        <p className="text-foreground">Você ainda não tem carteiras cadastradas.</p>
        <Link
          to="/carteiras"
          className="font-bold text-highlight hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Cadastrar carteira
        </Link>
      </div>
    )
  }

  const description = `${walletDisplayName(wallet)} · ${shortAddress(wallet.address)} · ${network} via ${providerLabel}`

  return (
    <div className="flex flex-col gap-2 rounded-[6px] border border-field p-3 font-mono">
      <p aria-live="polite" className="text-[14px] leading-5 text-foreground">
        {status === 'connected' && (
          <>
            <span className="font-bold text-success">Carteira conectada:</span> {description}
          </>
        )}
        {status === 'connecting' && <>Aguardando aprovação na carteira…</>}
        {status === 'idle' && <>Conecte {description} para confirmar.</>}
        {status === 'rejected' && (
          <span className="text-coral">
            {errorMessage ?? 'A conexão foi recusada.'} Tente novamente.
          </span>
        )}
      </p>
      {status === 'connected' ? (
        <Button type="button" size="sm" variant="secondary" onClick={onDisconnect}>
          Desconectar carteira
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={status === 'connecting'}
          onClick={onConnect}
        >
          {status === 'connecting' ? 'Conectando…' : 'Conectar carteira'}
        </Button>
      )}
    </div>
  )
}
