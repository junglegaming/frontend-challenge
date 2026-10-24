import { HttpResponse, delay, http } from 'msw'
import { z } from 'zod'
import type { LedgerService } from '../ledger/service'
import { CoinsAdminMockError, type CoinsAdminService } from './service'

const MAX_LIMIT = 200

/** Failure modes driven by the active mock scenario (specs/012-coins-admin, research D7). */
export interface CoinsAdminFailurePolicy {
  /** Every route answers 503, login included, as if the coins service were down. */
  unavailable: () => boolean
  /** Every authenticated route answers 401 `invalid_token`, as if the 15-minute access had run out. */
  sessionExpired: () => boolean
  /** Network latency of the active scenario, in ms (the `/api` handlers get it from `route()`; `/backend` has none). */
  latencyMs: () => number
}

const noFailures: CoinsAdminFailurePolicy = { unavailable: () => false, sessionExpired: () => false, latencyMs: () => 0 }

const loginBodySchema = z.object({
  email: z.string().trim().max(254).email(),
  password: z.string().min(1).max(256),
})

const OWNER_ID = /^[A-Za-z0-9_.-]{1,128}$/

/** `base` is the app's `/backend` prefix, which Vite/vercel.json map to the real API's `/api`. */
export function coinsAdminHandlers(
  base: string,
  admin: CoinsAdminService,
  ledger: LedgerService,
  failures: CoinsAdminFailurePolicy = noFailures,
) {
  const run = (fn: () => Response | Promise<Response>) => async () => {
    try {
      const lag = failures.latencyMs()
      if (lag > 0) await delay(lag)
      if (failures.unavailable()) {
        throw new CoinsAdminMockError(503, 'service_unavailable', 'The coins service is temporarily unavailable.')
      }
      return await fn()
    } catch (error) {
      if (error instanceof CoinsAdminMockError) {
        return HttpResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status })
      }
      throw error
    }
  }

  const adminOf = (request: Request) => {
    if (failures.sessionExpired()) {
      throw new CoinsAdminMockError(401, 'invalid_token', 'Token is expired or its signature could not be verified.')
    }
    return admin.authenticate(request.headers.get('authorization'))
  }

  return [
    http.post(`${base}/admin/login`, ({ request }) =>
      run(async () => {
        const body: unknown = await request.json().catch(() => ({}))
        const parsed = loginBodySchema.safeParse(body)
        if (!parsed.success) {
          throw new CoinsAdminMockError(400, 'invalid_login_request', 'email (valid) and password are required.')
        }
        return HttpResponse.json(await admin.login(parsed.data.email, parsed.data.password))
      })(),
    ),

    http.get(`${base}/admin/me`, ({ request }) => run(() => HttpResponse.json(admin.me(adminOf(request))))()),

    http.get(`${base}/admin/owners`, ({ request }) =>
      run(() => {
        adminOf(request)
        const params = new URL(request.url).searchParams
        const rawLimit = params.get('limit')
        const limit = rawLimit === null ? 50 : Number(rawLimit)
        const cursor = params.get('cursor') ?? undefined
        const invalidCursor = cursor !== undefined && (cursor.length < 1 || cursor.length > 2048)
        if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT || invalidCursor) {
          throw new CoinsAdminMockError(
            400,
            'invalid_query',
            'limit MUST be an integer between 1 and 200; cursor MUST be a non-empty string.',
          )
        }
        return HttpResponse.json(ledger.listOwners(limit, cursor))
      })(),
    ),

    http.get<{ ownerId: string }>(`${base}/admin/owners/:ownerId`, ({ request, params }) =>
      run(() => {
        adminOf(request)
        const ownerId = decodeURIComponent(String(params.ownerId))
        if (!OWNER_ID.test(ownerId)) {
          throw new CoinsAdminMockError(
            400,
            'invalid_owner_id',
            'ownerId MUST match [A-Za-z0-9_.-] and have at most 128 characters.',
          )
        }
        return HttpResponse.json(ledger.ownerDetail(ownerId))
      })(),
    ),
  ]
}
