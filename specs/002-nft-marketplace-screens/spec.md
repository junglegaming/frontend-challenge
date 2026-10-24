# Feature Specification: NFT Marketplace Screens (Mobile + Desktop)

**Feature Branch**: `002-nft-marketplace-screens`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Implementar as telas restantes do marketplace de NFTs (mobile + desktop) com base nos designs em \"C:\Users\User\Downloads\Frontend Challenge\Mobile\" e \"C:\Users\User\Downloads\Frontend Challenge\Desktop\": Login, Cadastro, Início (home), Detalhes do NFT, Carrinho de NFTs, Pagamento, Confirmação de Pedido, Carteiras, Perfil do Colecionador. Algumas telas (Detalhes do NFT, Perfil do Colecionador) já existem no código; o foco são as telas ainda não implementadas e garantir paridade mobile/desktop responsiva."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover NFTs on the home/catalog screen (Priority: P1)

A visitor lands on the marketplace home page and can immediately browse a curated hero banner, filter the catalog by collection, price range and network, search and sort listings, and page through results — on both desktop (sidebar filters) and mobile (search bar + filter trigger, stacked grid).

**Why this priority**: This is the marketplace's front door. Without it, no other screen (cart, checkout, NFT detail) can be reached organically, so it is the baseline for any usable increment.

**Independent Test**: Load `/` with no prior session; confirm hero, collection facets, price-range filter, network facet, sort control and pagination are visible and change the listed NFTs; confirm the same capabilities are reachable on a 390px viewport via the bottom dock and filter/search affordances.

**Acceptance Scenarios**:

1. **Given** a visitor on the home page, **When** they select a collection facet (e.g. "Arte digital") or set a price range and apply it, **Then** the NFT grid updates to only the matching listings and the pagination resets to page 1.
2. **Given** a visitor on the home page, **When** they choose a sort option (e.g. "Novos lançamentos" / "Em alta"), **Then** the grid order changes accordingly without a full page reload.
3. **Given** the same catalog state, **When** viewed at a 390px mobile width, **Then** the sidebar filters are reachable through the mobile search/filter control and the grid reflows to the mobile column layout, with the bottom dock providing navigation to home/favorites/cart/account.
4. **Given** a listed NFT's price or availability changes while the page is open, **Then** the affected card reflects the new price/availability without the user needing to refresh (per the existing catalog realtime sync).

---

### User Story 2 - Authenticate via Login / Cadastro (Priority: P1)

A visitor opens the shared "Entrar | Criar conta" dialog (from the navbar "Entrar" action or when redirected from a protected route) to sign in with email/password or a social provider, or switch to the "Criar conta" tab to register a new account, while the marketplace page stays visible behind the dialog.

**Why this priority**: Authentication gates checkout, wallets and profile management, so it must exist before those flows can be exercised end-to-end.

**Independent Test**: From any page, trigger the auth dialog, submit valid login credentials and confirm the dialog closes with an authenticated session reflected in the navbar; separately, switch to "Criar conta", submit a new account and confirm the same outcome.

**Acceptance Scenarios**:

1. **Given** the auth dialog is open on the "Entrar" tab, **When** the user submits a registered email and correct password, **Then** the session is established, the dialog closes, and the user returns to the page/route they were on (honoring a `redirect` search param when present).
2. **Given** the auth dialog is open on the "Entrar" tab, **When** the user submits an incorrect password, **Then** an inline error is shown and the session is not created.
3. **Given** the auth dialog is open on the "Criar conta" tab, **When** the user submits username, email, password and matching confirmation, **Then** an account is created and the user is signed in.
4. **Given** the "Criar conta" tab, **When** the submitted email is already registered, **Then** an inline conflict error is shown and no duplicate account is created.
5. **Given** a signed-out visitor navigates directly to a protected route (e.g. checkout, wallets), **When** the route resolves, **Then** the auth dialog/login flow is presented with a `redirect` back to the originally requested route.
6. **Given** the dialog is open on a 390px viewport, **When** rendered, **Then** it occupies the mobile layout (full-width sheet/dialog) while preserving the same fields and tab switch as desktop.

---

### User Story 3 - Manage the NFT cart (Priority: P2)

An authenticated or guest visitor who has added NFTs to the cart reviews the "Carrinho de NFTs" page: adjusting edition quantities per line item, removing lines, applying a promo code, seeing a live subtotal/discount/network-fee/total summary, and proceeding toward checkout.

