# Implementation Plan: Documentação Swagger/OpenAPI do backend `apps/api`

**Branch**: `009-api-swagger-docs` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-api-swagger-docs/spec.md`

## Summary

Adicionar à `apps/api` (Express 5, feature 007) uma documentação da API em dois endpoints novos e públicos sob `/api`: `GET /api/openapi.json` (documento **OpenAPI 3.1** legível por máquina) e `GET /api/docs` (Swagger UI interativa). O documento é **gerado a partir dos schemas Zod v4 que já validam as requisições** — usando o `z.toJSONSchema` nativo do Zod 4 — de forma que a documentação não possa divergir da validação real. Os schemas de request hoje inline nas rotas são centralizados numa definição única por domínio (importada pela rota e pelo gerador). Nenhuma rota existente muda de comportamento. Nenhuma dependência de runtime nova fora da stack permitida pela constituição é introduzida (Swagger UI via CDN, OpenAPI montado com Zod + código próprio).

## Technical Context

**Language/Version**: TypeScript (strict, `~6.0.2`), Node.js 24.x (runtime da Vercel), ESM (`nodenext`)

**Primary Dependencies**: Express 5 (já presente), **Zod v4** (`^4.6.5`, já presente) via `z.toJSONSchema`; Swagger UI servida por assets de CDN (sem dependência npm). Nenhuma lib nova de OpenAPI.

**Storage**: N/A — o documento OpenAPI é derivado em tempo de execução/boot a partir dos schemas; nada é persistido. (Vercel Blob da 007 permanece intocado.)

**Testing**: extensão do `apps/api/scripts/smoke-test.mjs` (estratégia de verificação própria de `apps/api`, não o Playwright do front) — validar presença das rotas, status/Content-Type de `/api/openapi.json` e `/api/docs`, e validade OpenAPI 3.1 do documento; o smoke-test existente da 007 serve de gate de regressão (SC-004).

**Target Platform**: Vercel Serverless Function (catch-all `api/index.ts`) + listener local (`dev:local`, `vercel dev`).

**Project Type**: Web service (backend `apps/api`), somente servidor — sem mudança no front.

**Performance Goals**: geração do documento MUST ser desprezível no tempo de resposta (documento montado uma vez e memoizado por processo; alvo < 50 ms para servir após o primeiro build, sem I/O de rede nem de Blob).

**Constraints**: permanecer na stack permitida de `apps/api` (constituição v1.3.0); zero regressão no contrato da 007; mesmo path em todos os ambientes; sem segredos no output; sem `any` (Princípio II).

**Scale/Scope**: 6 operações existentes + 2 rotas novas de documentação; ~5 schemas de componente reutilizados dos Zod existentes + 1 envelope `Error`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Aplicável: **"Exceção Pontual: Monorepo na Vercel com Vercel Blob (`apps/web`, `apps/api`)"** (v1.3.0) e o Princípio II. Os Princípios I, III, IV, V, VI e a tabela de "Stack obrigatória" referem-se à SPA React em `src/`/`apps/web` e **não se aplicam** a `apps/api` (feature somente backend).

| Regra da constituição | Status | Como o plano cumpre |
|---|---|---|
| **Stack permitida de `apps/api`** (Node, TS, Express, `cors`, `zod`, `@vercel/blob`, `jsonwebtoken`) | ✅ PASS | Usa apenas Express + Zod (já na lista). A Swagger UI é carregada de CDN (HTML servido pela própria Function) → **nenhuma dependência npm de runtime nova**. O montador de OpenAPI é código próprio sobre `z.toJSONSchema`. Sem emenda necessária. |
| **Princípio II — tipagem estrita, sem `any`, Zod na borda** | ✅ PASS / reforça | A doc é derivada dos mesmos Zod da borda; o montador é tipado (tipos do próprio OpenAPI 3.1), sem `any`. Reforça a validação como fonte única. |
| **`server/` intocado** | ✅ PASS | Nada em `server/` é lido ou alterado. |
| **Rotas da 007 intocadas (comportamento)** | ✅ PASS | Apenas adiciona rotas; a centralização de schemas de request preserva a validação atual byte-a-byte (mesmo objeto Zod). |
| **Verificação própria de `apps/api`** (não apontar Playwright para o backend) | ✅ PASS | Verificação via `scripts/smoke-test.mjs`, como já é a convenção da 007. |
| **Limitações documentadas, nunca escondidas** | ✅ PASS | FR-009 exige citar na doc a limitação de emissão de token e a de concorrência do Blob. |

**Resultado**: PASS, sem violações. A seção de Complexidade abaixo fica vazia (nenhuma dependência fora da lista; nenhuma emenda necessária). Caso a implementação conclua que `z.toJSONSchema` é insuficiente e exija uma lib de OpenAPI, isso vira uma violação a justificar e uma emenda à constituição — ver research.md D1 (decisão e gatilho de reavaliação).

## Project Structure

### Documentation (this feature)

```text
specs/009-api-swagger-docs/
├── plan.md              # Este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/           # Fase 1 (doc-routes.md)
└── tasks.md             # Fase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
apps/api/
├── api/index.ts                      # (inalterado) entry catch-all da Vercel
├── vercel.json                       # (inalterado) rewrite /api/(.*) -> /api/index
├── src/
│   ├── app.ts                        # [MOD] monta docsRouter sob /api ANTES do catch-all 404
│   ├── openapi/                      # [NOVO] geração do documento (isolada das rotas)
│   │   ├── document.ts               #   buildOpenApiDocument(): info, servers, tags, paths, security
│   │   ├── components.ts             #   Zod -> JSON Schema (z.toJSONSchema) + envelope Error; nomeia $ref
│   │   └── swagger-ui.ts             #   HTML mínimo que carrega Swagger UI de CDN e aponta p/ /api/openapi.json
│   ├── routes/
│   │   ├── docs.ts                   # [NOVO] GET /openapi.json, GET /docs (públicas, sem requireAuth)
│   │   ├── auth.ts                   # [MOD leve] importa tokenRequestSchema de domains/auth/contracts
│   │   ├── coins.ts                  # [MOD leve] importa amount/transactionsQuery de domains/coins/contracts
│   │   └── health.ts                 # (inalterado)
│   └── domains/
│       ├── auth/contracts.ts         # [NOVO] tokenRequestSchema (centralizado, era inline em routes/auth.ts)
│       └── coins/contracts.ts        # [MOD] + amountSchema, transactionsQuerySchema (eram inline em routes/coins.ts)
└── scripts/smoke-test.mjs            # [MOD] + checagens das rotas de doc (presença, status, validade 3.1)
```

**Structure Decision**: Feature somente backend, dentro de `apps/api`. A geração de OpenAPI fica num módulo próprio (`src/openapi/`), separada do serviço de rotas (`routes/docs.ts`) — SRP: montar o documento ≠ servi-lo. Os schemas de request são centralizados em `domains/<domínio>/contracts.ts` (onde os record-schemas já vivem), tornando-os fonte única para validação **e** documentação (FR-005/FR-006). `app.ts` apenas monta o novo router antes do catch-all.

## Complexity Tracking

> Preencher apenas se o Constitution Check tiver violações a justificar.

Nenhuma. O Constitution Check passou sem violações: nenhuma dependência de runtime nova fora da stack permitida (Swagger UI via CDN; OpenAPI montado com Zod v4 + código próprio), nenhuma mudança de comportamento nas rotas existentes, nenhuma emenda necessária.
