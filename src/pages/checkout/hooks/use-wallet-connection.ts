import { useMutation } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import type { Network, WalletConnection } from '@/domains/wallets'
import { api, isApiError } from '@/shared/api/http'

export type WalletConnectionState =
  | { status: 'idle' }
  | { status: 'connecting'; walletId: string; network: Network }
  | { status: 'connected'; walletId: string; network: Network }
  | { status: 'rejected'; walletId: string; network: Network; message: string }

/**
 * Simulated wallet handshake against `POST /wallets/:id/connect` (research.md R2).
 * TODO(time de carteiras): o domínio `wallets` não expõe essa chamada; quando expuser, trocar por ela.
 */
const connectWallet = ({ walletId, network }: { walletId: string; network: Network }) =>
  api.post<WalletConnection>(`/wallets/${walletId}/connect`, { network })

export function useWalletConnection() {
  const [state, setState] = useState<WalletConnectionState>({ status: 'idle' })
  const { mutate, reset } = useMutation({ mutationFn: connectWallet })

  const connect = useCallback(
    (walletId: string, network: Network) => {
      setState({ status: 'connecting', walletId, network })
      mutate(
        { walletId, network },
        {
          onSuccess: (connection) => setState({ status: 'connected', walletId: connection.walletId, network: connection.network }),
          onError: (error) => {
            const message = !isApiError(error)
              ? 'Não foi possível conectar a carteira.'
              : error.code === 'WALLET_REJECTED'
                ? 'A conexão foi recusada na carteira.'
                : (error.fields.network ?? error.message)
            setState({ status: 'rejected', walletId, network, message })
          },
        },
      )
    },
    [mutate],
  )

  const disconnect = useCallback(() => {
    reset()
    setState({ status: 'idle' })
  }, [reset])

  const isConnectedTo = (walletId: string | null, network: Network | null) =>
    state.status === 'connected' && state.walletId === walletId && state.network === network

  return { state, connect, disconnect, isConnectedTo }
}
