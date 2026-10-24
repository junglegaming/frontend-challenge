import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// node:sqlite (not better-sqlite3): no C++ build toolchain is available in this environment to
// compile a native binding — see specs/006-platform-coins/research.md D1. It is still
// experimental in this Node version, an accepted risk for this small demo-scale service.

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
mkdirSync(DATA_DIR, { recursive: true })

export const db = new DatabaseSync(join(DATA_DIR, 'coins.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS coin_balances (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0)
  );

  CREATE TABLE IF NOT EXISTS coin_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('topup','debit','refund')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    order_ref TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

/** Runs `fn` inside a manual BEGIN/COMMIT/ROLLBACK — node:sqlite has no built-in `.transaction()`. */
export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}
