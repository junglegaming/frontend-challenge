import axios, { type AxiosRequestConfig } from 'axios'
import { ZodError, type z } from 'zod'
import { subscribeSessionToken } from '@/shared/api/session'
import { env } from '@/shared/config/env'
import { ledgerErrorBodySchema, ledgerTokenSchema } from '../model/contracts'

/**
 * A separate Axios instance for the real backend (`apps/api`, Postgres on Neon), reached through the
 * same-origin `/backend` proxy. It deliberately never reuses `@/shared/api/http` (whose `/api` prefix
 * is owned by MSW) nor `coins`' client (which talks to `server/`, a different backend and identity model).
 */
export const ledgerHttp = axios.create({
  baseURL: env.backendBaseUrl,
  timeout: env.requestTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
})

/** Normalised error of this domain; never inspect an `AxiosError` outside this file. */
export class LedgerError extends Error {
  readonly status: number | null
  readonly code: string

  constructor(params: { status: number | null; code: string; message: string }) {
    super(params.message)
    this.name = 'LedgerError'
    this.status = params.status
    this.code = params.code
  }

  get isInsufficientBalance() {
    return this.status === 402
  }

  /** The `Idempotency-Key` was already used for a different operation: final, never retried. */
  get isKeyConflict() {
    return this.status === 409
  }

  /** Network failures, timeouts and 5xx can succeed on a later attempt; 4xx cannot. */
  get isRetryable() {
    return this.status === null || this.status >= 500
  }
}

function toLedgerError(error: unknown): LedgerError {
  if (error instanceof LedgerError) return error
  if (axios.isCancel(error)) return new LedgerError({ status: null, code: 'CANCELED', message: 'Requisição cancelada.' })
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const body = ledgerErrorBodySchema.safeParse(error.response.data)
      return new LedgerError({
        status: error.response.status,
        code: body.success ? body.data.error.code : 'UNEXPECTED_RESPONSE',
        message: body.success ? body.data.error.message : 'Falha inesperada no servidor.',
      })
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new LedgerError({ status: null, code: 'TIMEOUT', message: 'O servidor demorou para responder.' })
    }
    return new LedgerError({ status: null, code: 'NETWORK', message: 'Sem conexão com o servidor.' })
  }
  if (error instanceof ZodError) {
    return new LedgerError({ status: 502, code: 'INVALID_RESPONSE', message: 'Resposta inesperada do servidor.' })
  }
  return new LedgerError({ status: null, code: 'INTERNAL', message: 'Erro inesperado.' })
}

// --- Token session -----------------------------------------------------------------------------------
// `apps/api` requires a short-lived signed token per owner (POST /auth/token); the acting owner is read
// from the verified token only. Tokens are cached per user and refreshed shortly before they expire.

const REFRESH_MARGIN_MS = 30_000

interface CachedToken {
  token: string
  expiresAtMs: number
}

const tokens = new Map<string, CachedToken>()
const inFlight = new Map<string, Promise<string>>()

async function issueToken(ownerId: string): Promise<string> {
  try {
    const { data } = await ledgerHttp.post('/auth/token', { ownerId })
    const parsed = ledgerTokenSchema.parse(data)
    tokens.set(ownerId, { token: parsed.token, expiresAtMs: Date.parse(parsed.expiresAt) })
    return parsed.token
  } catch (error) {
    throw toLedgerError(error)
  } finally {
    inFlight.delete(ownerId)
  }
}

async function tokenFor(ownerId: string): Promise<string> {
  const cached = tokens.get(ownerId)
  if (cached && cached.expiresAtMs - Date.now() > REFRESH_MARGIN_MS) return cached.token
  // Concurrent callers share one issuance instead of each minting its own token.
  const pending = inFlight.get(ownerId) ?? issueToken(ownerId)
  inFlight.set(ownerId, pending)
  return pending
}

/** Drops every cached token (logout / user switch must not leave credentials in memory). */
export function clearLedgerTokens() {
  tokens.clear()
  inFlight.clear()
}

// Login, logout and user switches all change the app session token: drop cached backend tokens then
// (constitution, Principle IV: logout/user switch clears private caches). Subscribing here, instead of
// calling from the auth domain, avoids an auth <-> ledger import cycle.
subscribeSessionToken(clearLedgerTokens)

// --- Requests ----------------------------------------------------------------------------------------

/**
 * Authenticated, schema-validated request. The only automatic retry is the contract's token rule: a 401
 * (expired token) re-issues the token once. A 409 means the `Idempotency-Key` was already used for a
 * different operation, so it is thrown at once (re-sending cannot succeed). Writes pass an idempotency key
 * so a retry after a timeout replays the original result instead of applying the operation twice.
 */
export async function ledgerRequest<T>(
  ownerId: string,
  config: AxiosRequestConfig,
  schema: z.ZodType<T>,
  idempotencyKey?: string,
): Promise<T> {
  let refreshedAfter401 = false

  for (;;) {
    try {
      const token = await tokenFor(ownerId)
      const { data } = await ledgerHttp.request({
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
          ...(idempotencyKey === undefined ? {} : { 'Idempotency-Key': idempotencyKey }),
        },
      })
      return schema.parse(data)
    } catch (error) {
      const ledgerError = toLedgerError(error)

      if (ledgerError.status === 401 && !refreshedAfter401) {
        refreshedAfter401 = true
        tokens.delete(ownerId)
        continue
      }
      throw ledgerError
    }
  }
}
