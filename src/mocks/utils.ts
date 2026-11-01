import { getDb } from './db'
import { json } from './http'

export function getToken(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export function getVisitorId(request: Request): string | null {
  return request.headers.get('X-Cart-Id')
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>,
) {
  const body: {
    error: { code: string; message: string; fields?: Record<string, string>; retryable?: boolean }
  } = { error: { code, message } }
  if (fields) body.error.fields = fields
  return json(body, { status })
}

export function unauthorized() {
  return errorResponse('UNAUTHORIZED', 'Autenticação necessária', 401)
}

/** Resolve o usuário autenticado a partir da sessão (null se inválida/expirada). */
export function getAuthenticatedUser(request: Request) {
  const token = getToken(request)
  if (!token) return null
  const db = getDb()
  const session = db.sessions[token]
  if (!session || new Date(session.expiresAt) <= new Date()) return null
  return db.users.find((u) => u.id === session.userId) ?? null
}

/**
 * Dono do carrinho: o usuário autenticado (pelo id, estável entre sessões) ou,
 * sem sessão válida, o visitante identificado por `X-Cart-Id`.
 */
export function getOwnerKey(request: Request): string {
  const user = getAuthenticatedUser(request)
  if (user) return `user:${user.id}`
  return `visitor:${getVisitorId(request) ?? 'anon'}`
}
