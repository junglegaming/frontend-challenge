import { Router, type Request } from "express"
import { requireAuth } from "../lib/auth.js"
import {
  IdempotencyConflictError,
  InsufficientBalanceError,
  amountSchema,
  idempotencyKeySchema,
  transactionsQuerySchema,
} from "../domains/coins/contracts.js"
import * as coinsService from "../domains/coins/service.js"
import { badRequest, conflict, paymentRequired } from "../lib/errors.js"

// Express 5 forwards rejected promises from async handlers to the error
// middleware, so a database failure surfaces as a structured 500 instead of
// crashing the process.
const router = Router()

router.use(requireAuth)

function ownerIdOrThrow(req: { ownerId?: string }): string {
  // Always set: this router sits behind requireAuth.
  if (!req.ownerId) {
    throw new Error("requireAuth did not populate req.ownerId")
  }
  return req.ownerId
}

router.get("/balance", async (req, res) => {
  const ownerId = ownerIdOrThrow(req)
  const balance = await coinsService.getBalance(ownerId)
  res.status(200).json(balance)
})

router.get("/transactions", async (req, res, next) => {
  const ownerId = ownerIdOrThrow(req)
  const parsed = transactionsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    next(badRequest("invalid_limit", "limit MUST be an integer between 1 and 200."))
    return
  }

  const items = await coinsService.listTransactions(ownerId, parsed.data.limit)
  res.status(200).json({ ownerId, transactions: items })
})

/** Optional `Idempotency-Key` header: absent -> `undefined`; present but empty or over 128 chars -> 400. */
function idempotencyKeyOrThrow(req: Request): string | undefined {
  const raw = req.get("Idempotency-Key")
  if (raw === undefined) return undefined
  const parsed = idempotencyKeySchema.safeParse(raw)
  if (!parsed.success) {
    throw badRequest("invalid_idempotency_key", "Idempotency-Key MUST have between 1 and 128 characters.")
  }
  return parsed.data
}

/** Maps the domain errors shared by topup and debit to their HTTP answers. */
function toApiError(err: unknown): unknown {
  if (err instanceof InsufficientBalanceError) {
    return paymentRequired("insufficient_balance", "Balance is lower than the requested amount.")
  }
  if (err instanceof IdempotencyConflictError) {
    return conflict("idempotency_key_conflict", "Idempotency-Key was already used with a different operation.")
  }
  return err
}

router.post("/topup", async (req, res, next) => {
  const ownerId = ownerIdOrThrow(req)
  const parsed = amountSchema.safeParse(req.body)
  if (!parsed.success) {
    next(badRequest("invalid_amount", "amount MUST be a positive integer."))
    return
  }
  const idempotencyKey = idempotencyKeyOrThrow(req)

  try {
    const balance = await coinsService.topUp(ownerId, parsed.data.amount, idempotencyKey)
    res.status(200).json(balance)
  } catch (err) {
    next(toApiError(err))
  }
})

router.post("/debit", async (req, res, next) => {
  const ownerId = ownerIdOrThrow(req)
  const parsed = amountSchema.safeParse(req.body)
  if (!parsed.success) {
    next(badRequest("invalid_amount", "amount MUST be a positive integer."))
    return
  }
  const idempotencyKey = idempotencyKeyOrThrow(req)

  try {
    const balance = await coinsService.debit(ownerId, parsed.data.amount, idempotencyKey)
    res.status(200).json(balance)
  } catch (err) {
    next(toApiError(err))
  }
})

export default router
