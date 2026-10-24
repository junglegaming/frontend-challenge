# Feature Specification: Platform Coins

**Feature Branch**: `006-platform-coins`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "cria o back-end e deixa organizado monorepo" (build the backend for the platform-coins feature already agreed with the user, and keep the repository cleanly organized as the frontend and the new backend coexist). Builds on decisions already made earlier in this working session and now ratified in the project constitution (v1.1.0, "Exceção Pontual: Backend Real de Moedas da Plataforma"): a platform-native "coins" currency, usable alongside the existing wallet/ETH checkout flow, backed by a real (not simulated) backend service.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Top up a coin balance (Priority: P1)

A signed-in collector adds coins to their platform balance through a simple, self-service top-up action, and immediately sees their new balance.

**Why this priority**: Nothing else in this feature is reachable without a balance to spend — this is the foundational capability, and independently valuable/testable on its own (a collector can top up and see their balance even before ever using it to buy an NFT).

**Independent Test**: As a signed-in collector with zero or low balance, perform a top-up, and confirm the displayed balance increases by exactly the topped-up amount, with no other side effects.

**Acceptance Scenarios**:

1. **Given** a signed-in collector viewing their coin balance, **When** they top up a specific amount, **Then** their balance increases by that amount and the new balance is shown immediately, without needing a page refresh.
2. **Given** a collector who has topped up before, **When** they view their balance again later (e.g., after signing out and back in, or after a page refresh), **Then** the balance reflects all of their past top-ups accurately.
3. **Given** the top-up action, **When** a collector performs it, **Then** no real payment information (card numbers, bank details, etc.) is ever requested — the top-up is clearly a simulated/self-service action.

---

### User Story 2 - Pay for a purchase with coins (Priority: P2)

At checkout, a signed-in collector with enough coin balance chooses to pay with coins instead of a connected wallet, and completes the purchase the same way they would with the existing wallet/ETH flow.

**Why this priority**: This is the actual purpose of having a balance (User Story 1) — delivering real value — but it depends on US1 existing first, so it's the next priority rather than the first.

**Independent Test**: With a collector who already has a sufficient coin balance (from US1) and items in their cart, go through checkout choosing "pay with coins," and confirm the order completes and the coin balance decreases by the expected amount.

**Acceptance Scenarios**:

1. **Given** a collector at checkout with a coin balance large enough to cover the order total, **When** they choose to pay with coins and confirm, **Then** the order completes exactly as a wallet-paid order would (same confirmation experience), and their coin balance decreases by the order's coin-equivalent amount.
2. **Given** a collector at checkout, **When** they view the payment options, **Then** paying with a connected wallet (the existing flow) remains available and unchanged — coins are an additional choice, not a replacement.
3. **Given** a collector whose coin balance is lower than the order's coin-equivalent amount, **When** they attempt to pay with coins, **Then** the attempt is rejected with a clear message before anything is charged, and they are not left with a partially-completed purchase.
4. **Given** a collector who successfully pays with coins, **When** the purchase is confirmed, **Then** their coin balance correctly decreased exactly once — a repeated click or a retry MUST NOT decrease it a second time for the same order.

---

### Edge Cases

