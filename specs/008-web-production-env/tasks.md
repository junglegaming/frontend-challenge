---

description: "Task list for 008-web-production-env"
---

# Tasks: Ambiente de produção do front-end

**Input**: Design documents from `/specs/008-web-production-env/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/delivery-rules.md, quickstart.md (all present)

**Tests**: Requested by the plan (research D10) because the existing Playwright suite runs in `dev` mode and cannot prove production behavior. They live in a **separate** Playwright config (`apps/web/playwright.production.config.ts`) and directory (`apps/web/e2e/production/`), so the existing suite is untouched (FR-009).

**Organization**: Tasks are grouped by user story (spec.md US1–US4).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US4 from spec.md
- All paths are relative to the repository root.

## Deviations from plan.md / quickstart.md (found while reading the code; applied in T026)

1. **Separate Playwright config instead of a `production-build` project.** `apps/web/playwright.config.ts` has one global `webServer`; adding a project there would force a production build on every run of the normal suite. Command becomes `pnpm --dir apps/web test:e2e:production`.
2. **`vite preview` does not apply `vercel.json` headers**, so a local smoke test could never see the CSP. T020 mirrors the `/(.*)` headers of `vercel.json` into `preview.headers` (single source of truth) so the local smoke exercises the real policy. Cache and fallback rules are still only verifiable on a real deployment (T010).
3. **`apps/web/scripts/lighthouse.mjs` spawns its own `vite preview` on a fixed port**, so it cannot audit a published URL. T024 adds `LIGHTHOUSE_BASE_URL`.

## Path Conventions

`apps/web/` only, plus `docs/`, root `README.md` and this spec folder. `apps/api`, `server/` and specs 006/007 are **not** modified by this feature.

---

## Phase 1: Setup

**Purpose**: Declare the new configuration surface before any code reads it.

- [X] T001 [P] Declare `readonly VITE_ENABLE_BACKEND_MOCKS?: string` in `apps/web/src/vite-env.d.ts` (`VITE_COINS_API_URL` and `VITE_BACKEND_BASE_URL` are already declared there)
- [X] T002 [P] Update `apps/web/.env.example`: add `VITE_ENABLE_BACKEND_MOCKS=true` with a comment ("production build: `false`; unset ⇒ `true` only in dev"), add `VITE_ENABLE_MOCKS` note ("production keeps `true` — the product is a demo, constitution Principle V"), and add `# VITE_COINS_API_URL=http://localhost:4000` **commented out** with "dev only; leave unset in production ⇒ coins disabled". Keep `BACKEND_PROXY_TARGET` and `VITE_BACKEND_BASE_URL` as they are. Variable meanings must match `specs/008-web-production-env/data-model.md`

---

## Phase 2: Foundational (blocking)

**Purpose**: The typed configuration and the production test harness that every story uses.

**⚠️ CRITICAL**: No user story starts before this phase is done.

