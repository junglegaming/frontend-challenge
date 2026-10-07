import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { env } from '@/shared/config/env'
import type { ApiErrorBody, ApiErrorCode } from './contracts'
import { getSessionToken } from './session'

/** Normalised error every hook/component receives. Never inspect AxiosError outside this file. */
export class ApiError extends Error {
  readonly code: ApiErrorCode | 'NETWORK' | 'TIMEOUT' | 'CANCELED'
  readonly status: number | null
  readonly fields: Record<string, string>
  readonly details: unknown

  constructor(params: {
    code: ApiError['code']
    message: string
    status: number | null
    fields?: Record<string, string>
    details?: unknown
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.code = params.code
    this.status = params.status
    this.fields = params.fields ?? {}
    this.details = params.details
  }

  /** Whether retrying the same request can succeed (used by the TanStack Query retry policy). */
  get isRetryable() {
    return this.code === 'NETWORK' || this.code === 'TIMEOUT' || this.code === 'TRANSIENT' || this.status === 500
  }

  get isAuthError() {
    return this.code === 'UNAUTHENTICATED' || this.code === 'SESSION_EXPIRED'
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.requestTimeoutMs,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = getSessionToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

type AuthErrorListener = (error: ApiError) => void
const authErrorListeners = new Set<AuthErrorListener>()

/** The session domain subscribes here to react to 401s from any request. */
export function onAuthError(listener: AuthErrorListener) {
  authErrorListeners.add(listener)
  return () => authErrorListeners.delete(listener)
}

function toApiError(error: unknown): ApiError {
  if (axios.isCancel(error)) {
    return new ApiError({ code: 'CANCELED', message: 'Requisição cancelada', status: null })
  }
  if (error instanceof AxiosError) {
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
      return new ApiError({ code: 'TIMEOUT', message: 'O servidor demorou para responder.', status: null })
    }
    const body = error.response?.data as Partial<ApiErrorBody> | undefined
    if (error.response && body?.error) {
      return new ApiError({
        code: body.error.code,
        message: body.error.message,
        status: error.response.status,
        fields: body.error.fields,
        details: body.error.details,
      })
    }
    if (error.response) {
      return new ApiError({
        code: error.response.status >= 500 ? 'INTERNAL' : 'NOT_FOUND',
        message: 'Falha inesperada no servidor.',
        status: error.response.status,
      })
    }
    return new ApiError({ code: 'NETWORK', message: 'Sem conexão com o servidor.', status: null })
  }
  return new ApiError({ code: 'INTERNAL', message: 'Erro inesperado.', status: null })
}

http.interceptors.response.use(undefined, (error: unknown) => {
  const apiError = toApiError(error)
  if (apiError.isAuthError) authErrorListeners.forEach((listener) => listener(apiError))
  return Promise.reject(apiError)
})

/** Typed helpers: domains call these with their DTO types, so transport → state → UI stays typed. */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => http.get<T>(url, config).then((r) => r.data),
  post: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    http.post<T>(url, body, config).then((r) => r.data),
  patch: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    http.patch<T>(url, body, config).then((r) => r.data),
  put: <T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) =>
    http.put<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) => http.delete<T>(url, config).then((r) => r.data),
}
