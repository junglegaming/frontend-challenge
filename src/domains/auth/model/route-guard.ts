import { redirect } from '@tanstack/react-router'
import { hasSessionToken } from '@/shared/api/session'

/**
 * Call from a protected route's `beforeLoad`. Throws a redirect to `/login` with a `redirect`
 * search param pointing back at the requested URL when there is no session.
 */
export function requireSession(href: string) {
  if (!hasSessionToken()) {
    throw redirect({ to: '/login', search: { redirect: href } })
  }
}
