import { LocalStoragePersistence, Store } from '../../infra/store'

// Simulates `apps/api` (specs/007-monorepo-vercel-blob/contracts/api-routes.md + specs/010-api-production-backend/
// contracts/api-delta.md) for tests and offline demos. It reproduces the contract (token issuance, per-owner
// isolation, 400/401/402, `Idempotency-Key` with replay and 409), not the database. State is persisted like the rest
// of the mock, so a reload keeps the coins exactly as the real API would (specs/011-web-coins-real-api, FR-011).

const TOKEN_TTL_MS = 15 * 60 * 1000
const MAX_KEY_LENGTH = 128

export interface LedgerBalanceRecord {
  ownerId: string
  amount: number
  version: number
  updatedAt: string
}

export interface LedgerTransactionRecord {
  txId: string
  ownerId: string
  direction: 'credit' | 'debit'
  amount: number
  resultingBalance: number
  createdAt: string
}

interface StoredOperation {
  direction: 'credit' | 'debit'
  amount: number
  result: LedgerBalanceRecord
}

interface LedgerState {
  balances: Record<string, LedgerBalanceRecord>
  history: Record<string, LedgerTransactionRecord[]>
  /** `${ownerId}\u0000${key}` -> the operation that key already applied. */
  operations: Record<string, StoredOperation>
  sequence: number
}

const emptyState = (): LedgerState => ({ balances: {}, history: {}, operations: {}, sequence: 0 })

