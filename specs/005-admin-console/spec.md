# Feature Specification: Admin Console — Products, Users & AI Image Generator

**Feature Branch**: `005-admin-console`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "Console administrativo para o marketplace de NFTs: hoje não existe nenhum conceito de papel/permissão de usuário, nem uma área administrativa, nem um jeito de orquestrar os NFTs anunciados ou as contas de usuário. Esta feature adiciona: (1) um papel de \"administrador\" distinto do papel padrão de \"colecionador\" — apenas um usuário fixo de seed já nasce administrador; o cadastro público (signup) nunca cria um administrador; (2) uma área administrativa só acessível a administradores (um visitante ou colecionador comum que tentar acessar diretamente uma URL administrativa deve ser redirecionado, não ver a área); dentro dela, duas telas: \"Produtos\" (gestão dos anúncios de NFT — criar um novo anúncio com edição inicial, editar preço/estoque de uma edição existente, e remover um anúncio da vitrine sem apagar seu histórico) e \"Usuários\" (buscar/listar usuários, ver detalhe de um usuário, suspender uma conta e reativá-la; suspender uma conta encerra as sessões ativas dela); (3) dentro do formulário de criar/editar anúncio de NFT, um gerador de imagem \"por IA\": o administrador digita uma descrição em texto e recebe uma imagem gerada para usar como arte do NFT — a mesma descrição deve sempre gerar a mesma imagem (determinístico, reprodutível), e esta capacidade deve ser inteiramente simulada dentro da camada de mocks do projeto (sem chamar nenhum serviço de IA real, sem exigir chave de API, sem custo), consistente com o princípio do projeto de que toda simulação reside na camada de mocks e deve ser determinística e reproduzível. Restrição explícita de stack: a pilha obrigatória do projeto (React, TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO, Tailwind CSS, shadcn/ui, MSW, Playwright, Lighthouse) é a única permitida — nenhuma nova dependência (nenhum SDK de IA/LLM, nenhuma biblioteca nova de processamento de imagem) pode ser introduzida para esta feature; isso deve ficar registrado como uma suposição/restrição explícita na spec. Fora de escopo: gestão de pedidos pelo admin (não faz parte desta feature)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep non-admins out of the admin area (Priority: P1)

An administrator can reach a dedicated admin area to manage the marketplace; a regular collector or signed-out visitor who tries the same URLs is kept out and sent elsewhere, never seeing admin screens or admin data.

**Why this priority**: Every other capability in this feature (managing listings, managing users, generating art) sits behind this boundary. Without it correctly enforced, nothing else in this feature is safe to ship — it is the prerequisite for all other stories.

**Independent Test**: As a signed-in administrator, reach the admin area and confirm it loads. As a signed-in collector (or a signed-out visitor), attempt to reach the same admin URLs directly and confirm access is denied and the person is redirected away, with no admin content or data ever rendered or returned.

**Acceptance Scenarios**:

1. **Given** a signed-in administrator, **When** they navigate to the admin area, **Then** they see the admin area's screens.
2. **Given** a signed-in collector (non-administrator), **When** they attempt to load an admin-area URL directly, **Then** they are redirected away and never see admin content.
3. **Given** a signed-out visitor, **When** they attempt to load an admin-area URL directly, **Then** they are redirected to sign in (and, after signing in as a non-administrator, are still kept out per Scenario 2).
4. **Given** the public account-creation flow, **When** anyone signs up for a new account, **Then** the new account is always a regular collector account, never an administrator account.

---

### User Story 2 - Manage NFT listings (Priority: P2)

An administrator creates new NFT listings, adjusts the price or available stock of an existing listing's edition, and removes a listing from the public storefront without erasing its history (e.g., past orders that reference it).

**Why this priority**: This is the core "orchestrate the products" need named in the request, and the most directly valuable day-to-day admin task once access control (Story 1) is in place.

**Independent Test**: As an administrator, create a new listing with one edition, confirm it appears in the public catalog; edit that edition's price and stock and confirm the catalog reflects the change; remove the listing from the storefront and confirm it no longer appears publicly while any of its past order history remains intact.

