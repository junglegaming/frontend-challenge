import type { EthAmount } from '@/shared/lib/eth'
import type { Network } from '@/domains/wallets'

export type CartItemStatus = 'ok' | 'price_changed' | 'quantity_exceeds_stock' | 'sold_out'

export interface CartItem {
  /** `${nftId}:${editionId}` */
  id: string
  nftId: string
  editionId: string
  name: string
  editionName: string
  artistName: string
  image: { src: string; alt: string }
  quantity: number
  /** Current unit price from the catalog. */
  unitPrice: EthAmount
  /** Unit price when the item was added (or last acknowledged). */
  acknowledgedUnitPrice: EthAmount
  available: number
  maxPerOrder: number
  status: CartItemStatus
  nftVersion: number
}

export interface Cart {
  id: string
  items: CartItem[]
  couponCode: string | null
  itemCount: number
  updatedAt: string
}

export interface AddCartItemRequest {
  nftId: string
  editionId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity?: number
  /** Accepts the current catalog price after a `price_changed` notice. */
  acknowledgePrice?: boolean
}

export interface ApplyCouponRequest {
  code: string
}

export interface MergeCartRequest {
  guestCartId: string
}

export interface QuoteLine {
  itemId: string
  nftId: string
  editionId: string
  name: string
  editionName: string
  image: { src: string; alt: string }
  quantity: number
  unitPrice: EthAmount
  lineTotal: EthAmount
}

export type QuoteIssue =
  | { type: 'price_changed'; itemId: string; previous: EthAmount; current: EthAmount }
  | { type: 'quantity_exceeds_stock'; itemId: string; requested: number; available: number }
  | { type: 'sold_out'; itemId: string }
  | { type: 'coupon_removed'; code: string; reason: 'invalid' | 'expired' }

export interface Quote {
  /** Deterministic hash of every value below — the order must be created with the same signature. */
  signature: string
  network: Network
  lines: QuoteLine[]
  coupon: { code: string; description: string } | null
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  issues: QuoteIssue[]
  /** False when there are blocking issues (sold out / stock exceeded) or the cart is empty. */
  purchasable: boolean
  expiresAt: string
}
