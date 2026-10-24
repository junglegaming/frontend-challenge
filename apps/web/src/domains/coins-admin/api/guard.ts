import { useQueryClient } from '@tanstack/react-query'
import { redirect, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { consumeCoinsAdminEndReason, getCoinsAdminSession, useCoinsAdminSession } from './session'

/** Cache key prefix of everything this domain keeps in TanStack Query. */
export const COINS_ADMIN_CACHE_KEY = 'coins-admin'

/**
 * For a protected route's `beforeLoad`. Requires a valid coins-admin session (never the site session: they are
 * different roles, spec FR-004). Without one it sends the person to the sign-in page, remembering where they were
 * going and, when the access had run out, why.
 */
export function requireCoinsAdmin(href: string) {
  if (getCoinsAdminSession()) return
  const expired = consumeCoinsAdminEndReason() === 'expired'
  throw redirect({
    to: '/admin/coins/login',
    search: { redirect: href, ...(expired ? { reason: 'expired' as const } : {}) },
  })
}

/**
 * Mount on every protected page. When the session ends while the page is open it ALWAYS drops the cached coins-admin
 * data (spec SC-005) and, only if the access ran out (401/403 or the 15 minutes), sends the person back to sign in
 * with the expiry notice. A deliberate sign-out ('logout') navigates by itself, without the notice.
 */
export function useCoinsAdminSessionRedirect() {
  const session = useCoinsAdminSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const hadSession = useRef(session !== null)

  useEffect(() => {
    if (session !== null) {
      hadSession.current = true
      return
    }
    if (!hadSession.current) return
    hadSession.current = false

    queryClient.removeQueries({ queryKey: [COINS_ADMIN_CACHE_KEY] })
    if (consumeCoinsAdminEndReason() === 'expired') {
      void navigate({ to: '/admin/coins/login', search: { redirect: location.href, reason: 'expired' } })
    }
  }, [session, queryClient, navigate, location.href])
}
