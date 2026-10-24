import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { db, transaction } from '../db.js'

export const coinsRouter = Router()

interface BalanceRow {
  balance: number
}

function currentBalance(userId: string): number {
  const row = db.prepare('SELECT balance FROM coin_balances WHERE user_id = ?').get(userId) as BalanceRow | undefined
  return row?.balance ?? 0
}

coinsRouter.get('/balance', (req, res) => {
  res.json({ userId: req.userId, balance: currentBalance(req.userId) })
})

const topupSchema = z.object({ amount: z.number().int().positive() })

coinsRouter.post('/topup', (req, res) => {
  const parsed = topupSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_amount' })
    return
  }
  const { amount } = parsed.data
  const userId = req.userId
  const transactionId = randomUUID()

  const balance = transaction(() => {
    db.prepare('UPDATE coin_balances SET balance = balance + ? WHERE user_id = ?').run(amount, userId)
    db.prepare('INSERT INTO coin_transactions (id, user_id, type, amount) VALUES (?, ?, ?, ?)').run(
      transactionId,
      userId,
      'topup',
      amount,
    )
    return currentBalance(userId)
  })

  res.status(201).json({ userId, balance, transactionId })
})

const debitSchema = z.object({ amount: z.number().int().positive(), orderRef: z.string().optional() })

coinsRouter.post('/debit', (req, res) => {
  const parsed = debitSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_amount' })
    return
  }
  const { amount, orderRef } = parsed.data
  const userId = req.userId
  const transactionId = randomUUID()

  const result = transaction(() => {
    const update = db
      .prepare('UPDATE coin_balances SET balance = balance - ? WHERE user_id = ? AND balance >= ?')
      .run(amount, userId, amount)
    if (update.changes !== 1) {
      return { ok: false as const, balance: currentBalance(userId) }
    }
    db.prepare('INSERT INTO coin_transactions (id, user_id, type, amount, order_ref) VALUES (?, ?, ?, ?, ?)').run(
      transactionId,
      userId,
      'debit',
      amount,
      orderRef ?? null,
    )
    return { ok: true as const, balance: currentBalance(userId) }
  })

  if (!result.ok) {
    res.status(409).json({ error: 'insufficient_balance', balance: result.balance })
    return
  }
  res.json({ userId, balance: result.balance, transactionId })
})

const refundSchema = z.object({ amount: z.number().int().positive(), orderRef: z.string().optional() })

coinsRouter.post('/refund', (req, res) => {
  const parsed = refundSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_amount' })
    return
  }
  const { amount, orderRef } = parsed.data
  const userId = req.userId
  const transactionId = randomUUID()

  const balance = transaction(() => {
    db.prepare('UPDATE coin_balances SET balance = balance + ? WHERE user_id = ?').run(amount, userId)
    db.prepare('INSERT INTO coin_transactions (id, user_id, type, amount, order_ref) VALUES (?, ?, ?, ?, ?)').run(
      transactionId,
      userId,
      'refund',
      amount,
      orderRef ?? null,
    )
    return currentBalance(userId)
  })

  res.json({ userId, balance, transactionId })
})
