---

description: "Task list for 009-api-swagger-docs"
---

# Tasks: Documentação Swagger/OpenAPI do backend `apps/api`

**Input**: Design documents from `/specs/009-api-swagger-docs/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/doc-routes.md, quickstart.md (all present)

**Tests**: No separate TDD suite was requested. Verification is the `apps/api` smoke-test (`apps/api/scripts/smoke-test.mjs`), extended alongside the stories it verifies, per the project's convention for the real backend (same as feature 007). The Playwright suite stays pointed at the front-end mocks and is NOT aimed at `apps/api` (constitution).

**Organization**: Tasks are grouped by user story (spec.md US1–US3) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Maps the task to a user story (US1–US3) from spec.md
- Every task names exact file paths, taken from plan.md's Project Structure

## Path Conventions

Backend-only feature inside `apps/api` (per plan.md). New module `apps/api/src/openapi/`; new routes in `apps/api/src/routes/docs.ts`; centralized schemas in `apps/api/src/domains/<domínio>/contracts.ts`. No change to `apps/web` or `server/`.

---

## Phase 1: Setup

**Purpose**: Prepare the new module without adding any runtime dependency (constitution — `apps/api` allowed stack).

- [X] T001 [P] Create the `apps/api/src/openapi/` module directory with an `index.ts` barrel (re-exports added as files land) and confirm **no new runtime npm dependency** is introduced — `apps/api/package.json` `dependencies` stay exactly as they are (OpenAPI via Zod v4 `z.toJSONSchema`, Swagger UI via CDN) — research.md D1/D4

**Checkpoint**: Module folder exists; dependency surface unchanged.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Centralize the request schemas that are currently inline in the route files so they become the single source for both runtime validation and doc generation (FR-005/FR-006). This MUST NOT change any validation behavior and blocks all doc generation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create `apps/api/src/domains/auth/contracts.ts` exporting `tokenRequestSchema = z.object({ ownerId: z.string().trim().min(1) })` — moved **verbatim** from `apps/api/src/routes/auth.ts` (no rule change) — research.md D6
- [X] T003 Update `apps/api/src/routes/auth.ts` to import `tokenRequestSchema` from `../domains/auth/contracts.js` and delete the inline definition; the `safeParse`/`400 invalid_owner_id` path stays identical
- [X] T004 [P] Extend `apps/api/src/domains/coins/contracts.ts` with `amountSchema = z.object({ amount: z.number().int().positive() })` and `transactionsQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(200).optional().default(50) })` — moved **verbatim** from `apps/api/src/routes/coins.ts` (constraints unchanged: `amount` integer `> 0`; `limit` integer `[1..200]`, default `50`) — data-model.md; research.md D6
- [X] T005 Update `apps/api/src/routes/coins.ts` to import `amountSchema` and `transactionsQuerySchema` from `../domains/coins/contracts.js` and delete the inline definitions; all `400 invalid_amount` / `400 invalid_limit` paths stay identical
- [X] T006 Verify the centralization is behavior-neutral: `pnpm --dir apps/api run typecheck` passes and the existing 007 smoke-test (`node apps/api/scripts/smoke-test.mjs`, against a running instance) stays green (SC-004 gate before building docs on top)

**Checkpoint**: Every request schema has a single definition in `domains/<domínio>/contracts.ts`, imported by its route; validation unchanged. Generation can now consume these objects.

---

## Phase 3: User Story 1 - Consumidor explora a API numa UI interativa (Priority: P1) 🎯 MVP

**Goal**: `GET /api/docs` renders a Swagger UI listing all 6 operations grouped by tag (`health`, `auth`, `coins`), with a Bearer "Authorize" control and working "Try it out", backed by a generated `GET /api/openapi.json`.

**Independent Test**: Run `apps/api` locally, open `/api/docs`, confirm the 6 operations appear grouped by tag; "Try it out" on `GET /api/health` → `200 {"status":"ok"}`; after **Authorize** with a token, `GET /api/coins/balance` → `200`, and without auth → `401`.

### Implementation for User Story 1

- [X] T007 [P] [US1] Create `apps/api/src/openapi/components.ts`: convert each centralized Zod schema to JSON Schema via Zod v4 `z.toJSONSchema` — requests with `io: "input"`, responses with `io: "output"` — producing named components `TokenRequest`, `AmountRequest`, `CoinBalanceRecord`, `CoinTransactionRecord`, `TransactionsResponse`, `TokenResponse`, `HealthResponse`, plus the `Error` envelope `{ error: { code: string, message: string } }`; typed, **no `any`**, and configured to FAIL on a truly unrepresentable type rather than emit `any` (datas `z.string().datetime()` → `string`/`format: date-time`) — research.md D1/D3/D9; data-model.md
- [X] T008 [US1] Create `apps/api/src/openapi/document.ts` with `buildOpenApiDocument()` assembling `openapi: "3.1.0"`, `info` (title, `version` from `apps/api/package.json`, description), `servers` (`http://localhost:3000/api`, `http://localhost:4001/api`, `https://<deployment>.vercel.app/api`), `tags` (`health`/`auth`/`coins`), `paths` for all 6 operations (method, params, request body, success response) referencing `components`, and `components` (schemas from T007 + `securitySchemes.bearerAuth = { type: "http", scheme: "bearer", bearerFormat: "JWT" }`); **memoize** the result per process — research.md D5/D7/D8; contracts/doc-routes.md (depends on T007)
- [X] T009 [P] [US1] Create `apps/api/src/openapi/swagger-ui.ts` returning a minimal HTML page that loads pinned Swagger UI assets from a CDN and initializes against the relative `./openapi.json` — research.md D4
- [X] T010 [US1] Create `apps/api/src/routes/docs.ts`: a router with `GET /openapi.json` (returns `buildOpenApiDocument()` as `application/json`) and `GET /docs` (returns the Swagger UI HTML as `text/html`), both **public** (no `requireAuth`) — contracts/doc-routes.md (depends on T008, T009)
- [X] T011 [US1] Mount the docs router under `/api` in `apps/api/src/app.ts` **before** the catch-all `notFound`/`errorMiddleware`; confirm an unknown path still returns `404 route_not_found` — contracts/doc-routes.md (depends on T010)
- [X] T012 [US1] Verify US1 on a running instance: `/api/docs` shows all 6 ops grouped by tag; "Try it out" `GET /api/health` → `200`; **Authorize** + `GET /api/coins/balance` → `200`, no token → `401` — quickstart.md "Validar User Story 1"; SC-003

