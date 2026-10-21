import { HttpResponse } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '@/shared/api/contracts'

/** Business-rule violation raised by services; handlers translate it to the REST error contract. */
export class DomainError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly fields?: Record<string, string>
  readonly details?: unknown

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    fields?: Record<string, string>,
    details?: unknown,
  ) {
    super(message)
    this.name = 'DomainError'
    this.status = status
    this.code = code
    this.fields = fields
    this.details = details
  }
}

export const errors = {
  validation: (fields: Record<string, string>, message = 'Verifique os campos destacados.') =>
    new DomainError(422, 'VALIDATION_ERROR', message, fields),
  unauthenticated: () => new DomainError(401, 'UNAUTHENTICATED', 'Faça login para continuar.'),
  sessionExpired: () => new DomainError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.'),
  invalidCredentials: () => new DomainError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.'),
  forbidden: () => new DomainError(403, 'FORBIDDEN', 'Você não tem permissão para acessar este recurso.'),
  notFound: (resource: string) => new DomainError(404, 'NOT_FOUND', `${resource} não encontrado.`),
  conflict: (message: string, fields?: Record<string, string>) => new DomainError(409, 'CONFLICT', message, fields),
  availability: (message: string, details?: unknown) =>
    new DomainError(409, 'AVAILABILITY_CONFLICT', message, undefined, details),
}

export function errorResponse(error: DomainError) {
  const body: ApiErrorBody = {
    error: { code: error.code, message: error.message, fields: error.fields, details: error.details },
  }
  return HttpResponse.json(body, { status: error.status })
}

export function httpErrorResponse(status: number, code: ApiErrorCode, message: string) {
  return errorResponse(new DomainError(status, code, message))
}
