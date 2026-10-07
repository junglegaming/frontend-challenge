/**
 * Minimal session-token store shared by the Axios client and the realtime client.
 * The `auth` domain owns login/logout/signup; this primitive just holds the current
 * token so `shared/` doesn't have to depend on a domain.
 */
const STORAGE_KEY = 'nft-session:token'

function readPersisted(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let token: string | null = readPersisted()
const listeners = new Set<() => void>()

export function getSessionToken(): string | null {
  return token
}

export function hasSessionToken(): boolean {
  return token !== null
}

export function setSessionToken(next: string | null) {
  token = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, next)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked: the session still works for the lifetime of the tab.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeSessionToken(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