**Acceptance Scenarios**:

1. **Given** an administrator on the Products screen, **When** they create a new NFT listing with an initial edition (name, price, stock), **Then** the listing becomes visible in the public catalog with the values they entered.
2. **Given** an existing listing's edition, **When** an administrator updates its price or available stock, **Then** the public catalog reflects the updated value without requiring a manual refresh, consistent with how real-time catalog updates already work elsewhere in the product.
3. **Given** an existing listing, **When** an administrator removes it from the storefront, **Then** it no longer appears in public browsing or search, while it remains viewable within any past order that already referenced it.

---

### User Story 3 - Manage user accounts (Priority: P2)

An administrator searches for and reviews user accounts, and can suspend a misbehaving account (which also signs that person out everywhere) or reactivate a previously suspended one.

**Why this priority**: The second half of the "orchestrate... usuários" need, independently valuable and independently testable from Story 2 (different data, same access boundary).

**Independent Test**: As an administrator, search for a known account, open its detail, suspend it, and confirm that account's active session(s) end immediately and the account can no longer sign in; then reactivate it and confirm sign-in works again.

**Acceptance Scenarios**:

1. **Given** an administrator on the Users screen, **When** they search by name or e-mail, **Then** matching accounts appear in a list.
2. **Given** a user account in the list, **When** the administrator opens it, **Then** they see that account's detail (profile info and current status).
3. **Given** an active user account, **When** an administrator suspends it, **Then** that account's active session(s) end immediately and the account cannot sign in again until reactivated.
4. **Given** a suspended user account, **When** an administrator reactivates it, **Then** the account can sign in normally again.

---

### User Story 4 - Generate NFT artwork from a text description (Priority: P3)

While creating or editing an NFT listing, an administrator types a text description and receives a generated image to use as that NFT's artwork, without needing any outside design tool.

**Why this priority**: A productivity enhancement to Story 2's listing-creation flow, valuable but not a precondition for the admin area or user management to work — lowest priority of the four.

**Independent Test**: In the listing creation/edit form, enter a text description, generate an image, and confirm it appears as the listing's artwork; generate again from the exact same description and confirm the result is identical both times.

**Acceptance Scenarios**:

1. **Given** the NFT listing creation/edit form, **When** an administrator enters a text description and requests an image, **Then** a generated image appears and can be used as the listing's artwork.
2. **Given** the same text description entered twice (in the same or a different listing), **When** an image is generated each time, **Then** both generated images are identical.
3. **Given** a generation request, **When** it completes, **Then** nothing is sent to, or depends on, any real external image/AI service — generation always succeeds the same way regardless of network conditions, cost, or external availability.

---

### Edge Cases

