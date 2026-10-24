# Feature Specification: Quality Hardening — Failure Coverage, Rollback Test, A11y/UX Audit

**Feature Branch**: `003-quality-hardening`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Fechar lacunas de qualidade encontradas na feature 002-nft-marketplace-screens (já implementada e em produção): (1) cobrir no e2e os cenários de falha exigidos pelo Princípio VII ainda não testados — preço alterado no checkout (cenário de mock `price-change-at-checkout`), sessão expirada (`short-session`), e erros genéricos de rede/4xx/5xx (`server-error`/`service-unavailable`/`offline`) nas telas de carrinho, checkout e catálogo; (2) adicionar o teste de rollback otimista para `quantity_exceeds_stock` no carrinho, que o relatório de análise encontrou como lacuna (tarefa T034 da feature 002 estava marcada concluída mas o teste real não cobria esse caminho); (3) conduzir uma auditoria de acessibilidade, responsividade (390/768/1440) e aderência a padrões de UI/interação nas 6 telas novas (home, login/cadastro, carrinho, checkout, confirmação de pedido, carteiras), usando como ponto de partida os itens ainda não marcados em specs/002-nft-marketplace-screens/checklists/ux-a11y-review.md (CHK001-CHK025), resolvendo cada lacuna real de código ou documentando a decisão quando for uma limitação aceitável do spec original."

## Clarifications

### Session 2026-10-21

- Q: Does SC-001's required test coverage treat "network" and "4xx/5xx" as one combined failure category, or as two separate categories that each need their own dedicated test? → A: One combined category — a single status-code scenario test (e.g. `service-unavailable`) satisfies both buckets.
- Q: Should the checkout screen also get its own dedicated network/5xx error-state test, or is the existing catalog test sufficient to close FR-003? → A: The existing catalog test is sufficient; FR-003's "catalog or cart" wording is authoritative and checkout is not additionally required.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Close required failure-scenario coverage (Priority: P1)

The team needs the catalog, cart and checkout screens to have automated proof that the project's required failure scenarios (network/5xx errors, session expiration, and a price change detected at checkout) are handled gracefully, not just the two scenarios (invalid coupon, idempotent retry) already covered.

**Why this priority**: This closes a confirmed constitution-level gap (Princípio VII: "cenários de falha ... MUST ser cobertos"). It is the only CRITICAL finding from the prior analysis and the most consequential to leave open.

**Independent Test**: Run the new e2e suites with the mock scenarios `price-change-at-checkout`, `short-session`, and one of `server-error`/`service-unavailable`/`offline` selected, and confirm each produces the expected graceful UI state (warning, redirect-to-login, or retry-capable error) rather than a crash or silent failure.

**Acceptance Scenarios**:

1. **Given** a cart whose quoted price changes before checkout is confirmed (`price-change-at-checkout` scenario), **When** the user attempts to confirm the purchase, **Then** the UI surfaces the price-changed issue and blocks completion until the user re-reviews the updated total.
2. **Given** a session that expires while the user is on the cart or checkout screen (`short-session` scenario), **When** the user performs an action that requires authentication, **Then** the app detects the expired session and redirects to login with a `redirect` back to the original screen, instead of failing silently or showing a raw error.
3. **Given** a transient network/server error on the catalog or cart screen (`server-error`, `service-unavailable`, or `offline` scenario), **When** the affected request fails, **Then** the screen shows a retry-capable error state instead of a blank page, an unhandled exception, or silently stale data.

---

### User Story 2 - Verify the cart's optimistic rollback (Priority: P2)

The team needs automated proof that the cart's quantity stepper actually rolls back to its previous value when a quantity change is rejected by the server (e.g., it now exceeds available stock), since this was implemented in code but never asserted by a test.

**Why this priority**: A previously "complete" task did not meet its own acceptance bar — this is a confirmed, scoped gap, but it affects only the cart screen and is independent of User Story 1.

**Independent Test**: Seed a cart line whose requested quantity will be rejected as exceeding stock, trigger the quantity change, and confirm the UI reverts to the prior quantity and shows an inline message, without needing any other story's screens.

**Acceptance Scenarios**:

1. **Given** a cart line where a quantity increase will be rejected as exceeding available stock, **When** the user increases the quantity, **Then** the UI first shows the optimistic (higher) value, then reverts to the prior value once the rejection is received, and shows an inline message explaining why.

---

### User Story 3 - Audit and resolve open accessibility/UX/pattern items (Priority: P3)

The team needs every item left open in the prior accessibility/UX/functional requirements review (`specs/002-nft-marketplace-screens/checklists/ux-a11y-review.md`, CHK001–CHK025) to reach a conclusion: either the underlying code is adjusted to close the gap, or a decision is recorded explaining why the gap is an acceptable limitation of the original spec.

