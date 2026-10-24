import { useSyncExternalStore } from 'react'
import { hasSessionToken, subscribeSessionToken } from './session'

/** Reactive read of the session token presence. The `auth` domain exposes the actual user/session. */
export function useIsAuthenticated() {
  return useSyncExternalStore(subscribeSessionToken, hasSessionToken, hasSessionToken)
}