**Why this priority**: The cart is the pivot between browsing and purchasing; it must work before checkout/payment can be meaningfully tested, but it depends on User Story 1 to have items to add.

**Independent Test**: Seed the cart (via "add to cart" from the catalog or NFT detail page) with at least one NFT, open `/cart`, change a line item's edition quantity and confirm the line and summary totals recompute; apply a valid promo code and confirm the discount line updates; remove all lines and confirm the empty-cart state.

**Acceptance Scenarios**:

1. **Given** a cart with one or more NFT lines, **When** the user increments/decrements a line's edition quantity, **Then** that line's subtotal and the cart-wide subtotal/total update immediately.
2. **Given** a cart with at least one line, **When** the user removes a line, **Then** it disappears from the list and totals recompute; if it was the last line, an empty-cart state is shown instead of the summary panel.
3. **Given** a valid promo code, **When** applied, **Then** the "Desconto do lançamento" line reflects the discount and the total updates; an invalid code shows an inline error and leaves totals unchanged.
4. **Given** a non-empty cart, **When** the user selects "Conectar e finalizar", **Then** they are routed into the checkout/payment flow (via login first if not authenticated).
5. **Given** the same cart state at 390px width, **When** rendered, **Then** line items, quantity steppers and the wallet summary panel stack vertically while remaining fully operable.

---

### User Story 4 - Complete checkout / Pagamento (Priority: P2)

An authenticated collector with a non-empty cart fills in their collector profile and wallet details (or selects a previously saved wallet/connection method), reviews the order summary, chooses a wallet/network connection option, and confirms the purchase.

**Why this priority**: This is the monetization step of the marketplace; it depends on User Story 3 (a populated cart) and typically User Story 2 (an authenticated collector), so it is sequenced after both.

**Independent Test**: With an authenticated session and a non-empty cart, open `/checkout`, fill all required collector-profile and wallet fields (display name, username, network, wallet address, wallet type, email, ENS name, referral code), select a wallet/connection option, submit "Confirmar compra", and confirm the flow proceeds to order confirmation.

**Acceptance Scenarios**:

1. **Given** the checkout page with the order summary populated from the cart, **When** a required field (e.g. wallet address, e-mail) is left empty, **Then** the form blocks submission and surfaces a field-level validation message.
2. **Given** all required fields are valid, **When** the user selects a wallet/network connection option and submits "Confirmar compra", **Then** the cart's quote is revalidated before the purchase is confirmed, using an idempotency key per attempt so retries do not duplicate the order.
3. **Given** a submission that times out or fails transiently, **When** the user retries, **Then** the previously-submitted order is recovered/resumed rather than creating a duplicate order.
4. **Given** the "Usar outra carteira?" option is selected, **When** toggled, **Then** the form exposes the alternate-wallet fields needed to complete checkout with a different wallet.
5. **Given** the same checkout state at 390px width, **When** rendered, **Then** the collector-profile form and the order summary/wallet-selection panel stack vertically in a single column while all fields remain reachable and submittable.

---

### User Story 5 - View order confirmation (Priority: P2)

After a successful purchase, the collector sees a confirmation view summarizing the completed order: transaction id, date, total, wallet used, the purchased line items with per-line editions/subtotal, network fee, grand total, and a link to view the transaction on a block explorer.

**Why this priority**: It closes the purchase loop started in User Story 4 and is required to validate that a purchase actually completed, but has no standalone value without a completed checkout.

**Independent Test**: Complete a checkout from User Story 4 and confirm `/orders/$orderId` renders the transaction id, date, total, wallet, itemized lines and an outbound "Ver no Etherscan" (or equivalent) link; directly request an order that is still pending or was declined and confirm the corresponding pending/declined state is shown instead of a confirmed receipt.

**Acceptance Scenarios**:

1. **Given** an order that has settled as confirmed, **When** the confirmation view loads, **Then** it shows the receipt (transaction id, date, total, wallet, line items with editions and subtotals, network fee, total) and a working link to the block explorer.
2. **Given** an order that is still pending, **When** the confirmation view loads, **Then** a pending state is shown instead of the receipt, with no explorer link implying false completion.
3. **Given** an order that was declined, **When** the confirmation view loads, **Then** a declined/failed state is shown with no receipt rendered.
4. **Given** the confirmed-order view at 390px width, **When** rendered, **Then** the receipt content remains fully readable and the dialog/sheet fits the mobile viewport without horizontal scrolling.

