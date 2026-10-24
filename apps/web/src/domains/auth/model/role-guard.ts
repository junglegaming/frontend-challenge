import { redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router'
import { getSessionToken, hasSessionToken } from '@/shared/api/session'
import { sessionQueryOptions } from '../api/queries'
import type { UserRole } from './contracts'

/**
 * Call from a protected route's `beforeLoad`. Requires a session (like `requireSession`) AND the
 * given role, fetching/reusing the cached session user via the router's `queryClient` so a cold
 * load (direct URL, refresh) is decided correctly instead of racing an empty cache.
 */
export async function requireRole(href: string, context: RouterContext, role: UserRole) {
  if (!hasSessionToken()) {
    throw redirect({ to: '/login', search: { redirect: href } })
  }
  const session = await context.queryClient.ensureQueryData(sessionQueryOptions(getSessionToken()))
  if (session.user.role !== role) {
    throw redirect({ to: '/', search: { forbidden: true } })
  }
}
