import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { z } from "zod"
import { forbidden, internal, unauthorized } from "./errors.js"

const TOKEN_TTL_SECONDS = 15 * 60

const authTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  /** Absent on owner tokens. Only `signAdminToken` can set it, and `/auth/token` never does. */
  role: z.literal("admin").optional(),
})

type AuthTokenClaims = z.infer<typeof authTokenClaimsSchema>

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- extending Express's Request type
  namespace Express {
    interface Request {
      ownerId?: string
      adminId?: string
    }
  }
}

function getSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET
  if (!secret) {
    throw internal(
      "missing_auth_secret",
      "AUTH_JWT_SECRET is not configured. Set it in apps/api/.env.local (see .env.example).",
    )
  }
  return secret
}

export function signToken(ownerId: string): { token: string; expiresAt: string } {
  const secret = getSecret()
  const token = jwt.sign({ sub: ownerId }, secret, {
    algorithm: "HS256",
    expiresIn: TOKEN_TTL_SECONDS,
  })
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString()
  return { token, expiresAt }
}

/** Verifies the bearer token of a request and returns its claims; throws a 401 `ApiError` otherwise. */
function verifyRequestToken(req: Request): AuthTokenClaims {
  const header = req.header("authorization")
  const [scheme, token] = header?.split(" ") ?? []

  if (scheme !== "Bearer" || !token) {
    throw unauthorized("missing_token", "Authorization: Bearer <token> header is required.")
  }

  const secret = getSecret()

  let payload: unknown
  try {
    payload = jwt.verify(token, secret, { algorithms: ["HS256"] })
  } catch {
    throw unauthorized("invalid_token", "Token is expired or its signature could not be verified.")
  }

  const claims = authTokenClaimsSchema.safeParse(payload)
  if (!claims.success) {
    throw unauthorized("invalid_token", "Token is missing its owner claim.")
  }
  return claims.data
}

export function signAdminToken(adminId: string): { token: string; expiresAt: string } {
  const secret = getSecret()
  const token = jwt.sign({ sub: adminId, role: "admin" }, secret, {
    algorithm: "HS256",
    expiresIn: TOKEN_TTL_SECONDS,
  })
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString()
  return { token, expiresAt }
}

/** Owner routes: valid token, and NOT an admin token (admins do not act as owners). */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const claims = verifyRequestToken(req)
    if (claims.role !== undefined) {
      throw forbidden("wrong_token_type", "Admin tokens cannot be used on owner routes.")
    }
    // The acting owner id comes exclusively from this verified claim (FR-013).
    req.ownerId = claims.sub
    next()
  } catch (error) {
    next(error)
  }
}

/** Admin routes: valid token carrying `role: "admin"`. Owner tokens get a 403. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  try {
    const claims = verifyRequestToken(req)
    if (claims.role !== "admin") {
      throw forbidden("admin_only", "This route requires an admin token.")
    }
    req.adminId = claims.sub
    next()
  } catch (error) {
    next(error)
  }
}
