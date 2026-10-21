import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api/http'
import type { Wallet, WalletInput } from '../model/contracts'

export const WALLETS_QUERY_KEY = ['wallets'] as const

export const walletsQueries = {
  list: () =>
    queryOptions({
      queryKey: WALLETS_QUERY_KEY,
      queryFn: ({ signal }) => api.get<Wallet[]>('/wallets', { signal }),
    }),
}

export const createWallet = (body: WalletInput) => api.post<Wallet>('/wallets', body)
export const updateWallet = ({ walletId, ...body }: WalletInput & { walletId: string }) =>
  api.put<Wallet>(`/wallets/${walletId}`, body)
