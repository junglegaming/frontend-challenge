# Quickstart: Validating the Admin Console

## Prerequisites

```bash
pnpm install
pnpm dev   # http://localhost:5173, MSW mocks active
```

Seed admin credentials (per research.md D1 — `usr_ana`, already in `src/mocks/fixtures/users.ts`
and documented in the mocks README): `ana@nft.dev`.

## Automated validation

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e                                    # full suite, confirms zero regressions
pnpm exec playwright test e2e/admin-products
pnpm exec playwright test e2e/admin-users
```

## Manual validation scenarios

1. **Access control (FR-003/FR-004)**
   - Sign in as `usr_ana` (admin) → navigate to `/admin/products` → page loads.
   - Sign in as `usr_bruno` (collector) → load `/admin/products` directly by URL → redirected away,
     no admin content ever flashes on screen.
   - Signed out → load `/admin/users` directly → redirected to `/login?redirect=/admin/users`.

2. **NFT listing management (US2)**
   - As admin, create a new listing with one edition → confirm it appears in the public catalog
     (`/`) with the entered price/stock.
   - Edit that edition's price/stock → confirm the public catalog reflects it without a manual
     refresh (realtime `nft.updated`).
   - Delist it → confirm it disappears from `/` and `/market`, while any existing order referencing
     it is unaffected.

3. **User management (US3)**
   - As admin, search for `usr_bruno` → open detail → suspend → confirm `usr_bruno`'s session ends
     immediately (their next authenticated action behaves like an expired session) and they cannot
     sign back in until reactivated.
   - Attempt to suspend the sole admin (`usr_ana`, signed in as herself) → confirm it's blocked with
     an explanation (FR-011).
   - Reactivate `usr_bruno` → confirm sign-in works again.

4. **Mocked AI image generator (US4)**
   - In the listing form, type a description, generate an image → confirm it appears as the
     listing's artwork.
   - Generate again with the exact same text → confirm the result is byte-identical (FR-013).
   - Submit an empty description → confirm a clear inline rejection (FR-015), no image generated.

5. **Responsive/a11y spot-check**
   - Resize `/admin/products` and `/admin/users` to 390px and 1440px — no horizontal scroll, every
     action reachable.
   - Run the axe-based check already encoded in each new e2e spec — zero critical violations.
