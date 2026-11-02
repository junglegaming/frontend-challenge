# NFT Marketplace Mock Backend Foundation - Analysis

## 1. Implementation Completeness & Interdependencies

### Files to Create & Ordering

| Order | File | Purpose | Dependencies |
|-------|------|---------|-------------|
| 1 | `src/shared/api/api-types.ts` | Core type definitions (request/response models, API contracts) | Foundation for all other files |
| 2 | `src/shared/api/api-error.ts` | Shared error types and handling | Depends on api-types |
| 3 | `src/shared/api/http-client.ts` | Axios client configuration with interceptors | Depends on api-types, api-error |
| 4 | `src/mocks/state/mock-state.ts` | Centralized mock state store | Depends on api-types |
| 5 | `src/mocks/fixtures/index.ts` | Mock data fixtures (NFTs, users, cart, etc.) | Depends on api-types |
| 6 | `src/mocks/handlers/index.ts` | MSW request handlers | Depends on api-types, fixtures, mock-state |
| 7 | `src/mocks/server.ts` | MSW server (browser/ test config) | Depends on handlers |
| 8 | `src/mocks/browser.ts` | Browser entry point for MSW activation | Depends on server |

### Critical Interdependencies

- **api-types.ts** is the single source of type contracts - everything else imports from it
- **mock-state.ts** maintains shared state consistency across catalog, favorites, cart, profile, wallets, orders
- **fixtures/index.ts** provides deterministic data; must export types compatible with api-types
- **handlers/index.ts** MSW handlers consume fixtures and mock-state to return realistic responses
- **server.ts** and **browser.ts** are entry points; server.ts can be reused in test environment
- **http-client.ts** must be configured before components use Axios; interceptors handle mock toggling

### Key Architecture

```
src/shared/api/
  api-types.ts    ← type contracts
  api-error.ts    ← error models
  http-client.ts  ← Axios config + mock toggling

src/mocks/
  state/mock-state.ts   ← central state store
  fixtures/index.ts     ← deterministic data
  handlers/index.ts     ← MSW request handlers
  server.ts             ← MSW server (browser/test)
  browser.ts            ← browser entry point
```

## 2. Testing Strategy

### Approach

| Test Type | Scope | MSW Integration |
|-----------|-------|-----------------|
| **Unit tests** | Individual handlers, fixture generators, state mutations | MSW server mocking |
| **Integration tests** | End-to-end API workflows (auth → NFTs → cart → orders) | MSW browser tests |
| **E2E tests (Playwright)** | Full user flows with mocks | MSW enabled via `setupTestMSW` |

### Mock State Reset Utility

- **Purpose**: Reset mock state to a known deterministic scenario
- **Test coverage**: Test each scenario reset (empty catalog, user A, user B, cart populated, etc.)
- **Implementation**: Function that reinitializes `mock-state.ts` state and persists to localStorage if enabled

### Coverage Goals

| Metric | Target |
|--------|--------|
| Line coverage | ≥ 80% |
| Handler coverage | 100% of MSW routes |
| Fixture scenarios | All Epics 2-13 scenarios |
| E2E test coverage | All 12 Playwright test categories from README §10 |

## 3. Documentation Needs

### Architectural Decisions to Document

1. **MSW browser vs test server configuration** - when each is used
2. **Mock state persistence strategy** - localStorage vs in-memory vs reset utility
3. **Axios interceptor mock toggling** - how mocks are enabled/disabled per environment
4. **Socket.IO integration** - @mswjs/socket.io-binding usage and limitations
5. **User session isolation** - how sessions are partitioned between test users

### API Contracts to Document

- `POST /api/auth/register` - validation, duplicate email
- `POST /api/auth/login` / `GET /api/auth/session` - auth flows
- `GET /api/nfts` / `GET /api/nfts/:id` - catalog with filters/pagination
- `GET/POST/DELETE /api/favorites` - favorites management
- `GET/POST/PATCH/DELETE /api/cart` - cart operations
- `POST /api/cart/quote` - coupon/quote calculations
- `POST /api/orders` - order creation with idempotency
- `GET /api/orders/:id` - receipt retrieval
- `GET/PATCH /api/profile` / `GET/POST /api/wallets` - profile & wallets

### Mock Configuration Options

- `ENABLE_MOCKS` env variable (default: true for dev, false for build)
- `MOCK_LATENCY` - configurable request delay (ms)
- `MOCK_SCENARIO` - named scenario (e.g., "user-a", "user-b", "empty-catalog")
- `SOCKET_IO_BINDING` - @mswjs/socket.io-binding config

