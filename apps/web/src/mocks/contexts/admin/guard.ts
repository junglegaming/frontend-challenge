import { errors } from '../../http/errors'
import type { AuthService } from '../auth/service'

function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

/** Resolves the caller's identity and throws FORBIDDEN unless they're an admin. */
export function requireAdmin(auth: AuthService, request: Request) {
  const identity = auth.authenticate(bearerToken(request))
  const session = auth.currentSession(identity)
  if (session.user.role !== 'admin') throw errors.forbidden()
  return identity
}