---

### User Story 6 - Manage wallets in the account area (Priority: P3)

A signed-in collector, from the account section (alongside the existing "Dados do perfil" area), manages their primary wallet (display name, nickname, network, wallet address, wallet type, e-mail, ENS name, referral code) and can add/edit a secondary wallet, optionally marking it "Igual à carteira principal".

**Why this priority**: Wallet management supports checkout convenience (reusing saved wallets) but is not required to complete a first purchase, so it is the lowest-priority increment.

**Independent Test**: As an authenticated user, open the account "Carteiras" section, fill and save the primary-wallet form, confirm the saved values persist on reload, then add a secondary wallet and confirm it appears as a distinct entry.

**Acceptance Scenarios**:

1. **Given** the Carteiras screen with no primary wallet saved, **When** the user fills all required fields and selects "Salvar carteira", **Then** the wallet is persisted and reflected on next visit to the screen.
2. **Given** a saved primary wallet, **When** the user edits a field and saves again, **Then** the update replaces the previous value without creating a duplicate wallet entry.
3. **Given** no secondary wallet exists yet, **When** the user selects "Adicionar" under "Carteira secundária", **Then** a secondary-wallet form appears, reusing the same field set as the primary wallet.
4. **Given** the secondary-wallet form, **When** the user marks "Igual à carteira principal", **Then** the secondary wallet is populated from (or linked to) the primary wallet's values instead of requiring re-entry.
5. **Given** the Carteiras screen at 390px width, **When** rendered, **Then** the account side-navigation and the wallet form both remain usable (e.g. via the same collapsible pattern already used by the existing profile screen).

---

### Edge Cases

