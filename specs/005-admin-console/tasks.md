---

description: "Task list template for feature implementation"
---

# Tasks: Admin Console — Products, Users & AI Image Generator

**Input**: Design documents from `/specs/005-admin-console/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Each user story's own Playwright e2e folder is listed as part of that story's
implementation, matching the convention established by features 002–004.

**Organization**: Tasks are grouped by user story (US1–US4 from `spec.md`). US1 (access control) is
a true prerequisite for US2–US4 in practice (there is no admin area to put listing/user/image
features into without it), so its tasks are ordered first even though all four remain independently
testable once US1 exists.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps the task to US1–US4 from `spec.md`
- File paths are exact and relative to the repository root

---

## Phase 1: Setup

- [X] T001 Run `pnpm exec playwright test` once to confirm the current baseline (confirmed green
      this session, 004-storefront-expansion complete) passes, establishing the no-regression floor
      this feature must not break.

## Phase 2: Foundational

Nenhuma tarefa foundational separada — US1 já cumpre esse papel (ver nota acima): nada em US2–US4
pode começar antes de T002–T011 (role + guard + área admin) existirem.

---

## Phase 3: User Story 1 - Keep non-admins out of the admin area (Priority: P1) 🎯 MVP

**Goal**: papel de administrador + área admin acessível apenas por administradores; sign-up nunca
cria um admin.

**Independent Test**: como `usr_ana` (admin), acessar `/admin/products` e ver a tela carregar; como
`usr_bruno` (colecionador) ou visitante, tentar a mesma URL e ser redirecionado sem ver conteúdo.

### Implementation for User Story 1

- [X] T002 [US1] Add `export type UserRole = 'collector' | 'admin'` and `role: UserRole` (required)
      to `SessionUser` in `src/domains/auth/model/contracts.ts` (data-model.md).
- [X] T003 [US1] Add `role: UserRole` and `status: UserAccountStatus` (`'active' | 'suspended'`) to
      `UserRecord` in `src/mocks/state.ts` (depends on T002 for the shared `UserRole`/
      `UserAccountStatus` types — re-export or duplicate the literal union as needed to avoid a
      mocks→domain-internal import cycle; prefer importing the public type from `@/domains/auth`).
- [X] T004 [US1] In `src/mocks/fixtures/users.ts`: seed `usr_ana` with `role: 'admin', status:
      'active'`; seed `usr_bruno` with `role: 'collector', status: 'active'` (research.md D1).
- [X] T005 [US1] In `src/mocks/contexts/auth/service.ts`: `AuthService.signup` always assigns
      `role: 'collector', status: 'active'` to new users — self-serve signup can never create an
      admin (FR-002). Update `toSessionUser` (or equivalent mapping) to forward `role` into the
      `Session` response.
- [X] T006 [US1] Create `src/domains/auth/model/role-guard.ts` exporting `requireRole(href:
      string, context: RouterContext, role: UserRole)`: checks `hasSessionToken()` first
      (redirect to `/login?redirect=href` if absent, reusing `requireSession`'s logic), then
      `await context.queryClient.ensureQueryData(sessionQueryOptions(getSessionToken()))` and
      redirects to `/` with `?forbidden=true` if `session.user.role !== role` (research.md D2).
      Export it from `src/domains/auth/index.ts`.
- [X] T007 [P] [US1] Create `src/domains/admin/model/contracts.ts`: `UserAccountStatus`,
      `AdminNftListing`/`CreateListingRequest`/`UpdateEditionRequest`,
      `AdminUserSummary`/`AdminUserDetail` (data-model.md) — contracts only, no logic yet.
- [X] T008 [US1] Create `src/domains/admin/components/AdminSideMenu.tsx` (mirrors
      `AccountSideMenu`: links to `/admin/products` and `/admin/users`), `src/domains/admin/index.ts`
      (exports contracts + `AdminSideMenu` so far), `src/domains/admin/README.md` (depends on T007).
- [X] T009 [US1] Create minimal `src/pages/admin-products/AdminProductsPage.tsx` (renders
      `AdminSideMenu` + a placeholder heading — real content added in US2),
      `src/pages/admin-products/index.ts`, `src/pages/admin-products/README.md` (depends on T008).
- [X] T010 [US1] Create minimal `src/pages/admin-users/AdminUsersPage.tsx` (same shell pattern),
      `src/pages/admin-users/index.ts`, `src/pages/admin-users/README.md` (depends on T008).
- [X] T011 [US1] Create `src/app/routes/admin.products.tsx` and `src/app/routes/admin.users.tsx`:
      `beforeLoad: ({ location, context }) => requireRole(location.href, context, 'admin')`,
      `component:` the respective page (depends on T006, T009, T010). **Note**: per the routing bug
      found and fixed during Feature A (flat `foo.tsx` + `foo.$id.tsx` nests unintentionally in
      TanStack Router's file convention) — `admin.products.tsx`/`admin.users.tsx` have no
      `$id`-style sibling, so this specific trap does not apply here, but double-check the
      generated `routeTree.gen.ts` after first build to confirm no unintended nesting.
- [X] T012 [US1] Add `e2e/admin-products/admin-products.spec.ts` (or a shared
      `e2e/admin-console/access-control.spec.ts` if preferred) covering: admin can load
      `/admin/products`; signed-out visitor redirected to `/login?redirect=...`; signed-in collector
      redirected away without ever seeing admin content (FR-004) — this is the test that matters
      most in the whole feature per spec.md's own priority framing.

**Checkpoint**: área admin existe, protegida, com telas vazias prontas para receber US2/US3/US4.

---

## Phase 4: User Story 2 - Manage NFT listings (Priority: P2)

**Goal**: criar, editar preço/estoque e remover anúncios de NFT a partir da área admin.

**Independent Test**: como admin, criar um anúncio e vê-lo no catálogo público; editar preço/estoque
e ver o catálogo refletir sem refresh; remover e confirmar que some da vitrine mas pedidos antigos
continuam intactos.

### Implementation for User Story 2

- [X] T013 [US2] Create `src/mocks/contexts/admin/guard.ts`: `requireAdmin(auth: AuthService,
      request: Request)` resolves the Bearer token via the existing `AuthService`, throws
      `errors.forbidden()` (`src/mocks/http/errors.ts`) if the resolved user's `role !== 'admin'`.
- [X] T014 [US2] Create `src/mocks/contexts/admin/service.ts`: `AdminService` constructor takes the
      *existing* `CatalogRepository` and `UserRepository` instances (no new repository, research.md
      D4); implement `createListing`, `updateEdition`, `delist` — each bumps `version` and emits
      `nft.updated` via the existing realtime server, matching `CatalogService`'s own pattern.
- [X] T015 [US2] Create `src/mocks/contexts/admin/handlers.ts`: `POST /api/admin/nfts`, `PATCH
      /api/admin/nfts/:nftId/editions/:editionId`, `POST /api/admin/nfts/:nftId/delist` — each
      wrapped with `requireAdmin` before calling the service (contracts/admin-products.md).
- [X] T016 [US2] Wire into `src/mocks/composition.ts`: instantiate `AdminService` with the existing
      `catalogRepository`/`users` instances, append its handlers to the exported `handlers` array
      (same pattern as `creators` in feature 004).
- [X] T017 [P] [US2] Add `admin` query/mutation hooks to `src/domains/admin/api/queries.ts`:
      `useAdminNfts`, `useCreateListing`, `useUpdateListing`, `useDelistNft` (TanStack Query, same
      shape as `catalogQueries`/mutations elsewhere); export from `src/domains/admin/index.ts`.
- [X] T018 [US2] Build out `src/pages/admin-products/components/{ListingTable,ListingForm}.tsx` and
      wire them into `AdminProductsPage.tsx` (depends on T017): table lists NFTs with
      edit/delist actions; form creates a listing with one edition. (Image-generation button added
      in US4, T024 — leave a plain image-URL/upload-less field here for now.)
- [X] T019 [US2] Add `e2e/admin-products/listings.spec.ts`: create a listing → appears in `/`
      (public catalog); edit price/stock → catalog reflects it without manual refresh; delist →
      disappears from `/` and `/market`, viewport/axe baselines for `/admin/products`.

**Checkpoint**: gestão de anúncios funcional e testável isoladamente (supondo US1 já no lugar).

---

## Phase 5: User Story 3 - Manage user accounts (Priority: P2)

**Goal**: buscar usuários, ver detalhe, suspender (encerrando sessões) e reativar.

**Independent Test**: como admin, buscar um usuário, suspendê-lo, confirmar que ele não consegue
mais usar a sessão ativa nem entrar novamente; reativar e confirmar que volta a funcionar; tentar
suspender o único admin e ver o bloqueio.

### Implementation for User Story 3

- [X] T020 [US3] Extend `src/mocks/contexts/admin/service.ts` (from T014): `listUsers(q)`,
      `getUser(id)` (404 via `errors.notFound` if absent), `suspendUser(id)` — **first counts active
      admins; if the target is the sole active admin, throws a `409`-style `DomainError`** (FR-011,
      data-model.md invariant) — and `reactivateUser(id)`. `suspendUser` also deletes every
      `SessionRecord` for that user (reuses `SessionRepository`; add a `deleteByUserId(userId)`
      method to `SessionRepository` in `src/mocks/contexts/auth/repository.ts` if one doesn't exist
      — verify before adding).
- [X] T021 [US3] Extend `src/mocks/contexts/admin/handlers.ts` (from T015): `GET
      /api/admin/users?q=`, `GET /api/admin/users/:userId`, `POST
      /api/admin/users/:userId/suspend`, `POST /api/admin/users/:userId/reactivate` — all behind
      `requireAdmin` (contracts/admin-users.md).
- [X] T022 [P] [US3] Add `useAdminUsers`, `useAdminUser`, `useSuspendUser`, `useReactivateUser` to
      `src/domains/admin/api/queries.ts` (depends on T017's file existing; different exports, can
      run in parallel with T018 if T017 is done).
- [X] T023 [US3] Build out `src/pages/admin-users/components/{UserSearch,UserDetailPanel}.tsx` and
      wire into `AdminUsersPage.tsx` (depends on T022): search box → result list → detail panel
      with suspend/reactivate; the suspend action is disabled with an inline explanation when the
      target is the sole active admin (FR-011, Edge Cases).
- [X] T024 [US3] Add `e2e/admin-users/users.spec.ts`: search finds a known user; suspend
      `usr_bruno` → their session ends (simulate via a second `page`/context already signed in as
      `usr_bruno`, confirm their next authenticated call behaves like an expired session) and
      sign-in fails until reactivated; attempting to suspend the sole admin is blocked;
      viewport/axe baselines for `/admin/users`.

**Checkpoint**: gestão de usuários funcional e testável isoladamente.

---

## Phase 6: User Story 4 - Generate NFT artwork from a text description (Priority: P3)

**Goal**: gerar uma imagem determinística a partir de uma descrição em texto, dentro do formulário
de criação/edição de anúncio.

**Independent Test**: gerar uma imagem a partir de um texto; gerar de novo com o mesmo texto e
confirmar que o resultado é idêntico; tentar gerar com descrição vazia e ver a rejeição.

### Implementation for User Story 4

- [X] T025 [P] [US4] Extract the deterministic SVG-drawing logic already in `scripts/generate-art.mjs`
      (the `tile()` function and its mulberry32 PRNG) into a pure function in
      `src/mocks/infra/placeholder-art.ts`, imported by both `scripts/generate-art.mjs` (update its
      import) and the new mock service below — exactly one implementation, not two (research.md D5).
- [X] T026 [US4] Create `src/domains/media-generation/model/contracts.ts`
      (`GenerateImageRequest`, `GeneratedImage`), `src/domains/media-generation/api/queries.ts`
      (`useGenerateImage()` mutation), `src/domains/media-generation/index.ts`,
      `src/domains/media-generation/README.md` (depends on T025 only for the mock side, not this
      domain's own files — can start in parallel with T025).
- [X] T027 [US4] Create `src/mocks/contexts/media-generation/service.ts` (FNV-1a hash of the prompt
      → seed → `placeholder-art.ts` → base64 SVG data URI; throws a validation error for an
      empty/whitespace-only prompt, FR-015) and `src/mocks/contexts/media-generation/handlers.ts`
      (`POST /api/media/generate-image`) — depends on T025.
- [X] T028 [US4] Wire into `src/mocks/composition.ts` (append handlers, no service composition
      needed beyond instantiation — this context needs no injected repository).
- [X] T029 [US4] Add a `GenerateImageButton`/prompt field to
      `src/pages/admin-products/components/ListingForm.tsx` (from T018): calls
      `useGenerateImage()`, sets the result as the form's image field (depends on T018, T026, T028).
- [X] T030 [US4] Add an e2e assertion (in `e2e/admin-products/listings.spec.ts` or a new
      `e2e/admin-products/image-generation.spec.ts`) that generating twice from the identical prompt
      text produces a byte-identical image `src` (FR-013), and that an empty prompt is rejected
      inline (FR-015).

**Checkpoint**: todas as 4 histórias completas e testáveis.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T031 Run `pnpm lint && pnpm typecheck && pnpm build` and fix any issue introduced by
      T002–T030.
- [X] T032 Run the full Playwright suite (`pnpm exec playwright test`, **not** piped through
      `tail`/`head` — always check the real exit code and the "N failed" line directly; a masked
      exit code caused a real regression to go unnoticed during feature 004 this session) and
      confirm all existing tests plus the new ones in T012/T019/T024/T030 pass with zero
      regressions (SC-006).
- [X] T033 Execute `quickstart.md`'s 5 manual validation scenarios as a final sign-off.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: no dependencies.
- **US1 (Phase 3)**: effectively foundational — T002–T011 must all complete before any US2/US3/US4
  task that touches `/admin/products` or `/admin/users` content, since those pages don't exist with
  real routes/guards until US1 is done.
- **US2 (Phase 4)** and **US3 (Phase 5)**: independent of each other once US1 is done; may proceed
  in parallel.
- **US4 (Phase 6)**: depends on US2's `ListingForm.tsx` existing (T018) to attach the generate-image
  button to, but its domain/mock files (T025–T028) can be built in parallel with US2/US3.
- **Polish (Phase 7)**: depends on whichever stories are done at the time.

### Within Each User Story

- T002 → T003 → T004/T005 is a strict sequential chain (role field must exist before fixtures/signup
  reference it).
- T013 → T014 → T015 → T016 (US2 mock chain) and T020 → T021 (US3 mock additions to the same files)
  are sequential relative to each other since T020/T021 extend the same `service.ts`/`handlers.ts`
  files T014/T015 create — do US2's mock chain first if both are being done by the same person.
- T025 (shared drawing-logic extraction) has no dependency on US1/US2/US3 and can start anytime.

### Parallel Opportunities

- T007 (US1 admin contracts) is parallel with nothing else in US1 (everything else in US1 depends
  on it or on T002/T006).
- T017 (US2 hooks) and T022 (US3 hooks) touch the same `queries.ts` file — sequential if done by one
  person, otherwise coordinate to avoid merge conflicts.
- T025 (US4 shared drawing logic) and T026 (US4 domain scaffolding) can run in parallel with all of
  US2/US3 once US1 is done.

## Parallel Example: after US1 is done

```bash
Task: "Build admin NFT listing mock service"       # US2, T014
Task: "Extract placeholder-art.ts drawing logic"    # US4, T025
```

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete T001 (Setup).
2. Complete Phase 3 (US1 — access control). This alone proves the security boundary works, which
   the spec itself calls the single most consequential piece of this feature.
3. **Stop and validate**: confirm a non-admin is blocked from `/admin/products` and `/admin/users`
   by direct URL.

### Incremental Delivery

1. T001 → baseline confirmed.
2. US1 → validate → MVP (access control proven).
3. US2 → validate → listing management ships.
4. US3 → validate → user management ships.
5. US4 → validate → image generator ships (depends on US2's form existing).
6. Polish (T031–T033) → final green run across lint/typecheck/build/e2e.

## Notes

- `[P]` = different files, no dependency on an incomplete task.
- `[Story]` maps the task to US1/US2/US3/US4; Setup/Polish carry no story label.
- `usr_ana` is the sole seed administrator (research.md D1) — do not also seed a brand-new admin
  fixture; reusing her avoids disturbing any existing test or fixture reference to her as a
  collector, since she keeps working normally in every non-admin flow too.
- The image generator (US4) MUST NOT introduce any new dependency (no AI/LLM SDK, no image library)
  — this is an explicit, hard constraint from the spec's Assumptions, reaffirmed mid-session.
