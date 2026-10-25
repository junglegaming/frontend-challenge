import { delay, HttpResponse } from 'msw'
import type { ApiErrorCode } from '@/schemas/common'
import type { z } from 'zod'
import { db, type DbSession } from './db'
import { DomainError } from './domain'
import { getScenario, latencyMs } from './scenarios'

export const API = import.meta.env.VITE_API_URL ?? '/api'

export function apiError(status: number, code: ApiErrorCode, message: string, extra?: { fields?: Record<string, string>; details?: unknown }) {
  return HttpResponse.json({ error: { code, message, ...extra } }, { status })
}

export function getToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}

export function findSession(token: string | null): DbSession | null {
  if (!token) return null
  return db.state.sessions.find((session) => session.token === token && session.expiresAt > Date.now()) ?? null
}

/** Exige sessão válida; lança `HttpResponse` 401 que o wrapper `route` devolve. */
export function requireUser(request: Request) {
  const token = getToken(request)
  if (!token) throw apiError(401, 'UNAUTHENTICATED', 'Faça login para continuar')
  const session = findSession(token)
  if (!session) {
    db.update((state) => {
      state.sessions = state.sessions.filter((item) => item.token !== token)
    })
    throw apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  }
  const user = db.state.users.find((item) => item.id === session.userId)
  if (!user) throw apiError(401, 'UNAUTHENTICATED', 'Faça login para continuar')
  return user
}

/** Dono do carrinho: usuário autenticado ou visitante identificado pelo header X-Guest-Cart. */
export function cartOwner(request: Request): string {
  if (getToken(request)) return `user:${requireUser(request).id}`
  const guest = request.headers.get('X-Guest-Cart')
  if (!guest || !/^[a-z0-9-]{8,64}$/i.test(guest)) throw apiError(400, 'VALIDATION_ERROR', 'Carrinho de visitante não identificado')
  return `guest:${guest}`
}

export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  const body: unknown = await request.json().catch(() => null)
  const result = schema.safeParse(body)
  if (!result.success) {
    const fields: Record<string, string> = {}
    for (const issue of result.error.issues) fields[issue.path.join('.')] ??= issue.message
    throw apiError(422, 'VALIDATION_ERROR', 'Verifique os campos destacados', { fields })
  }
  return result.data
}

type Resolver = (info: { request: Request; params: Record<string, string | readonly string[] | undefined> }) => Response | Promise<Response>

/**
 * Envolve cada handler com latência do cenário, modo offline e conversão de erros
 * (HttpResponse lançado ou DomainError) para o envelope da API.
 */
export function route(resolver: Resolver, options: { latency?: () => number } = {}): Resolver {
  return async (info) => {
    if (getScenario() === 'offline') return HttpResponse.error()
    await delay((options.latency ?? latencyMs)())
    try {
      return await resolver(info)
    } catch (error) {
      if (error instanceof Response) return error
      if (error instanceof DomainError) {
        return HttpResponse.json({ error: { code: error.code, message: error.message, details: error.details } }, { status: error.status })
      }
      throw error
    }
  }
}

export async function hashPassword(salt: string, password: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`kurio:${salt}:${password}`))
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
