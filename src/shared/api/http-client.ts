import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { type ZodType } from 'zod'

import { errorEnvelopeSchema } from '@/shared/contracts'
import { getToken, getVisitorId } from '@/shared/session'

const API_URL = import.meta.env.VITE_API_URL || '/api'

/** Erro normalizado da API — único formato que o código de UI enxerga. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: Record<string, string> | undefined
  readonly retryable: boolean

  constructor(init: {
    status: number
    code: string
    message: string
    fields?: Record<string, string> | undefined
    retryable?: boolean | undefined
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.fields = init.fields
    this.retryable = init.retryable ?? false
  }
}

type SessionExpiredHandler = () => void

let onSessionExpired: SessionExpiredHandler | null = null

/**
 * Registra a reação da aplicação a uma sessão inválida ou expirada (401 em
 * requisição autenticada): limpar dados privados e retomar pelo login.
 *
 * @param handler - Chamado uma vez por resposta 401 autenticada; `null` remove.
 * @example
 * setSessionExpiredHandler(() => { clearSession(); queryClient.clear() })
 */
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  onSessionExpired = handler
}

/** Instância única do Axios — todo tráfego REST passa por aqui. */
export const httpClient = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
})

httpClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Cart-Id'] = getVisitorId()
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Cancelamento proposital (consulta obsoleta): não é falha para a interface.
    if (axios.isCancel(error)) throw error
    if (error.response) {
      // Só a sessão atual pode expirar: um 401 atrasado de um token antigo
      // (usuário anterior) não pode derrubar quem acabou de entrar.
      const sentAuthorization = error.config?.headers?.Authorization
      const currentToken = getToken()
      if (
        error.response.status === 401 &&
        currentToken !== null &&
        sentAuthorization === `Bearer ${currentToken}`
      ) {
        onSessionExpired?.()
      }
      const parsed = errorEnvelopeSchema.safeParse(error.response.data)
      if (parsed.success) {
        throw new ApiError({ status: error.response.status, ...parsed.data.error })
      }
      throw new ApiError({
        status: error.response.status,
        code: 'NETWORK_ERROR',
        message: 'Resposta inesperada da API',
      })
    }
    if (error.code === 'ECONNABORTED') {
      throw new ApiError({
        status: 0,
        code: 'TIMEOUT',
        message: 'Tempo esgotado',
        retryable: true,
      })
    }
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Falha de conexão',
      retryable: true,
    })
  },
)

/** GET tipado: valida a resposta contra o schema zod. */
export async function getJson<T>(
  schema: ZodType<T>,
  path: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await httpClient.get(path, config)
  if (
    typeof res.data === 'string' &&
    (res.data.includes('<!doctype html>') || res.data.includes('<html'))
  ) {
    throw new ApiError({
      status: 503,
      code: 'NETWORK_ERROR',
      message: 'Serviço temporariamente indisponível. Tente novamente.',
      retryable: true,
    })
  }
  return schema.parse(res.data)
}

/** POST tipado: valida a resposta contra o schema zod. */
export async function postJson<T>(
  schema: ZodType<T>,
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await httpClient.post(path, body, config)
  return schema.parse(res.data)
}

/** PATCH tipado: valida a resposta contra o schema zod. */
export async function patchJson<T>(
  schema: ZodType<T>,
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await httpClient.patch(path, body, config)
  return schema.parse(res.data)
}
