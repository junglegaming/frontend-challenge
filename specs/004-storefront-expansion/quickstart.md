# Quickstart: Validating Storefront Expansion

## Prerequisites

```bash
pnpm install
pnpm dev   # starts the app with MSW mocks at http://localhost:5173
```

## Automated validation

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e                              # full suite, confirms zero regressions
pnpm exec playwright test e2e/market       # this feature's 3 new suites in isolation
pnpm exec playwright test e2e/creators
pnpm exec playwright test e2e/learn
```

Expected: all pass; total Playwright test count grows from the current baseline (76, see
`specs/003-quality-hardening`) by the number of new tests added across `e2e/market`,
`e2e/creators` (2 spec files) and `e2e/learn`.

## Manual validation scenarios

1. **Mercado discovery → filtered catalog**
   - Navigate to `/market` from the navbar "Mercado" link (should now be enabled/clickable).
   - Confirm category tiles, a trending rail and a collections rail render with real data.
   - Select a category tile → confirm you land on `/` filtered to that category.
   - Select a trending item → confirm you land on that NFT's detail page.

2. **Criadores directory → creator detail**
   - Navigate to `/creators` from the navbar "Criadores" link.
   - Confirm a grid of creators renders (avatar, name, NFT count).
   - Select a creator → confirm `/creators/$creatorId` shows a bio and a grid of that creator's
     NFTs, matching the count shown in the directory.
   - Manually visit `/creators/does-not-exist` → confirm a not-found state, not a blank page or raw
     error.

3. **Aprenda list → article**
   - Navigate to `/learn` from the navbar "Aprenda" link.
   - Confirm a list of articles renders with title, summary and reading time.
   - Select an article → confirm `/learn/$slug` shows its full content.
   - Manually visit `/learn/does-not-exist` → confirm a not-found state.

4. **Responsive/a11y spot-check**
   - Resize to 390px and 1440px for all three screens — confirm no horizontal scroll and all
     actions remain reachable.
   - Run the existing axe-based accessibility check pattern (already encoded in each new e2e spec)
     and confirm zero critical violations.

## Known limitation

Visual fidelity against the project's Figma reference design has not been confirmed for these 3
screens (Figma access was unavailable during specification — see spec.md Assumptions and
research.md D4). This quickstart validates structure/function/accessibility, not pixel-level
design match. Re-run visual review once Figma access is resolved.
