import { verifyPassword } from '../../infra/password'

// Simulates the ADMIN routes of `apps/api` (specs/012-coins-admin/contracts/web-coins-admin-usage.md) for tests and
// offline demos: real-looking credentials, one answer for every failed sign-in, 15-minute admin tokens, and the
// service's error codes. The only credential is a demo account whose password exists here as salt + PBKDF2 hash,
// never in plain text (documented in README.md, like the site's fictitious accounts).

const TOKEN_TTL_MS = 15 * 60 * 1000
const TOKEN_PREFIX = 'mock-coins-admin'

const DEMO_ADMIN = {
  id: 'adm_demo_moedas',
  email: 'moedas@nft.dev',
  passwordSalt: '86fd29f2b2733afe7c4c0de3ce398f46',
  passwordHash: 'c14062db96eacf7c777db2a9c7a473ab764a0807d930b0d0822d5ace63e66766',
} as const

/** Error carrying the API's `{ error: { code, message } }` contract. */
export class CoinsAdminMockError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export class CoinsAdminService {
  private readonly now: () => number

  constructor(now: () => number = Date.now) {
    this.now = now
  }

  /** Unknown e-mail and wrong password get the exact same answer, like the real service. */
  async login(email: string, password: string) {
    const known = email.trim().toLowerCase() === DEMO_ADMIN.email
    // Always derive, so the answer does not reveal through timing whether the e-mail exists.
    const valid = await verifyPassword(password, DEMO_ADMIN.passwordSalt, DEMO_ADMIN.passwordHash)
    if (!known || !valid) {
      throw new CoinsAdminMockError(401, 'invalid_credentials', 'E-mail or password is incorrect.')
    }
    const expiresAtMs = this.now() + TOKEN_TTL_MS
    return {
      token: `${TOKEN_PREFIX}.${DEMO_ADMIN.id}.${expiresAtMs}`,
      expiresAt: new Date(expiresAtMs).toISOString(),
      admin: { id: DEMO_ADMIN.id, email: DEMO_ADMIN.email },
    }
  }

  /** Accepts only admin tokens: an owner token (`mock-ledger.…`) is a valid token of the wrong role (403). */
  authenticate(authorization: string | null): string {
    const [scheme, token] = authorization?.split(' ') ?? []
    if (scheme !== 'Bearer' || !token) {
      throw new CoinsAdminMockError(401, 'missing_token', 'Authorization: Bearer <token> header is required.')
    }
    if (token.startsWith('mock-ledger.')) {
      throw new CoinsAdminMockError(403, 'forbidden', 'This route requires an admin token.')
    }
    const [prefix, adminId, expires] = token.split('.')
    if (prefix !== TOKEN_PREFIX || !adminId || !expires || Number(expires) <= this.now()) {
      throw new CoinsAdminMockError(401, 'invalid_token', 'Token is expired or its signature could not be verified.')
    }
    return adminId
  }

  me(adminId: string) {
    return { id: adminId, role: 'admin' as const }
  }
}
