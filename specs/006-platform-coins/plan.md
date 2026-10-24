# Implementation Plan: Platform Coins

**Branch**: `006-platform-coins` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-platform-coins/spec.md`

## Summary

Adds a real (not simulated) backend service in a new top-level `server/` directory — per the
constitution's v1.1.0 amendment — that owns a collector's coin balance and transaction ledger with
genuine SQLite persistence. The existing frontend SPA gets a small new `coins` domain (a separate
Axios instance pointed at the real backend, not the MSW-mocked one), a balance/top-up UI in the
wallets/account area, and a payment-method choice at checkout between the existing wallet/ETH flow
and the new coin balance. Identity bridging trusts the frontend's existing (simulated) session user
id, documented as an explicit, accepted limitation. Playwright/e2e continues running entirely
against the existing MSW mocks; the real backend gets its own lightweight verification script.

## Technical Context

**Language/Version**: TypeScript ~6.0 (React 19.2) for the frontend, unchanged; Node.js + TypeScript
for the new `server/` (Node v22.14, already installed and verified in this environment)

**Primary Dependencies**: Frontend — no new dependency (reuses Axios, TanStack Query, existing
domain/mock conventions). Backend (`server/`, its own `package.json`, isolated from the frontend's
dependency tree) — `express`, `cors`, `zod`, dev-only `typescript`/`tsx`/`@types/express`/
`@types/cors`/`@types/node`. SQLite access uses Node's **built-in** `node:sqlite` module (no
package dependency at all — see research.md D1 for why this replaced the originally-planned
`better-sqlite3`: no C++ build toolchain is available in this environment to compile it).

**Storage**: SQLite file at `server/data/coins.db` (via `node:sqlite`), the first real persisted
storage in this project — everything else is in-memory/localStorage-backed mock state.

**Testing**: Frontend — existing Playwright suite, unaffected (still runs against MSW only). Backend
— a small standalone Node test script (`server/scripts/smoke-test.mjs` or similar) exercising
topup/debit/refund/insufficient-balance directly against a running server instance; not part of
`pnpm test:e2e`.

**Target Platform**: Web (frontend, unchanged) + a local Node HTTP server (backend, new) run
alongside it in development.

**Project Type**: web-application — frontend SPA (unchanged structure) plus one new, independent
backend package living in the same repository.

**Performance Goals**: no new targets; this is a low-traffic, single-developer-demo-scale service.

**Constraints**: zero new frontend dependency; backend stack strictly limited to the constitution's
allowance (Express + better-sqlite3 + cors + zod, no NestJS, no Nx/Turborepo); Playwright/e2e MUST
stay green against the existing mocks (SC-006); the real backend's identity model MUST stay
documented as a known simplification (no real auth exists anywhere in this project).

**Scale/Scope**: 1 new backend package (`server/`, ~6-8 files), 1 new frontend domain (`coins`,
contracts + a separate Axios client + queries), 1 new UI section (balance + top-up, in the
wallets/account area), 1 new checkout payment-method branch, 1 new env var
(`VITE_COINS_API_URL`), 1 root dev script to run both processes together.

## Constitution Check

*GATE: passou antes da Fase 0; reavaliado após a Fase 1 — ver notas abaixo.*

| Princípio | Avaliação |
|-----------|-----------|
| I. Camadas e fronteiras | OK para o lado frontend: novo domínio `coins` segue exatamente o mesmo padrão dos demais (`model/contracts.ts`, `api/`, `index.ts`); `server/` fica fora da árvore `src/` e não participa da regra `app/routes → pages → domains → shared` (ele não é parte da SPA). |
| II. Tipagem estrita | OK. Contratos do domínio `coins` tipados; `any` proibido também dentro de `server/` (TypeScript estrito lá também, por convenção, ainda que a constituição não exija isso explicitamente para o backend novo). |
| III. Estado remoto | OK. O frontend consome o saldo via TanStack Query como qualquer outro dado remoto — a única diferença é a base URL/instância Axios apontando para um backend real em vez do mock. |
| IV. Tempo real | N/A — esta feature não introduz eventos Socket.IO novos; saldo é consultado via REST simples. |
| V. Mocks só em `src/mocks` | **Exceção explícita e já ratificada** (constituição v1.1.0, seção "Exceção Pontual: Backend Real de Moedas da Plataforma") — `server/` é deliberadamente real, não mock, exatamente como essa seção autoriza. Nada em `src/mocks` muda. |
| VI. Acessibilidade/responsividade/fidelidade | Aplicável à nova seção de saldo/top-up e ao novo passo de checkout — mesmo padrão de componentes `shared/ui`, mesmos breakpoints 390/768/1440. |
| VII. Testes e auditoria | O Playwright existente continua intacto contra os mocks (nenhuma mudança); `server/` precisa de sua própria verificação separada (documentado na seção da exceção), não do mesmo `e2e/`. |

Sem violações além da exceção já concedida explicitamente pela própria constituição. Nenhuma linha
em Complexity Tracking é necessária além de referenciar essa exceção já existente.

## Project Structure

### Documentation (this feature)

```text
specs/006-platform-coins/
├── plan.md              # este arquivo
├── research.md          # Fase 0 — decisões D1-D6
├── data-model.md         # Fase 1 — schema SQLite + contratos do domínio coins
├── quickstart.md         # Fase 1 — como rodar o server/, validar e2e manualmente
├── contracts/
│   └── coins-api.md      # contrato REST do backend real
└── tasks.md              # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
server/
├── package.json                  # projeto standalone, próprio lockfile, não no workspace pnpm
├── tsconfig.json
├── .gitignore                    # data/*.db, data/*.db-journal, data/*.db-wal
├── README.md                      # setup, limitação de identidade, como rodar o smoke test
├── data/                          # criado em runtime, nunca commitado
├── scripts/
│   └── smoke-test.mjs             # verificação standalone (topup/debit/refund/insufficient)
└── src/
    ├── server.ts                   # bootstrap HTTP (porta via env, default 4000)
    ├── app.ts                      # express app: middleware, rotas, error handler
    ├── db.ts                       # conexão better-sqlite3 + migração idempotente no boot
    ├── middleware/identity.ts      # lê X-User-Id, upsert usuário/saldo na primeira vez
    └── routes/coins.ts             # /coins/balance, /topup, /debit, /refund