// Cursor codec (the mock runs in the browser: no `Buffer`). base64url of the UTF-8 owner id, like apps/api.
function encodeCursor(value: string): string {
  const binary = String.fromCharCode(...new TextEncoder().encode(value))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeCursor(cursor: string): string {
  try {
    const base64 = cursor.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='))
    return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
  } catch {
    return ''
  }
}

/** Error carrying the API's `{ error: { code, message } }` contract. */
export class LedgerMockError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export class LedgerService {
  private readonly store: Store<LedgerState>
  private readonly now: () => number

  constructor(
    now: () => number = Date.now,
    store: Store<LedgerState> = new Store(new LocalStoragePersistence<LedgerState>('nft-mock:ledger', 1), emptyState),
  ) {
    this.now = now
    this.store = store
  }

  reset() {
    this.store.reset()
  }

  issueToken(ownerId: unknown) {
    if (typeof ownerId !== 'string' || ownerId.trim() === '') {
      throw new LedgerMockError(400, 'invalid_owner_id', 'ownerId is required and MUST be a non-empty string.')
    }
    const expiresAtMs = this.now() + TOKEN_TTL_MS
    return {
      token: `mock-ledger.${encodeURIComponent(ownerId.trim())}.${expiresAtMs}`,
      expiresAt: new Date(expiresAtMs).toISOString(),
    }
  }

  /** The acting owner comes only from the token, exactly like the real API. */
  authenticate(authorization: string | null): string {
    const [scheme, token] = authorization?.split(' ') ?? []
    if (scheme !== 'Bearer' || !token) {
      throw new LedgerMockError(401, 'missing_token', 'Authorization: Bearer <token> header is required.')
    }
    const [prefix, owner, expires] = token.split('.')
    if (prefix !== 'mock-ledger' || !owner || !expires || Number(expires) <= this.now()) {
      throw new LedgerMockError(401, 'invalid_token', 'Token is expired or its signature could not be verified.')
    }
    return decodeURIComponent(owner)
  }

  getBalance(ownerId: string): LedgerBalanceRecord {
    return (
      this.store.read((s) => s.balances[ownerId]) ?? {
        ownerId,
        amount: 0,
        version: 0,
        updatedAt: new Date(0).toISOString(),
      }
    )
  }

  topUp(ownerId: string, amount: unknown, idempotencyKey?: string | null) {
    return this.applyOnce(ownerId, 'credit', this.validAmount(amount), idempotencyKey)
  }

  debit(ownerId: string, amount: unknown, idempotencyKey?: string | null) {
    return this.applyOnce(ownerId, 'debit', this.validAmount(amount), idempotencyKey)
  }

  /**
   * Owners that have a balance, in ascending `ownerId` order, keyset-paginated like `apps/api`: `cursor` is the
   * base64url of the last `ownerId` of the previous page, and is returned only when there are more owners.
   */
  listOwners(limit: number, cursor?: string): { owners: { ownerId: string; updatedAt: string }[]; cursor?: string } {
    const after = cursor ? decodeCursor(cursor) : ''
    const rows = this.store
      .read((s) => Object.values(s.balances))
      .filter((balance) => balance.ownerId > after)
      .sort((a, b) => (a.ownerId < b.ownerId ? -1 : a.ownerId > b.ownerId ? 1 : 0))
      .slice(0, limit + 1)
    const page = rows.slice(0, limit)
    const last = page.at(-1)
    return {
      owners: page.map((row) => ({ ownerId: row.ownerId, updatedAt: row.updatedAt })),
      cursor: rows.length > limit && last ? encodeCursor(last.ownerId) : undefined,
    }
  }

  /** What `GET /admin/owners/:ownerId` shows: the balance and the 50 most recent operations. */
  ownerDetail(ownerId: string) {
    return { balance: this.getBalance(ownerId), transactions: this.listTransactions(ownerId, 50) }
  }

  listTransactions(ownerId: string, limit: number) {
    return [...(this.store.read((s) => s.history[ownerId]) ?? [])].reverse().slice(0, limit)
  }

  private validAmount(amount: unknown): number {
    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      throw new LedgerMockError(400, 'invalid_amount', 'amount MUST be a positive integer.')
    }
    return amount
  }

  /** Same key + same operation -> the original result, nothing written; same key + another operation -> 409. */
  private applyOnce(
    ownerId: string,
    direction: 'credit' | 'debit',
    amount: number,
    idempotencyKey: string | null | undefined,
  ): LedgerBalanceRecord {
    if (idempotencyKey === undefined || idempotencyKey === null) return this.apply(ownerId, direction, amount)
    if (idempotencyKey.length < 1 || idempotencyKey.length > MAX_KEY_LENGTH) {
      throw new LedgerMockError(400, 'invalid_idempotency_key', 'Idempotency-Key MUST have between 1 and 128 characters.')
    }

    const operationId = `${ownerId}\u0000${idempotencyKey}`
    const stored = this.store.read((s) => s.operations[operationId])
    if (stored) {
      if (stored.direction !== direction || stored.amount !== amount) {
        throw new LedgerMockError(409, 'idempotency_key_conflict', 'This Idempotency-Key was already used for a different operation.')
      }
      return stored.result
    }

    // A 402 throws before anything is stored, so the same key can be used again once the balance allows it.
    const result = this.apply(ownerId, direction, amount)
    this.store.write((s) => {
      s.operations[operationId] = { direction, amount, result }
    })
    return result
  }

  private apply(ownerId: string, direction: 'credit' | 'debit', amount: number): LedgerBalanceRecord {
    const current = this.getBalance(ownerId)
    const next = direction === 'credit' ? current.amount + amount : current.amount - amount
    if (next < 0) {
      throw new LedgerMockError(402, 'insufficient_balance', 'Balance is lower than the requested amount.')
    }

    const updatedAt = new Date(this.now()).toISOString()
    const record: LedgerBalanceRecord = { ownerId, amount: next, version: current.version + 1, updatedAt }

    this.store.write((s) => {
      s.balances[ownerId] = record
      s.sequence += 1
      const entry: LedgerTransactionRecord = {
        txId: `mock-tx-${s.sequence}`,
        ownerId,
        direction,
        amount,
        resultingBalance: next,
        createdAt: updatedAt,
      }
      s.history[ownerId] = [...(s.history[ownerId] ?? []), entry]
    })
    return record
  }
}
