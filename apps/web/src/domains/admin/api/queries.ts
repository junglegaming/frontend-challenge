import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Nft } from '@/domains/catalog'
import { api } from '@/shared/api/http'
import { ADMIN_ORDERS_PAGE_SIZE } from '../model/contracts'
import type {
  AdminOrderDetail,
  AdminOrdersPage,
  AdminOrdersSearch,
  AdminOverview,
  AdminUserDetail,
  AdminUserSummary,
  CreateListingRequest,
  UpdateEditionRequest,
} from '../model/contracts'

const adminNftsKey = ['admin', 'nfts'] as const
const adminOverviewKey = ['admin', 'overview'] as const
const adminOrdersKey = (status?: string, page?: number) => ['admin', 'orders', status ?? 'all', page ?? 1] as const
const adminOrderKey = (id: string) => ['admin', 'orders', 'detail', id] as const
const adminUsersKey = (q?: string) => ['admin', 'users', q ?? ''] as const
const adminUserKey = (id: string) => ['admin', 'users', 'detail', id] as const

export function useAdminNfts() {
  return useQuery(queryOptions({ queryKey: adminNftsKey, queryFn: () => api.get<Nft[]>('/admin/nfts') }))
}

export function useCreateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateListingRequest) => api.post<Nft, CreateListingRequest>('/admin/nfts', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminNftsKey }),
  })
}

export function useUpdateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nftId, editionId, change }: { nftId: string; editionId: string; change: UpdateEditionRequest }) =>
      api.patch<Nft, UpdateEditionRequest>(`/admin/nfts/${nftId}/editions/${editionId}`, change),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminNftsKey }),
  })
}

export function useDelistNft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (nftId: string) => api.post<Nft>(`/admin/nfts/${nftId}/delist`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminNftsKey }),
  })
}

export function useAdminUsers(q?: string) {
  return useQuery(
    queryOptions({
      queryKey: adminUsersKey(q),
      queryFn: () => api.get<AdminUserSummary[]>('/admin/users', { params: q ? { q } : undefined }),
    }),
  )
}

export function useAdminUser(userId: string | null) {
  return useQuery(
    queryOptions({
      queryKey: adminUserKey(userId ?? ''),
      queryFn: () => api.get<AdminUserDetail>(`/admin/users/${userId}`),
      enabled: userId !== null,
    }),
  )
}

export function useSuspendUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.post<AdminUserDetail>(`/admin/users/${userId}/suspend`),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.setQueryData(adminUserKey(user.id), user)
    },
  })
}

export function useReactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.post<AdminUserDetail>(`/admin/users/${userId}/reactivate`),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.setQueryData(adminUserKey(user.id), user)
    },
  })
}

/**
 * Totals of the admin home (products, users, orders by status). `staleTime: 0`: they are computed when the screen
 * opens, never served from an earlier visit (specs/013-marketplace-admin, Assumptions).
 */
export function useAdminOverview() {
  return useQuery(
    queryOptions({
      queryKey: adminOverviewKey,
      queryFn: () => api.get<AdminOverview>('/admin/overview'),
      staleTime: 0,
    }),
  )
}

/**
 * One page of every user's orders, optionally filtered by status. The previous page stays on screen while the next
 * one loads. Only transient failures are retried (the client-wide policy).
 */
export function useAdminOrders({ status, page }: AdminOrdersSearch) {
  return useQuery(
    queryOptions({
      queryKey: adminOrdersKey(status, page),
      queryFn: ({ signal }) =>
        api.get<AdminOrdersPage>('/admin/orders', {
          params: { status, page: page ?? 1, pageSize: ADMIN_ORDERS_PAGE_SIZE },
          signal,
        }),
      placeholderData: keepPreviousData,
    }),
  )
}

/** Any user's order, in the shape of the buyer's receipt plus the owner's user id. */
export function useAdminOrder(orderId: string) {
  return useQuery(
    queryOptions({
      queryKey: adminOrderKey(orderId),
      queryFn: ({ signal }) => api.get<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(orderId)}`, { signal }),
    }),
  )
}
