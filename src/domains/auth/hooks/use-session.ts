import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { useMergeGuestCart } from '@/domains/cart'
import { getSessionToken, setSessionToken, subscribeSessionToken } from '@/shared/api/session'
import { authApi, sessionKeys, sessionQueryOptions } from '../api/queries'
import type { Session } from '../model/contracts'

/** Reactive read of the session token, so components re-render (and re-query) right after login/logout. */
function useSessionToken() {
  return useSyncExternalStore(subscribeSessionToken, getSessionToken, getSessionToken)
}

export function useSession() {
  const token = useSessionToken()
  return useQuery(sessionQueryOptions(token))
}

function useOpenSession() {
  const queryClient = useQueryClient()
  const mergeGuestCartIfAny = useMergeGuestCart()

  return (session: Session) => {
    setSessionToken(session.token)
    queryClient.setQueryData(sessionKeys.all(session.token), session)
    mergeGuestCartIfAny()
  }
}

export function useLogin() {
  const openSession = useOpenSession()
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: openSession,
  })
}

export function useSignup() {
  const openSession = useOpenSession()
  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: openSession,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      setSessionToken(null)
      queryClient.clear()
    },
  })
}
