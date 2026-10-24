# Implementation Plan: Storefront Expansion — Mercado, Criadores, Aprenda

**Branch**: `004-storefront-expansion` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-storefront-expansion/spec.md`

## Summary

Builds real destinations for the 3 navigation links already declared but disabled in
`src/app/layout/nav-items.ts` (`market`/`criadores`/`aprenda`, `to: null, enabled: false`):
a curated discovery hub (Mercado) that reuses the existing catalog rather than duplicating it,
a creators directory + creator-detail pair backed by a new small read-only `creators` domain
derived from existing NFT/artist data (no new fixtures), and a fully static educational screen
(Aprenda) with no backend at all. All three are public (no sign-in required), matching home's
access level. No existing screen, domain, or contract changes.

## Technical Context

**Language/Version**: TypeScript ~6.0 (React 19.2) — unchanged from 002/003

**Primary Dependencies**: TanStack Router (new routes), TanStack Query (new `creators` domain
queries), Axios (via the existing `@/shared/api/http` client), MSW (new `creators` mock context),
shadcn/ui (reused components only — `Card`, `Badge`, `Tabs`/`Separator` as needed); no new runtime
dependency is introduced

**Storage**: N/A — `creators` is a read-only projection over existing in-memory mock state; Learn
articles are a static in-repo TypeScript array, not persisted data

**Testing**: Playwright (3 new per-page folders: `e2e/market`, `e2e/creators`, `e2e/learn`),
oxlint, `pnpm typecheck`, `pnpm build` (reused, not created)

**Target Platform**: Web (same breakpoints 390/768/1440 as every other screen)

**Project Type**: web-application (same SPA; incremental addition of 3 public screens + 1 small
domain)

**Performance Goals**: no new targets; maintains existing Lighthouse accessibility ≥ 95 bar

**Constraints**: no new navigable screen may duplicate the home page's general browse/search/filter
role (Mercado is explicitly scoped as a curated hub, not a second catalog); `pnpm lint`,
`pnpm typecheck`, `pnpm build` and the full existing Playwright suite MUST stay green (FR implied by
SC-006); no authentication required for any of the 3 screens (FR-010)

**Scale/Scope**: 3 new pages (`market`, `creators` + `creator-detail`, `learn`), 1 new domain
(`creators`), 1 new mock context (`creators`, read-side projection only), 3 new e2e folders, 1
cross-cutting change to `nav-items.ts`

## Constitution Check

*GATE: passou antes da Fase 0; reavaliado após a Fase 1 — ver notas abaixo.*

| Princípio | Avaliação |
|-----------|-----------|
| I. Camadas e fronteiras | OK. Uma pasta nova por tela (`market`, `creators`, `creator-detail`, `learn`); um domínio novo (`creators`) para a única entidade genuinamente nova; nenhuma página importa outra, nenhuma regra de fronteira violada. |
| II. Tipagem estrita | OK. `Creator`/`Article` tipados em `model/contracts.ts`; sem `any`; `creators` reaproveita `NftSummary` do domínio `catalog` por import público, não por duplicação de tipo. |
| III. Estado remoto | OK. `creatorQueries.list/detail/nfts` via TanStack Query, mesmo padrão de `catalogQueries`; Learn não tem estado remoto algum (conteúdo estático). |
| IV. Tempo real | N/A — nenhum evento Socket.IO novo; `creators` é uma projeção de leitura sobre dados já sincronizados em tempo real pelo catálogo. |
| V. Mocks só em `src/mocks` | OK. Novo contexto `src/mocks/contexts/creators/` deriva de `CatalogRepository` já existente, sem fixtures novas nem estado duplicado — determinístico por construção. |
| VI. Acessibilidade/responsividade/fidelidade | Aplicável a todas as 3 telas novas (390/768/1440, axe, teclado) — ver research.md D4 sobre o gap de acesso ao Figma. |
| VII. Testes e auditoria | Cada tela nova ganha sua própria pasta e2e (`e2e/market`, `e2e/creators`, `e2e/learn`) seguindo o padrão de `e2e/home/catalog.spec.ts`. |

Sem violações. Nenhuma linha em Complexity Tracking é necessária.

## Project Structure

### Documentation (this feature)

```text
specs/004-storefront-expansion/
├── plan.md              # este arquivo
├── research.md          # Fase 0 — decisões D1-D4
├── data-model.md         # Fase 1 — Creator, Learn Article
├── quickstart.md         # Fase 1 — como validar as 3 telas manualmente e via e2e
├── contracts/
│   ├── market.md
│   ├── creators.md
│   └── learn.md
└── tasks.md              # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
src/app/layout/nav-items.ts      # market/creators/learn: to: null → rota real, enabled: true

src/app/routes/
├── market.tsx                   # público, sem beforeLoad
├── creators.tsx                 # público, sem beforeLoad
├── creators.$creatorId.tsx      # público, sem beforeLoad
├── learn.tsx                    # público, sem beforeLoad
└── learn.$slug.tsx              # público, sem beforeLoad

src/pages/market/
├── MarketPage.tsx
├── components/{CategoryTiles,TrendingRail,CollectionsRail}.tsx
├── index.ts
└── README.md

src/pages/creators/
├── CreatorsPage.tsx
├── components/CreatorCard.tsx
├── index.ts
└── README.md

src/pages/creator-detail/
├── CreatorDetailPage.tsx
├── components/CreatorBio.tsx
├── index.ts
└── README.md

src/pages/learn/
├── LearnPage.tsx
├── content/articles.ts          # dados estáticos (Article[])
├── components/ArticleCard.tsx
├── index.ts
└── README.md
# Detalhe de artigo renderizado pela mesma LearnPage/rota `$slug`, sem página própria adicional

src/domains/creators/
├── model/contracts.ts           # Creator { id, name, avatarUrl, bio, nftCount }
├── api/queries.ts                # creatorQueries.list()/.detail(id)/.nfts(id)
├── index.ts
└── README.md

src/mocks/contexts/creators/
├── repository.ts                 # projeção de leitura sobre CatalogRepository (sem estado próprio)
├── service.ts
└── handlers.ts
# wired into src/mocks/composition.ts's `handlers` array

e2e/market/market.spec.ts
e2e/creators/creators.spec.ts
e2e/creators/creator-detail.spec.ts
e2e/learn/learn.spec.ts
```

**Structure Decision**: nenhuma estrutura nova além de uma pasta de domínio (`creators`) e das
pastas de página/e2e por tela, seguindo exatamente a convenção já usada pelas features 001/002/003
(`app/routes → pages → domains → shared`). `market` e `learn` não precisam de domínio próprio —
`market` reaproveita `@/domains/catalog` e `learn` é conteúdo estático dentro da própria pasta de
página.

## Complexity Tracking

Sem violações da constituição; nada a justificar.
