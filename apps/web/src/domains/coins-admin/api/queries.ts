import { keepPreviousData, useMutation, useQuery, type QueryClient } from '@tanstack/react-query'
import {
  OWNERS_PAGE_SIZE,
  loginResponseSchema,
  ownerDetailSchema,
  ownerIdSchema,
  ownersPageSchema,
  type LoginFormValues,
} from '../model/contracts'
import { CoinsAdminError, coinsAdminRequest } from './client'
import { COINS_ADMIN_CACHE_KEY } from './guard'
import { clearCoinsAdminSession, setCoinsAdminSession, useCoinsAdminId } from './session'

/** 4xx answers are final; only network/timeout/5xx failures are worth another attempt (at most 2). */
const retryTransient = (failureCount: number, error: unknown) =>
  error instanceof CoinsAdminError && error.isRetryable && failureCount < 2

/**
 * Sign-in against the real service (`POST /backend/admin/login`). It carries no token and is never retried by
 * itself. On success the session is kept in memory only (constitution 1.7.0).
 */
export function useCoinsAdminLogin() {
  return useMutation({
    mutationFn: ({ email, password }: LoginFormValues) =>
      coinsAdminRequest(
        { method: 'POST', url: '/admin/login', data: { email, password }, withToken: false },
        loginResponseSchema,
      ),
    onSuccess: ({ token, expiresAt, admin }) => {
      setCoinsAdminSession({ token, expiresAt, adminId: admin.id, email: admin.email })
    },
  })
}

/** Deliberate sign-out: ends the session as `logout` (no expiry notice) and drops every cached coins-admin datum. */
export function coinsAdminLogout(queryClient: QueryClient) {
  clearCoinsAdminSession('logout')
  queryClient.removeQueries({ queryKey: [COINS_ADMIN_CACHE_KEY] })
}

/**
 * One page of owners. `cursors` is the stack kept in the URL: the page is the one that follows the last cursor (the
 * first page when empty). Keys are isolated per administrator and per page (constitution, Principle III).
 */
export function useOwnersPage(cursors: string[]) {
  const adminId = useCoinsAdminId()

  return useQuery({
    queryKey: [COINS_ADMIN_CACHE_KEY, adminId, 'owners', cursors.join(',')],
    queryFn: ({ signal }) =>
      coinsAdminRequest(
        { method: 'GET', url: '/admin/owners', params: { limit: OWNERS_PAGE_SIZE, cursor: cursors.at(-1) }, signal },
        ownersPageSchema,
      ),
    enabled: adminId !== null,
    placeholderData: keepPreviousData,
    retry: retryTransient,
  })
}

/** Balance and the 50 most recent operations of one owner. An id the service would refuse is never sent. */
export function useOwnerDetail(ownerId: string) {
  const adminId = useCoinsAdminId()
  const validId = ownerIdSchema.safeParse(ownerId).success

  return useQuery({
    queryKey: [COINS_ADMIN_CACHE_KEY, adminId, 'owner', ownerId],
    queryFn: ({ signal }) =>
      coinsAdminRequest({ method: 'GET', url: `/admin/owners/${encodeURIComponent(ownerId)}`, signal }, ownerDetailSchema),
    enabled: adminId !== null && validId,
    retry: retryTransient,
  })
}
