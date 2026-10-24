---

description: "Task list template for feature implementation"
---

# Tasks: Quality Hardening — Failure Coverage, Rollback Test, A11y/UX Audit

**Input**: Design documents from `/specs/003-quality-hardening/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (all present; no `contracts/` — no new interfaces)

**Tests**: This feature's deliverable *is* test coverage for User Stories 1–2; the "tests" are the implementation, not a separate TDD layer. User Story 3 is a mix of small code fixes, `spec.md` wording fixes, and checklist annotations.

**Organization**: Tasks are grouped by user story (US1–US3 from `spec.md`) so each can be delivered and verified independently.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps the task to US1–US3 from `spec.md`
- File paths are exact and relative to the repository root

---

## Phase 1: Setup

- [X] T001 Run `pnpm exec playwright test` once to confirm the current 71-test baseline passes, establishing the no-regression floor required by FR-006/SC-004 before any change in this feature.

## Phase 2: Foundational

Nenhuma tarefa foundational — as 3 histórias desta feature são independentes entre si (nenhuma depende de infraestrutura nova) e podem começar em paralelo assim que T001 confirmar a baseline.

---

## Phase 3: User Story 1 - Close required failure-scenario coverage (Priority: P1) 🎯 MVP

**Goal**: provar, com testes automatizados, que preço alterado, sessão expirada e erro de rede/servidor são tratados de forma graciosa nas telas de catálogo/carrinho/checkout.

**Independent Test**: rodar `e2e/checkout/checkout.spec.ts` e `e2e/home/catalog.spec.ts` com os 3 novos cenários selecionados e confirmar os 3 estados esperados (aviso de preço, redirecionamento por sessão expirada, erro com retry).

### Implementation for User Story 1

- [X] T002 [US1] Add a 'preço alterado no checkout' test to `e2e/checkout/checkout.spec.ts`: select the `price-change-at-checkout` mock scenario (`selectScenario`), seed session + cart, attempt to confirm the purchase, and assert the UI blocks completion and flags the stale total (FR-001). If the warning does not actually appear, fix the gap in `src/pages/checkout/CheckoutPage.tsx`'s quote-revalidation path (`onSubmit`) so the `price_changed` `QuoteIssue` is surfaced before confirmation — this is a real defect fix, not optional, per the feature's Edge Cases.
- [X] T003 [US1] Add a 'sessão expirada' test to `e2e/checkout/checkout.spec.ts`: select the `short-session` mock scenario, advance past its `sessionTtlMs` (via `page.clock` or an equivalent wait), trigger an authenticated action (e.g. loading `/checkout`), and assert a redirect to `/login?redirect=...` rather than a silent failure (FR-002).
- [X] T004 [P] [US1] Add an 'erro de rede/servidor' test to `e2e/home/catalog.spec.ts`: select one of `server-error`/`service-unavailable`/`offline`, and assert the catalog renders `NftGridError`'s retry-capable error state instead of a blank page or unhandled exception (FR-003).

**Checkpoint**: os 3 cenários de falha restantes exigidos pelo Princípio VII estão cobertos por teste e, se necessário, corrigidos.

---

## Phase 4: User Story 2 - Verify the cart's optimistic rollback (Priority: P2)

**Goal**: provar que o stepper de quantidade do carrinho reverte visualmente quando o servidor rejeita o novo valor.

**Independent Test**: rodar o novo teste em `e2e/cart/cart.spec.ts` isoladamente e confirmar que ele falha se o rollback (`onError` de `useUpdateCartItem`) for removido do código.

### Implementation for User Story 2

- [X] T005 [P] [US2] Add a 'rollback otimista' test to `e2e/cart/cart.spec.ts`: seed a cart line at/near its `maxPerOrder`/`available` limit, increase the quantity via the stepper to force a server-side `quantity_exceeds_stock` rejection, and assert the UI briefly shows the optimistic (higher) value then reverts to the prior quantity with the inline `STATUS_MESSAGE` text (FR-004).

**Checkpoint**: rollback otimista do carrinho comprovado por teste (fecha o gap do antigo T034 da feature 002).

---

## Phase 5: User Story 3 - Audit and resolve open accessibility/UX/pattern items (Priority: P3)

**Goal**: levar os 25 itens de `specs/002-nft-marketplace-screens/checklists/ux-a11y-review.md` a uma conclusão — correção de código, ajuste de texto no `spec.md` da 002, ou justificativa registrada — seguindo a triagem de `research.md` D2.

**Independent Test**: reabrir `checklists/ux-a11y-review.md` da 002 e confirmar que todos os 25 itens estão `[x]` com uma nota ao lado.

### Implementation for User Story 3 — code fixes (CHK003, CHK009, CHK010)

- [X] T006 [P] [US3] Add an explicit error state (message + retry button) for cart-load failure in `src/pages/cart/CartPage.tsx`, mirroring the pattern already used by `src/pages/home/components/NftGrid.tsx`'s `NftGridError` (CHK003).
- [X] T007 [P] [US3] Add an explicit error state (message + retry button) for cart/quote-load failure in `src/pages/checkout/CheckoutPage.tsx` (CHK003).
- [X] T008 [P] [US3] Add an explicit error state (message + retry button) for wallets-load failure in `src/pages/wallets/WalletsPage.tsx` (CHK003).
- [X] T009 [P] [US3] Add `aria-live="polite"` to the totals `<dl>` in `src/pages/checkout/components/OrderSummary.tsx`, matching the pattern already present in `src/pages/cart/components/CartSummary.tsx` (CHK010).
- [X] T010 [US3] Add a keyboard-navigation e2e assertion in `e2e/home/catalog.spec.ts` proving the price-range `Slider` in `CatalogFilters` is operable via Tab/Arrow keys (not just mouse), per Radix's built-in support (CHK009).

### Implementation for User Story 3 — spec.md wording fixes (CHK001, CHK004, CHK016, CHK018, CHK019, CHK022, CHK024, CHK025)

- [X] T011 [US3] Amend `specs/002-nft-marketplace-screens/spec.md` FR-001 to reference the Assumptions' "minor spacing/font-rendering/placeholder-asset differences are acceptable" note, bounding what counts as an in-scope visual defect (CHK001).
- [X] T012 [US3] Amend `specs/002-nft-marketplace-screens/spec.md` FR-022 to explicitly allow different visual treatments per breakpoint (sidebar vs. sheet, dialog vs. full-width sheet) as long as functionality is equivalent (CHK004).
- [X] T013 [US3] Amend `specs/002-nft-marketplace-screens/spec.md` Key Entities to note that the FR-013/FR-019 "username"/"código de indicação" fields are resolved per that feature's own `research.md` D2/D3 (mapped to Profile fields or non-persisted), rather than left as an open inconsistency (CHK016).
- [X] T014 [US3] Amend `specs/002-nft-marketplace-screens/spec.md` FR-015 to state the idempotency key's scope precisely — tied to the cart's quote signature, not the checkout session generally (CHK018).
- [X] T015 [US3] Amend `specs/002-nft-marketplace-screens/spec.md` FR-012 to name the concrete redirect destination (`/cart`) when checkout is reached with an empty/unpurchasable cart (CHK019).
- [X] T016 [US3] Amend `specs/002-nft-marketplace-screens/spec.md` FR-020 to state that "Igual à carteira principal" copies a snapshot at creation time, not a live link to later primary-wallet edits (CHK022).
- [X] T017 [US3] Add a one-line traceability note after each Success Criterion (SC-001–SC-007) in `specs/002-nft-marketplace-screens/spec.md` naming the FR(s) that support it (CHK024).
- [X] T018 [US3] Add a short User Story → Functional Requirement traceability table at the end of `specs/002-nft-marketplace-screens/spec.md` (CHK025).

### Implementation for User Story 3 — rationale-only checklist annotations (no code/spec change)

- [X] T019 [P] [US3] In `specs/002-nft-marketplace-screens/checklists/ux-a11y-review.md`, mark CHK002, CHK005, CHK006, CHK007, CHK008, CHK011, CHK012, CHK013, CHK014, CHK015, CHK017, CHK020, CHK021 and CHK023 as `[x]`, each with the one-line rationale already drafted in this feature's `research.md` D2 table.

**Checkpoint**: todos os 25 itens do checklist da 002 resolvidos (código, texto do spec, ou justificativa registrada); nenhum item fica em aberto sem explicação.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 Run `pnpm lint && pnpm typecheck && pnpm build` and fix any issue introduced by T002–T010.
- [X] T021 Run the full Playwright suite (`pnpm test:e2e`) and confirm all existing tests plus the new ones in T002–T005/T010 pass with zero regressions (FR-006, SC-001, SC-004).
- [X] T022 Execute `quickstart.md`'s 3 manual validation scenarios as a final sign-off, and confirm `checklists/ux-a11y-review.md` (002) has zero items left both unchecked and unexplained (SC-003).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: no dependencies — run first to establish the regression baseline.
- **Foundational**: none — US1, US2 and US3 can all start right after T001.
- **US1 (Phase 3)**, **US2 (Phase 4)**, **US3 (Phase 5)**: fully independent of each other; may be done in parallel by different people, or sequentially in priority order.
- **Polish (Phase 6)**: depends on whichever user stories are done at the time.

### Within Each User Story

- T002 and T003 both edit `e2e/checkout/checkout.spec.ts`, so they are sequential relative to each other even though both belong to US1.
- T011–T018 all edit the same `specs/002-nft-marketplace-screens/spec.md` file, so they are sequential relative to each other even though all belong to US3 — apply them as one pass over the file, not in parallel.
- T010 and T004 both touch files under `e2e/home/`, so apply T004 before T010 if done by the same person to avoid merge noise (not a hard dependency).

### Parallel Opportunities

- T004 (US1) and T005 (US2) are fully parallel (different files, different stories).
- T006, T007, T008, T009 (US3 code fixes) are all parallel — four different files.
- T019 (US3 rationale annotations) is parallel to every other US3 task — it only touches the checklist file.

## Parallel Example: starting all three stories at once

```bash
# After T001, in parallel:
Task: "Add price-changed test to e2e/checkout/checkout.spec.ts"       # US1, T002
Task: "Add rollback test to e2e/cart/cart.spec.ts"                    # US2, T005
Task: "Add cart-load error state to src/pages/cart/CartPage.tsx"      # US3, T006
```

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete T001 (Setup).
2. Complete Phase 3 (US1 — the only CRITICAL-severity gap from the prior analysis).
3. **Stop and validate**: run `e2e/checkout` and `e2e/home` to confirm all 3 failure scenarios pass.
4. This alone closes the constitution-level gap; US2/US3 can follow independently.

### Incremental Delivery

1. T001 → baseline confirmed.
2. US1 → validate → this is the MVP, closes the CRITICAL finding.
3. US2 → validate → closes the T034 test-debt gap.
4. US3 → validate → closes the 25-item checklist.
5. Polish (T020–T022) → final green run across lint/typecheck/build/e2e.

## Notes

- `[P]` = different files, no dependency on an incomplete task.
- `[Story]` maps the task to US1/US2/US3; Setup/Foundational/Polish carry no story label.
- Any defect found while writing a failure-scenario test (T002's conditional fix) is in scope to fix, per this feature's own Assumptions — "covered gracefully" requires the behavior to actually be graceful.
- Avoid: re-running `/speckit-tasks` against `specs/002-nft-marketplace-screens/tasks.md` — that feature's 62/62 completed task list must stay untouched; all spec/text fixes here target `spec.md` directly, not `tasks.md`.