**Why this priority**: These are review findings about requirements wording and secondary UX/a11y polish, not confirmed functional defects — valuable to close out, but lower urgency than the two test-coverage gaps above.

**Independent Test**: Walk through each of CHK001–CHK025; for each, confirm it now has either (a) a code change plus a passing accessibility/visual check, or (b) a recorded rationale, and that none remain silently unresolved.

**Acceptance Scenarios**:

1. **Given** an open checklist item describing a missing or ambiguous requirement (e.g., keyboard operability of a custom control, a vague breakpoint condition), **When** the audit addresses it, **Then** either the referenced code/spec is updated to close the gap, or the checklist item is marked `[x]` with a one-line rationale for why no change is needed.
2. **Given** all 25 items have been walked through, **When** the audit concludes, **Then** no item remains both unchecked and without a recorded decision.

---

### Edge Cases

- What happens when closing a checklist item (e.g., the FR-013/FR-019 "username"/"código de indicação" field inconsistency) would require changing the already-shipped mock backend contracts? The resolution MUST stay within the existing contracts (documenting the limitation) rather than modifying `src/mocks`, consistent with feature 002's own assumption that the mock backend is feature-complete.
- What happens when an audit item is already satisfied by an existing shared design-system component or behavior, just not obviously so from the spec wording alone? It is marked resolved with a reference to the existing component/behavior, with no code change required.
- What happens if adding a new failure-scenario test reveals an actual, previously-unknown defect (not just missing test coverage)? The defect MUST be fixed as part of this feature, since "covered gracefully" (User Story 1) requires the behavior to actually be graceful, not just asserted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The automated test suite MUST include a scenario where an item's price changes between its quote and checkout confirmation, asserting the UI blocks or clearly flags the stale total before the purchase can complete.
- **FR-002**: The automated test suite MUST include a scenario where the user's session expires while on a cart or checkout screen, asserting the app redirects to login with a `redirect` parameter back to the original screen rather than failing silently.
- **FR-003**: The automated test suite MUST include at least one scenario where a catalog or cart request fails with a transient network/server error, asserting a retry-capable error state is shown. Per the 2026-10-21 clarification, "network" and "4xx/5xx" (SC-001) are a single combined category satisfied by one such test, and this test is not additionally required on the checkout screen.
- **FR-004**: The automated test suite MUST include a scenario that forces a cart quantity change to be rejected for exceeding available stock, asserting the UI reverts the optimistically-applied quantity and shows an inline message.
- **FR-005**: For each of the 25 items in `specs/002-nft-marketplace-screens/checklists/ux-a11y-review.md`, the work MUST produce either a code/spec change that closes the gap or a recorded one-line rationale for why it is an acceptable limitation, and MUST leave no item both unchecked and unexplained.
- **FR-006**: Any code change made while resolving a failure scenario or checklist item MUST keep `pnpm lint`, `pnpm typecheck`, `pnpm build`, and the full existing Playwright suite passing (no regressions to the 71 tests already in place as of this feature's start).
- **FR-007**: Any new or modified end-to-end test MUST follow the existing per-page folder convention (`e2e/<page>/`) and reuse the existing shared test helpers (viewport set, sign-in, scenario selection, order settlement, horizontal-scroll check, accessibility scan) rather than duplicating that setup logic.

### Key Entities

- No new domain entities are introduced. This feature operates entirely on the existing NFT Listing, Cart, Order and Wallet concepts already defined in `specs/002-nft-marketplace-screens/data-model.md`, plus the existing mock-backend failure scenarios in `src/mocks/scenarios/definitions.ts`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 6 failure-scenario categories required by the project constitution (network, 4xx/5xx, expired session, invalid coupon, price changed, idempotent timeout retry) have at least one passing automated test, up from 2 before this feature.
- **SC-002**: The cart's optimistic quantity-rollback behavior is verified by a passing automated test where none existed before.
- **SC-003**: Zero of the 25 items in the prior accessibility/UX/functional checklist remain both unresolved and undocumented.
- **SC-004**: The complete automated verification suite (lint, typecheck, build, full Playwright run) passes with zero regressions introduced by this feature's changes.

## Assumptions

- This is test-coverage, defect-fix and documentation work on an already-shipped feature (002); it does not introduce new user-facing screens, routes, or domain entities.
- The mock backend (`src/mocks`, including its predefined failure scenarios) is considered feature-complete and stable for this scope; new tests exercise existing scenarios rather than requiring new ones.
- "Resolved" for a checklist item does not require a visible UI change — a documented rationale in the checklist file is an acceptable outcome when the underlying requirement is judged already adequate or out of scope.
- Any defect uncovered while writing a failure-scenario test (as opposed to a pure test-coverage gap) is treated as in-scope to fix, since the goal is genuinely graceful handling, not merely an assertion that passes.
