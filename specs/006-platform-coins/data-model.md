# Data Model: Platform Coins

## Backend storage (`server/`, SQLite — see research.md D4 for full DDL)

- **`users(id, created_at)`** — `id` mirrors the frontend's existing (simulated) session user id.
- **`coin_balances(user_id, balance)`** — exactly one row per user; `balance` is a non-negative
  integer (coins have no fractional unit); `CHECK (balance >= 0)` enforced at the database level.
- **`coin_transactions(id, user_id, type, amount, order_ref, created_at)`** — the ledger; `type` is
  one of `'topup' | 'debit' | 'refund'`; `amount` is always a positive integer (the sign is implied
  by `type`, never stored as a negative number); `order_ref` is optional (set for `debit`/`refund`,
  correlating to the order the coins payment is for; absent for `topup`).

## Frontend domain contracts (`src/domains/coins/model/contracts.ts`)

```ts
export interface CoinBalance {
  userId: string
  balance: number   // non-negative integer
}

export interface CoinTransaction {
  id: string
  type: 'topup' | 'debit' | 'refund'
  amount: number     // positive integer
  orderRef?: string
  createdAt: string
}

/** Fixed, single conversion rate used for every pay-with-coins purchase (FR-006). */
export const ETH_TO_COINS_RATE = 1000
```

**Validation rules** (enforced server-side, per FR-002/FR-007):
- `topup` and `debit` request `amount` MUST be a positive integer; `0` or negative is rejected.
- A `debit` MUST be rejected (`409`, no state change) when the requested `amount` is strictly
  greater than the current balance — equal is allowed (spec.md Edge Cases: "insufficient" means
  strictly less than required).
- `balance` MUST never go negative; the database `CHECK` constraint is the final backstop, but the
  service layer MUST reject first so the collector gets a clear message, not a generic 500.

**State/flow** (not a stored "state machine" — a sequence of ledger entries that sum into `balance`):
`topup` → increases `balance`. `debit` → decreases `balance` (only if sufficient). `refund` →
increases `balance` back by the same amount as a prior `debit`, used only as compensation when an
order fails after a successful debit (spec.md Edge Cases, FR-009) — not a general-purpose reversal
collectors can trigger themselves.