- What happens when a coins payment is accepted (balance debited) but the order itself then fails to complete for an unrelated reason? The debited coins MUST be returned to the collector's balance, so they are never left having paid for nothing.
- What happens when the collector's coin balance is exactly equal to the order's coin-equivalent amount (no more, no less)? The payment MUST succeed — "insufficient" means strictly less than required, not less-or-equal.
- What happens when a collector who has never topped up attempts to pay with coins? The attempt MUST be rejected the same way as any other insufficient-balance case (their balance starts at zero, not undefined/erroring).
- What happens when the backend that holds the coin balance is temporarily unreachable? The top-up or pay-with-coins action MUST fail clearly (visible error, no silent success) rather than pretending to succeed — this is an accepted limitation of this feature (see Assumptions), not a case the system needs to gracefully degrade around.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let a signed-in collector view their current coin balance.
- **FR-002**: The system MUST let a signed-in collector top up (increase) their coin balance via a simple, self-service action that requires no real payment information.
- **FR-003**: A top-up MUST be reflected in the displayed balance immediately, without requiring a manual page refresh.
- **FR-004**: The coin balance MUST persist for a collector across sessions (e.g., still correct after signing out and back in, or after a browser restart), not just for the current page load.
- **FR-005**: At checkout, the system MUST offer paying with the coin balance as an alternative to the existing connected-wallet/ETH payment method, without removing or changing the existing method.
- **FR-006**: The system MUST convert an order's total to a coin-equivalent amount using one fixed, consistent conversion rate, applied the same way for every purchase.
- **FR-007**: The system MUST reject a pay-with-coins attempt when the collector's balance is strictly less than the order's coin-equivalent amount, with a clear message, before any balance change or order creation happens.
- **FR-008**: A successful pay-with-coins purchase MUST decrease the collector's balance by exactly the order's coin-equivalent amount, exactly once per completed order, even if the confirmation action is retried.
- **FR-009**: If coins are deducted for a purchase that ultimately does not complete, the system MUST return the deducted coins to the collector's balance.
- **FR-010**: A purchase completed with coins MUST reach the same order-confirmation experience (receipt, transaction reference, etc.) as a purchase completed with a connected wallet.

### Key Entities

- **Coin Balance**: A collector's current platform-coin total. Exactly one per collector account; never negative.
- **Coin Transaction**: A single change to a balance — a top-up (increase) or a purchase-related debit/refund (decrease/reversal) — each tied to the collector it belongs to, with enough information to explain why the balance changed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A collector can go from any starting balance to "enough coins for a specific purchase" in a single top-up action.
- **SC-002**: 100% of completed coin-paid purchases show the same confirmation experience (receipt quality/content) as a wallet-paid purchase.
- **SC-003**: Balance changes (top-ups and purchases) are reflected correctly 100% of the time after a page refresh or a new sign-in, with no discrepancy between what was topped up/spent and what is displayed.
- **SC-004**: 100% of pay-with-coins attempts with insufficient balance are rejected with no balance change and no order created.
- **SC-005**: Zero instances, across repeated/retried confirmation clicks, of a single completed order debiting the coin balance more than once.
- **SC-006**: The complete automated verification suite (lint, typecheck, build, full existing Playwright run) passes with zero regressions introduced by this feature's changes.

## Assumptions

- **Real backend, not simulated (explicit, constitution-ratified exception)**: unlike every other part of this product, the coin balance and its transaction history are backed by a genuinely persistent, real backend service (per the project constitution's v1.1.0 amendment, "Exceção Pontual: Backend Real de Moedas da Plataforma"), not by the mocked network layer that governs the rest of the app. This is a deliberate, documented departure from how the rest of the product works, not an oversight.
- **No real payment gateway**: top-up is entirely self-service and simulated — no real money, card, or bank integration is introduced, consistent with the product's existing stance on simulated payments elsewhere.
- **Fixed exchange rate**: the ETH-to-coins conversion used to price a purchase in coins is a single fixed constant for this feature, not a fluctuating market rate; changing that rate later is out of scope here.
- **Self-service only, no admin involvement**: coins are acquired exclusively via the collector's own top-up action in this feature; an administrator granting or adjusting a collector's balance is out of scope.
- **Identity bridging is a known, accepted simplification**: because this product has no real authentication anywhere (login/session are simulated), the real coins backend identifies a collector by the id their (simulated) session already uses, trusting it rather than independently verifying it. This is acceptable only because no real money or sensitive data is involved, and must remain visibly documented as a limitation, not hidden.
- **Existing automated test suite stays on the simulated layer**: the project's existing Playwright suite continues to run entirely against the existing mocked network layer; verifying the real coins backend needs its own, separate verification approach (see Assumptions above on why this backend is exceptional).
- **Repository organization**: the real backend lives in its own clearly-separated location within this same repository (not a separate repository, and not a heavyweight monorepo tool migration) — "organized monorepo" here means a clean, simple separation between the existing frontend and the new backend's own code/dependencies, not adopting new workspace tooling.