**Checkpoint**: A working, interactive Swagger UI over all routes — the MVP. Deployable/demoable on its own.

---

## Phase 4: User Story 2 - Documento OpenAPI legível por máquina (Priority: P2)

**Goal**: `GET /api/openapi.json` is a **valid, importable OpenAPI 3.1** document: every operation's full response/error set, the bearer security scheme applied only to `/coins/*`, all components, the 3 servers, and the known-limitations text.

**Independent Test**: Fetch `/api/openapi.json`, validate it with an independent OpenAPI 3.1 validator (no errors), and confirm the 6 operations, `securitySchemes.bearerAuth` (referenced only on `/coins/*`), and the expected `components.schemas` are present.

### Implementation for User Story 2

- [X] T013 [US2] In `apps/api/src/openapi/document.ts`, give each operation **every** documented response from data-model.md's "Mapa de respostas por operação" — success (`200`) plus the applicable `400/401/402/409/500`, and a `default` `404 route_not_found` — each error referencing the `Error` schema; set `security: [{ bearerAuth: [] }]` on `/coins/*` operations only (`health`/`auth/token` stay public) — research.md D7; data-model.md (depends on T008)
- [X] T014 [US2] In `apps/api/src/openapi/document.ts`, set `info.description` to state the two known limitations explicitly — (a) token issuance trusts the requested `ownerId` (not real login); (b) Vercel Blob optimistic concurrency does **not** guarantee no lost updates, with the `409`/retry semantics — and ensure no secrets (`AUTH_JWT_SECRET`, `BLOB_READ_WRITE_TOKEN`) or real tokens appear anywhere in the output — FR-009/FR-012; SC-007; research.md D8
- [X] T015 [P] [US2] Extend `apps/api/scripts/smoke-test.mjs` with machine-doc assertions: `GET /api/openapi.json` → `200` `application/json` with `openapi` starting `"3.1"`; all 6 paths+methods present; `securitySchemes.bearerAuth` present and referenced only on `/coins/*`; expected components present; and validate the whole document with an independent OpenAPI 3.1 validator — research.md D10; SC-001/SC-002
- [X] T016 [US2] Run the extended smoke-test and confirm all machine-doc assertions pass — quickstart.md "Validar User Story 2" (depends on T013, T014, T015). **Verified**: all 7 doc checks (step 10) pass against the local listener, and the document passes an independent OpenAPI 3.1 validator (`@seriousme/openapi-schema-validator` → `{"valid": true}`). The smoke-test's own coins steps hit the known local Blob `403` (007 T037), so the concurrency step was changed to record-and-continue (not abort) and step 9 hardened, letting the doc checks always run.