- What happens when a visitor tries to check out with an empty cart (e.g. by direct URL navigation to `/checkout`)? The system should redirect back to the cart/catalog instead of showing a blank or broken payment form.
- How does the system handle a catalog filter combination that matches zero NFTs? An explicit empty-results state must be shown instead of an empty grid.
- How does the system handle losing network connectivity mid-checkout after the summary was revalidated but before "Confirmar compra" completes? The idempotency key must allow a safe retry without double-charging/double-creating the order.
- What happens if a user edits an NFT's edition quantity in the cart above the editions actually available? The quantity must be clamped and an inline message shown.
- How does signup handle a password/confirmation mismatch? Inline validation must block submission before any request is sent.
- What happens when a signed-in user without any saved wallet reaches checkout? Checkout must still allow entering wallet details inline rather than requiring a prior visit to Carteiras.
- How does the order-confirmation screen behave if the `orderId` does not exist or does not belong to the current user? A not-found/forbidden state must be shown instead of partial or another user's data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render a home/catalog screen at the root route showing a hero section, a collection/price/network filter panel, search, sort control, an NFT grid and pagination, matching the structure and content shown in the `Início.png` reference designs (desktop and mobile), bounded by the Assumptions' note that minor spacing, font-rendering or placeholder-asset differences from the reference designs are acceptable and not in-scope visual defects.
- **FR-002**: The system MUST let users combine collection, price-range and network filters, search text, and a sort order, updating the listed NFTs and resetting pagination to the first page whenever a filter changes.
- **FR-003**: The system MUST reflect catalog price/availability changes received in real time on already-rendered NFT cards without requiring a manual refresh.
- **FR-004**: The system MUST provide a single shared authentication dialog with an "Entrar" tab and a "Criar conta" tab, reachable from the navbar "Entrar" action and from any protected route a signed-out user attempts to reach.
- **FR-005**: The system MUST authenticate users by email and password on the "Entrar" tab, support "Esqueceu a senha?" as an entry point into password recovery, and support "Continuar com Google" / "Continuar com Facebook" as alternative sign-in actions.
- **FR-006**: The system MUST register new accounts on the "Criar conta" tab from username, e-mail, password and password confirmation, rejecting mismatched password confirmations and already-registered e-mails with inline, field-level errors.
- **FR-007**: The system MUST preserve and honor a `redirect` search parameter across the login/signup flow so users return to the route they originally requested after authenticating.
- **FR-008**: The system MUST merge a visitor's guest cart into their account cart when they authenticate.
- **FR-009**: The system MUST render a cart screen listing each NFT line with its image, name, token id, unit price, an edition quantity stepper, and a computed line subtotal, matching `Carrinho de NFTs.png`.
- **FR-010**: The system MUST recompute the cart's subtotal, launch discount, network fee and total whenever a line's quantity changes, a line is removed, or a promo code is applied/removed, and MUST show an explicit empty-cart state when no lines remain.
- **FR-011**: The system MUST validate a promo code before applying its discount, leaving totals unchanged and showing an inline error for an invalid code.
- **FR-012**: The system MUST require authentication before entering checkout from the cart's "Conectar e finalizar" action, and MUST prevent reaching checkout with an empty cart, redirecting back to `/cart` in that case.
- **FR-013**: The system MUST render a checkout/payment screen collecting collector-profile fields (display name, username, network, wallet address, secondary wallet/ENS, wallet type, referral code, e-mail, ENS name) and an order summary (line items, subtotal, discount, network fee, total) with a wallet/connection method selector, matching `Pagamento.png`.
- **FR-014**: The system MUST block checkout submission while any required field is invalid or empty, surfacing field-level validation messages.
- **FR-015**: The system MUST revalidate the cart's price quote immediately before confirming a purchase, and MUST use a per-attempt idempotency key — scoped to the cart's current quote signature, not the checkout session generally, per `research.md` D4 — so a retried submission after a timeout/failure resumes or recovers the original order instead of creating a duplicate.
- **FR-016**: The system MUST support an alternate-wallet entry path ("Usar outra carteira?") within checkout.
- **FR-017**: The system MUST render an order-confirmation screen for a confirmed order showing transaction id, date, total, wallet used, itemized line items (with editions and subtotal), network fee, grand total and an outbound link to view the transaction on a block explorer, matching `Confirmação de Pedido.png`.
- **FR-018**: The system MUST render distinct pending and declined states on the order-confirmation screen when the order has not settled as confirmed, each withholding the confirmed receipt content.
- **FR-019**: The system MUST render a Carteiras screen within the existing account area (reusing the same account side-navigation as the Perfil do Colecionador screen) for managing a primary wallet (display name, nickname, network, wallet address, wallet type, e-mail, ENS name, referral code) and an optional secondary wallet, matching `Carteiras.png`.
- **FR-020**: The system MUST let a secondary wallet be marked "Igual à carteira principal" to reuse the primary wallet's values instead of requiring independent re-entry; this copies a snapshot of the primary wallet's values at creation time, not a live link to later edits of the primary wallet.
- **FR-021**: The system MUST persist wallet changes so that saved primary/secondary wallet values are shown on a subsequent visit to the Carteiras screen.
- **FR-022**: Every screen in this feature (home, auth dialog, cart, checkout, order confirmation, wallets) MUST provide full functional parity between the desktop (≥1440px) and mobile (~390px) breakpoints shown in the reference designs, including the mobile bottom-dock navigation and any filter/search affordances that replace sidebar content on small viewports. Different visual treatments per breakpoint (e.g. sidebar vs. sheet, dialog vs. full-width sheet) are explicitly allowed as long as the underlying functionality is equivalent — parity requires equivalent capability, not visual identity.
- **FR-023**: The system MUST show a not-found/forbidden state on the order-confirmation screen when the requested order does not exist or does not belong to the signed-in user.

### Key Entities

- **Collector (User)**: A marketplace account with display name, username, e-mail, authentication credentials, and an optional profile already covered by the existing Perfil do Colecionador screen.
- **NFT Listing**: A catalog item with name, token id, image, price (and optional "before discount" price), collection/category, network, rarity flag and availability, already covered by the existing Detalhes do NFT screen; consumed read-only by the screens in this feature.
- **Cart**: A collection of cart lines for a guest or authenticated owner, each line referencing an NFT listing, an edition quantity and a computed subtotal; the cart as a whole carries an optional promo code, subtotal, discount, network fee and total.
- **Coupon**: A promo code with a validity state and a discount effect applied to a cart's total.
- **Order / Transaction**: A purchase created from a cart at checkout time, with a status (pending, confirmed, declined), transaction id, date, wallet used, itemized line items (carried over from the cart) and network fee/total.
- **Wallet**: A collector's saved wallet entry (primary or secondary) with display name, nickname, network, address, wallet type, e-mail, ENS name and referral code.

