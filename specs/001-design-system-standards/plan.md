# Implementation Plan: Padrões do Design System (Kurio)

**Branch**: `001-design-system-standards` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-design-system-standards/spec.md`

## Summary

Centralizar a identidade visual da referência (`reference-profile-screen.png`) em tokens únicos
(6 cores base, fonte monoespaçada, escalas de espaçamento e raio), um conjunto de ícones,
uma navbar e uma dock inferior compartilhadas, e um catálogo de componentes em `src/shared/ui`.
Em seguida, migrar todas as telas existentes para esses padrões. Abordagem: tokens CSS em
`src/index.css` expostos ao Tailwind, componentes shadcn/ui adaptados pelo tema (não reescritos),
layout global em `src/app/layout`, e uma página interna de catálogo para revisão visual.

## Technical Context

**Language/Version**: TypeScript ~6.0 (React 19.2)

**Primary Dependencies**: Tailwind CSS 4.3 (tokens via `@theme inline`), shadcn/ui (radix-ui, cva, tailwind-merge), lucide-react (ícones), TanStack Router, `@fontsource/space-mono`

**Storage**: N/A

**Testing**: Playwright (E2E + regressão visual em 390/768/1440), oxlint (jsx-a11y), `pnpm typecheck`, Lighthouse (acessibilidade)

**Target Platform**: Web (desktop, tablet, mobile), tema escuro único

**Project Type**: web-application (SPA front-end, mocks via MSW)

**Performance Goals**: sem regressão de layout shift (CLS ≈ 0) ao carregar a fonte; Lighthouse acessibilidade ≥ 95

**Constraints**: contraste ≥ 4,5:1; alvos ≥ 44 px no toque; sem rolagem horizontal; respeitar `prefers-reduced-motion`; regras de dependência de `docs/TEAMS.md` (verificadas por lint)

**Scale/Scope**: 10 páginas (3 rotas implementadas hoje: início, detalhe do NFT, perfil; demais são esqueletos), 1 layout raiz, ~13 componentes de UI

## Constitution Check

*GATE: passou antes da Fase 0; reavaliado após a Fase 1 — sem violações.*

| Princípio | Avaliação |
|-----------|-----------|
| I. Camadas e fronteiras | OK. Tokens e UI em `shared/`, navbar/dock em `app/layout`, páginas só consomem. `shared/` não importa `app/pages/domains`: a navbar recebe contagem do carrinho e sessão por props. |
| II. Tipagem estrita | OK. Sem `any`; nomes de ícones e itens de navegação tipados. |
| III. Estado remoto | OK. Sem novo estado remoto; navbar permanece apresentacional. |
| IV. Tempo real | N/A. |
| V. Mocks só em `src/mocks` | OK. O catálogo visual não usa dados fictícios de negócio. |
| VI. Acessibilidade/responsividade/fidelidade | É o alvo principal da feature. shadcn adaptado via tema. |
| VII. Testes e auditoria | OK. Snapshots visuais por página e auditoria Lighthouse planejados. |

**Bloqueio pré-existente (não causado por esta feature)**: há marcadores de merge não resolvidos
(`<<<<<<<`) em `src/shared/ui/button.tsx`, `src/shared/api/http.ts` e `src/app/routeTree.gen.ts`
(este último com status `UU`). A implementação MUST resolvê-los primeiro (ver `research.md` D8).

## Project Structure

### Documentation (this feature)

```text
specs/001-design-system-standards/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── design-tokens.md
│   └── ui-components.md
├── reference-profile-screen.png
├── checklists/requirements.md
└── tasks.md             # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── index.css                      # tokens (cores, tipografia, espaçamento, raio) + base
├── app/
│   ├── routes/__root.tsx          # monta Navbar, Dock, <main>, Footer
│   └── layout/
│       ├── Navbar.tsx             # substitui Header.tsx
│       ├── Dock.tsx               # novo: barra inferior (< md)
│       ├── nav-items.ts           # itens e destinos tipados (compartilhados por Navbar e Dock)
│       └── Footer.tsx             # restilizado
├── shared/
│   ├── ui/                        # catálogo: button, input, label, field, password-input,
│   │                              # select (sufixo), avatar, badge, card, skeleton, side-menu,
│   │                              # nav-link, count-badge, dialog, tabs, sonner, separator
│   └── icons/index.ts             # re-exporta o conjunto oficial de ícones (nome → componente)
└── pages/
    ├── home/ nft-detail/ cart/ checkout/ order-confirmation/
    ├── login/ signup/ profile/ wallets/ not-found/   # migradas para os padrões
    └── design-system/             # catálogo visual (somente desenvolvimento) — ver research D9
e2e/
└── design-system/                 # snapshots em 390/768/1440 + checagens de acessibilidade
```

**Structure Decision**: aplicação web única já existente. Tokens e componentes ficam em `shared/`;
navbar e dock em `app/layout` porque dependem de rotas; o catálogo visual é uma página
(`pages/design-system`) para manter as regras de dependência intactas.

## Complexity Tracking

Sem violações da constituição; nada a justificar.
