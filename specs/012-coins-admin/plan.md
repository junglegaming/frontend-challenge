# Implementation Plan: Administração das moedas no site

**Branch**: `012-admin-coins` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-coins-admin/spec.md`

## Summary

Uma área nova no `apps/web` para o administrador **real** do serviço de moedas (`apps/api`): entrada com e-mail e senha
(`POST /backend/admin/login`), lista paginada de donos (`GET /backend/admin/owners`) e detalhe com saldo e extrato
(`GET /backend/admin/owners/:ownerId`), tudo somente leitura. Segue DDD: um contexto delimitado novo, **administração de
moedas** (`domains/coins-admin`), com cliente HTTP, sessão e contratos próprios, sem compartilhar sessão nem papel com o
admin simulado do marketplace (`domains/admin`, sessão do site). A sessão de admin vive só em memória (constituição
1.7.0). Em dev/e2e um mock MSW novo (`mocks/contexts/coins-admin`) responde `/backend/admin/*` usando o mesmo estado do
mock de moedas; em produção responde o `apps/api` real. O `apps/api` não muda.

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19 (inalterados).

**Primary Dependencies**: as do `apps/web` (TanStack Router/Query, Axios, Zod, MSW, shadcn/ui, sonner). Nenhuma nova.

**Storage**: nenhum no site. Sessão de admin em memória do módulo (nunca `localStorage`/`sessionStorage`). Dados vêm do
`apps/api` (Postgres/Neon) ou, em dev/e2e, do `LedgerService` do mock (persistido em `localStorage` pela 011).

**Testing**: Playwright contra os mocks (uma pasta por página em `e2e/`), axe e snapshots visuais em 390/768/1440;
suíte do build de produção; `check-production-bundle`.

**Target Platform**: navegador; SPA na Vercel; `/backend/*` reescrito para o `apps/api`.

**Project Type**: web app (`apps/web`) consumindo o web-service `apps/api` sem alterá-lo.

**Performance Goals**: SC-006: lista e detalhe em ≤ 2 s (p95) no site publicado; a 010/011 mediram p95 ~270 ms
pelas rotas de moedas.

**Constraints**: somente leitura (constituição 1.4.0/1.7.0); token de admin fora do armazenamento permanente e separado
da sessão do site (1.7.0); acesso de 15 min sem renovação (limite do `apps/api`, FR-012 proíbe mudar); CSP
`connect-src 'self'` (só `/backend`); fronteiras de camadas pelo `oxlint` (Princípio I).

**Scale/Scope**: 3 telas, 1 domínio novo, 1 contexto de mock novo, 1 item de menu, 3 pastas de e2e, 1 doc.

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1. Base: constituição **v1.7.0**.*

| Princípio / Seção | Avaliação |
|-------------------|-----------|
| I. Camadas e fronteiras | **OK.** Rotas `app/routes/admin.coins.*` → páginas `pages/admin-coins-login`, `pages/admin-coins`, `pages/admin-coins-owner` (cada uma com README) → domínio `@/domains/coins-admin` → `shared`. O domínio não importa `domains/admin` nem `domains/ledger` (contexto separado). |
| II. Tipagem estrita | **OK.** Contratos Zod em `domains/coins-admin/model`; sem `any`; quantidades inteiras. |
| III. Estado remoto | **OK.** Axios (instância própria) + TanStack Query; chaves isoladas por admin e parâmetros; paginação na URL (pilha de cursores em `search`); estados de carregamento/vazio/erro; sem mutations de dados (só login/logout). |
| IV. Tempo real | N/A. Logout do admin de moedas limpa sessão e cache da área (SC-005). |
| V. Mocks só na rede | **OK.** Simulação em `mocks/contexts/coins-admin` (MSW), credencial fictícia só como hash; nenhum dado fictício em componente. |
| VI. Acessibilidade/responsividade | **OK.** Formulário com labels e erros associados; tabelas com cabeçalhos; `role="alert"`; skeletons; 390/768/1440 sem overflow; axe nas três telas. |
| VII. Testes | **OK.** E2E por página com falhas (credencial errada, sessão expirada, 503, id inválido, sem permissão), snapshots, lint/typecheck/build verdes. |
| Escopo 1.7.0: tela do admin real das moedas | **OK.** Somente leitura, `/backend/admin/*`, token separado da sessão do site e fora do `localStorage`. |
| Exceção `apps/api` 1.4.0 | **OK.** `/admin/*` segue somente leitura; nenhuma mudança no `apps/api`. |
| Fluxo: documentação | `docs/CHALLENGE.md:48` (FR-013, pendência da emenda 1.7.0), `docs/TEAMS.md` (novo domínio e páginas), READMEs das páginas e do domínio. |

**Resultado do gate**: sem violações. Pós-Fase 1: sem violações novas.

## Project Structure

### Documentation (this feature)

```text
specs/012-coins-admin/
├── plan.md               # este arquivo
├── research.md           # Fase 0: decisões D1–D9
├── data-model.md         # Fase 1: contratos, sessão, paginação, mock
├── quickstart.md         # Fase 1: validar em dev, e2e, produção
├── contracts/
│   └── web-coins-admin-usage.md   # rotas do apps/api usadas pelo site (sem mudá-las)
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
apps/web/src/
├── domains/coins-admin/                 # NOVO contexto delimitado: administração de moedas
│   ├── model/contracts.ts               # Zod: login, me, página de donos, detalhe do dono, erro
│   ├── model/messages.ts                # mensagens de erro para a UI
│   ├── api/client.ts                    # Axios próprio em /backend; CoinsAdminError; Authorization do admin
│   ├── api/session.ts                   # sessão em memória (token, expiresAt, e-mail) + subscribe
│   ├── api/guard.ts                     # requireCoinsAdmin(href) para beforeLoad
│   ├── api/queries.ts                   # useCoinsAdminLogin, useCoinsAdminLogout, useOwnersPage, useOwnerDetail
│   ├── index.ts                         # API pública
│   └── README.md
├── pages/
│   ├── admin-coins-login/               # entrada (e-mail, senha, erros, redirect)
│   ├── admin-coins/                     # lista de donos (pilha de cursores na URL)
│   └── admin-coins-owner/               # saldo + extrato
├── app/routes/
│   ├── admin.coins.login.tsx            # validateSearch { redirect?, reason? }
│   ├── admin.coins.index.tsx            # beforeLoad requireCoinsAdmin; validateSearch { cursors? }
│   └── admin.coins.$ownerId.tsx         # beforeLoad requireCoinsAdmin
├── shared/ui/admin-side-menu.tsx        # + item "Moedas" (active: 'coins')
└── mocks/
    ├── contexts/coins-admin/            # NOVO: handlers /backend/admin/*, credencial fictícia (hash), tokens
    ├── contexts/ledger/service.ts        # + listOwners(limit, cursor) e ownerDetail(ownerId)
    ├── scenarios/definitions.ts         # + 'coins-admin-session-expired'
    └── composition.ts                   # registra o contexto quando enableBackendMocks
apps/web/e2e/
├── admin-coins-login/                   # entrada, erro idêntico, redirect, sem cruzar sessões, axe, visual
├── admin-coins/                         # lista, paginação ida/volta, vazio, 503, expiração, axe, visual
├── admin-coins-owner/                   # saldo/extrato, dono sem operações, id inválido, sem ações de escrita
└── production/hardening.spec.ts         # + a entrada do admin de moedas chama só /backend/admin
docs/CHALLENGE.md, docs/TEAMS.md
```

**Structure Decision**: contexto delimitado próprio em vez de estender `domains/admin`: o admin do marketplace usa a
sessão do site e o MSW `/api/admin/*`; o admin de moedas usa outra credencial, outro token e outro serviço. Misturar os
dois quebraria a regra da 1.7.0 (sessões separadas). Também não reaproveita `domains/ledger` (que age em nome de um
dono, com token de dono): o pequeno código de erro/HTTP é repetido de propósito para não acoplar contextos.

## Complexity Tracking

Nenhuma violação a justificar.

## Riscos e dependências

| Risco | Efeito | Tratamento |
|---|---|---|
| Sessão só em memória | Recarregar a página pede login de novo | Aceito na spec (Edge Cases); a URL de retorno (`redirect`) devolve a pessoa ao lugar |
| Acesso de 15 min sem renovação | Pedidos começam a dar 401 | 401 de admin limpa a sessão e leva à entrada com `reason=expired` e `redirect`; guarda também checa `expiresAt` |
| Dados reais em produção | Admin vê saldos de demonstração do banco compartilhado | Somente leitura; nada é alterado |
| Menu do admin mistura dois contextos | "Produtos/Usuários" exigem a sessão do site, "Moedas" exige a sessão de admin de moedas | Cada guarda decide por si; o menu é só navegação (a correção para `Link` fica na 013) |
