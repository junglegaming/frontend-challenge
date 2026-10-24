---

description: "Task list for 010-api-production-backend (revision 3: Prisma ORM)"
---

# Tasks: Back-end de produção (`apps/api`) funcionando de verdade

**Input**: Design documents from `/specs/010-api-production-backend/`

**Prerequisites**: plan.md (revision 3, Prisma), spec.md, research.md (D1–D15), data-model.md, contracts/api-delta.md, contracts/verification-suite.md, quickstart.md

**Tests**: The spec requires an executable verification (FR-012), so the test artifact is `apps/api/scripts/verify-deploy.mjs` (contract: `contracts/verification-suite.md`). No unit-test framework is introduced. The Prisma swap adds one gate: the 20-request same-key race (research D14).

**Organization**: Tasks are grouped by user story (spec.md US1–US4).

**Progress carried over**: this file was regenerated on 2026-10-24 for the Prisma plan **without losing progress**. Work already done in revision 2 (Neon driver direct) stays `[X]` and is described as it was actually built; the Prisma tasks that replace parts of it are new and unchecked. IDs were renumbered in execution order (old → new: T008–T011 → T012–T015, T019 → T022, T026 → T033, T030–T036 → T039–T045). The previous file is saved at `C:\Users\User\AppData\Local\Temp\claude\C--Users-User-Desktop-xD\5e93462a-b1f8-47bf-8918-5151849f7ba7\scratchpad\tasks.before-prisma.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US4 from spec.md
- All paths are relative to the repository root.

## Path Conventions

`apps/api/`, the root `package.json` (pnpm settings only), `.specify/memory/constitution.md` and, for status/docs only, `specs/008-web-production-env/`. `server/`, `apps/web/` and `specs/006`/`007` are **not** modified (FR-015).

## Ordering note

US1 is already delivered (on the old Blob code). **No Prisma code starts before T002 (amendment 1.6.0) is approved.** If the user declines the amendment, skip every Prisma task (T003, T004, T007–T011, T023–T026, T031, T032, T036, T037) and continue from T033 with the revision-2 code, which already satisfies the spec.

---

## Phase 1: Setup

- [X] T001 Constitution v1.5.0 in `.specify/memory/constitution.md` (2026-10-24): `apps/api` may use Postgres on Neon via `@neondatabase/serverless`; Blob → Postgres migration rules. Already in the working tree
- [X] T002 (2026-10-24: v1.6.0 applied via /speckit-constitution) **Gate — needs the user's approval.** Amend `.specify/memory/constitution.md` to **v1.6.0** (MINOR) through `/speckit-constitution`, using the text in `specs/010-api-production-backend/plan.md` → Complexity Tracking → "Texto proposto para a emenda 1.6.0": replace "acessado só por `@neondatabase/serverless`; nenhum ORM e nenhum outro banco" with "acessado pelo **Prisma ORM** (`@prisma/client`, `prisma`) com o adaptador `@prisma/adapter-neon` sobre `@neondatabase/serverless`; nenhum outro ORM, driver ou banco. Esquema e migrações MUST viver em `apps/api/prisma/` (Prisma Migrate). SQL cru só por *tagged template* parametrizado (`$queryRaw`), nunca pelas variantes `Unsafe`. `DATABASE_URL` e `DATABASE_URL_UNPOOLED` só em variável de ambiente." Keep every other bullet of the exception verbatim; add the Sync Impact Report entry (1.5.0 → 1.6.0) and bump `Last Amended`
- [X] T003 (2026-10-24: Prisma 7.10.1 exact; `postinstall` verified from a clean `src/generated`; pnpm ran the `prisma`/`@prisma/engines` scripts, no "Ignored build scripts") Add Prisma to `apps/api/package.json` with **exact** versions (research D13; the `prisma` `latest` dist-tag is an 8.0 RC, do not use it): dependencies `"@prisma/client": "7.10.1"`, `"@prisma/adapter-neon": "7.10.1"`; devDependency `"prisma": "7.10.1"`; keep `@neondatabase/serverless`. Scripts: add `"postinstall": "prisma generate"`, change `"db:migrate"` to `"prisma migrate deploy"`, add `"db:status": "prisma migrate status"`. In the **root** `package.json` add `"prisma"` and `"@prisma/engines"` to `pnpm.onlyBuiltDependencies` (keep `"nx"`, `"esbuild"`). Run `pnpm install` from the repo root; the output MUST NOT contain "Ignored build scripts" for those packages. Depends on T002
- [X] T004 (2026-10-24: env example, gitignore, oxlint ignore) [P] Edit `apps/api/.env.example`: add `DATABASE_URL_UNPOOLED=` with a comment ("direct, non-pooled connection of the same Neon branch; used only by Prisma Migrate; set by the Neon integration") under `DATABASE_URL`. Add `src/generated/` to `apps/api/.gitignore`. Add `"ignorePatterns": ["src/generated/**"]` to `apps/api/.oxlintrc.json`. Depends on T002

---

## Phase 2: Foundational (database layer — blocks US2, US3 and US4's database steps)

- [X] T005 (revision 2) `apps/api/src/lib/db.ts`: lazily created Neon HTTP client, `500 missing_database_url` when `DATABASE_URL` is unset; `apps/api/src/server.ts` `REQUIRED_ENV_VARS` = `["DATABASE_URL", "AUTH_JWT_SECRET"]`
- [X] T006 (revision 2) Idempotent DDL in `apps/api/src/db/schema.ts` (tables `balances`, `transactions`, `admins`) applied by `apps/api/scripts/migrate.ts`; ran twice against the dev Neon branch from `.env.local` without error
- [X] T007 (2026-10-24: `schema.prisma` (generator `prisma-client`, esm, `.js` extensions)) Create `apps/api/prisma/schema.prisma` per `data-model.md` → "Modelos Prisma ↔ tabelas" (research D7, D15). `generator client { provider = "prisma-client", output = "../src/generated/prisma", moduleFormat = "esm", importFileExtension = "js" }`; `datasource db { provider = "postgresql" }` (no `url` in Prisma 7). Models, camelCase fields with `@map` to the existing snake_case columns: **`Balance`** `@@map("balances")`: `ownerId String @id @map("owner_id")`, `amount BigInt`, `version BigInt @default(0)`, `updatedAt DateTime @default(now()) @map("updated_at") @db.Timestamptz`, relation `transactions CoinTransaction[]`. **`CoinTransaction`** `@@map("transactions")`: `txId String @id @map("tx_id") @db.Uuid`, `ownerId` (relation to `Balance.ownerId`), `direction String`, `amount BigInt`, `resultingBalance BigInt @map("resulting_balance")`, `resultingVersion BigInt @default(0) @map("resulting_version")`, `idempotencyKey String? @map("idempotency_key")`, `createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz`; `@@unique([ownerId, idempotencyKey], map: "transactions_owner_idempotency_key")`; `@@index([ownerId, createdAt(sort: Desc), txId(sort: Desc)], map: "transactions_owner_created_idx")`. **`Admin`** `@@map("admins")`: `id String @id`, `email String @unique`, `role String @default("admin")`, `passwordHash String @map("password_hash")`, `createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz`. Depends on T003
- [X] T008 (2026-10-24: `prisma.config.ts`; `prisma generate` verified with no database variables set) [P] Create `apps/api/prisma.config.ts` with `defineConfig` from `prisma/config`: `schema: "prisma/schema.prisma"`, `migrations: { path: "prisma/migrations" }`, `datasource: { url: process.env.DATABASE_URL_UNPOOLED ?? "" }`. Read `process.env` directly, **not** the `env()` helper, so `prisma generate` works with no variables (Vercel install, research D15). Before reading, load `.env.local` when it exists (`try { process.loadEnvFile(".env.local") } catch {}`); never log a URL. Depends on T003
- [X] T009 (2026-10-24: `0_init` generated + 9 named CHECKs by hand; `migration_lock.toml`) Create the initial migration: `pnpm --dir apps/api exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` → `apps/api/prisma/migrations/0_init/migration.sql`, plus `apps/api/prisma/migrations/migration_lock.toml` with `provider = "postgresql"`. Then add the CHECK constraints by hand, **verbatim** from `apps/api/src/db/schema.ts`: `balances`: `CHECK (owner_id <> '')`, `CHECK (amount >= 0)`, `CHECK (version >= 0)`; `transactions`: `CHECK (direction IN ('credit', 'debit'))`, `CHECK (amount > 0)`, `CHECK (resulting_balance >= 0)`, `CHECK (resulting_version >= 0)`, `CHECK (idempotency_key IS NULL OR length(idempotency_key) BETWEEN 1 AND 128)`; `admins`: `CHECK (role = 'admin')`. Compare the result with `schema.ts` table by table: same columns, types, defaults, FK `transactions.owner_id → balances.owner_id`, and index names. Depends on T007
- [X] T010 (2026-10-24: `lib/db.ts` is `prisma()` over `PrismaNeonHttp`) Rewrite `apps/api/src/lib/db.ts` (research D2): export `prisma()` returning a lazily created `PrismaClient` (imported from `../generated/prisma/client.js`) built with `new PrismaNeonHttp(DATABASE_URL, {})` from `@prisma/adapter-neon`, one per function instance; keep throwing `internal("missing_database_url", …)` when `DATABASE_URL` is unset, with the same message; never log the URL. Remove the direct `neon()` client. Depends on T007
- [X] T011 (2026-10-24: diff vs schema: no difference; the dev branch had only 7 of 9 CHECKs (the old `ADD COLUMN IF NOT EXISTS` skipped two), so `transactions_resulting_version_check` and `transactions_idempotency_key_check` were added (0 violating rows) before `migrate resolve --applied 0_init`; `db:status` up to date; `schema.ts`/`migrate.ts` deleted) Baseline the dev Neon branch (quickstart step 1; research D7): `pnpm --dir apps/api exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` MUST exit `0`; run the `pg_constraint` query from quickstart step 1 and confirm all 9 CHECKs of T009 exist; then `pnpm --dir apps/api exec prisma migrate resolve --applied 0_init` and `pnpm --dir apps/api db:status` = "Database schema is up to date!". Only then delete `apps/api/src/db/schema.ts` and `apps/api/scripts/migrate.ts`. Depends on T008, T009, T010

**Checkpoint**: Prisma Client is generated, the dev branch is under Prisma Migrate, and `lib/db.ts` serves a Prisma client.

---

## Phase 3: User Story 1 — A API publicada responde em produção (Priority: P1) 🎯 MVP — DELIVERED

**Goal**: `/api/*` answers in production, directly and through the site's `/backend/*`.

**Independent Test**: `GET https://nft-marketplace-api-ochre.vercel.app/api/health` and `GET https://nft-marketplace-web-wheat.vercel.app/backend/health` both return `200` from the real API.

- [X] T012 [US1] `apps/api/vercel.json` has `"framework": null`, `"buildCommand": ""` and the rewrite `/api/(.*)` → `/api/index`; `apps/api/README.md` "Deploying" explains why. **Do not change `vercel.json` for Prisma** (research D15)
- [X] T013 [US1] (2026-10-24) Vercel project `nft-marketplace-api` created with `AUTH_JWT_SECRET` and the Blob store; deployed straight to production (no separate preview)
- [X] T014 [US1] (2026-10-24) `GET https://nft-marketplace-api-ochre.vercel.app/api/health` = `200`, unknown route = the API's structured `404`
- [X] T015 [US1] (2026-10-24) `GET https://nft-marketplace-web-wheat.vercel.app/backend/health` = `200`; token → topup → balance verified through the site; no token ⇒ `401`; `specs/008-web-production-env/tasks.md` T014 marked done

**Checkpoint**: US1 delivered on the old storage. The next promotion (T042) carries the database + Prisma code.

---

## Phase 4: User Story 2 — O saldo de moedas nunca perde uma atualização (Priority: P2)

**Goal**: Atomic, idempotent balance operations; saldo = soma do histórico.

**Independent Test**: 50 concurrent operations on one balance end with exactly `inicial + soma das aceitas`, 10 runs out of 10; 20 concurrent requests with the same `Idempotency-Key` produce one effect and 20 identical `200` responses.

- [X] T016 [P] [US2] Port `CoinsRepository` in `apps/api/src/domains/coins/repository.ts` (`getBalance`, `applyOperation({ownerId, direction, amount, idempotencyKey?})` → `{ balance, replayed }`, `listTransactions`). **Unchanged by Prisma**
- [X] T017 [P] [US2] `apps/api/src/domains/coins/contracts.ts`: `IdempotencyConflictError`, `InsufficientBalanceError`, `idempotencyKeySchema` (1..128 chars)
- [X] T018 [US2] `apps/api/src/domains/coins/service.ts` depends only on the port (`createCoinsService(repository)`), no retry loop; `apps/api/src/routes/coins.ts` reads the optional `Idempotency-Key` (`400 invalid_idempotency_key`, `409 idempotency_key_conflict`, `402 insufficient_balance`)
- [X] T019 [US2] `apps/api/src/openapi/document.ts` documents `Idempotency-Key` and the `400`/`409` responses on `POST /coins/topup` and `/coins/debit`
- [X] T020 [US2] `apps/api/scripts/verify-deploy.mjs` coins checks #1–#7 and #10–#12 (platform challenges counted apart from lost updates)
- [X] T021 [US2] (revision 2) `apps/api/src/domains/coins/neonCoinsRepository.ts`: one-statement CTE per operation, replay by key, unique-violation retry via `err.code === "23505"`
- [X] T022 [US2] (2026-10-24, revision 2) `verify-deploy --repeat 10` against `dev:local` + Neon: 10/10 with zero lost updates; 20-request same-key race ⇒ 1 effect
- [X] T023 (2026-10-24: `prismaCoinsRepository.ts`; ledger order is `resultingVersion desc` first (true commit order; `createdAt` is statement start time and can interleave); unique violation arrives as `PrismaClientKnownRequestError` code `23505` (not `P2002`/`P2010`), see research D14) [US2] Create `apps/api/src/domains/coins/prismaCoinsRepository.ts` implementing `CoinsRepository` (research D12, D14), replacing `neonCoinsRepository.ts` behavior one-for-one: `getBalance` via `prisma().balance.findUnique` (no row ⇒ `{ ownerId, amount: 0, version: 0, updatedAt: new Date(0).toISOString() }`, nothing written); `listTransactions` via `findMany({ where: { ownerId }, orderBy: [{ createdAt: "desc" }, { txId: "desc" }], take: limit })`; key lookup via `findUnique({ where: { ownerId_idempotencyKey: { ownerId, idempotencyKey } } })`; the **write stays one statement** — copy the credit and debit CTEs from `neonCoinsRepository.ts` unchanged into `prisma().$queryRaw` tagged templates (never `$queryRawUnsafe`) and validate the rows with the existing Zod `balanceRowSchema`. Convert every `BigInt` to `number` with a safe-integer check and every `DateTime` to ISO at the boundary; Prisma types MUST NOT leave this file. Same replay rules: same direction and amount ⇒ original result with `replayed: true`; otherwise `IdempotencyConflictError`; debit with no row returned ⇒ `InsufficientBalanceError`. Add `isUniqueViolation(err)` that recognises `Prisma.PrismaClientKnownRequestError` with `code === "P2002"` **and** the raw-query error whose adapter cause is a unique violation (`23505` / `UniqueConstraintViolation`). Depends on T010, T011
- [X] T024 (2026-10-24: service swapped; `neonCoinsRepository.ts` deleted (by the peer session xd-04)) [US2] In `apps/api/src/domains/coins/service.ts` change only the default adapter: `createCoinsService(new PrismaCoinsRepository())`. Delete `apps/api/src/domains/coins/neonCoinsRepository.ts`. Depends on T023
- [X] T025 (2026-10-24: `health.ts` via `prisma().$queryRaw` (written by the peer session xd-04); `/health` 200 verified) [US2] Edit `apps/api/src/routes/health.ts`: run `SELECT 1` through `prisma().$queryRaw`; keep `200 {"status":"ok"}`, `500 database_unavailable` (never echo the driver message) and `500 missing_database_url` exactly as now. Depends on T010
- [X] T026 (2026-10-24: typecheck + lint clean; `--repeat 10 --skip-admin` 10/10 zero lost updates; 5 consecutive 20-request same-key races on a fresh server: all 200, 1 distinct body, balance 7, 1 ledger entry. First attempt found 19/20 errors: `isUniqueViolation` missed code `23505`; fixed) [US2] **Prisma gate (local).** `pnpm --dir apps/api typecheck && pnpm --dir apps/api lint`; start `pnpm --dir apps/api dev:local`; run `BASE_URL=http://localhost:4001/api AUTH_JWT_SECRET=<local> pnpm --dir apps/api verify:deploy --repeat 10 --skip-admin` ⇒ zero lost updates in 10 of 10; then fire 20 simultaneous `POST /coins/topup` with the same `Idempotency-Key` and the same amount ⇒ exactly 1 new transaction and 20 identical `200` bodies, **no `500`**. A `500` means `isUniqueViolation` (T023) does not recognise Prisma's error shape: log the error's `name`/`code`/`meta` keys (never values that contain the URL), fix the helper, rerun. Do not start US3 Prisma work before this passes. Depends on T024, T025

**Checkpoint**: US2 proven locally on Prisma (SC-002, SC-003, SC-005).

---

## Phase 5: User Story 3 — Dados sensíveis deixam de ser publicamente legíveis (Priority: P3)

**Goal**: Admins, hashes, balances and history live only in the database, reachable only through the API.

**Independent Test**: No direct address returns an admin or balance record; admin login still works with the same responses.

- [X] T027 [US3] Port `AdminRepository` in `apps/api/src/domains/admin/repository.ts` (`findByEmail`, `upsert` → `{ created }`, `listOwners(limit, cursor)`); `apps/api/src/domains/admin/service.ts` depends only on the port, keeps the dummy hash for indistinguishable failures and the 8-character minimum. **Unchanged by Prisma**
- [X] T028 [US3] (revision 2) `apps/api/src/domains/admin/neonAdminRepository.ts`; `apps/api/scripts/seed-admin.ts` requires `DATABASE_URL` and uses `upsertAdmin`, credentials only from `ADMIN_EMAIL`/`ADMIN_PASSWORD`
- [X] T029 [US3] `apps/api/scripts/verify-deploy.mjs` checks #8 (admin login, indistinguishable failures), #9 (role separation), #13 (direct-read denial, hash never in a response)
- [X] T030 [US3] Blob removed from the code: `apps/api/src/lib/blobStore.ts` deleted, `@vercel/blob` and `BLOB_READ_WRITE_TOKEN` gone from `apps/api`
- [X] T031 (2026-10-24: `prismaAdminRepository.ts` (written by the peer session xd-04)) [US3] Create `apps/api/src/domains/admin/prismaAdminRepository.ts` implementing `AdminRepository`: `findByEmail` via `prisma().admin.findUnique({ where: { email } })` mapped to `{ id, email, passwordHash }`; `upsert` via `prisma().admin.upsert({ where: { id }, create: { id, email, role: "admin", passwordHash }, update: { passwordHash } })` so `created_at` is preserved on re-seed, with `created` computed by a `findUnique({ where: { id } })` just before (single writer: only the seed script calls it); `listOwners` via `prisma().balance.findMany({ where: { ownerId: { gt: after } }, orderBy: { ownerId: "asc" }, take: limit + 1, select: { ownerId: true, updatedAt: true } })`, keeping the current base64url cursor encoding and page shape `{ owners: { ownerId, updatedAt }[], cursor }` exactly. `passwordHash` never leaves this file except through `findByEmail`. Depends on T010, T011
- [X] T032 (2026-10-24: admin service swapped; `neonAdminRepository.ts` deleted; `grep neondatabase apps/api/src apps/api/scripts` finds nothing) [US3] In `apps/api/src/domains/admin/service.ts` change only the default adapter: `createAdminService(new PrismaAdminRepository())`. Delete `apps/api/src/domains/admin/neonAdminRepository.ts`. Then `grep -rn "neondatabase" apps/api/src apps/api/scripts` MUST find nothing (the driver is reached only through the adapter). Depends on T031
- [ ] T033 [US3] Run locally: `pnpm --dir apps/api typecheck && pnpm --dir apps/api lint`; `ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm --dir apps/api seed:admin` twice (first `created`, then updated, `created_at` unchanged); `node apps/api/scripts/admin-smoke-test.mjs`; full `verify:deploy` with `ADMIN_EMAIL`/`ADMIN_PASSWORD` ⇒ all 14 checks `✓`. Depends on T026, T032

**Checkpoint**: Storage is private, Blob is gone, everything runs on Prisma locally (SC-004 locally).

---

## Phase 6: User Story 4 — Operar e verificar a produção é repetível (Priority: P4)

**Goal**: Anyone can deploy, verify and roll back the API by following the docs.

**Independent Test**: Follow only `quickstart.md` to a verified preview and a verified production.

- [X] T034 [US4] `apps/api/scripts/verify-deploy.mjs` check #14 (latency p95 ≤ 2 s) and `--repeat N`
- [X] T035 [US4] (revision 2) `apps/api/README.md` storage sections rewritten for Postgres; `specs/008-web-production-env/deploy-environments.md` API section uses `DATABASE_URL`/`AUTH_JWT_SECRET`
- [X] T036 (2026-10-24: README: Prisma section (setup/postinstall, `db:migrate`/`db:status`, baseline, schema changes, single raw statement, `23505`), deploy section with `DATABASE_URL_UNPOOLED`) [P] [US4] Update `apps/api/README.md` for Prisma: `pnpm install` generates the client (`postinstall`, `src/generated/prisma`, not committed); `.env.local` needs `DATABASE_URL` and `DATABASE_URL_UNPOOLED`; `pnpm db:migrate` = `prisma migrate deploy`, `pnpm db:status`; baseline steps for a branch created before Prisma; how to change the schema (`prisma migrate dev --create-only`, add CHECKs by hand, review, apply); why the balance write is raw SQL in one statement (research D12) and that `$queryRawUnsafe` is forbidden. Keep the token-issuance limitation and the rotate-the-admin-password note. Depends on T033
- [X] T037 (2026-10-24: 008 table has the `DATABASE_URL_UNPOOLED` row) [P] [US4] Update `specs/008-web-production-env/deploy-environments.md` API section: add `DATABASE_URL_UNPOOLED` per environment (Prisma Migrate only); link `specs/010-api-production-backend/quickstart.md`. No other 008 file changes. Depends on T033
- [X] T038 (2026-10-24: quickstart uses `pnpm exec vercel`, and step 3 now reflects that the Neon integration exists but Dev/Preview/Production share ONE endpoint (verified by host comparison, same as `.env.local`): separate branches are needed first) [US4] Reconcile `specs/010-api-production-backend/quickstart.md` with what actually ran in T011, T026 and T033: fix any command, flag, script name or expected message that differed; change nothing else. Depends on T033
- [ ] T039 [US4] **Needs the user's confirmation — creates external resources.** (2026-10-24: the Neon integration is already installed and injects `DATABASE_URL`/`DATABASE_URL_UNPOOLED`, but all three environments share one endpoint; the user chose separate Neon branches: they create `preview`/`development` branches in the Neon console, then repoint the Vercel Preview/Development variables — see quickstart step 3) In the Vercel project `nft-marketplace-api` add the **Neon Postgres** integration (Marketplace) with separate branches for Preview and Production (quickstart step 3); confirm with `vercel env ls` that `DATABASE_URL` (pooled) **and** `DATABASE_URL_UNPOOLED` (direct) exist for both, creating them from `POSTGRES_URL`/`POSTGRES_URL_NON_POOLING` if named differently; add `AUTH_JWT_SECRET` for Preview with a value **different** from Production's. Never print values
- [ ] T040 [US4] Migrate and seed each remote branch (quickstart step 4): `DATABASE_URL_UNPOOLED=<preview direct> pnpm --dir apps/api exec prisma migrate deploy`, then `DATABASE_URL=<preview> ADMIN_EMAIL=... ADMIN_PASSWORD='<NEW password>' pnpm --dir apps/api exec tsx scripts/seed-admin.ts`; repeat for production. The password MUST differ from the one used while the hash was publicly readable. `prisma migrate status` on each branch = up to date. Delete any `.env.*.local` pulled for this afterwards. Depends on T039
- [ ] T041 [US4] **Needs the user's confirmation — deploys.** `vercel deploy` from `apps/api`; in the build log confirm `prisma generate` ran in `postinstall` (no "Ignored build scripts"); run `BASE_URL=https://<preview>/api PROTECTION_BYPASS=<secret> AUTH_JWT_SECRET=<preview> ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm --dir apps/api verify:deploy`; all 14 checks `✓`. This is the end-to-end test the constitution requires before Blob stops being used: **no promotion without it**. A `500` on every route including `/health` means the client was not generated (research D15). Depends on T033, T040
- [ ] T042 [US4] **Needs the user's confirmation — publishes to production.** `vercel promote <preview-url>` (or `vercel deploy --prod`); run `verify:deploy` against `https://nft-marketplace-api-ochre.vercel.app/api` and then against `https://nft-marketplace-web-wheat.vercel.app/backend` (FR-003); run once more with `--repeat 10 --skip-admin` (SC-002: 10 of 10, zero lost updates). Record the p95 from check #14 in `specs/010-api-production-backend/quickstart.md` under a "Resultado" heading. Depends on T041
- [ ] T043 [US4] **Needs the user's confirmation — deletes data.** Clean up the old storage (quickstart step 10): delete the old Blob objects (admin records first), remove the Blob store if nothing else uses it, remove `BLOB_READ_WRITE_TOKEN` from the project's env vars, and run check #13 with `DIRECT_PROBE_URLS=<old admin URLs>` ⇒ none returns a record. After this, `vercel rollback` to a pre-database deploy no longer works. Depends on T042

**Checkpoint**: Production is verified end to end on Prisma, repeatably (SC-001–SC-007).

---

## Phase 7: Polish & Cross-Cutting

- [ ] T044 Regression gate from the repo root: `pnpm typecheck`, `pnpm lint`, `pnpm build`, then `pnpm --dir apps/web exec playwright test`; the result must equal the pre-feature one (only the 6 known stale `checkout`/`wallets` snapshots fail; SC-008). `git status` shows no change under `server/`, `apps/web/`, `specs/006-platform-coins/`, `specs/007-monorepo-vercel-blob/` (FR-015), and nothing under `apps/api/src/generated/` is tracked
- [ ] T045 Re-read `specs/010-api-production-backend/spec.md` FR-001…FR-015 and SC-001…SC-008 against the final state and list in the completion report which are verified (and how) and which are not; expected open item, if any: SC-006 on cold starts with the larger Prisma bundle, per the p95 recorded in T042

---

## Dependencies & Execution Order

- **T002 (amendment 1.6.0)** gates every Prisma task. Declined ⇒ skip T003, T004, T007–T011, T023–T026, T031, T032, T036, T037 and run T033 → T039–T045 on the revision-2 code.
- **Phase 1** (T003 → T004) → **Phase 2** (T007 → T009; T008 and T010 after T003/T007; T011 last) → **US2** (T023 → T024; T025; gate T026) → **US3** (T031 → T032 → T033) → **US4** (docs T036–T038; remote T039 → T040 → T041 → T042 → T043) → **Polish** (T044, T045).
- US3's Prisma adapter (T031) technically needs only T010/T011, but starts after the US2 gate (T026) so a Prisma error-shape problem is fixed once, in one place.
- Same-file sequences: `apps/api/package.json` = T003 only; `lib/db.ts` = T010; `coins/service.ts` = T024; `admin/service.ts` = T032; `README.md` = T036.

### Parallel opportunities

- T004 alongside T003's install (different files); T008 alongside T007.
- T025 alongside T023 (different files, both need only T010).
- T036 and T037 together.

```text
Task: "T007 apps/api/prisma/schema.prisma"
Task: "T008 apps/api/prisma.config.ts"
--- after T010 ---
Task: "T023 apps/api/src/domains/coins/prismaCoinsRepository.ts"
Task: "T025 apps/api/src/routes/health.ts via prisma().$queryRaw"
```

## Implementation strategy

### MVP (US1): done

The API answers in production and through the site (T012–T015), still on Blob.

### Incremental delivery from here

1. T002 approval → Phase 1–2: Prisma installed, schema and dev branch under Prisma Migrate.
2. US2 on Prisma (T023–T026): the balance is still correct, now through the ORM; same-key race gate.
3. US3 on Prisma (T031–T033): admin adapter swapped; full 14-check run locally.
4. US4 (T036–T043): docs, remote branches, verified preview, promotion, Blob cleanup.
5. Polish (T044–T045).

## Notes

- External actions need the user's explicit confirmation immediately before running: T002 (constitution), T039 (integration), T041/T042 (deploys), T043 (data deletion). Never print env values, tokens or hashes.
- The atomic write is the **only** raw SQL in `apps/api`; any other `$queryRaw` needs a reason in the PR. `$queryRawUnsafe`/`$executeRawUnsafe` are forbidden.
- If a task seems to require editing `server/`, `apps/web/` or specs 006/007, or changing `apps/api/vercel.json`, stop and re-check the plan.
