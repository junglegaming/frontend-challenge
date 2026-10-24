# Feature Specification: Monorepo na Vercel com Vercel Blob

**Feature Branch**: `007-monorepo-vercel-blob`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "então quero monta um monorepo tudo feito na vercel usando blobs monte um ambiente para monorepo e estrutura as rota do back-end" (set up a monorepo, everything deployed on Vercel, using Vercel Blob for storage; set up the monorepo environment and structure the backend routes). Decisions ratified with the user before writing this spec: (1) this is a new, separate infrastructure feature — it does **not** modify the existing `server/` (Express + SQLite) backend or the `006-platform-coins` spec/plan, which stay exactly as they are; (2) Vercel Blob is used for **all** backend-owned data in this new infra, including structured data such as balances and transaction ledgers, not only binary assets — a deliberate choice made with the explicit, documented trade-off that Blob has no native transactions/row locking (see Edge Cases and Assumptions); (3) the monorepo workspace is built with **pnpm workspaces + Nx** (Nx layered on top of pnpm for task running/caching/generators, not replacing pnpm as the package manager).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer runs the whole project as one monorepo (Priority: P1)

A developer clones the repository and, from the root, can install dependencies once and run every app (the existing frontend SPA and the new backend) through a single, consistent workspace — instead of today's split where the frontend lives at the repo root and `server/` is a deliberately separate, unlinked package.

**Why this priority**: Nothing else in this feature matters if the workspace itself isn't usable — this is the foundation every other story (backend routes, Blob storage) is built on, and it's independently valuable/testable on its own (a developer gets a working monorepo even before any new route exists).

**Independent Test**: From a clean clone, run the root install and the root dev command, and confirm both the existing frontend and the new backend app start successfully, with Nx recognizing both as workspace projects (`nx graph` / `nx show projects` lists them).

**Acceptance Scenarios**:

1. **Given** a clean clone of the repository, **When** a developer installs dependencies from the root, **Then** every app/package in the workspace (frontend `apps/web`, new backend `apps/api`, any shared `packages/*`) resolves its dependencies without needing a separate install step per app.
2. **Given** the workspace is installed, **When** a developer runs the root dev script, **Then** the frontend and the new backend both start locally, reachable at their documented local URLs/ports.
3. **Given** the workspace, **When** a developer asks Nx to list projects or run a task (e.g. build, typecheck) for a specific app, **Then** Nx scopes the task to that app/its dependents only, not the whole repo.
4. **Given** the existing `server/` (006/platform-coins backend) and the existing root frontend, **When** the new workspace is created, **Then** neither is modified or moved by this feature — they continue to run exactly as before, unaffected.

---

### User Story 2 - Backend exposes a documented, structured set of routes on Vercel (Priority: P2)

A developer (or another service) calls the new backend's HTTP routes, organized by resource under a clear, documented convention, deployed as Vercel Serverless Functions — runnable locally the same way they run in production.

**Why this priority**: This is the actual deliverable of "estruturar as rotas do back-end" — it depends on the monorepo existing first (User Story 1), but is the next most valuable piece: a backend nobody can call, however well the workspace is wired, delivers nothing.

