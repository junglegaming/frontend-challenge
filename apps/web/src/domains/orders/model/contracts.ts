import type { EthAmount } from '@/shared/lib/eth'
import type { Network, WalletProvider } from '@/domains/wallets'

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export const TERMINAL_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set(['confirmed', 'declined'])

export interface CollectorDetails {
  fullName: string
  email: string
  country: string
  /** Optional note shown on the receipt. */
  note?: string
}

export interface CreateOrderRequest {
  quoteSignature: string
  network: Network
  walletId: string
  collector: CollectorDetails
}

/** Immutable snapshot taken when the order is created. Catalog changes never alter it. */
export interface OrderLine {
  nftId: string
  editionId: string
  name: string
  editionName: string
  image: { src: string; alt: string }
  quantity: number
  unitPrice: EthAmount
  lineTotal: EthAmount
}

export interface Order {
  id: string
  status: OrderStatus
  version: number
  createdAt: string
  updatedAt: string
  network: Network
  wallet: { id: string; label: string; provider: WalletProvider; address: string }
  collector: CollectorDetails
  lines: OrderLine[]
  coupon: { code: string; description: string } | null
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  transaction: { hash: string; explorerUrl: string } | null
  declineReason: string | null
}

/** Payload of the `order.updated` realtime event. */
export interface OrderUpdatedPayload {
  orderId: string
  userId: string
  status: OrderStatus
  transaction: Order['transaction']
  declineReason: string | null
}

declare module '@/shared/realtime/contracts' {
  interface RealtimeEventMap {
    'order.updated': OrderUpdatedPayload
  }
}
