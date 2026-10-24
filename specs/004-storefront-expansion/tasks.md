---

description: "Task list template for feature implementation"
---

# Tasks: Storefront Expansion — Mercado, Criadores, Aprenda

**Input**: Design documents from `/specs/004-storefront-expansion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Each user story's own Playwright e2e folder (per the project's established convention,
see `e2e/home/catalog.spec.ts`) is listed as part of that story's implementation, not a separate
pre-implementation TDD gate — matching how features 002/003 were structured.

**Organization**: Tasks are grouped by user story (US1–US3 from `spec.md`) so each can be delivered
and verified independently.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps the task to US1–US3 from `spec.md`
- File paths are exact and relative to the repository root

---

## Phase 1: Setup

- [X] T001 Run `pnpm exec playwright test` once to confirm the current baseline (76 tests, per
      `specs/003-quality-hardening`) passes, establishing the no-regression floor this feature must
      not break.

## Phase 2: Foundational

Nenhuma tarefa foundational — as 3 histórias desta feature são independentes entre si (nenhuma
depende de infraestrutura nova) e podem começar em paralelo assim que T001 confirmar a baseline.

---

## Phase 3: User Story 1 - Discover NFTs through curated rails / Mercado (Priority: P1) 🎯 MVP

**Goal**: dar um destino real ao link "Mercado" — um hub de descoberta curado (categorias, em alta,
coleções) que navega para o catálogo/detalhe já existentes, sem duplicar busca/filtro/grid próprios.

**Independent Test**: carregar `/market` isoladamente, confirmar que os 3 blocos renderizam com
dados reais, e que selecionar um item leva ao destino esperado (catálogo filtrado ou detalhe do
NFT).

### Implementation for User Story 1

- [X] T002 [P] [US1] Create `src/pages/market/components/CategoryTiles.tsx`: renders one tile per
      `NFT_CATEGORIES`/`CATEGORY_LABELS` entry (from `@/domains/catalog`); selecting a tile
      navigates to `/` with `?category=<id>` (FR-001, FR-002).
- [X] T003 [P] [US1] Create `src/pages/market/components/TrendingRail.tsx`: renders
      `catalogQueries.featured()` results as a horizontal rail of `NftCard`; selecting an item
      navigates to `/nft/$nftId`; shows an explicit empty state when the query returns zero items
      (FR-001, FR-002, Edge Cases).
- [X] T004 [P] [US1] Create `src/pages/market/components/CollectionsRail.tsx`: groups the same
      `catalogQueries.featured()` result client-side by `Nft.collection`, rendering up to N
      collections with ≥1 item; selecting a collection navigates to `/` with `?q=<collection
      name>` (FR-001, FR-002, per `contracts/market.md`).
- [X] T005 [US1] Create `src/pages/market/MarketPage.tsx` composing T002–T004, plus
      `src/pages/market/index.ts` and `src/pages/market/README.md` (scope, route, domains used —
      `@/domains/catalog` only, no new domain), reusing the existing `NftGridError`/skeleton
      patterns for loading/error states (depends on T002, T003, T004).
- [X] T006 [US1] Create `src/app/routes/market.tsx`:
      `createFileRoute('/market')({ component: MarketPage })`, no `beforeLoad` (public screen, FR-010)
      (depends on T005).
- [X] T007 [US1] In `src/app/layout/nav-items.ts`: extend `NavItem['to']` union with `'/market'`,
      and flip the `market` entry to `{ to: '/market', enabled: true }` (FR-009) (depends on T006).
- [X] T008 [US1] Add `e2e/market/market.spec.ts`: viewport (390/768/1440) + axe + horizontal-scroll
      baseline (mirroring `e2e/home/catalog.spec.ts`'s pattern), plus a functional assertion that
      selecting a category tile navigates to `/` filtered by that category (depends on T007).

**Checkpoint**: Mercado está completo e testável isoladamente; "Mercado" não é mais um link morto.

---

## Phase 4: User Story 2 - Browse creators and their work / Criadores (Priority: P2)

**Goal**: diretório de criadores + detalhe por criador, derivados dos NFTs já existentes, sem
fixtures novas (research.md D2/D3).

**Independent Test**: carregar `/creators` isoladamente, confirmar o grid, selecionar um criador e
confirmar bio + grid de NFTs no detalhe; visitar um id inexistente e confirmar o estado
"não encontrado".

### Implementation for User Story 2

- [X] T009 [P] [US2] Create `src/domains/creators/model/contracts.ts`: `Creator { id: string, name:
      string, avatarUrl: string | null, bio: string, nftCount: number }` (data-model.md).
- [X] T010 [US2] Create `src/domains/creators/api/queries.ts`: `creatorQueries.list()`,
      `.detail(id)`, `.nfts(id)` via `api.get<Creator[]>('/creators')` /
      `api.get<Creator>('/creators/:id')` / `api.get<NftSummary[]>('/creators/:id/nfts')`, same
      `queryOptions` pattern as `catalogQueries` (depends on T009).
- [X] T011 [US2] Create `src/domains/creators/index.ts` (public exports: contracts, queries) and
      `src/domains/creators/README.md` (scope, no persisted state — read projection over catalog)
      (depends on T010).
- [X] T012 [P] [US2] Create `src/mocks/contexts/creators/repository.ts`: derives `Creator[]` by
      grouping `CatalogRepository`'s NFTs on `artist.id` (no new fixtures, no new state — per
      research.md D2); include a small fixed `id → bio` lookup table for the bio text (research.md
      D3), falling back to a generic bio string for any artist id not in the table.
- [X] T013 [US2] Create `src/mocks/contexts/creators/service.ts`: `list()`, `detail(id)` (throws
      `errors.notFound('Criador')` per `contracts/creators.md` when absent), `nfts(id)` (depends on
      T012).
- [X] T014 [US2] Create `src/mocks/contexts/creators/handlers.ts`: `GET /api/creators`, `GET
      /api/creators/:id`, `GET /api/creators/:id/nfts` (depends on T013).
- [X] T015 [US2] Wire the new context into `src/mocks/composition.ts`: instantiate the
      `creators` service (reusing the existing `catalogRepository` instance) and append its
      handlers to the exported `handlers` array (depends on T014).
- [X] T016 [P] [US2] Create `src/pages/creators/components/CreatorCard.tsx`: avatar, name,
      `nftCount`, navigates to `/creators/$creatorId` on select.
- [X] T017 [US2] Create `src/pages/creators/CreatorsPage.tsx` (grid of T016, empty state when the
      directory is empty), `src/pages/creators/index.ts`, `src/pages/creators/README.md` (depends
      on T011, T015, T016).
- [X] T018 [US2] Create `src/app/routes/creators.tsx`:
      `createFileRoute('/creators')({ component: CreatorsPage })`, no `beforeLoad` (public, FR-010)
      (depends on T017).
- [X] T019 [P] [US2] Create `src/pages/creator-detail/components/CreatorBio.tsx`: avatar, name,
      bio.
- [X] T020 [US2] Create `src/pages/creator-detail/CreatorDetailPage.tsx` (T019 + a grid of the
      creator's NFTs via `NftCard`; renders the existing not-found pattern when
      `creatorQueries.detail(id)` 404s, per FR-005), `src/pages/creator-detail/index.ts`,
      `src/pages/creator-detail/README.md` (depends on T011, T015, T019).
- [X] T021 [US2] Create `src/app/routes/creators.$creatorId.tsx`: params-forwarding route to
      `CreatorDetailPage`, no `beforeLoad` (public, FR-010) (depends on T020).
- [X] T022 [US2] In `src/app/layout/nav-items.ts`: extend `NavItem['to']` union with `'/creators'`,
      flip the `creators` entry to `{ to: '/creators', enabled: true }` (FR-009) (depends on T018,
      T021; sequential with T007/T031 — same file).
- [X] T023 [US2] Add `e2e/creators/creators.spec.ts`: grid renders with real data, card → detail
      navigation, viewport/axe baselines (depends on T022).
- [X] T024 [US2] Add `e2e/creators/creator-detail.spec.ts`: bio + NFT grid render for a known
      creator id, not-found state for an unknown id (FR-005), viewport/axe baselines (depends on
      T022).

**Checkpoint**: Criadores está completo e testável isoladamente.

---

## Phase 5: User Story 3 - Learn about NFTs / Aprenda (Priority: P3)

**Goal**: conteúdo educativo estático (lista + detalhe por slug), sem mock/backend.

**Independent Test**: carregar `/learn` isoladamente, confirmar a lista, abrir um artigo e
confirmar o conteúdo completo; visitar um slug inexistente e confirmar o estado "não encontrado".

### Implementation for User Story 3

- [X] T025 [US3] Create `src/pages/learn/content/articles.ts`: static `Article { slug, title,
      summary, readingMinutes, body }[]` (data-model.md) with at least 3 Portuguese NFT-education
      articles (per `contracts/learn.md`): o que são NFTs, como funciona uma edição/estoque
      limitado, como comprar com segurança na plataforma; `slug` unique across the array.
- [X] T026 [P] [US3] Create `src/pages/learn/components/ArticleCard.tsx`: title, summary, reading
      time; navigates to `/learn/$slug` on select.
- [X] T027 [US3] Create `src/pages/learn/LearnPage.tsx` (list of T026 over the static array from
      T025), `src/pages/learn/index.ts`, `src/pages/learn/README.md` (depends on T025, T026).
- [X] T028 [US3] Create `src/app/routes/learn.tsx`:
      `createFileRoute('/learn')({ component: LearnPage })`, no `beforeLoad` (public, FR-010)
      (depends on T027).
- [X] T029 [US3] Create `src/app/routes/learn.$slug.tsx`: resolves the `Article` by exact `slug`
      match against the static array synchronously; renders the existing not-found pattern when no
      match exists (FR-008) (depends on T025).
- [X] T030 [US3] In `src/app/layout/nav-items.ts`: extend `NavItem['to']` union with `'/learn'`,
      flip the `learn` entry to `{ to: '/learn', enabled: true }` (FR-009) (depends on T028, T029;
      sequential with T007/T022 — same file).
- [X] T031 [US3] Add `e2e/learn/learn.spec.ts`: list renders the seeded articles, selecting one
      navigates to its detail and shows its title/body, not-found state for a bad slug (FR-008),
      viewport/axe baselines (depends on T030).

**Checkpoint**: Aprenda está completo e testável isoladamente; os 3 links de navegação do escopo
desta feature estão todos ativos.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T032 Run `pnpm lint && pnpm typecheck && pnpm build` and fix any issue introduced by
      T002–T031.
- [ ] T033 Run the full Playwright suite (`pnpm test:e2e`) and confirm all existing tests plus the
      new ones in T008/T023/T024/T031 pass with zero regressions (SC-006).
- [ ] T034 Execute `quickstart.md`'s manual validation scenarios (Mercado, Criadores, Aprenda,
      responsive/a11y spot-check) as a final sign-off.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: no dependencies — run first to establish the regression baseline.
- **Foundational**: none — US1, US2 and US3 can all start right after T001.
- **US1 (Phase 3)**, **US2 (Phase 4)**, **US3 (Phase 5)**: fully independent of each other in terms
  of source/domain files; may be done in parallel by different people, or sequentially in priority
  order.
- **Polish (Phase 6)**: depends on whichever user stories are done at the time.

### Within Each User Story

- T002–T004 (US1 rail/tile components) are parallel with each other, then T005 composes them.
- T009→T010→T011 (US2 domain) and T012→T013→T014→T015 (US2 mocks) are each a sequential chain, but
  the domain chain and the mocks chain can proceed in parallel with each other until T017 needs
  both.
- T007 (US1), T022 (US2) and T030 (US3) all edit the same `src/app/layout/nav-items.ts` file, so
  they are sequential relative to each other even though they belong to independent stories — apply
  them in whatever order the stories are actually finished, not necessarily US1→US2→US3.

### Parallel Opportunities

- T002, T003, T004 (US1) are fully parallel.
- T009 (US2 domain contracts) and T012 (US2 mock repository) can start in parallel.
- T016 (US2 `CreatorCard`) and T019 (US2 `CreatorBio`) are parallel with each other and with the
  domain/mock chain.
- T026 (US3 `ArticleCard`) is parallel with T025 (US3 static content).
- Across stories: once T001 is done, a US1 task, a US2 task and a US3 task can all run at the same
  time (different files), e.g. T002, T009, T025.

## Parallel Example: starting all three stories at once

```bash
# After T001, in parallel:
Task: "Create CategoryTiles.tsx"                              # US1, T002
Task: "Create creators domain contracts.ts"                   # US2, T009
Task: "Create static learn articles.ts"                       # US3, T025
```

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete T001 (Setup).
2. Complete Phase 3 (US1 — Mercado, the highest-priority of the three).
3. **Stop and validate**: run `e2e/market` and confirm the 3 acceptance scenarios from spec.md.
4. This alone activates the single most prominent dead nav link; US2/US3 can follow independently.

### Incremental Delivery

1. T001 → baseline confirmed.
2. US1 (Mercado) → validate → ships the MVP.
3. US2 (Criadores) → validate → ships the creators directory/detail.
4. US3 (Aprenda) → validate → ships the learn content; all 3 target nav links now active.
5. Polish (T032–T034) → final green run across lint/typecheck/build/e2e.

## Notes

- `[P]` = different files, no dependency on an incomplete task.
- `[Story]` maps the task to US1/US2/US3; Setup/Foundational/Polish carry no story label.
- The `favorites` nav item is explicitly untouched by this feature (spec.md Assumptions) — do not
  modify its entry in `nav-items.ts` while doing T007/T022/T030.
- Visual fidelity to the (currently Figma-inaccessible) reference design is out of scope for this
  task list's Definition of Done; research.md D4 and quickstart.md's "Known limitation" record this
  as an accepted follow-up, not a blocker to marking these tasks complete.

## Post-completion fixes (found during T033's real verification)

T033 was initially marked done after a `pnpm exec playwright test | tail -N` run that reported
`[exited with code 0]` — but the exit code of a piped command is the *last* pipeline stage's
(`tail`'s), not Playwright's, which silently masked 12 real test failures. Two genuine bugs were
found and fixed once re-run without piping through `tail`:

1. **Routing bug**: `src/app/routes/creators.tsx` + `creators.$creatorId.tsx` and
   `src/app/routes/learn.tsx` + `learn.$slug.tsx` were unintentionally nested (TanStack Router's
   file convention treats `foo.$id.tsx` as a child of an existing `foo.tsx`), so the detail/article
   routes never rendered — the parent's full-page component had no `<Outlet/>`. Fixed by renaming
   the list routes to `creators.index.tsx` / `learn.index.tsx`, making them leaf routes under an
   implicit pass-through layout instead of real parents.
2. **Accessibility bug**: `CollectionsRail.tsx`'s collection buttons had both visible text content
   and a redundant `aria-label`, triggering axe's `label-content-name-mismatch` (WCAG 2.5.3). Fixed
   by removing the `aria-label` and relying on the already-descriptive visible text.

Also updated the pre-existing `e2e/design-system/navbar-consistency.spec.ts`, which still asserted
"Mercado" was `aria-disabled` — outdated now that this feature enables it; updated to assert it's a
real link to `/market` instead.

**Lesson**: never pipe `pnpm exec playwright test` (or any command whose exit code matters) through
`tail`/`head`/`grep` — always redirect to a file (`> file 2>&1; echo $?`) or check the reporter's own
"N failed" line directly.