- [X] T003 Edit `apps/web/src/shared/config/env.ts` per data-model.md: add `enableBackendMocks: (import.meta.env.VITE_ENABLE_BACKEND_MOCKS ?? (import.meta.env.DEV ? 'true' : 'false')) === 'true'` (only the string `'true'` turns it on); change `coinsApiUrl` to `import.meta.env.VITE_COINS_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : undefined)` so its type is `string | undefined` and the `localhost` literal is only reachable when `DEV` (FR-007); add `coinsEnabled: coinsApiUrl !== undefined`. Keep every other key and its default unchanged. Add a one-line comment on each new key stating the production value
- [X] T004 Create `apps/web/src/domains/coins/model/availability.ts` exporting `export const coinsEnabled = env.coinsApiUrl !== undefined` (import `env` from `@/shared/config/env`; no React, no Axios — it lives in `model/`), and re-export it from `apps/web/src/domains/coins/index.ts` (`export * from './model/availability'`). Depends on T003
- [X] T005 [P] Create the production test harness: `apps/web/playwright.production.config.ts` — `testDir: './e2e/production'`, `fullyParallel: true`, `reporter: [['list']]`, `use.baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4175'`, `use.extraHTTPHeaders = { 'x-vercel-protection-bypass': secret, 'x-vercel-set-bypass-cookie': 'true' }` only when `process.env.PROTECTION_BYPASS` is set, and a `webServer` **only when `PLAYWRIGHT_BASE_URL` is unset**: `command: 'node ./node_modules/vite/bin/vite.js build && node ./node_modules/vite/bin/vite.js preview --port 4175 --strictPort'`, `url: 'http://localhost:4175'`, `env: { VITE_ENABLE_MOCKS: 'true', VITE_ENABLE_BACKEND_MOCKS: 'false' }` (leave `VITE_COINS_API_URL` unset), `timeout: 180_000`, `reuseExistingServer: false`. Port 4175 because `scripts/lighthouse.mjs` uses 4174. Add `"test:e2e:production": "playwright test -c playwright.production.config.ts"` to `apps/web/package.json`, and add `testIgnore: '**/production/**'` to `apps/web/playwright.config.ts` so the default suite never picks these specs up
- [X] T006 Verify nothing changed for dev: run `pnpm typecheck`, `pnpm lint` and `pnpm --dir apps/web exec playwright test e2e/ledger` from the repo root; all must pass exactly as before (`DEV=true` ⇒ backend mocks on, coins URL still `http://localhost:4000`). Depends on T003–T005

**Checkpoint**: Configuration is typed, dev behavior is unchanged, and `pnpm --dir apps/web test:e2e:production` exists (it has no specs yet).

---

## Phase 3: User Story 1 — Visitante usa a vitrine publicada (Priority: P1) 🎯 MVP

**Goal**: A public production URL serves the storefront, with correct SPA routing and cache policy.

**Independent Test**: Open the production URL, navigate the main screens, open `/nft/nft_001` and `/account/profile` directly and reload; no platform `404`, no console errors attributable to configuration.

