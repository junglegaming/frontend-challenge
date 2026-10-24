---

description: "Task list for 011-web-coins-real-api"
---

# Tasks: Moedas do site usando o back-end real

**Input**: Design documents from `/specs/011-web-coins-real-api/`

**Prerequisites**: plan.md, spec.md, research.md (D1–D8), data-model.md, contracts/web-ledger-usage.md, quickstart.md

**Tests**: Included. The constitution (Principle VII) requires Playwright e2e against the mocks for critical flows and their failure cases, and the spec sets SC-002/003/004/006/007 that only tests can prove.

**Organization**: Tasks are grouped by user story (spec.md US1–US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US3 from spec.md
- All paths are relative to the repository root.

## Path Conventions

Everything lives in `apps/web/` plus docs (`docs/TEAMS.md`, `specs/008-web-production-env/deploy-environments.md`). `apps/api/` and `server/` are **not** modified (FR-013, FR-014).

---

## Phase 1: Setup

- [X] T001 (2026-10-24: branch `011-web-coins-real-api` from origin/main (9b3dd23); web typecheck clean) Create the feature branch from the current main: `git fetch origin && git checkout -b 011-web-coins-real-api origin/main` (the spec/plan files of `specs/011-web-coins-real-api/` and `.specify/feature.json` come along as uncommitted changes); run `pnpm install` at the root and confirm `pnpm --dir apps/web typecheck` passes before any change

---

## Phase 2: Foundational (blocks every user story)

- [X] T002 In `apps/web/src/domains/ledger/api/client.ts` (research D2, D3): delete `CONFLICT_RETRIES`, `wait` and the 409 retry branch of `ledgerRequest`, so a 409 is thrown at once; add `get isKeyConflict() { return this.status === 409 }` to `LedgerError`; add an optional `idempotencyKey?: string` argument to `ledgerRequest` that, when present, adds the header `Idempotency-Key: <key>` to the request. Keep the 401 single re-issue, the token cache and `subscribeSessionToken(clearLedgerTokens)` unchanged. Update the doc comments (409 = "chave reutilizada com outra operação", final; the file no longer mentions Blob)
- [X] T003 [P] Create `apps/web/src/domains/ledger/model/conversion.ts` with `export const ETH_TO_COINS_RATE = 1000` and `export function toCoinsAmount(totalEth: string): number` returning `new Decimal(totalEth).times(ETH_TO_COINS_RATE).ceil().toNumber()` (copied from `apps/web/src/domains/coins/model/contracts.ts`, research D7); export it from `apps/web/src/domains/ledger/index.ts`
- [X] T004 [P] Create `apps/web/src/domains/ledger/model/keys.ts` with `export function coinsKeys(orderKey: string): { debit: string; refund: string }` returning `${orderKey}:coins-debit` and `${orderKey}:coins-refund` (data-model "Chave de operação"; the API accepts 1..128 characters, throw an `Error` if a result is longer than 128); export it from `apps/web/src/domains/ledger/index.ts`
- [X] T005 [P] Give the MSW ledger mock idempotency parity **and persistence** (data-model "Mock"; FR-002, FR-011; analysis F1): in `apps/web/src/mocks/contexts/ledger/service.ts` add a map keyed by `${ownerId}\u0000${key}` storing `{ direction, amount, result }`; `topUp`/`debit` take an optional `idempotencyKey`: same key + same direction and amount ⇒ return the stored result with no new effect; same key + different direction or amount ⇒ `LedgerMockError(409, 'idempotency_key_conflict', …)`; key empty or longer than 128 ⇒ `LedgerMockError(400, 'invalid_idempotency_key', …)`; a 402 does not store the key. Persist balances, history, the key map and the sequence with the existing localStorage adapter `apps/web/src/mocks/infra/store.ts` (own storage key and schema version; unknown versions discarded) so `page.reload()`/`page.goto()` keep the coins exactly like the real API; `reset()` clears memory and storage. In `apps/web/src/mocks/contexts/ledger/handlers.ts` read the `Idempotency-Key` header in `/coins/topup` and `/coins/debit` and pass it on; update `apps/web/src/mocks/composition.ts` to build the service with the store
- [X] T006 [P] Add two coins failure scenarios (research D8; analysis K1): in `apps/web/src/mocks/scenarios/definitions.ts` add `ledgerUnavailable?: boolean` and `ledgerLoseFirstWriteResponse?: boolean` to `ScenarioDefinition` and the scenarios `{ id: 'coins-unavailable', label: 'Moedas indisponíveis', description: 'O serviço de moedas (/backend) responde 503.', latency: DEFAULT_LATENCY, ledgerUnavailable: true }` and `{ id: 'coins-response-lost', label: 'Resposta de moedas perdida', description: 'A primeira recarga/débito é aplicada, mas a resposta volta como 503.', latency: DEFAULT_LATENCY, ledgerLoseFirstWriteResponse: true }`; in `apps/web/src/mocks/composition.ts` pass both flags to `ledgerHandlers`; in `apps/web/src/mocks/contexts/ledger/handlers.ts`: while `ledgerUnavailable`, every route except `/health` answers `503 { error: { code: 'service_unavailable', … } }`; while `ledgerLoseFirstWriteResponse`, the first `/coins/topup` or `/coins/debit` of each owner is **applied** (key stored) and then answered `503 service_unavailable`, later ones normally
- [X] T007 Rework the ledger hooks in `apps/web/src/domains/ledger/api/queries.ts` (contracts/web-ledger-usage.md; research D3, D5): `useLedgerTopUp()` mutation variables become `{ amount: number; idempotencyKey: string }` (required), sent via `ledgerRequest(..., idempotencyKey)`; optimistic update: `onMutate` cancels `ledgerKeys.balance(userId)`, snapshots it and adds `amount`; `onError` restores the snapshot; `onSuccess` sets the returned balance; `onSettled` invalidates `['ledger', 'transactions', userId]`. Remove `useLedgerDebit`. Add imperative `ledgerDebit(ownerId: string, amount: number, idempotencyKey: string)` and `ledgerCredit(ownerId, amount, idempotencyKey)` returning `LedgerBalance`, and `invalidateLedger(queryClient, ownerId)` that invalidates `['ledger', 'balance', ownerId]` and `['ledger', 'transactions', ownerId]`. Export the new functions from `apps/web/src/domains/ledger/index.ts`. Depends on T002
- [X] T008 [P] Create `apps/web/src/domains/ledger/model/messages.ts` with `ledgerErrorMessage(error: unknown, context?: { balance?: number; required?: number }): string` implementing the data-model "Erro" table verbatim: 402 ⇒ "Saldo de moedas insuficiente: você tem {balance}, esta compra custa {required}." (without context: "Saldo de moedas insuficiente."); 409 ⇒ "Esta operação já foi registrada com outro valor. Recarregue a página."; retryable (network/timeout/5xx, incl. 503) ⇒ "Serviço de moedas indisponível. Tente novamente."; 401 ⇒ "Sua sessão de moedas expirou. Entre de novo."; 400 ⇒ the API message; anything else ⇒ "Não foi possível concluir a operação de moedas."; export it from `apps/web/src/domains/ledger/index.ts`. Depends on T002 (`isKeyConflict`)

**Checkpoint**: `pnpm --dir apps/web typecheck` passes; the old `domains/coins` still compiles (nothing removed yet).

---

## Phase 3: User Story 1 — Ver e recarregar o saldo, inclusive no site publicado (Priority: P1) 🎯 MVP

**Goal**: Wallets shows the real balance and recent history and tops up with a single effect per intent, in every environment.

**Independent Test**: With mocks: sign in, open `/wallets`, see 0, top up 100 → balance 100 and one history entry, survive a reload; with the `coins-unavailable` scenario: a clear message and a retry button.

### Tests for User Story 1

- [X] T009 [P] [US1] Create `apps/web/e2e/wallets/coins.spec.ts` (helpers from `apps/web/e2e/design-system/helpers.ts`: `signIn`, `selectScenario`; `fast` scenario unless stated): (a) a new user sees "0 moedas" and the "Recarregar" control; (b) top up 100 ⇒ "100 moedas" and the history shows one credit of 100, still after `page.reload()`; (c) double-click "Recarregar" with the same amount ⇒ exactly one history entry; (d) **timeout recovery** (constitution VII, analysis K1): `selectScenario(page, 'coins-response-lost')`, top up 50 ⇒ the unavailable alert; click "Recarregar" again with the same amount ⇒ "50 moedas" and exactly **one** credit in the history; (e) `selectScenario(page, 'coins-unavailable')` ⇒ `role="alert"` with "Serviço de moedas indisponível. Tente novamente." and a working "Tentar de novo" after switching back to `fast`; (f) isolation: call `signIn` again (it creates a new, distinct account) ⇒ none of the first account's balance or history is visible; (g) signed out, `/wallets` redirects to `/login` (no coins UI)

### Implementation for User Story 1

- [X] T010 [US1] Rewrite `apps/web/src/pages/wallets/components/CoinsBalanceSection.tsx` on `@/domains/ledger` only (FR-001–FR-004, FR-010): `useLedgerBalance()` shows `data.amount` ("N moedas", `aria-live="polite"`); `useLedgerTransactions(5)` lists the 5 most recent (credit/debit label, amount, resulting balance, date) with an empty state "Nenhuma operação ainda."; top-up keeps one `idempotencyKey` per intent in a `useRef` (`crypto.randomUUID()` on confirm, reused while the same amount is retried, cleared on success or when the amount changes) and calls `useLedgerTopUp().mutate({ amount, idempotencyKey })`; the button is disabled while pending (no double effect); errors use `ledgerErrorMessage` in a `role="alert"` region, and the balance error state shows a "Tentar de novo" button calling `refetch()`; keep the current layout, heading "Moedas da Kurio" and input label; remove every import of `@/domains/coins`, `coinsEnabled` and `isApiError`. Depends on T007, T008
- [X] T011 (2026-10-24: baseline updated and reviewed (only the coins section differs); stable on rerun) [US1] Update the wallets visual baseline: run `pnpm --dir apps/web exec playwright test e2e/wallets --update-snapshots`, review the new `apps/web/e2e/wallets/wallets.spec.ts-snapshots/*` images (only the coins section may differ), then run `e2e/wallets` again without the flag: all green. Depends on T009, T010

**Checkpoint**: US1 works against the mock; `/wallets` no longer depends on `server/`.

---

## Phase 4: User Story 2 — Pagar um pedido com moedas (Priority: P2)

**Goal**: Checkout debits once per order, refuses insufficient balance before creating anything, and credits back exactly once when the order fails.

**Independent Test**: With mocks: top up, pay with coins (order created, balance down by the cost); with too little balance (no order, no debit); with `sold-out-at-checkout` (one debit and one credit of the same amount).

### Tests for User Story 2

- [X] T012 (2026-10-24: 6/6; implementation note: in `order-timeout` the mock creates the order and consumes the cart, so test (d) asserts one debit and no credit, and the message became "Não confirmamos a compra. Confira seus pedidos antes de tentar de novo.") [P] [US2] Create `apps/web/e2e/checkout/coins.spec.ts` (`signIn`, `seedCartItem`, `selectScenario` from `apps/web/e2e/design-system/helpers.ts`; top up through `/wallets`, which persists across navigation after T005): (a) enough balance ⇒ choose "Pagar com moedas da Kurio", confirm, reach the order page, and `/wallets` shows balance − cost with one debit; (b) balance below cost ⇒ the alert "Saldo de moedas insuficiente: você tem X, esta compra custa Y.", no navigation to an order, no debit in the history; (c) **definite rejection**: `selectScenario(page, 'sold-out-at-checkout')` ⇒ error shown, history has exactly one debit and one credit of the same amount, balance back to where it was; (d) **ambiguous failure** (analysis U1): `selectScenario(page, 'order-timeout')` ⇒ the message "Não confirmamos a compra. Confira seus pedidos antes de tentar de novo.", exactly one debit and **no** credit in the history (implementation note: in this scenario the mock creates the order and consumes the cart, so a retry from the UI is not possible; replay-without-charging is proven by (e) and T016); (e) **timeout on the debit** (constitution VII): `selectScenario(page, 'coins-response-lost')`, confirm ⇒ error; confirm again ⇒ order page with exactly one debit; (f) double-click "Confirmar compra" ⇒ exactly one debit. Cost = `toCoinsAmount(quote total)` read from the "Custo desta compra" text

### Implementation for User Story 2

- [X] T013 [P] [US2] Update `apps/web/src/pages/checkout/components/PaymentMethodPicker.tsx`: replace `@/domains/coins` with `useLedgerBalance()` (show `data.amount`), remove the `coinsEnabled` early return (always visible), and render the insufficient-balance hint as `role="alert"` with `ledgerErrorMessage` using `{ balance, required: coinsRequired }`; show the balance error with `ledgerErrorMessage` too. Depends on T007, T008
- [X] T014 [US2] Rewrite the coins branch of `onSubmit` in `apps/web/src/pages/checkout/CheckoutPage.tsx` following the data-model "Estados do pagamento com moedas" (FR-007 as amended by analysis U1): `const keys = coinsKeys(idempotencyKey)`; `amount = toCoinsAmount(fresh.data.total)` from `@/domains/ledger`; `await ledgerDebit(userId, amount, keys.debit)`; on `LedgerError` with `isInsufficientBalance` show `ledgerErrorMessage(error, { balance, required: amount })` and return (no order); other errors ⇒ `ledgerErrorMessage(error)` and return (a retry reuses the same keys). When `createOrder` fails: **definite rejection** = `isApiError(error) && error.status !== null && error.status >= 400 && error.status < 500` ⇒ `ledgerCredit(userId, amount, keys.refund)`; on success call `rotateIdempotencyKey(fresh.data.signature)` and toast "Pedido não criado; suas moedas foram devolvidas."; on failure keep a persistent `role="alert"` "Suas moedas ainda não voltaram." with a "Devolver moedas de novo" button that retries `ledgerCredit` with the **same** `keys.refund` and rotates the key only once the credit succeeds. **Ambiguous failure** (anything else: network, timeout, 5xx) ⇒ do **not** credit and do **not** rotate; show "Não confirmamos a compra. Confira seus pedidos antes de tentar de novo." (the next attempt reuses the order key, so the debit and the order replay without a new effect). After every coins write call `invalidateLedger(queryClient, userId)`. Disable the confirm button while the debit/order is in flight. Add `export function rotateIdempotencyKey(quoteSignature: string): string` to `apps/web/src/domains/checkout/model/idempotency.ts` (replaces the stored key with a new `crypto.randomUUID()`) and export it from `apps/web/src/domains/checkout/index.ts`. Remove every import of `@/domains/coins`. Depends on T003, T004, T007, T008, T013
- [X] T015 (2026-10-24: baseline updated and reviewed (payment picker now visible); the existing heading selector `'Pagamento'` matched the new `'Forma de pagamento'` too, so `exact: true` was added in `checkout.spec.ts` (lines 114, 126); checkout suite 15/15 twice) [US2] Update the checkout visual baseline: `pnpm --dir apps/web exec playwright test e2e/checkout --update-snapshots`, review `apps/web/e2e/checkout/checkout.spec.ts-snapshots/*` (the payment picker is now always visible), rerun without the flag: all green, including the existing `checkout.spec.ts` idempotency test. Depends on T012, T014

**Checkpoint**: US2 works against the mock; no page imports `@/domains/coins` anymore.

---

## Phase 5: User Story 3 — Desenvolver e testar sem depender do serviço publicado (Priority: P3)

**Goal**: The mock behaves like the real API, the old client is gone, and the production build only talks to `/backend`.

**Independent Test**: The whole e2e suite runs with no external service; the production-build suite shows the coins section, the unavailable state locally, and no request to `localhost`/port 4000.

### Tests for User Story 3

- [X] T016 [P] [US3] Extend `apps/web/e2e/ledger/ledger.spec.ts`: (a) a top-up sent **20 times** with the same `Idempotency-Key` returns the same balance every time and adds exactly one history entry (SC-002, analysis C1); (b) the same key with another amount returns 409 `idempotency_key_conflict` and the client throws at once (count the requests with `page.on('request')`: exactly one POST, no retry); (c) a key of 129 characters returns 400 `invalid_idempotency_key`; (d) balance and history survive `page.reload()` (mock persistence, T005). Remove any test that relied on the 409 retry
- [X] T017 (2026-10-24: `no request to localhost` is checked as `every coins call starts with <origin>/backend/` and `nothing to port 4000`, since the local preview itself runs on localhost; production suite 8/8) [P] [US3] Rewrite `apps/web/e2e/production/hardening.spec.ts` for the new behavior (FR-012, SC-007): after `signIn`, `/wallets` **shows** the heading "Moedas da Kurio"; without `PLAYWRIGHT_BASE_URL` (no API behind the local `/backend`) it shows the unavailable alert; the checkout shows "Pagar com moedas da Kurio"; across the journey every coins request URL path starts with `/backend/` and no request targets `localhost` or port 4000. With `PLAYWRIGHT_BASE_URL` set, assert the balance renders instead of the alert

### Implementation for User Story 3

- [X] T018 [US3] Retire the old client (FR-013, research D1/D6): delete `apps/web/src/domains/coins/` (including its README); remove `coinsApiUrl`, `coinsEnabled` and the `VITE_COINS_API_URL` default from `apps/web/src/shared/config/env.ts`; remove `VITE_COINS_API_URL` from `apps/web/src/vite-env.d.ts`, `apps/web/.env.example` and `apps/web/.env.production` (and their comments); in `apps/web/scripts/check-production-bundle.mjs` drop the `delete env.VITE_COINS_API_URL` line and its comment, keeping the `localhost` check; update the comment in `apps/web/playwright.production.config.ts`. Then `grep -rn "domains/coins\|VITE_COINS_API_URL\|coinsEnabled\|coinsApiUrl" apps/web/src apps/web/e2e apps/web/scripts apps/web/*.ts apps/web/.env*` MUST return nothing. Depends on T010, T014
- [X] T019 (2026-10-24: ledger 10/10, production suite 8/8, bundle check clean) [US3] Run `pnpm --dir apps/web exec playwright test e2e/ledger` and `pnpm --dir apps/web exec playwright test -c playwright.production.config.ts` and `node apps/web/scripts/check-production-bundle.mjs`; all green. Depends on T016, T017, T018

**Checkpoint**: SC-006/SC-007 hold; the site has one coins client.

---

## Phase 6: Polish & Cross-Cutting

- [X] T020 (2026-10-24: README rewritten (Postgres, 402/409, idempotency, cache/retries, FR-016 limitation, mock scenarios)) [P] Update `apps/web/src/domains/ledger/README.md`: storage is Postgres/Neon (not Blob); 402 = insufficient balance; 409 = key reused with another operation, final, never retried; every write sends `Idempotency-Key` (keys per intent / derived from the order key); cache keys and retry policy (queries retry only network/timeout/5xx, max 2; 401 re-issues once); the optimistic top-up; the known limitation (token issuance trusts the owner id; the site identity is mocked; production coins are demo coins, FR-016)
- [X] T021 (2026-10-24: TEAMS.md, 008 deploy-environments and 007 T047 updated) [P] Update `docs/TEAMS.md` (coins section: now `ledger` via `/backend` in every environment, `domains/coins` removed, the FR-016 limitation) and `specs/008-web-production-env/deploy-environments.md` (coins visible in production through `/backend`; `VITE_COINS_API_URL` no longer exists); in `specs/007-monorepo-vercel-blob/tasks.md` annotate T047 "(done by 011-web-coins-real-api)" without changing anything else
- [X] T022 (2026-10-24: root typecheck/lint/build green; bundle check clean; full e2e 144 passed, 0 failed (the 6 previously stale checkout/wallets snapshots were refreshed by T011/T015); production suite 8/8; no change under apps/api or server) Regression gate from the repo root: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `node apps/web/scripts/check-production-bundle.mjs`, then the full `pnpm --dir apps/web exec playwright test`: only the 6 known stale `checkout`/`wallets` snapshot failures from before this feature may remain (any other failure blocks), plus `-c playwright.production.config.ts` green. `git status` shows no change under `apps/api/` or `server/`
- [ ] T023 **Needs a dev database branch for `apps/api` (010 T039).** Manual validation per `specs/011-web-coins-real-api/quickstart.md` step 3 against a local `apps/api` on the dev branch (`VITE_ENABLE_BACKEND_MOCKS=false BACKEND_PROXY_TARGET=http://localhost:4001`): top-up, history, pay with coins, insufficient balance, `sold-out-at-checkout` ⇒ one debit + one credit in the API history, double-click ⇒ one debit. Record the results under a "Resultado" heading in that quickstart
- [ ] T024 **Needs the user's confirmation — publishes the site.** After merge, deploy `apps/web` (`pnpm exec vercel deploy --prod` from `apps/web`), then run quickstart step 5: the production-config suite with `PLAYWRIGHT_BASE_URL=https://nft-marketplace-web-wheat.vercel.app`, a small manual top-up (SC-001), and SC-005: load `/wallets` 20 times signed in and record the p95 time until the balance is shown under a "Resultado" heading in `specs/011-web-coins-real-api/quickstart.md` (analysis C2). Reminder: until 010 T039 separates the API databases, this writes demo coins into the API's production database

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T008)** → US1 → US2 → US3 → Polish.
- Within Foundational: T002 → T007 and T008; T003, T004, T005, T006 are independent of each other and of T002.

