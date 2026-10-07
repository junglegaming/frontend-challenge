/**
 * Transport-level contracts shared by every domain and by the MSW handlers.
 * Domain-specific DTOs live in `src/domains/<domain>/model/contracts.ts`.
 */

export type ApiErrorCode =
  | 'VALIDATION_ERROR' // 422 — field errors in `fields`
  | 'UNAUTHENTICATED' // 401 — no session
  | 'INVALID_CREDENTIALS' // 401 — wrong e-mail/password on login
  | 'WALLET_REJECTED' // 422 — simulated wallet refused the connection/signature
  | 'SESSION_EXPIRED' // 401 — session existed but expired
  | 'FORBIDDEN' // 403 — authenticated but not allowed
  | 'NOT_FOUND' // 404
  | 'CONFLICT' // 409 — generic conflict (e.g. e-mail already registered)
  | 'AVAILABILITY_CONFLICT' // 409 — edition sold out / quantity above stock
  | 'QUOTE_STALE' // 409 — price, fee or coupon changed since the quote
  | 'IDEMPOTENCY_CONFLICT' // 409 — same key reused with a different payload
  | 'COUPON_INVALID' // 422
  | 'COUPON_EXPIRED' // 422
  | 'TRANSIENT' // 503 — retryable failure
  | 'INTERNAL' // 500

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    fields?: Record<string, string>
    details?: unknown
  }
}

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