src/domains/coins/
├── model/contracts.ts              # CoinBalance, CoinTransaction, exchange rate constant
├── api/client.ts                   # Axios instance própria, baseURL = env.coinsApiUrl, injeta X-User-Id
├── api/queries.ts                  # useCoinsBalance, useTopUpCoins, (debit/refund usados só no checkout)
├── index.ts
└── README.md

src/shared/config/env.ts            # + coinsApiUrl (VITE_COINS_API_URL)

src/pages/wallets/
├── WalletsPage.tsx                 # + <CoinsBalanceSection />
└── components/CoinsBalanceSection.tsx  # saldo atual + ação de top-up (novo)

src/pages/checkout/
├── CheckoutPage.tsx                 # + estado de método de pagamento (wallet | coins), + sequência
│                                    #   debit-então-create-order com estorno em caso de falha
└── components/PaymentMethodPicker.tsx  # novo — escolha entre carteira (já existente) e coins

package.json                        # + script raiz "dev:coins-server" e "dev:all" (concurrently)
```

**Structure Decision**: `server/` é um pacote Node standalone, deliberadamente fora do workspace
pnpm do frontend (sem ferramenta de monorepo, conforme a exceção da constituição). O frontend ganha
exatamente um domínio novo (`coins`), seguindo o padrão já estabelecido por `creators`/`admin`/
`media-generation`. Nenhuma pasta nova é criada em `src/mocks` — este é o ponto central da feature.

## Complexity Tracking

Sem violações além da exceção já concedida e documentada na constituição (v1.1.0); nada adicional a
justificar aqui.
