import { useSyncExternalStore } from 'react'

/**
 * Session of the coins administrator (the real `apps/api` admin), kept in module memory ONLY: never in
 * `localStorage`/`sessionStorage` (constitution 1.7.0, spec FR-005). It is independent from the site session.
 * The service's admin access lasts 15 minutes and is not renewed.
 */
interface Session {
  token: string
  expiresAt: string
  adminId: string
  email: string
}

/** Why the last session ended; read once, so the "session expired" notice never follows a deliberate sign-out. */
export type EndReason = 'logout' | 'expired'

let session: Session | null = null
let endReason: EndReason | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function setCoinsAdminSession(next: Session) {
  session = next
  endReason = null
  emit()
}

function isExpired(current: Session) {
  return Date.now() >= Date.parse(current.expiresAt)
}

/** Internal read for the HTTP client and the route guard. Detecting an expired session ends it as `expired`. */
export function getCoinsAdminSession(): Session | null {
  if (session && isExpired(session)) clearCoinsAdminSession('expired')
  return session
}

/** Whether there is a valid session (the token itself is never exposed outside the domain). */
export function hasCoinsAdminSession(): boolean {
  return getCoinsAdminSession() !== null
}

export function clearCoinsAdminSession(reason: EndReason) {
  if (!session) return
  session = null
  endReason = reason
  emit()
}

/** Returns the last end reason once and forgets it. */
export function consumeCoinsAdminEndReason(): EndReason | null {
  const reason = endReason
  endReason = null
  return reason
}

export function subscribeCoinsAdminSession(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// useSyncExternalStore needs a stable snapshot: the e-mail string (or null) is a primitive, so it is.
const emailSnapshot = () => session?.email ?? null

/** The connected administrator's e-mail, or `null` when there is no session. The token is never exposed. */
export function useCoinsAdminSession(): { email: string } | null {
  const email = useSyncExternalStore(subscribeCoinsAdminSession, emailSnapshot, emailSnapshot)
  return email === null ? null : { email }
}

/** Id of the connected admin, used to isolate cached data per administrator. */
export function useCoinsAdminId(): string | null {
  return useSyncExternalStore(
    subscribeCoinsAdminSession,
    () => session?.adminId ?? null,
    () => session?.adminId ?? null,
  )
}
