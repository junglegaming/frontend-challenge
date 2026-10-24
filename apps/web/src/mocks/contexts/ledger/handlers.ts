import { HttpResponse, http } from 'msw'
import { LedgerMockError, type LedgerBalanceRecord, type LedgerService } from './service'

const MAX_LIMIT = 200

/** Failure modes driven by the active mock scenario (specs/011-web-coins-real-api, research D8). */
export interface LedgerFailurePolicy {
  /** Every route except `/health` answers 503, as if the coins service were down. */
  unavailable: () => boolean
  /** The first write of each owner is applied, then answered 503: a response lost after the commit. */
  loseFirstWriteResponse: () => boolean
}

const noFailures: LedgerFailurePolicy = { unavailable: () => false, loseFirstWriteResponse: () => false }

const serviceUnavailable = () =>
  new LedgerMockError(503, 'service_unavailable', 'The coins service is temporarily unavailable.')

/** `base` is the app's `/backend` prefix, which Vite/vercel.json map to the real API's `/api`. */
export function ledgerHandlers(base: string, ledger: LedgerService, failures: LedgerFailurePolicy = noFailures) {
  // Owners whose first write already had its response dropped (in memory: one loss per owner per page load).
  const lostResponseFor = new Set<string>()

  const run = (fn: () => Response | Promise<Response>) => async () => {
    try {
      if (failures.unavailable()) throw serviceUnavailable()
      return await fn()
    } catch (error) {
      if (error instanceof LedgerMockError) {
        return HttpResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status })
      }
      throw error
    }
  }

  const bodyOf = async (request: Request): Promise<Record<string, unknown>> => {
    const parsed: unknown = await request.json().catch(() => ({}))
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
  }

  const ownerOf = (request: Request) => ledger.authenticate(request.headers.get('authorization'))
  const keyOf = (request: Request) => request.headers.get('idempotency-key')

  /** Applies the write, then (in the response-lost scenario) answers 503 once per owner, as a lost response would. */
  const answerWrite = (ownerId: string, write: () => LedgerBalanceRecord) => {
    const result = write()
    if (failures.loseFirstWriteResponse() && !lostResponseFor.has(ownerId)) {
      lostResponseFor.add(ownerId)
      throw serviceUnavailable()
    }
    return HttpResponse.json(result)
  }

  return [
    http.get(`${base}/health`, () => HttpResponse.json({ status: 'ok' })),

    http.post(
      `${base}/auth/token`,
      ({ request }) => run(async () => HttpResponse.json(ledger.issueToken((await bodyOf(request)).ownerId)))(),
    ),

    http.get(`${base}/coins/balance`, ({ request }) =>
      run(() => HttpResponse.json(ledger.getBalance(ownerOf(request))))(),
    ),

    http.get(`${base}/coins/transactions`, ({ request }) =>
      run(() => {
        const ownerId = ownerOf(request)
        const raw = new URL(request.url).searchParams.get('limit')
        const limit = raw === null ? 50 : Number(raw)
        if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
          throw new LedgerMockError(400, 'invalid_limit', 'limit MUST be an integer between 1 and 200.')
        }
        return HttpResponse.json({ ownerId, transactions: ledger.listTransactions(ownerId, limit) })
      })(),
    ),

    http.post(`${base}/coins/topup`, ({ request }) =>
      run(async () => {
        const ownerId = ownerOf(request)
        const { amount } = await bodyOf(request)
        return answerWrite(ownerId, () => ledger.topUp(ownerId, amount, keyOf(request)))
      })(),
    ),

    http.post(`${base}/coins/debit`, ({ request }) =>
      run(async () => {
        const ownerId = ownerOf(request)
        const { amount } = await bodyOf(request)
        return answerWrite(ownerId, () => ledger.debit(ownerId, amount, keyOf(request)))
      })(),
    ),
  ]
}
