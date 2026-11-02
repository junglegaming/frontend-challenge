/**
 * Shared API error types for the NFT Marketplace.
 *
 * Centralized error definitions ensuring consistent error handling
 * across the application, mock handlers, and test scenarios.
 *
 * @module shared/api
 * @see src/shared/api/api-types
 */

import type { ApiErrorResponse } from './api-types'

/** HTTP error codes used throughout the API */
export enum HttpStatusCode {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  UnprocessableEntity = 422,
  InternalServerError = 500
}

/** Error codes for API error responses */
export enum ErrorCode {
  ValidationFailed = 'VALIDATION_FAILED',
  DuplicateEmail = 'DUPLICATE_EMAIL',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  SessionExpired = 'SESSION_EXPIRED',
  NotAuthenticated = 'NOT_AUTHORIZED',
  ResourceNotFound = 'RESOURCE_NOT_FOUND',
  ItemAlreadyFavorite = 'ITEM_ALREADY_FAVORITE',
  ItemNotAvailable = 'ITEM_NOT_AVAILABLE',
  CouponInvalid = 'COUPON_INVALID',
  CouponExpired = 'COUPON_EXPIRED',
  PriceChanged = 'PRICE_CHANGED',
  ItemSoldOut = 'ITEM_SOLD_OUT',
  OrderTimeout = 'ORDER_TIMEOUT',
  IdempotencyKeyConflict = 'IDEMPOTENCY_KEY_CONFLICT',
  PayloadMismatch = 'PAYLOAD_MISMATCH',
  NetworkError = 'NETWORK_ERROR',
  TimeoutError = 'TIMEOUT_ERROR'
}

/** Validation error field mapping */
export interface ValidationError {
  field: string
  message: string
  code?: string
}

/** Batch of validation errors indexed by field name */
export interface ValidationErrors {
  [key: string]: ValidationError
}

/** Axios error type for consistent error handling */
export interface AxiosApiError extends Error {
  response: {
    status: HttpStatusCode
    data: ApiErrorResponse
  }
  isAxiosError: boolean
  toJSON: () => {
    message: string
    name: string
    status: number
    error: string
    response: {
      status: number
      data: ApiErrorResponse
    }
  }
}

/** Error boundary state for React error boundaries */
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | ApiErrorResponse
  reset: () => void
}

/** User-facing error messages mapped from error codes */
export const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.ValidationFailed]: 'Please check the form for errors.',
  [ErrorCode.DuplicateEmail]: 'This email is already registered.',
  [ErrorCode.InvalidCredentials]: 'Invalid email or password.',
  [ErrorCode.SessionExpired]: 'Your session has expired. Please log in again.',
  [ErrorCode.NotAuthenticated]: 'You are not authorized to perform this action.',
  [ErrorCode.ResourceNotFound]: 'The requested resource could not be found.',
  [ErrorCode.ItemAlreadyFavorite]: 'This NFT is already in your favorites.',
  [ErrorCode.ItemNotAvailable]: 'This NFT is no longer available.',
  [ErrorCode.CouponInvalid]: 'The coupon code is invalid.',
  [ErrorCode.CouponExpired]: 'This coupon has expired.',
  [ErrorCode.PriceChanged]: 'The price has changed. Please review your cart.',
  [ErrorCode.ItemSoldOut]: 'This NFT is now sold out.',
  [ErrorCode.OrderTimeout]: 'The order timed out. Please try again.',
  [ErrorCode.IdempotencyKeyConflict]: 'A request with this key already exists.',
  [ErrorCode.PayloadMismatch]: 'The request payload does not match the original.',
  [ErrorCode.NetworkError]: 'Network error. Please check your connection.',
  [ErrorCode.TimeoutError]: 'The request timed out. Please try again.'
}

/** Default error handler for Axios interceptors */
export function handleApiError(error: unknown): never {
  const axiosError = error as AxiosApiError

  if (!axiosError.response) {
    throw new Error(error instanceof Error ? error.message : 'Unexpected error')
  }

  const { status, data } = axiosError.response
  const code = data.error.code as ErrorCode || ErrorCode.NetworkError

  // Map error code to user-friendly message
  const message = errorMessages[code] || data.error.message || 'An unexpected error occurred'

  throw new Error(`${message} (${HttpStatusCode[status]})`)
}

/** Check if error matches a specific error code */
export function isErrorCode(
  error: unknown,
  code: ErrorCode
): error is AxiosApiError {
  try {
    handleApiError(error)
    return true
  } catch (e) {
    return false
  }
}