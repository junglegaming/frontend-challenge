# Mock Backend Tasks

## Epic 1: Mock Backend Foundation

- [ ] Create the mock backend documentation structure.
- [ ] Define the shared API response types.
- [ ] Define the shared API error types.
- [ ] Define domain models.
- [ ] Configure MSW for browser development.
- [ ] Configure MSW for automated tests.
- [ ] Create a centralized mock state store.
- [ ] Create a mock state reset utility.
- [ ] Add deterministic mock data generation.
- [ ] Add environment configuration for enabling and disabling mocks.

## Epic 2: Fixtures

- [ ] Create NFT fixtures.
- [ ] Create collection fixtures.
- [ ] Create user fixtures.
- [ ] Create wallet fixtures.
- [ ] Create coupon fixtures.
- [ ] Create order fixtures.
- [ ] Create initial cart fixtures.
- [ ] Create at least two isolated user scenarios.
- [ ] Create fixtures for empty catalog responses.
- [ ] Create fixtures for sold-out NFTs.
- [ ] Create fixtures for expired coupons.
- [ ] Create fixtures for rejected payments.

## Epic 3: Authentication API

- [ ] Implement `POST /api/auth/register`.
- [ ] Implement duplicate-email validation.
- [ ] Implement password validation.
- [ ] Implement `POST /api/auth/login`.
- [ ] Implement invalid-credentials handling.
- [ ] Implement `GET /api/auth/session`.
- [ ] Implement session expiration.
- [ ] Implement `POST /api/auth/logout`.
- [ ] Persist the active session.
- [ ] Isolate sessions between users.
- [ ] Add authentication API tests.

## Epic 4: NFT API

- [ ] Implement `GET /api/nfts`.
- [ ] Implement search.
- [ ] Implement collection filtering.
- [ ] Implement minimum-price filtering.
- [ ] Implement maximum-price filtering.
- [ ] Implement sorting.
- [ ] Implement pagination.
- [ ] Implement `GET /api/nfts/:nftId`.
- [ ] Implement not-found responses.
- [ ] Add catalog API tests.
- [ ] Add deterministic response ordering.

## Epic 5: Favorites API

- [ ] Implement `GET /api/favorites`.
- [ ] Implement `POST /api/favorites/:nftId`.
- [ ] Implement `DELETE /api/favorites/:nftId`.
- [ ] Enforce authentication.
- [ ] Isolate favorites by user.
- [ ] Handle duplicate favorite requests.
- [ ] Add favorites API tests.

## Epic 6: Cart API

- [ ] Implement anonymous cart identification.
- [ ] Implement `GET /api/cart`.
- [ ] Implement `POST /api/cart/items`.
- [ ] Implement `PATCH /api/cart/items/:nftId`.
- [ ] Implement `DELETE /api/cart/items/:nftId`.
- [ ] Validate integer quantities.
- [ ] Validate maximum quantity per NFT.
- [ ] Validate NFT availability.
- [ ] Persist the cart.
- [ ] Implement anonymous-to-authenticated cart merge.
- [ ] Define duplicate-item merge behavior.
- [ ] Add cart API tests.

## Epic 7: Coupons and Quotes

- [ ] Implement `POST /api/cart/quote`.
- [ ] Validate coupon codes.
- [ ] Handle expired coupons.
- [ ] Calculate percentage discounts.
- [ ] Calculate fixed discounts.
- [ ] Calculate network fees.
- [ ] Preserve ETH precision.
- [ ] Include NFT versions in the quote.
- [ ] Add quote expiration.
- [ ] Detect price changes.
- [ ] Detect availability changes.
- [ ] Add quote API tests.

## Epic 8: Orders and Idempotency

- [ ] Implement `POST /api/orders`.
- [ ] Require the `Idempotency-Key` header.
- [ ] Store idempotency keys.
- [ ] Return the original order for repeated requests.
- [ ] Return a conflict for payload mismatches.
- [ ] Simulate order timeouts.
- [ ] Implement `GET /api/orders/:orderId`.
- [ ] Implement receipt retrieval.
- [ ] Preserve immutable order snapshots.
- [ ] Remove only successfully purchased cart items.
- [ ] Preserve cart items after a failed order.
- [ ] Add order API tests.
- [ ] Add duplicate-submission tests.

