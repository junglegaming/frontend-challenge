# Quickstart: Validating Platform Coins

## Prerequisites

```bash
pnpm install                 # frontend deps (unchanged)
pnpm --dir server install    # backend deps (new, separate lockfile)
```

## Running both processes

```bash
pnpm dev:all        # runs the Vite dev server + the coins backend together (concurrently)
# or, in two terminals:
pnpm dev                 # frontend, http://localhost:5173
pnpm dev:coins-server    # backend, http://localhost:4000
```

## Automated validation

```bash
pnpm lint && pnpm typecheck && pnpm build   # frontend, unchanged
pnpm test:e2e                                # full existing Playwright suite — MUST stay green,
                                              # unaffected by this feature (it runs against MSW only)
node server/scripts/smoke-test.mjs           # new — exercises the real backend directly:
                                              # topup, debit (sufficient), debit (insufficient → 409),
                                              # refund, confirms balance math at every step
```

## Manual validation scenarios

1. **Top up (US1)**
   - Sign in as any collector, go to the wallets/account area.
   - Confirm the coin balance section shows a starting balance (0 for a new account).
   - Top up a specific amount → confirm the displayed balance increases by exactly that amount,
     with no page refresh needed (FR-003).
   - Refresh the page / sign out and back in → confirm the balance is still correct (FR-004).

2. **Pay with coins (US2)**
   - With a collector who has enough coins (from step 1) and an item in the cart, go to checkout.
   - Confirm both payment methods are offered: connected wallet (unchanged) and coin balance.
   - Choose "pay with coins" and confirm → order completes, reaches the same confirmation
     experience as a wallet-paid order (SC-002), and the coin balance decreases by the expected
     coin-equivalent amount.

3. **Insufficient balance (Edge Case, FR-007)**
   - With a collector whose balance is below the order's coin-equivalent amount, attempt to pay
     with coins → confirm a clear rejection message, no order created, balance unchanged.

4. **Compensation on order failure (Edge Case, FR-009)**
   - Simulate an order-creation failure after a successful debit (e.g., via one of the existing
     mock failure scenarios applied to `POST /api/orders`) → confirm the debited coins are returned
     to the balance.

## Known limitation to keep in mind while testing

The coins backend trusts the `X-User-Id` the frontend sends (research.md D3) — there is no real
authentication behind it. This is an intentional, constitution-documented simplification, not a
bug to "fix" during this feature's testing.