**Note**: FR-013 and FR-019 list "nome de usuário"/"username" and "código de indicação"/"referral code" among the checkout/wallet fields; these do not add attributes to `Wallet` or `Order`. Per `research.md` D2/D3, "username" and "ENS name" are read from the existing `Profile` entity (`username`, `ensName`/`ensTld`), and "referral code" is a visual-only field not persisted by any contract in this iteration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can go from landing on the home page to having an NFT in their cart in 3 actions or fewer (browse/filter, open NFT, add to cart).
  _Traceable to: FR-001, FR-002._
- **SC-002**: A new visitor can create an account via "Criar conta" and reach an authenticated state in under 2 minutes.
  _Traceable to: FR-004, FR-006._
- **SC-003**: An authenticated collector with items already in the cart can complete checkout (profile + wallet + confirmation) in under 5 minutes on a first attempt.
  _Traceable to: FR-012, FR-013, FR-014, FR-015._
- **SC-004**: All 7 screens in scope (home, login/signup dialog, cart, checkout, order confirmation, wallets, plus the responsive variants of each) render with equivalent functionality at both the 1440px desktop and 390px mobile reference breakpoints, with zero features available on desktop but missing on mobile.
  _Traceable to: FR-022._
- **SC-005**: Cart and checkout totals (subtotal, discount, network fee, total) update within 1 second of any quantity, promo-code or line-removal change, with no full-page reload.
  _Traceable to: FR-010, FR-015._
- **SC-006**: At least 90% of invalid submissions (bad promo code, duplicate e-mail, incomplete checkout form) are resolved by the user on their next attempt using only the inline error messaging shown, without needing external help.
  _Traceable to: FR-006, FR-011, FR-014._
- **SC-007**: Zero duplicate orders are created when a checkout submission is retried after a timeout or transient failure.
  _Traceable to: FR-015._

## Assumptions

- The mock REST/Socket.IO backend already implemented under `src/mocks` (auth, cart, catalog, favorites, orders, profile, wallets contexts) is considered feature-complete for this scope; this feature is frontend UI work against those existing contracts, not new backend design.
- "Login" and "Cadastro" are a single shared dialog component with an "Entrar" / "Criar conta" tab switch (per the reference designs), opened over the current background route, rather than two separate full-page routes — even though the existing `src/pages/login` and `src/pages/signup` scaffolding is organized as if they were independent routes.
- "Checkout" and "Pagamento" refer to the same screen (the existing `src/pages/checkout` scaffold); its route is protected, so only authenticated collectors with a non-empty cart can complete it.
- The top-level navbar items "Mercado", "Criadores" and "Aprenda" are existing/placeholder navigation links outside this feature's scope — no reference designs were provided for dedicated screens behind them, so they are not built as part of this feature.
- "Esqueceu a senha?" only needs to be a reachable entry point from the auth dialog in this scope; the full password-recovery screen is out of scope unless reference designs for it are provided later.
- Wallet connection and transaction confirmation are simulated against the existing mock backend (no real blockchain/wallet-provider integration is required).
- Visual fidelity targets the structure, content and interactions of the provided PNG reference designs; minor spacing, font-rendering or placeholder-asset differences from the exported mockups are acceptable as long as layout, content and behavior match.
- Already-built shared UI (shadcn/ui-based `src/shared/ui/*`, `Navbar`, `Dock`, account `ProfileSidebar`/side-menu) is reused across these screens rather than rebuilt per screen.
- Detalhes do NFT and Perfil do Colecionador are already implemented and are out of scope for new work in this feature; they are referenced only as integration points (e.g. "add to cart" from NFT detail, shared account navigation with wallets).

## Traceability

| User Story | Functional Requirements |
|---|---|
| US1 — Discover NFTs on the home/catalog screen | FR-001, FR-002, FR-003 |
| US2 — Authenticate via Login / Cadastro | FR-004, FR-005, FR-006, FR-007, FR-008 |
| US3 — Manage the NFT cart | FR-009, FR-010, FR-011, FR-012 |
| US4 — Complete checkout / Pagamento | FR-012, FR-013, FR-014, FR-015, FR-016 |
| US5 — View order confirmation | FR-017, FR-018, FR-023 |
| US6 — Manage wallets in the account area | FR-019, FR-020, FR-021 |
| (cross-cutting, all stories) | FR-022 |

For example, US4 Acceptance Scenario 3's "retry doesn't duplicate the order" is satisfied by FR-015.
