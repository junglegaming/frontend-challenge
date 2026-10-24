import type { NextFunction, Request, Response } from 'express'
import { db } from '../db.js'

declare global {
  namespace Express {
    interface Request {
      userId: string
    }
  }
}

/**
 * Trusts the `X-User-Id` header sent by the frontend (its own, already-simulated session user
 * id) — there is no real authentication anywhere in this project. Documented, accepted
 * simplification (constitution v1.1.0, "Exceção Pontual: Backend Real de Moedas da Plataforma";
 * research.md D3) — never to be presented as a real security model.
 */
export function identity(req: Request, res: Response, next: NextFunction) {
  const userId = req.header('X-User-Id')
  if (!userId) {
    res.status(401).json({ error: 'missing_user_id' })
    return
  }

  db.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)').run(userId)
  db.prepare('INSERT OR IGNORE INTO coin_balances (user_id, balance) VALUES (?, 0)').run(userId)

  req.userId = userId
  next()
}