**Independent Test**: With the workspace running (User Story 1), call each documented route (health check plus the example resource's routes) both via local Vercel dev emulation and, after a deploy, via the real Vercel deployment URL, and confirm identical request/response behavior in both environments.

**Acceptance Scenarios**:

1. **Given** the backend app, **When** a developer inspects its route structure, **Then** routes are grouped by resource under one consistent path convention (e.g. `/api/<resource>/<action-or-id>`), each route documented with method, request shape, and response shape.
2. **Given** the backend running locally via the Vercel-equivalent local runner, **When** a request is made to any documented route, **Then** the response matches the documented contract exactly (status code, body shape).
3. **Given** the backend deployed to Vercel, **When** the same request is made against the deployed URL, **Then** the response is behaviorally identical to the local run (same contract, same status codes for the same inputs).
4. **Given** a request to an undocumented/unknown route under `/api`, **When** it is made, **Then** the backend responds with a clear, consistent 404 rather than an unhandled crash.

---

### User Story 3 - Backend routes are protected by signed-token authentication (Priority: P3)

Every request to the example resource's data-changing routes must carry a short-lived, signed token proving which owner it is acting as — derived from a real cryptographic verification, not from a client-supplied header the caller can set to anything.

**Why this priority**: Closes the most direct security gap in the example backend (today's model would let anyone claim to be any owner by sending a different id). It depends on the routes existing (User Story 2) to protect, and MUST land before the Blob-backed persistence (User Story 4) is exercised with anything resembling real traffic — an unauthenticated route sitting in front of real persisted balances is the riskiest possible order to build this in.

**Independent Test**: Call a protected route with no token (expect rejection), obtain a token for owner A, use it successfully for owner A's own data, then attempt to use a request that claims to be owner B while presenting owner A's token and confirm owner B's data is never touched.

**Acceptance Scenarios**:

1. **Given** no `Authorization` header, **When** a request is made to any coins route, **Then** the request MUST be rejected with `401` before any Blob read or write happens.
2. **Given** a valid, unexpired signed token issued for owner A, **When** it is used to call a coins route, **Then** the route acts on owner A's data — the acting owner id comes exclusively from the verified token, never from any other header or body field the request might also contain.
3. **Given** a request using owner A's valid token that also tries to specify a different owner id elsewhere in the request (header, query, body), **When** it is processed, **Then** the system MUST ignore that other claimed id entirely and act only as the token's owner — owner B's data MUST NOT be read or changed.
4. **Given** a token that is expired or whose signature doesn't verify, **When** it is used on any protected route, **Then** the request MUST be rejected with `401`, never silently accepted.
5. **Given** the token-issuance route, **When** it is called with an owner id, **Then** it returns a freshly signed, short-lived token for that id — this issuance step is explicitly still bound by this project's existing, documented lack of real login/passwords (see Assumptions): it trusts the owner id it's given, the same way every other simulated-session boundary in this project does.

---

### User Story 4 - Backend persists structured data in Vercel Blob (Priority: P4)

The new backend's example resource (a coins-style balance + transaction ledger, used here purely to prove the pattern end-to-end — not a replacement of the existing `006-platform-coins` backend) reads and writes its data through Vercel Blob instead of a database, in a way that keeps a single balance consistent under normal use.

**Why this priority**: This validates the riskiest and most novel part of the stack (Blob as a stand-in for structured storage) but only matters once there's a workspace (US1), a route to call (US2), and that route is actually protected (US3) — exercising real persistence behind an unauthenticated route would be the wrong order.

**Independent Test**: Through the example resource's routes (now behind valid tokens), perform a top-up then a debit against the same balance, and confirm the balance read back afterward reflects both operations correctly, with the full operation history retrievable as an ordered transaction log.

**Acceptance Scenarios**:

1. **Given** a balance that doesn't exist yet in Blob storage, **When** the first top-up for that id is made, **Then** a new balance record and its first transaction entry are created in Blob storage, starting from zero.
2. **Given** an existing balance in Blob storage, **When** a top-up or a debit is performed, **Then** the stored balance value is updated and a new transaction entry is appended, both durably persisted (readable back after the request completes, including after a cold start).
3. **Given** two requests that modify the same balance arrive close together, **When** both are processed, **Then** the system MUST NOT silently lose one of the two updates — it either serializes them correctly (both applied, final balance reflects both) or rejects the second with a clear, retryable error; it MUST NOT produce a result where only one write effectively happened but both reported success.
4. **Given** a balance's transaction log, **When** it is read back, **Then** entries are returned in the order they occurred, each with enough information to reconstruct how the current balance was reached.

---

### Edge Cases

- What happens when two requests try to debit/top-up the exact same balance at nearly the same time? Covered by Acceptance Scenario 3 of User Story 3 — no silent lost update; a documented optimistic-concurrency check (read-current-version, write-new-version, retry on conflict) is required precisely because Vercel Blob has no built-in transactions or row locks.
- What happens when the Vercel Blob store is unreachable or returns an error mid-write (e.g. after reading current state but before writing the new state)? The request MUST fail clearly to the caller (no silent partial success) and MUST NOT leave the in-flight change half-applied — if the write never completed, the previously-read state is still what's stored.
- What happens when a route is called locally without the Blob read/write token configured? The app MUST fail fast at startup or on first call with a clear configuration error, not a generic 500 with no explanation.
- What happens when the existing `server/` backend (006/platform-coins) and this new `apps/api` both exist in the repository at once? They MUST coexist without interfering — different ports locally, different deploy targets, no shared code path that could break one by changing the other.
- What happens when Nx's task graph is asked to build/typecheck only the frontend, only the backend, or both? Each MUST be runnable independently without forcing a build of the other.
- What happens when a token expires in the middle of a session? The next request MUST fail with a clear `401`, and the caller MUST be able to get a fresh token by calling the issuance route again — there is no silent auto-renewal.
- What happens when the token-signing secret is missing from configuration? The app MUST fail fast at startup with a clear configuration error (same pattern as the missing Blob token), never issuing or accepting unsigned/unverifiable tokens.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST be restructured into a pnpm + Nx workspace with at least two apps — the existing frontend (moved into `apps/web`, behavior unchanged) and a new backend (`apps/api`) — without changing any existing frontend behavior, route, or test outcome.
- **FR-002**: The existing `server/` directory (the `006-platform-coins` real backend) and its spec/plan MUST remain untouched by this feature — no files moved, renamed, or edited there.
- **FR-003**: The workspace MUST support installing all apps' dependencies from the repository root in one command, and running each app's dev server independently or together via root-level scripts.
- **FR-004**: Nx MUST be configured to recognize each app/package as a distinct project, so that build/typecheck/lint/test tasks can be scoped to a single project or run across the whole workspace.
- **FR-005**: The new backend (`apps/api`) MUST expose its HTTP routes as Vercel Serverless Functions, organized under a documented, resource-based path convention, runnable identically via local Vercel emulation and real Vercel deployment.
- **FR-006**: The new backend's routes MUST be documented (method, path, request shape, response shape, status codes) in the feature's contracts.
- **FR-007**: The new backend MUST persist its data through Vercel Blob, including structured data (e.g. a balance and its transaction history for the example resource), with no relational database introduced. **Superseded by constitution 1.5.0:** at the user's request `apps/api` may use Postgres on Neon (`@neondatabase/serverless`) and migrate balances, transactions and admins off Blob, because Blob has no transactions (SC-003 is not met) and no private storage. Until that migration is done and tested, this requirement still describes the running system.
- **FR-008**: A write to a structured record in Blob storage (e.g. a balance update) MUST use an optimistic-concurrency check (read current version, write new version, detect and reject/retry on conflict) so that two near-simultaneous writes to the same record cannot silently overwrite each other without at least one of them being retried or rejected.
- **FR-009**: The system MUST clearly document, in the backend's README and this feature's design artifacts, that Vercel Blob is not a transactional database — the optimistic-concurrency approach reduces but does not eliminate race risk, and this is an accepted limitation given this project's demo/prototype scale.
- **FR-010**: Local development MUST fail with a clear, specific error when required Vercel Blob configuration (the read/write token) is missing, rather than failing silently or with a generic error.
- **FR-011**: The monorepo environment MUST include a documented deployment path to Vercel for both apps (frontend and the new backend), including which environment variables each needs.
- **FR-012**: Every route under `/api/coins/*` MUST require a valid signed bearer token; a request without one MUST be rejected with `401` before any Blob read or write is attempted.
- **FR-013**: The backend MUST derive the acting owner id exclusively from the verified token's claim — never from a client-supplied header, query parameter, or body field — so a request cannot act as an owner other than the one the presented token was issued for.
- **FR-014**: Tokens MUST be short-lived with a fixed, documented expiry, and MUST be rejected (`401`) once expired or if their signature fails verification against the server's secret.
- **FR-015**: The backend MUST expose a token-issuance route (`POST /api/auth/token`) that, given an owner id, returns a freshly signed token for that id. This issuance step still trusts the caller-provided owner id — it does not add real login/passwords to the project — so it MUST be documented as only protecting against identity-spoofing *after* a token has been issued, not against someone who directly requests a token for an id they already know (see Assumptions).
- **FR-016**: Missing or invalid token-signing secret configuration MUST fail fast with a clear, specific error, both at startup and on first use — never silently issuing or accepting an unverifiable token.

- **FR-017**: `apps/web` MUST reach `apps/api` through a same-origin proxy under a dedicated `/backend/*` prefix (mapped to the API's `/api/*`) — in dev/preview via the Vite proxy, in production via a `vercel.json` rewrite. The prefix MUST NOT be `/api`, which the MSW layer owns.
- **FR-018**: `apps/web` MUST consume `apps/api` through a dedicated domain (`ledger`) that issues and caches one token per signed-in user, refreshes it before expiry, retries once on `401`, retries `409` write conflicts, validates every response with Zod, and drops cached tokens when the app session changes.
- **FR-020**: `apps/api` MUST authenticate administrators with e-mail and password (`POST /admin/login`), store the password only as a salted scrypt hash in Vercel Blob, and answer a failed login identically for an unknown e-mail and a wrong password.
- **FR-021**: Admin routes (`/admin/me`, `/admin/owners`, `/admin/owners/:ownerId`) MUST require a token with `role: "admin"`; owner tokens get `403`, and admin tokens MUST NOT be accepted on owner routes (`403`). `POST /auth/token` MUST never be able to issue an admin token. The routes are read-only.
- **FR-022**: Admin credentials MUST be provisioned by a script that reads them from the environment (`pnpm seed:admin`); they MUST NOT appear in any file of the repository.
- **FR-019**: The Playwright suite MUST exercise that domain against an MSW mock of `apps/api` (`src/mocks/contexts/ledger`), never against the real backend.

### Key Entities

- **Coin Balance Blob Record** (example resource, proves the Blob-backed pattern): the current total for one owner id, stored as a single JSON object at a deterministic Blob path, carrying a version/revision marker used for optimistic concurrency. Never negative.
- **Coin Transaction Blob Record**: an append-only entry describing one change to a balance (top-up or debit), stored so the full ordered history for one owner id can be reconstructed; includes amount, direction, resulting balance, and timestamp.
- **Workspace Project**: an app or package recognized by Nx (`apps/web`, `apps/api`, any `packages/*` created for shared code), each with its own build/typecheck/lint targets.
- **Auth Token**: a stateless, signed credential (not persisted anywhere — verified by signature alone) scoped to exactly one owner id, carrying an issue time and a short expiry; never conflated with the owner id a request might otherwise claim to be.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from a clean clone to both apps (frontend + new backend) running locally with exactly one root install command and one (or two, documented) root dev command(s).
- **SC-002**: 100% of the new backend's documented routes behave identically (same status codes, same response shape) whether called against the local Vercel-equivalent runner or the real Vercel deployment.
- **SC-003**: Running 50 concurrent top-up/debit requests against the same example balance in a test scenario results in zero silently-lost updates — the final stored balance exactly matches the sum of all requests that were accepted (none accepted as "success" and then not reflected).
- **SC-004**: The existing frontend's full existing Playwright suite and the existing `006-platform-coins` backend's own verification both continue to pass unchanged after this feature is merged, with zero regressions attributable to the workspace restructuring.
- **SC-005**: Nx can build, typecheck, and lint `apps/web` and `apps/api` independently of one another, each completing without requiring the other app's build to succeed first.
- **SC-006**: 100% of requests to `/api/coins/*` without a valid token are rejected with `401` before any Blob operation occurs, across all documented routes.
- **SC-007**: In a test scenario, a token issued for owner A never succeeds in reading or changing owner B's balance or transactions, regardless of what other identity the request claims elsewhere — 0 successful cross-owner accesses out of every attempt tested.

## Assumptions

- **Separate from `006-platform-coins`, not a replacement**: this feature does not touch `server/`, its spec, or its plan. The example resource built here to prove the Blob-backed pattern is a new, independent implementation under `apps/api` — not a migration of the existing coins backend. Reconciling or retiring `server/` in favor of this new infrastructure, if ever desired, is explicitly out of scope and would need its own future feature.
- **Vercel Blob for structured data is a deliberate, accepted trade-off**: Vercel Blob is key→file storage with no transactions, no row locks, and no query language. Using it for a balance/ledger (rather than Vercel Postgres/KV, which are better suited to structured, transactional data) was chosen explicitly by the user over this spec's recommendation to the contrary. The optimistic-concurrency approach (FR-008) mitigates but does not eliminate race risk; this is acceptable only at this project's demo/prototype scale, with no real money involved, and MUST stay documented as a known limitation, never presented as production-grade data consistency.
- **Nx is additive to pnpm, not a replacement**: pnpm remains the package manager and workspace linker (`pnpm-workspace.yaml`); Nx sits on top for task orchestration, caching, and project graph awareness. This introduces new tooling beyond the project constitution's current stack list and will need a constitution amendment (an additive exception, following the same pattern already used for `server/`), not a rewrite of existing principles.
- **Signed tokens close one gap, not every gap — still no real login anywhere in the project**: unlike the `006-platform-coins` backend (`server/`), which trusts a caller-supplied id directly on every request, `apps/api`'s coins routes require a signed, short-lived token whose claimed owner id is cryptographically verified — closing the trivial "just change a header value to act as someone else" attack on *already-issued* requests (FR-012-FR-014, SC-006/SC-007). **What this explicitly does not do**: the token-issuance route (`POST /api/auth/token`, FR-015) still accepts whatever owner id it's asked to issue a token for — there is no password, login, or any other proof of identity behind it, because this project has no real authentication anywhere. A party who already knows another user's owner id could still request a token for that id directly from the issuance route. Closing that remaining gap would require adding real login/credentials to the whole product, which is explicitly out of scope for this infrastructure feature. This trade-off MUST stay documented in `apps/api`'s README exactly as described here, never presented as full protection against account takeover.
- **Scope is infrastructure + one proof-of-concept resource, not new product features**: this feature does not add any new user-facing product capability to the storefront/marketplace. Its deliverable is the workspace, the route structure/conventions, and one working example end-to-end (balance/ledger on Blob) that future backend features can follow.
- **Existing automated test suite is unaffected**: the existing Playwright suite continues to run entirely against the existing MSW-mocked frontend and is not pointed at the new `apps/api` by this feature.