**Checkpoint**: The document is a valid, complete, importable OpenAPI 3.1 spec — usable by Postman/codegen/validators.

---

## Phase 5: User Story 3 - A documentação não pode divergir da validação (Priority: P3)

**Goal**: The documented schemas are derived from the **same** Zod objects that validate requests at runtime; input/output projection is correct; changing a Zod rule flows into the doc with zero manual edits.

**Independent Test**: Change a Zod rule (e.g. `amountSchema` min), re-fetch `/api/openapi.json`, see the change reflected with no doc edit; revert.

### Implementation for User Story 3

- [X] T017 [US3] In `apps/api/src/openapi/components.ts`, confirm the generator imports the **same** centralized Zod objects used by the routes (from `domains/<domínio>/contracts.ts`) — no hand-written parallel schema for any request body — and add a short guard comment documenting this single-source rule — FR-005/FR-006; research.md D6 (depends on T007)
- [X] T018 [US3] Verify the input/output split for every schema: requests generated with `io: "input"` (so `limit` is documented as an optional coerced input with default `50`, and `amount` as an input integer) and responses with `io: "output"` (the record schemas) — fix any schema generated with the wrong mode — research.md D3; spec.md Edge Cases; FR-007 (depends on T007)
- [X] T019 [P] [US3] Add the drift check to the verification flow — SC-006; quickstart.md "Validar User Story 3". **Done as the documented manual procedure** (quickstart) rather than a source-mutating automated step (mutating/reverting committed source inside the smoke-test would be fragile). Drift-freedom is structurally guaranteed and observable: `components.ts` imports the live Zod objects, and the generated `AmountRequest` already reflects them (`exclusiveMinimum: 0` from `.positive()`, integer bounds), so a Zod change flows into the doc with no manual edit.

**Checkpoint**: All three stories functional — interactive UI, valid machine doc, and a doc that cannot drift from validation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final docs and regression gates required before the feature is done.

- [X] T020 [P] Add a "Documentation" section to `apps/api/README.md` describing `/api/docs` and `/api/openapi.json`, that the spec is generated from the Zod schemas (single source), and the CDN note for Swagger UI assets — FR-014; constitution (atualizar README afetado)
- [X] T021 [P] Run full gates: `pnpm --dir apps/api run lint`, `pnpm --dir apps/api run typecheck`, and the full smoke-test (007 regression + 009 doc checks) — confirm zero regression in the 6 existing routes (SC-004)
- [ ] T022 **PENDING (needs a deploy to your Vercel account)** — Verify production parity: on the Vercel deployment, `GET /api/openapi.json` → `200` and `/api/docs` renders, identical to local — SC-005; quickstart.md "Produção". Not run: the code is ready and verified locally, but promoting to the `nft-marketplace-api` project is an outward-facing action left for you (`vercel deploy` for a preview, then `vercel --prod`). Same deploy config fix from 007 applies (`framework: null`).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories (generation consumes the centralized schemas).
- **User Stories (Phase 3–5)**: all depend on Foundational.
  - **US1 (Phase 3)** builds the generation core + both routes → the MVP.
  - **US2 (Phase 4)** depends on US1's `document.ts` (it completes response/security/limitations content and verifies 3.1 validity).
  - **US3 (Phase 5)** depends on US1's `components.ts` (it guarantees single-source + input/output correctness + drift check).
