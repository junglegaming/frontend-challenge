# Implementation Plan: Administração do marketplace completa

**Branch**: `013-admin-marketplace` (empilhada na `012-admin-coins`) | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-marketplace-admin/spec.md`

## Summary

A administração do marketplace (simulada, papel de administrador da sessão do site) ganha porta de entrada e visão de
pedidos: um painel `/admin` com totais, o link "Administração" (só para administradores) na navegação e no menu da conta,
a lista de pedidos de todos os usuários (`/admin/orders`, paginada, com filtro por estado) e o detalhe somente leitura
(`/admin/orders/$orderId`). Os menus laterais passam a navegar pelo roteador, sem recarregar a página, o que também
preserva o acesso em memória do admin das moedas (012). Segue DDD: o contexto **administração** (`domains/admin`) é dono
de tudo o que o administrador lê (visão geral e pedidos); `domains/orders` não muda no site e o serviço de pedidos do
mock só ganha leituras. Tudo simulado em MSW; `apps/api` e `server/` não mudam.

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19 (inalterados).

**Primary Dependencies**: as do `apps/web` (TanStack Router/Query, Axios, Zod, MSW, shadcn/ui). Nenhuma nova.

**Storage**: nenhum no site; pedidos vivem no estado persistido do mock (`localStorage`, `mocks/state.ts`).

**Testing**: Playwright contra os mocks (uma pasta por página em `e2e/`), axe e snapshots visuais em 390/768/1440;
suíte do build de produção; `check-production-bundle`.

**Target Platform**: navegador; SPA na Vercel (produção continua um demo com mocks para `/api/*`).

**Project Type**: web app (`apps/web`).

**Performance Goals**: SC-007: painel, lista e detalhe em ≤ 2 s (p95); tudo é local (mock), sem rede real.

**Constraints**: somente leitura nos pedidos (FR-010); isolamento do colecionador intacto (FR-011); sem recarregar a
página ao usar os menus (FR-012); `apps/api` e `server/` intocados; fronteiras pelo `oxlint` (Princípio I); `shared/`
não importa `app/`, `pages/` nem `domains/`.

**Scale/Scope**: 3 telas novas, 1 componente compartilhado corrigido (`side-menu`), 2 menus ajustados, 1 link na
navegação, 4 páginas existentes tocadas só para passar a ação "Sair do site", 1 contexto de mock ampliado, 3 pastas de
e2e, docs.

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1. Base: constituição **v1.7.0**.*

| Princípio / Seção | Avaliação |
|-------------------|-----------|
| I. Camadas e fronteiras | **OK.** Rotas `admin.index`, `admin.orders.index`, `admin.orders.$orderId` → páginas `admin-dashboard`, `admin-orders`, `admin-order` (cada uma com README) → `@/domains/admin` (+ tipos de `@/domains/orders`) → `shared`. O `side-menu` em `shared/ui` só importa a biblioteca do roteador, não `app/`. Código usado por duas páginas (a ação de sair, o seletor de estado) sobe para o domínio ou `shared/ui`. |
| II. Tipagem estrita | **OK.** Contratos Zod/TS em `domains/admin/model`; sem `any`; ETH como string decimal (`EthAmount`), quantidades inteiras. |
| III. Estado remoto | **OK.** Axios + TanStack Query; página e filtro **na URL** (parâmetros opcionais); chaves isoladas por parâmetros; estados de carregamento/vazio/erro; logout limpa o cache. |
| IV. Tempo real | N/A (lista e detalhe mostram o estado do carregamento; ver riscos). |
| V. Mocks só na rede | **OK.** Endpoints novos `/api/admin/*` em `mocks/contexts/admin`; nenhum dado fictício em componente. |
| VI. Acessibilidade/responsividade | **OK.** Tabelas com cabeçalhos, `aria-current` no item atual, foco visível, `role="alert"`, skeletons; 390/768/1440 sem rolagem horizontal; axe nas três telas. |
| VII. Testes | **OK.** E2E por página com falhas (não administrador, visitante, 404, vazio, erro), snapshots, lint/typecheck/build verdes. |
| Escopo 1.7.0: pedidos no admin do marketplace | **OK.** Somente leitura, exige `role: "admin"` da sessão do site. |
| Exceções `apps/api` e `server/` | **OK.** Intocados. |
| Fluxo: documentação | `docs/TEAMS.md` (3 páginas, mudança no menu), READMEs, README do contexto de mock. |

**Resultado do gate**: sem violações. Pós-Fase 1: sem violações novas.

## Project Structure

### Documentation (this feature)

```text
specs/013-marketplace-admin/
├── plan.md               # este arquivo
├── research.md           # Fase 0: decisões D1–D9
├── data-model.md         # Fase 1: visão geral, pedido do admin, filtros, erros
├── quickstart.md         # Fase 1: validar em dev, e2e, produção
├── contracts/
│   └── admin-marketplace-endpoints.md   # endpoints simulados novos (MSW)
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
apps/web/src/
├── shared/ui/
│   ├── side-menu.tsx                  # SideMenuItem: mantém <a href>; clique simples navega pelo roteador
│   ├── admin-side-menu.tsx            # + "Visão geral", "Pedidos", "Sair do site" (onLogout)
│   └── account-side-menu.tsx          # + "Administração" quando showAdmin
├── app/layout/Navbar.tsx              # + link "Administração" quando role === 'admin'
├── domains/admin/
│   ├── model/contracts.ts             # + AdminOverview, AdminOrderSummary, AdminOrderDetail, AdminOrdersPage,
│   │                                  #   OrderStatusFilter, adminOrdersSearchSchema
│   ├── api/queries.ts                 # + useAdminOverview, useAdminOrders, useAdminOrder
│   ├── hooks/use-admin-logout.ts      # sair do site e voltar ao início (usado pelo menu das 7 páginas de admin)
│   ├── components/OrderStatusBadge.tsx   # estado do pedido (usado pela lista e pelo detalhe)
│   └── index.ts
├── pages/
│   ├── admin-dashboard/               # /admin: totais e atalhos
│   ├── admin-orders/                  # /admin/orders: lista paginada + filtro
│   ├── admin-order/                   # /admin/orders/$orderId: detalhe somente leitura
│   ├── admin-products/, admin-users/, admin-coins/, admin-coins-owner/   # só passam onLogout ao menu
│   └── profile/, wallets/             # só passam showAdmin ao menu da conta
├── app/routes/
│   ├── admin.index.tsx                # beforeLoad requireRole(..., 'admin')
│   ├── admin.orders.index.tsx         # validateSearch { status?, page? }
│   └── admin.orders.$orderId.tsx
└── mocks/contexts/
    ├── admin/{handlers,service}.ts    # GET /admin/overview, /admin/orders, /admin/orders/:orderId
    └── orders/service.ts              # OrderService: listAll(filter, page), getAny(orderId), countByStatus()
apps/web/e2e/
├── admin-dashboard/, admin-orders/, admin-order/
├── admin-coins*/                      # ajustes: o botão da área é "Sair" exato (o menu agora tem "Sair do site")
└── account/                           # link Administração visível só para admin (nas páginas de perfil e navbar)
docs/TEAMS.md
```

**Structure Decision**: o administrador é o público e a permissão das leituras novas, então o contexto **administração**
(`domains/admin`) as possui; o serviço de pedidos do mock só ganha métodos de leitura e o domínio `orders` do site não
muda. O detalhe do admin é uma visão própria somente leitura: o recibo do comprador é um componente de página
(`pages/order-confirmation`), que outra página não pode importar, e só existe para pedidos confirmados.

## Complexity Tracking

Nenhuma violação a justificar.

## Riscos e dependências

| Risco | Efeito | Tratamento |
|---|---|---|
| Mudar o `side-menu` afeta todas as páginas de conta e admin | Regressão visual ou de foco | Mantém o `<a href>` (acessível, nova aba funciona) e só intercepta o clique simples; snapshots das páginas afetadas conferidos |
| "Sair do site" e "Sair" (admin das moedas) na mesma tela | Dois botões com o mesmo nome | O menu usa "Sair do site"; os testes da 012 passam a usar nome exato "Sair" |
| Empilhada na 012 (PR #5 aberto) | Conflito se a 012 mudar antes do merge | PR da 013 contra a branch da 012 até o #5 entrar; depois contra a `main` |
| Pedido pendente muda sozinho (liquidação simulada) | Número do painel e estado da lista podem divergir | O mock "liquida" pedidos vencidos ao ler; as telas mostram o estado do carregamento (spec, Assumptions) |
| Link "Administração" aparecendo antes de a sessão carregar | Vazamento visual para colecionador | Papel desconhecido = oculto; só aparece quando a sessão confirma `admin` |