## Epic 9: Profile API

- [ ] Implement `GET /api/profile`.
- [ ] Implement `PATCH /api/profile`.
- [ ] Implement avatar updates.
- [ ] Implement password changes.
- [ ] Validate profile fields.
- [ ] Handle session expiration.
- [ ] Persist profile changes.
- [ ] Add profile API tests.

## Epic 10: Wallet API

- [ ] Implement `GET /api/wallets`.
- [ ] Implement `POST /api/wallets`.
- [ ] Implement `PATCH /api/wallets/:walletId`.
- [ ] Validate wallet addresses.
- [ ] Validate supported networks.
- [ ] Enforce one primary wallet.
- [ ] Support secondary wallets.
- [ ] Persist wallet changes.
- [ ] Add wallet API tests.

## Epic 11: Real-time Events

- [ ] Configure the Socket.IO client.
- [ ] Configure the mock Socket.IO server or binding.
- [ ] Implement `nft.updated`.
- [ ] Implement `order.updated`.
- [ ] Add version numbers to event payloads.
- [ ] Simulate NFT price updates.
- [ ] Simulate NFT availability updates.
- [ ] Simulate pending orders.
- [ ] Simulate confirmed orders.
- [ ] Simulate rejected orders.
- [ ] Simulate duplicate events.
- [ ] Simulate outdated events.
- [ ] Simulate disconnects.
- [ ] Simulate reconnects.
- [ ] Implement REST reconciliation after reconnect.
- [ ] Test listener cleanup.
- [ ] Test user-session isolation.

## Epic 12: Failure Scenarios

- [ ] Add configurable response latency.
- [ ] Add slow-request scenarios.
- [ ] Add timeout scenarios.
- [ ] Add network-failure scenarios.
- [ ] Add HTTP 400 scenarios.
- [ ] Add HTTP 401 scenarios.
- [ ] Add HTTP 403 scenarios.
- [ ] Add HTTP 404 scenarios.
- [ ] Add HTTP 409 scenarios.
- [ ] Add HTTP 500 scenarios.
- [ ] Add session-expiration scenarios.
- [ ] Add payment-rejection scenarios.
- [ ] Add out-of-order response scenarios.

## Epic 13: Test Utilities

- [ ] Create a mock-state reset utility.
- [ ] Create an authenticated test user helper.
- [ ] Create an anonymous-session helper.
- [ ] Create a cart setup helper.
- [ ] Create an order setup helper.
- [ ] Create a Socket.IO event emitter helper.
- [ ] Create deterministic time utilities.
- [ ] Create API handler test utilities.
- [ ] Document how to select failure scenarios.

## Epic 14: Integration with the Frontend

- [ ] Create Axios API client configuration.
- [ ] Create authentication service.
- [ ] Create NFT service.
- [ ] Create favorites service.
- [ ] Create cart service.
- [ ] Create quote service.
- [ ] Create order service.
- [ ] Create profile service.
- [ ] Create wallet service.
- [ ] Create typed TanStack Query hooks.
- [ ] Define query keys.
- [ ] Define mutation invalidation rules.
- [ ] Define optimistic update behavior.
- [ ] Clear private cache on logout.
- [ ] Cancel user-specific requests on logout.

## Epic 15: Validation

- [ ] Validate all REST endpoints against their contracts.
- [ ] Validate all API error responses.
- [ ] Validate user isolation.
- [ ] Validate cart persistence.
- [ ] Validate order idempotency.
- [ ] Validate immutable receipts.
- [ ] Validate Socket.IO event ordering.
- [ ] Validate reconnection behavior.
- [ ] Validate reset behavior.
- [ ] Run Playwright tests with MSW enabled.
- [ ] Document the mock backend architecture.