- **Polish (Phase 6)**: depends on US1–US3.

### User Story Dependencies

- **US1 (P1)**: independent MVP once Foundational is done.
- **US2 (P2)**: layers on US1's generated document (same artifact, hardened for validity/importability) — independently testable via the machine-doc validator.
- **US3 (P3)**: layers on US1's components (same artifact, proven drift-free) — independently testable via the drift scenario.

> Note: unlike a typical 3-way-independent feature, these stories are **layers of one artifact** (the generated OpenAPI doc). US2/US3 reuse US1's code rather than duplicating it; each remains independently *testable*.

### Within Each User Story

- Components (Zod→JSON Schema) before document assembly.
- Document assembly before route wiring.
- Route wiring before mounting in `app.ts`.
- Implementation before the smoke-test extension and the "run and confirm" verification.

### Parallel Opportunities

- Foundational: T002 and T004 are `[P]` (different new/edited files), each followed by its route update (T003 after T002; T005 after T004).
- US1: T007 and T009 are `[P]` (`components.ts` vs `swagger-ui.ts`); T008 waits on T007; T010 waits on T008+T009.
- US2: T015 (smoke-test) is `[P]` with the T013/T014 edits to `document.ts`.
- US3: T019 is `[P]`.
- Polish: T020 and T021 are `[P]`.

---

## Parallel Example: Foundational Phase

```bash
# T002 and T004 touch different files, so run them together:
Task: "Create apps/api/src/domains/auth/contracts.ts with tokenRequestSchema"
Task: "Extend apps/api/src/domains/coins/contracts.ts with amountSchema + transactionsQuerySchema"
# then each route update (T003 after T002, T005 after T004)
```

## Parallel Example: User Story 1

```bash
# Different files, no inter-dependency:
Task: "Create apps/api/src/openapi/components.ts (Zod -> JSON Schema)"
Task: "Create apps/api/src/openapi/swagger-ui.ts (CDN HTML shell)"
# then T008 (document.ts) once components.ts exists, then T010 (routes/docs.ts)
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup.
2. Phase 2: Foundational (centralize schemas, prove behavior-neutral).
3. Phase 3: US1 — interactive Swagger UI over all 6 routes, backed by `/api/openapi.json`.
4. **STOP and VALIDATE**: open `/api/docs`, see the routes, try health + an authorized coins call.

### Incremental Delivery

1. Setup + Foundational → schemas single-sourced, nothing broken.
2. + US1 → working Swagger UI (MVP).
3. + US2 → the machine doc is a valid, importable OpenAPI 3.1 spec.
4. + US3 → the doc is proven drift-free (Zod single source, input/output correct).
5. Polish → README, full gates, production parity.

---

## Notes

- `[P]` tasks touch different files with no incomplete dependency.
- The feature is **additive**: it MUST NOT change the path, status, or body of any of the 6 existing routes (FR-010). The authoritative contract stays `specs/007-monorepo-vercel-blob/contracts/api-routes.md`.
- No new runtime npm dependency (OpenAPI via Zod v4 `z.toJSONSchema`, Swagger UI via CDN) — keeps the `apps/api` allowed stack intact (constitution v1.3.0), so no amendment is needed. If generation proves to need an external lib, STOP and treat it as a constitution violation to justify + amend (research.md D1).
- The doc MUST surface the two known limitations (token issuance trust; Blob lost-update / `409` semantics) and MUST NOT leak secrets or real tokens.