## 4. Quality Gates

### TypeScript Checks

- `npm run typecheck` or `tsc --noEmit` - zero errors
- All new files must export types from `api-types.ts`
- Mock state type must be compatible with TanStack Query cache

### Lint Rules

- No unused MSW handlers
- Fixture data must match api-types shapes
- Socket.IO binding must use @mswjs/socket.io-binding
- LocalStorage mock state must be JSON-serializable

### Build Validations

- MSW must start without console errors (verify on `npm run dev`)
- All handlers must return valid HTTP status codes
- Fixture data round-trips through api-types without type errors

### MSW Console Error Prevention

- Register all handlers in server.ts before starting
- Ensure fixtures data completeness before handler registration
- Add `addRoute` catch-all for unmatched paths → 404
- Validate MSW server setup in CI (typecheck + build)

## 5. Risk Areas & Edge Cases

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **User session isolation failures** | Data leakage between test users | Test each scenario with multiple users; enforce isolation in mock-state |
| **Socket.IO binding issues** | Real-time events not functioning | Use @mswjs/socket.io-binding; test reconnect/disconnect scenarios |
| **Idempotency key collisions** | Order creation conflicts | Generate unique keys per test; store in mock-state with payload hash |
| **LocalStorage persistence bugs** | State not surviving refresh | JSON.stringify/parse all state; test refresh scenarios |

### Edge Cases

- **Out-of-order responses** - MSW response ordering must respect request sequence
- **Expired coupons** - timestamp validation in quote handler
- **Sold-out NFTs** - availability check in cart/quote handlers
- **Duplicate favorite requests** - idempotent POST handling
- **Cart merge on auth** - anonymous cart items → authenticated user merge
- **Timeout after order creation** - idempotent retry must return same order

## 6. Order of Operations (Recommended Implementation Sequence)

### Phase 1: Foundation (Days 1-2)

1. Create `src/shared/api/api-types.ts` - all type contracts
2. Create `src/shared/api/api-error.ts` - error models
3. Create `src/shared/api/http-client.ts` - Axios config with mock interceptors
4. Run `tsc --noEmit` - verify types

### Phase 2: Mock Core (Days 3-4)

5. Create `src/mocks/state/mock-state.ts` - central state store
6. Create `src/mocks/fixtures/index.ts` - initial fixtures (NFTs, users, cart)
7. Create `src/mocks/handlers/index.ts` - basic handlers (auth, NFT list)
8. Create `src/mocks/server.ts` - MSW server config
9. Create `src/mocks/browser.ts` - browser entry point

### Phase 3: Scenario Expansion (Days 5-7)

10. Add remaining fixtures (collections, wallets, coupons, orders)
11. Add remaining handlers (favorites, quotes, orders, profile, wallets)
12. Configure Socket.IO binding with @mswjs/socket.io-binding
13. Implement mock-state reset utility

### Phase 4: Testing & Validation (Days 8-10)

14. Write unit tests for handlers and fixtures
15. Write integration tests for API workflows
16. Run Playwright tests with MSW enabled
17. Lint + typecheck validation
18. Lighthouse performance audit

## 7. Missing Pieces & Overlooked Items

### Based on Acceptance Criteria & Epics:

1. **No Socket.IO fallback** - README §7 requires `@mswjs/socket.io-binding` but this is often overlooked; ensure it's installed and configured

2. **No mock scenario configuration** - README §6.13 requires configurable scenarios; missing `MOCK_SCENARIO` env var support

3. **Incomplete error contract coverage** - README §5 requires error responses for: validation, session invalid, permission denied, not found, conflict, transient failure; ensure all are represented

4. **No persisted state across refresh** - README §6.12 mentions "Persistence local is allowed for sustain refresh"; need localStorage integration in mock-state

5. **Missing idempotency key storage** - Epics 8.2-8.3 require storing idempotency keys and returning conflict for payload mismatches; this needs mock-state persistence

6. **No query invalidation rules documented** - README §4.9-4.10 requires coherent cache invalidation after mutations; need documentation

7. **Axios config missing timeout/retry policy** - README §4.93 mentions "retries and sync policy must be documented"; http-client.ts needs this

8. **Playwright MSW setup not verified** - README §11.12 requires "Run Playwright tests with MSW enabled"; need integration test setup

9. **ARCHITECTURE.md not created** - README §12.13 requires documenting mock backend architecture; this should be created as part of the foundation

10. **No failure scenario selection docs** - Epics 13.18 requires "Document how to select failure scenarios"; needs a config or README section