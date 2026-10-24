import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { onAuthError } from '@/shared/api/http'
import { setSessionToken } from '@/shared/api/session'

/**
 * Mount once at the app root. Any request that comes back UNAUTHENTICATED/SESSION_EXPIRED
 * (see shared/api/http.ts) drops the local session and sends the user to login with a
 * `redirect` back to the page they were on — instead of leaving a raw load failure on screen.
 */
export function useAuthErrorRedirect() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useRouterState({ select: (s) => s.location })

  useEffect(() => {
    const unsubscribe = onAuthError(() => {
      setSessionToken(null)
      queryClient.clear()
      void navigate({ to: '/login', search: { redirect: location.href } })
    })
    return () => {
      unsubscribe()
    }
    // Re-subscribing on every location change keeps the redirect target current without
    // needing a ref: the listener itself is cheap to recreate.
  }, [navigate, queryClient, location.href])
}
