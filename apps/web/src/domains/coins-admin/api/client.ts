import axios, { type AxiosRequestConfig } from 'axios'
import { ZodError, type z } from 'zod'
import { env } from '@/shared/config/env'
import { errorBodySchema } from '../model/contracts'
import { clearCoinsAdminSession, getCoinsAdminSession } from './session'

/**
 * A separate Axios instance for the real coins service's ADMIN routes (`/backend/admin/*`). It never reuses
 * `@/shared/api/http` (the site session, owned by MSW under `/api`) nor the `ledger` client (owner tokens):
 * the coins administrator is another role with another credential (specs/012-coins-admin, plan D1).
 */
export const coinsAdminHttp = axios.create({
  baseURL: env.backendBaseUrl,
  timeout: env.requestTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
})

/** Normalised error of this domain; never inspect an `AxiosError` outside this file. */
export class CoinsAdminError extends Error {
  readonly status: number | null
  readonly code: string

  constructor(params: { status: number | null; code: string; message: string }) {
    super(params.message)
    this.name = 'CoinsAdminError'
    this.status = params.status
    this.code = params.code
  }

  /** Missing, invalid, expired or non-admin token: the session is over. */
  get isSessionExpired() {
    return this.status === 401 || this.status === 403
  }

  /** Wrong e-mail or password (the service answers both the same on purpose). */
  get isInvalidCredentials() {
    return this.status === 401 && this.code === 'invalid_credentials'
  }

  get isInvalidOwnerId() {
    return this.status === 400 && this.code === 'invalid_owner_id'
  }

  /** Network failures, timeouts and 5xx can succeed on a later attempt; 4xx cannot. */
  get isRetryable() {
    return this.status === null || this.status >= 500
  }
}

function toCoinsAdminError(error: unknown): CoinsAdminError {
  if (error instanceof CoinsAdminError) return error
  if (axios.isCancel(error)) return new CoinsAdminError({ status: null, code: 'CANCELED', message: 'Requisição cancelada.' })
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const body = errorBodySchema.safeParse(error.response.data)
      return new CoinsAdminError({
        status: error.response.status,
        code: body.success ? body.data.error.code : 'UNEXPECTED_RESPONSE',
        message: body.success ? body.data.error.message : 'Falha inesperada no servidor.',
      })
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new CoinsAdminError({ status: null, code: 'TIMEOUT', message: 'O servidor demorou para responder.' })
    }
    return new CoinsAdminError({ status: null, code: 'NETWORK', message: 'Sem conexão com o servidor.' })
  }
  if (error instanceof ZodError) {
    return new CoinsAdminError({ status: 502, code: 'INVALID_RESPONSE', message: 'Resposta inesperada do servidor.' })
  }
  return new CoinsAdminError({ status: null, code: 'INTERNAL', message: 'Erro inesperado.' })
}

/**
 * Schema-validated request. Sends the admin token by default; `withToken: false` (the login) sends none.
 * A 401/403 on a call that carried the token ends the session as `expired`. It never retries by itself: the queries decide.
 */
export async function coinsAdminRequest<T>(
  config: AxiosRequestConfig & { withToken?: boolean },
  schema: z.ZodType<T>,
): Promise<T> {
  const { withToken = true, ...axiosConfig } = config
  const headers: Record<string, string> = {}
  if (withToken) {
    const session = getCoinsAdminSession()
    if (!session) {
      throw new CoinsAdminError({ status: 401, code: 'missing_token', message: 'Sessão de administrador ausente.' })
    }
    headers.Authorization = `Bearer ${session.token}`
  }

  try {
    const { data } = await coinsAdminHttp.request({ ...axiosConfig, headers: { ...axiosConfig.headers, ...headers } })
    return schema.parse(data)
  } catch (error) {
    const adminError = toCoinsAdminError(error)
    if (withToken && adminError.isSessionExpired) clearCoinsAdminSession('expired')
    throw adminError
  }
}
