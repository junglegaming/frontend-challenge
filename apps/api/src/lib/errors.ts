import type { NextFunction, Request, Response } from "express"

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function badRequest(code: string, message: string): ApiError {
  return new ApiError(400, code, message)
}

export function unauthorized(code: string, message: string): ApiError {
  return new ApiError(401, code, message)
}

export function forbidden(code: string, message: string): ApiError {
  return new ApiError(403, code, message)
}

export function paymentRequired(code: string, message: string): ApiError {
  return new ApiError(402, code, message)
}

export function notFound(code: string, message: string): ApiError {
  return new ApiError(404, code, message)
}

export function conflict(code: string, message: string): ApiError {
  return new ApiError(409, code, message)
}

export function internal(code: string, message: string): ApiError {
  return new ApiError(500, code, message)
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // Express identifies error middleware by its 4-argument signature.
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } })
    return
  }

  const message = err instanceof Error ? err.message : "Unexpected error"
  res.status(500).json({ error: { code: "internal_error", message } })
}
