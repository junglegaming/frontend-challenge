import { z } from 'zod'
import type { EthAmount } from '@/shared/lib/eth'
import type { NftCategory, NftImage } from '@/domains/catalog'
import type { UserRole } from '@/domains/auth'
import type { Order, OrderStatus } from '@/domains/orders'
import type { Network } from '@/domains/wallets'

export type UserAccountStatus = 'active' | 'suspended'

export interface CreateListingRequest {
  name: string
  category: NftCategory
  description: string
  collection: string
  image: NftImage
  edition: {
    name: string
    price: EthAmount
    supply: number
    maxPerOrder: number
  }
}

export interface UpdateEditionRequest {
  price?: EthAmount
  available?: number
}

export interface AdminUserSummary {
  id: string
  name: string
  email: string
  username: string
  role: UserRole
  status: UserAccountStatus
}

export interface AdminUserDetail extends AdminUserSummary {
  bio: string
  avatarUrl: string | null
  updatedAt: string
}

// --- Marketplace overview and orders (specs/013-marketplace-admin) ---------------------------------------------

export const ORDER_STATUSES = ['pending', 'confirmed', 'declined'] as const satisfies readonly OrderStatus[]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  declined: 'Recusado',
}

/** Orders per page of the admin list (fixed; the page and the filter live in the URL). */
export const ADMIN_ORDERS_PAGE_SIZE = 20

/** Totals shown on the admin home. Computed when the screen opens (not in real time). */
export interface AdminOverview {
  products: { total: number }
  users: { total: number; suspended: number }
  orders: { total: number; pending: number; confirmed: number; declined: number }
}

/** One order in the admin list: any user's order, with who bought it. `total` is a decimal ETH string. */
export interface AdminOrderSummary {
  id: string
  status: OrderStatus
  createdAt: string
  buyer: { userId: string; fullName: string; email: string }
  itemCount: number
  total: EthAmount
  network: Network
}

export interface AdminOrdersPage {
  items: AdminOrderSummary[]
  page: number
  pageSize: number
  /** Orders that match the filter (not only this page). */
  total: number
  totalPages: number
}

/** The same content as the buyer's receipt, plus the owner's user id. */
export type AdminOrderDetail = Order & { userId: string }

/**
 * Admin orders list state in the URL. Both keys are optional: the default (first page, all statuses) is never written
 * to the address. An invalid value falls back to the default.
 */
export const adminOrdersSearchSchema = z.object({
  // Each key falls back on its own: a bad `page` must not throw away a good `status`.
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
})
export type AdminOrdersSearch = z.infer<typeof adminOrdersSearchSchema>