### User Story Dependencies

- **US1** needs T007 and T008 only.
- **US2** needs T003, T004, T007, T008; independent of US1 functionally, but runs after it because both stories' e2e top up through `/wallets` (T012 uses the US1 screen to set the balance).
- **US3** removal (T018) needs both screens migrated (T010, T014); its tests (T016, T017) need only Foundational.

### Within Each User Story

- Write the e2e first (T009, T012, T016, T017) and watch it fail, then implement, then refresh the visual baselines (T011, T015).

### Parallel Opportunities

- Foundational: T003, T004, T005, T006 together; T008 alongside T007 once T002 is done.
- US1: T009 alongside T010.
- US2: T012 and T013 together.
- US3: T016 and T017 together.
- Polish: T020 and T021 together.

## Parallel Example: Foundational

```text
Task: "T003 apps/web/src/domains/ledger/model/conversion.ts"
Task: "T004 apps/web/src/domains/ledger/model/keys.ts"
Task: "T005 apps/web/src/mocks/contexts/ledger/{service,handlers}.ts idempotency"
Task: "T006 coins-unavailable scenario in apps/web/src/mocks/scenarios/definitions.ts"
```

## Parallel Example: User Story 2

```text
Task: "T012 apps/web/e2e/checkout/coins.spec.ts"
Task: "T013 apps/web/src/pages/checkout/components/PaymentMethodPicker.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 only)

T001–T011: Wallets shows and tops up real coins (mock in dev, `apps/api` in production). The checkout still uses the old client and stays hidden in production until US2, so the MVP is safe to ship alone.

### Incremental Delivery

1. + US2 (T012–T015): pay with coins, refund by credit.
2. + US3 (T016–T019): mock parity proven, old client removed, production bundle clean.
3. Polish (T020–T024): docs, regression, manual check on the dev database, publish.

## Notes

- `apps/api/` and `server/` MUST NOT change. If a task seems to need an API change (e.g. a refund route), stop: that is a different feature.
- External actions need the user's explicit confirmation right before running: T024 (publish). T023 needs the 010 dev database branch first.
- Never print tokens; the e2e never sends real credentials.
