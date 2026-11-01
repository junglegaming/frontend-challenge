import { z } from 'zod'

/** Valor em ETH trafega sempre como string decimal (ex.: "1.19"). */
export const ethSchema = z.string().regex(/^\d+(\.\d+)?$/, 'ETH deve ser uma string decimal')
export type Eth = z.infer<typeof ethSchema>

/** Identificador estável de recurso. */
export const idSchema = z.string().min(1)
export type Id = z.infer<typeof idSchema>

/** Códigos de erro do contrato (envelope único). */
export const errorCodes = [
  'VALIDATION_ERROR',
  'SESSION_INVALID',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'AVAILABILITY_CONFLICT',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'STALE_QUOTE',
  'IDEMPOTENCY_CONFLICT',
  'WALLET_REJECTED',
  'WALLET_DISCONNECTED',
  'INTERNAL_ERROR',
  'TIMEOUT',
  'NETWORK_ERROR',
] as const
export type ErrorCode = (typeof errorCodes)[number]

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
  retryable: z.boolean().optional(),
})
export type ApiError = z.infer<typeof apiErrorSchema>

/** Envelope de erro presente em todas as respostas 4xx/5xx. */
export const errorEnvelopeSchema = z.object({
  error: apiErrorSchema,
})

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
})
export type Pagination = z.infer<typeof paginationSchema>

/** Data/hora em ISO 8601. */
export const isoDateSchema = z.string().datetime()
export type IsoDate = z.infer<typeof isoDateSchema>
