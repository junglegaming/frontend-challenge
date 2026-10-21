export const NETWORKS = ['ethereum', 'polygon', 'arbitrum', 'base'] as const
export type Network = (typeof NETWORKS)[number]

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum One',
  base: 'Base',
}

export const WALLET_PROVIDERS = ['metamask', 'coinbase', 'walletconnect'] as const
export type WalletProvider = (typeof WALLET_PROVIDERS)[number]

export const PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
  walletconnect: 'WalletConnect',
}

export type WalletSlot = 'primary' | 'secondary'

export interface Wallet {
  id: string
  slot: WalletSlot
  label: string
  provider: WalletProvider
  address: string
  networks: Network[]
  updatedAt: string
}

export interface WalletInput {
  slot: WalletSlot
  label: string
  provider: WalletProvider
  address: string
  networks: Network[]
}

export interface WalletConnectRequest {
  network: Network
}

export interface WalletConnection {
  walletId: string
  network: Network
  status: 'connected'
  connectedAt: string
}