- [X] T007 [US1] Create `apps/web/e2e/production/storefront.spec.ts` (runs against the production build served by T005's config): home renders its `h1` and the banner (proves MSW started in a production build); `/nft/nft_001` opened directly renders its heading, and still does after `page.reload()`; `/design-system` renders (mocks are on); collect `pageerror` and `console` messages of type `error` for the whole test and assert the list is empty. Use `signIn` from `apps/web/e2e/design-system/helpers.ts` for one authenticated deep link (`/account/profile`)
- [X] T008 [US1] Edit `apps/web/vercel.json` per `contracts/delivery-rules.md`: keep the `/backend/:path*` rewrite **first**; change the SPA fallback source from `/(.*)` to `/((?!assets/).*)` (a missing asset must be `404`, not `index.html` with `200`); add a `headers` array with `/assets/(.*)` → `Cache-Control: public, max-age=31536000, immutable`, `/index.html` → `Cache-Control: no-cache`, `/mockServiceWorker.js` → `Cache-Control: no-cache` plus `Service-Worker-Allowed: /`. Do not add the security headers here (T019)
- [X] T009 (2026-10-24: project `nft-marketplace-web` created; 3 vars set for preview+production; linked from `apps/web`) [US1] **Needs the user's confirmation first — creates a Vercel project.** From `apps/web`, run `vercel link --project nft-marketplace-web` (Root Directory `apps/web`, "include source files outside of the Root Directory" enabled for the pnpm workspace), then add `VITE_ENABLE_MOCKS=true`, `VITE_ENABLE_BACKEND_MOCKS=false` and `VITE_BACKEND_BASE_URL=/backend` for **both** `preview` and `production` (data-model.md: same set for both), and leave `VITE_COINS_API_URL` unset. Confirm with `vercel env ls`. Do not print secret values
- [X] T010 (2026-10-24: deployed from `apps/web` — first deploy of a project is promoted to production by Vercel; https://nft-marketplace-web-wheat.vercel.app. 6 routes 200, missing asset 404, immutable assets, SW no-cache, security headers present; `/` is `max-age=0, must-revalidate` (the `/index.html` rule does not match `/`). Build ran without the workspace lockfile — deploy from repo root with Root Directory `apps/web` to pin versions.) [US1] Deploy a preview (`vercel deploy` from `apps/web`) and verify with quickstart.md step 5, using the project's protection-bypass secret: all six routes (`/`, `/nft/nft_001`, `/cart`, `/checkout`, `/account/profile`, `/account/wallets`) return `200 text/html`; `/assets/nao-existe.js` returns `404`; `Cache-Control` is `no-cache` for `/` and `/mockServiceWorker.js` and `immutable` for a real `/assets/*` file. If the first build fails on the pnpm workspace install, apply the fallback in research D1 (`installCommand` from the repo root) and record it. Depends on T008, T009

**Checkpoint**: US1 delivers a public demo and is independently testable (SC-001, SC-004 for cache).

---

## Phase 4: User Story 2 — Produção fala com o back-end real, não com o mock (Priority: P2)

**Goal**: In production, `/backend/*` reaches `apps/api`; `/api/*` stays mocked.

**Independent Test**: In a production build, `GET /backend/health` is not answered by MSW; `/api/session` still is.

- [X] T011 [US2] Create `apps/web/e2e/production/backend.spec.ts`: (a) `signIn(page)` succeeds in the production build, proving `/api/*` is still answered by MSW; (b) `fetch('/backend/health')` from the page must **not** return `200` with `{"status":"ok"}` — in the local harness nothing listens behind the Vite proxy, so the real call fails (status ≥ 500) while the mock would have answered `200`; (c) a `LedgerError`-style failure is visible: `fetch('/backend/coins/balance')` without a token is not `401` from the mock either. Add a comment that when `PLAYWRIGHT_BASE_URL` points at a published deploy, case (b) is replaced by T014's real-chain check
- [X] T012 [US2] Edit `apps/web/src/mocks/composition.ts`: build `handlers` so that `...ledgerHandlers(BACKEND, ledger)` is included only when `env.enableBackendMocks` is true (e.g. a conditional spread). `LedgerService` and the `mockControls.reset` call may stay as they are. Depends on T003
- [X] T013 [US2] Run `pnpm --dir apps/web test:e2e:production -- storefront backend` and `pnpm --dir apps/web exec playwright test e2e/ledger`; production specs pass **and** the dev `ledger` spec still passes (FR-005/FR-009: the same code, opposite default per mode). Depends on T007, T011, T012
- [X] T014 [US2] (2026-10-24: DONE — API recreated at https://nft-marketplace-api-ochre.vercel.app, `/backend/health` = 200 through the site, token → topup → balance verified) **WAS BLOCKED (2026-10-24, rechecked via https://nft-marketplace-web-wheat.vercel.app/backend/health: still 404 — specs/007 T022/T023).** **Prerequisite check (FR-013) — may end BLOCKED.** First `curl https://nft-marketplace-api-ochre.vercel.app/api/health`. If it is `404` (the state on 2026-10-24), record "US2 blocked by specs/007 T022/T023" here and stop; do **not** mark US2 complete. If it returns `200`, run quickstart.md step 6 against the preview `/backend`: `/backend/health` returns the API's `{"status":"ok"}` and a token → credit → debit → balance sequence closes with correct values (SC-002). Depends on T010

**Checkpoint**: US2 is locally proven (T013); end-to-end proof depends on the API being fixed (T014).

---

## Phase 5: User Story 3 — Entrega endurecida e sem referências a localhost (Priority: P3)

**Goal**: No `localhost` in the production bundle, coins hidden when no backend is configured, security headers in place.

**Independent Test**: Inspect the bundle and responses: no `localhost`; coins UI absent; wallet/ETH checkout unchanged; no CSP violation during a full journey.

- [X] T015 [US3] Create `apps/web/e2e/production/hardening.spec.ts`: sign in and open `/account/wallets` — the heading "Moedas da Kurio" must not exist; seed a cart (`seedCartItem`) and open `/checkout` — the "Forma de pagamento" group and the "Pagar com moedas da Kurio" option must not exist, and "Confirmar compra" is still present; record every request URL with `page.on('request')` across the journey and assert none targets port `4000` or hostname `localhost` other than the app's own origin; install `page.addInitScript(() => document.addEventListener('securitypolicyviolation', e => (window.__csp = [...(window.__csp ?? []), e.violatedDirective])))` and assert `window.__csp` is empty after visiting `/`, `/nft/nft_001`, `/cart`, `/checkout`, `/account/profile`, `/account/wallets`
- [X] T016 [P] [US3] Edit `apps/web/src/pages/wallets/components/CoinsBalanceSection.tsx`: keep all hooks at the top (`useCoinsBalance`, `useTopUpCoins`, `useState`), then `if (!coinsEnabled) return null` before the JSX (import `coinsEnabled` from `@/domains/coins`). Depends on T004
- [X] T017 [P] [US3] Edit `apps/web/src/pages/checkout/components/PaymentMethodPicker.tsx`: after its hook call, `if (!coinsEnabled) return null` so the whole picker (heading + both radios) disappears and the page keeps its default `'wallet'` method; do not change `CheckoutPage.tsx` (its coins branch only runs when `paymentMethod === 'coins'`, which becomes unreachable). Depends on T004
- [X] T018 [P] [US3] Edit `apps/web/src/domains/coins/api/queries.ts`: `useCoinsBalance` must use `enabled: coinsEnabled && userId !== undefined` so no request is ever issued when coins are off (FR-008). Depends on T004
- [X] T019 [US3] Edit `apps/web/vercel.json`: add a `headers` entry for source `/(.*)` with exactly the values in `contracts/delivery-rules.md` — `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`. Depends on T008 (same file)
- [X] T020 [US3] Edit `apps/web/vite.config.ts`: read `vercel.json` with `node:fs` + `JSON.parse`, find the `headers` entry whose `source` is `/(.*)`, and pass its key/value pairs as `preview: { headers }` next to the existing `preview.proxy` (so `vite preview` and the local production smoke apply the real policy). Do not touch `server` (dev must not get the CSP: Vite's HMR needs inline scripts). Depends on T019
- [X] T021 [P] [US3] Create `apps/web/scripts/check-production-bundle.mjs` and add `"check:production-bundle": "node scripts/check-production-bundle.mjs"` to `apps/web/package.json`: run `vite build` with `VITE_ENABLE_BACKEND_MOCKS=false` and no `VITE_COINS_API_URL`, scan every file in `dist/` and fail if `localhost` appears anywhere except the documented exception `ws://localhost/realtime` (data-model.md: it is a route id for the mocked socket, never opened); print the offending file and line. Follow the style of `scripts/check-tokens.mjs`
- [X] T022 [P] [US3] Update `apps/web/src/domains/coins/README.md`: add a "Produção" section — coins are only enabled when `VITE_COINS_API_URL` is set (dev defaults it to `http://localhost:4000`); the `server/` backend uses SQLite and is not deployable on Vercel, so production builds hide the balance section and the pay-with-coins option; reactivating them is a separate feature
- [X] T023 [US3] Run `pnpm --dir apps/web test:e2e:production`, `pnpm --dir apps/web check:production-bundle`, then `pnpm typecheck && pnpm lint`; fix any CSP violation by relaxing the **specific directive** that reported it (never by removing the policy, research D7) and update `contracts/delivery-rules.md` if a directive changes. Depends on T015–T022

**Checkpoint**: US3 is proven locally (SC-003, FR-007, FR-008, FR-010); headers on the real deployment are re-checked in T010's procedure and T028.

---

## Phase 6: User Story 4 — Publicação repetível e documentada (Priority: P4)

**Goal**: Anyone can publish a preview and validate it by following the docs.

**Independent Test**: Follow only `quickstart.md` to a working preview.

- [X] T024 [US4] Edit `apps/web/scripts/lighthouse.mjs`: when `LIGHTHOUSE_BASE_URL` is set, **do not spawn** `vite preview` and use that value as `BASE`; when `LIGHTHOUSE_BYPASS` is also set pass `extraHeaders: { 'x-vercel-protection-bypass': <value>, 'x-vercel-set-bypass-cookie': 'true' }` in the Lighthouse flags. Default behavior (spawn on 4174, `/` and `/nft/nft_001`, accessibility ≥ 95) must stay identical. Update the header comment with both variables
- [X] T025 [P] [US4] Document the environment matrix and the publish procedure: add a "Ambiente de produção" section to `docs/TEAMS.md` (matrix from `data-model.md`, the fact that production is a mock-driven demo, and a link to `specs/008-web-production-env/quickstart.md`) and a short "Publicação" section to the root `README.md` (commands `pnpm --dir apps/web test:e2e:production`, `check:production-bundle`, link to the quickstart)
- [X] T026 [P] [US4] Align the spec artifacts with the three deviations listed at the top of this file: in `specs/008-web-production-env/quickstart.md` replace every `--project=production-build` with `pnpm --dir apps/web test:e2e:production`, and state that step 7 uses `LIGHTHOUSE_BASE_URL`/`LIGHTHOUSE_BYPASS`; in `plan.md` (Technical Context → Testing, Source Code tree) and `research.md` (D10) replace "projeto Playwright `production-build`" with "config Playwright separada `playwright.production.config.ts`"; note in `contracts/delivery-rules.md` that only the headers are mirrored locally

**Checkpoint**: The procedure is documented and matches the code.

---

## Phase 7: Polish & Cross-Cutting

- [X] T027 (2026-10-24: typecheck/lint/build green; e2e 121 passed, only the 6 known stale snapshots fail. `apps/api` and spec 007 show uncommitted edits that are not from this feature — 007 work in progress.) Full regression gate from the repo root: `pnpm typecheck`, `pnpm lint`, `pnpm build`, then the default suite `pnpm --dir apps/web exec playwright test`. Expected result is identical to before this feature: the 6 stale `checkout`/`wallets` snapshot failures (pre-existing, spec 007) and, at most, the load-dependent checkout accessibility test that passes in isolation; **no new failure**. Also confirm `git status` shows no change under `apps/api/`, `server/`, `specs/006-platform-coins/` or `specs/007-monorepo-vercel-blob/`
- [ ] T028 **Needs the user's confirmation — publishes to production.** From `apps/web`: `vercel deploy --prod`; repeat quickstart.md steps 5 and 6 against the production URL **without** the bypass header (the production domain is public) and re-check the security headers and cache from T010/T019; run `LIGHTHOUSE_BASE_URL=<production url> pnpm --dir apps/web lighthouse` and write the scores into `specs/008-web-production-env/quickstart.md` under a "Resultado" heading (SC-005). If T014 was BLOCKED, publish anyway only for US1/US3 and state in the report that US2 remains open
- [X] T029 Re-read `spec.md` FR-001 to FR-013 and SC-001 to SC-006 against the final state; list in the completion report which are verified (and how) and which are not (expected: SC-002/FR-013 if the API is still returning `404`) — **done 2026-10-24.** Verified on the real deployment (`https://nft-marketplace-web-wheat.vercel.app`, read-only GETs): SC-001 (6 routes `200 text/html`), fallback excludes assets (`/assets/nao-existe.js` → `404`), SC-004 (assets `immutable`, `/mockServiceWorker.js` `no-cache`; `/` was `max-age=0, must-revalidate` — `vercel.json` now also matches `/` explicitly, **needs a redeploy to take effect**), FR-010 (all 5 security headers present, CSP included). Verified locally against the production build: FR-002/FR-005 (`/api` mocked, `/backend` not), FR-007/FR-008 and SC-003 (no `localhost:<port>` in the bundle, negative control proves the check can fail; coins hidden; 0 calls to port 4000; CSP clean except the documented MSW WebSocket attempt), FR-009 (default suite: 121 passed, the same 6 stale snapshots fail; one checkout session-expiry test is intermittent in isolation — 1 failure in 4 runs, cause unproven). **Not verified: SC-002 and FR-013** — `https://nft-marketplace-api-ochre.vercel.app/api/health` still returns `404`; the rewrite itself works (the `404` returns through `/backend/health` with a proxy-hop id) but there is no healthy API behind it. **SC-005 partial**: Lighthouse runs locally (accessibility 100 on `/` and `/nft/nft_001`; performance 53–72 on a local preview, varies between runs) and `LIGHTHOUSE_BASE_URL` mode works; it has **not** been run against the published URL. **T028 not done** (publishing needs the user's confirmation).

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (1)** → **Foundational (2)** → **User stories (3–6)** → **Polish (7)**.
- T004 depends on T003. T006 depends on T003–T005.

### User story dependencies

- **US1**: needs Foundational only. T008 (vercel.json) must precede T019 (same file); T010 needs T008 + T009.
- **US2**: needs Foundational (T003, T005). **T014 needs the API fixed** (specs/007) and T010 — it may legitimately end BLOCKED without blocking US1/US3.
- **US3**: needs T004 for the UI/query tasks; T019 needs T008; T020 needs T019; T023 needs T015–T022.
- **US4**: independent of US2/US3 except T026, which edits the docs that describe what US3 builds (do it last).

### Within each story

Test file first (T007, T011, T015), then implementation, then the run/verify task. Same-file edits are sequential: `apps/web/vercel.json` = T008 → T019; `apps/web/package.json` = T005 → T021; `apps/web/vite.config.ts` = T020 only.

### Parallel opportunities

- T001, T002 together. T003 alone, then T004; T005 can run alongside T003/T004.
- After Foundational: US1 (T007, T008), US2 (T011, T012) and US3's test (T015) can start together; T016, T017, T018 are three independent files; T021 and T022 are independent.
- T024 is independent of every other task after Foundational; T025 and T026 are independent of each other.

## Parallel example: User Story 3 UI work

```text
Task: "T016 CoinsBalanceSection: return null when !coinsEnabled"
Task: "T017 PaymentMethodPicker: return null when !coinsEnabled"
Task: "T018 useCoinsBalance: enabled only when coinsEnabled"
```

## Implementation strategy

### MVP first (US1)

Setup → Foundational → US1 (T007–T010). Stop: a public demo exists with correct routing and cache. This needs **no** API and no code change beyond `vercel.json` and the harness.

### Incremental delivery

1. + US3 (T015–T023): removes the `localhost` calls and adds the headers — the production build becomes correct and safe.
2. + US2 (T011–T013 locally; T014 when the API is fixed): real back-end wiring.
3. + US4 (T024–T026): repeatable publish and Lighthouse on the published URL.
4. Polish (T027–T029), including the production promotion (T028).

Delivering US3 before US2 is intentional: US3 is fully verifiable without the API, and US2's last step is blocked by a defect owned by another feature.

## Notes

- External actions (T009 creates a Vercel project, T010 deploys a preview, T028 publishes to production) require the user's explicit confirmation immediately before running; never print the protection-bypass secret or any env value.
- The `ws://localhost/realtime` default of `VITE_SOCKET_URL` is a documented, justified exception to "no localhost in the bundle".
- If a task seems to require editing `apps/api`, `server/` or specs 006/007, stop and re-check the plan — it is out of scope.
