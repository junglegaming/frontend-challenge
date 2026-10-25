import { api } from '@/api/client'
import { walletSchema, walletsResponseSchema, type Wallet, type WalletInput } from '@/schemas/wallet'

export const walletService = {
  async list(signal?: AbortSignal): Promise<Wallet[]> {
    const { data } = await api.get('/wallets', { signal })
    return walletsResponseSchema.parse(data).wallets
  },
  async create(input: WalletInput): Promise<Wallet> {
    const { data } = await api.post('/wallets', input)
    return walletSchema.parse(data)
  },
  async update(walletId: string, input: Omit<WalletInput, 'slot'>): Promise<Wallet> {
    const { data } = await api.patch(`/wallets/${walletId}`, input)
    return walletSchema.parse(data)
  },
  async connect(walletId: string): Promise<Wallet> {
    const { data } = await api.post(`/wallets/${walletId}/connect`)
    return walletSchema.parse(data)
  },
  async disconnect(walletId: string): Promise<Wallet> {
    const { data } = await api.post(`/wallets/${walletId}/disconnect`)
    return walletSchema.parse(data)
  },
}
