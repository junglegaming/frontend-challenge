import axios, { AxiosError } from 'axios'
import { apiErrorBodySchema, type ApiErrorCode } from '@/schemas/common'
import { sessionEvents } from '@/lib/session-events'
import { guestCartStore, tokenStore } from '@/lib/storage'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode | 'NETWORK' | 'TIMEOUT' | 'UNKNOWN'
  readonly fields: Record<string, string>
  readonly details: unknown

  constructor(params: { status: number; code: ApiError['code']; message: string; fields?: Record<string, string>; details?: unknown }) {
    super(params.message)
    this.name = 'ApiError'
    this.status = params.status
    this.code = params.code
    this.fields = params.fields ?? {}
    this.details = params.details
  }

  get isNetwork() {
    return this.code === 'NETWORK'
  }

  get isTimeout() {
    return this.code === 'TIMEOUT'
  }

  /** Falhas em que repetir a mesma operação pode funcionar. */
  get isTransient() {
    return this.code === 'NETWORK' || this.code === 'TIMEOUT' || this.code === 'TRANSIENT' || this.status >= 500
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 8000,
  paramsSerializer: { indexes: null },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  else config.headers.set('X-Guest-Cart', guestCartStore.get())
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error)
    const apiError = toApiError(error)
    const sentToken = error instanceof AxiosError && Boolean(error.config?.headers?.Authorization)
    if (sentToken && apiError.status === 401) sessionEvents.emitExpired()
    return Promise.reject(apiError)
  },
)

function toApiError(error: unknown): ApiError {
  if (!(error instanceof AxiosError)) return new ApiError({ status: 0, code: 'UNKNOWN', message: 'Erro inesperado' })
  if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
    return new ApiError({ status: 0, code: 'TIMEOUT', message: 'O servidor demorou para responder' })
  }
  if (!error.response) return new ApiError({ status: 0, code: 'NETWORK', message: 'Sem conexão com o servidor' })
  const body = apiErrorBodySchema.safeParse(error.response.data)
  if (!body.success) return new ApiError({ status: error.response.status, code: 'UNKNOWN', message: 'Erro inesperado no servidor' })
  return new ApiError({ status: error.response.status, ...body.data.error })
}
