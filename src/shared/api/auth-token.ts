import { getSessionToken, setSessionToken } from './session'

/**
 * Compatibility wrappers over the single session-token store in `./session`.
 * Kept so existing callers keep working without a second source of truth.
 */
export function getAuthToken(): string | null {
  return getSessionToken()
}

export function setAuthToken(token: string | null) {
  setSessionToken(token)
}