- What happens when an administrator tries to suspend their own account, or the one fixed seed administrator account? The action is blocked with a clear explanation, so the marketplace is never left with zero administrators.
- What happens when a non-administrator's existing session is active in another tab while an administrator suspends that account? The next action that account's tab attempts is treated as signed-out and redirected to sign in, matching how an expired session is already handled elsewhere in the product.
- What happens when an administrator edits a listing's stock down below the quantity already reserved in open carts/orders? The edit is accepted for future availability; it does not retroactively break orders/carts already placed, consistent with how stock changes already behave in the existing storefront.
- What happens when an administrator requests an image generation with an empty or whitespace-only description? The request is rejected with an inline message asking for a description, rather than generating a blank or meaningless image.
- What happens when a removed (delisted) listing is reached via an old direct link from a previous session? The public storefront shows it as no longer available, rather than a broken page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST distinguish an "administrator" account type from the standard "collector" account type.
- **FR-002**: Exactly one pre-existing seed account MUST be an administrator from the start; the public sign-up flow MUST NOT be able to create an administrator account under any circumstance.
- **FR-003**: The system MUST provide an admin area reachable only by signed-in administrators.
- **FR-004**: A signed-out visitor or a signed-in non-administrator who attempts to reach any admin-area destination directly MUST be redirected away and MUST NOT see any admin screen or admin data.
- **FR-005**: Within the admin area, administrators MUST be able to create a new NFT listing with at least one edition (name, price, available stock).
- **FR-006**: Within the admin area, administrators MUST be able to edit an existing edition's price and available stock, with the change reflected in the public catalog without requiring visitors to manually refresh.
- **FR-007**: Within the admin area, administrators MUST be able to remove a listing from public visibility without deleting the historical record of any order that already references it.
- **FR-008**: Within the admin area, administrators MUST be able to search/list user accounts and view an individual account's detail.
- **FR-009**: Within the admin area, administrators MUST be able to suspend an active user account, which MUST immediately end that account's active sign-in session(s) and prevent further sign-in until reactivated.
- **FR-010**: Within the admin area, administrators MUST be able to reactivate a previously suspended account, restoring normal sign-in.
- **FR-011**: The system MUST prevent an administrator from suspending the sole remaining administrator account (including their own, if they are that account), so the marketplace is never left without an administrator.
- **FR-012**: The NFT listing creation/edit form MUST let an administrator generate artwork from a typed text description.
- **FR-013**: Generating artwork from the same text description MUST always produce the same image, every time, for any administrator.
- **FR-014**: Artwork generation MUST NOT depend on, or call out to, any real external AI/image-generation service — it MUST work fully simulated, with no external cost, API key, or network dependency on a third party.
- **FR-015**: The system MUST reject an artwork-generation request with an empty or whitespace-only description, with a clear inline message.

### Key Entities

- **Account Role**: A collector account or an administrator account. Every account has exactly one role; only the pre-existing seed administrator account starts with the administrator role.
- **Account Status**: Whether a user account is active or suspended. Suspension is reversible (reactivation) and immediately ends that account's active sessions.
- **NFT Listing / Edition**: The existing anunciado (NFT listing with one or more purchasable editions) already defined in the product's catalog; this feature adds administrator-driven creation, price/stock editing, and storefront removal (without deleting history), but does not change its existing shape.
- **Generated Artwork**: An image produced from a text description, tied to the description that produced it (same description ⇒ same image), used as a listing's artwork. Not a new persisted creative-asset library — just the artwork attached to a listing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of attempts by a non-administrator (signed out or signed in as a collector) to reach any admin-area destination directly are blocked — zero admin screens or admin data are ever exposed to a non-administrator.
- **SC-002**: An administrator can go from the Products screen to a newly created, publicly-visible listing in a single creation action (no multi-session setup required).
- **SC-003**: A price or stock edit made by an administrator is visible to a visitor already browsing the public catalog within the same real-time refresh window the catalog already guarantees elsewhere in the product (no manual reload needed).
- **SC-004**: Suspending a user account ends that account's ability to use the product within one subsequent action on their end (their very next request is treated as signed out).
- **SC-005**: Generating artwork from the same text description is 100% reproducible — repeated generations from an identical description always yield an identical result.
- **SC-006**: The complete automated verification suite (lint, typecheck, build, full end-to-end test run) passes with zero regressions introduced by this feature's changes.

## Assumptions

- Managing orders from the admin area is explicitly out of scope for this feature; the admin area covers only NFT listings/editions and user accounts.
- "Remove a listing from the storefront" means it stops appearing in public browsing/search, not that its record (or any order history referencing it) is deleted — consistent with how the product already treats other historical data (e.g., receipts).
- The administrator role is seeded once, ahead of time, rather than being something any flow in this feature creates; no "promote a collector to administrator" capability is introduced here.
- **Stack constraint (explicit)**: this feature MUST be built entirely within the project's existing required technology stack (React, TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO, Tailwind CSS, shadcn/ui, MSW, Playwright, Lighthouse). No new dependency of any kind — no AI/LLM SDK, no new image-processing library, no external service integration — may be introduced to satisfy the artwork-generation requirement (FR-012–FR-015); it must be achievable with simulated, in-product logic only.
- The artwork generator's "same description always produces the same image" requirement is satisfied by any deterministic mapping from text to image; the visual quality/style of the generated artwork is not specified beyond being usable as a listing's artwork image.
