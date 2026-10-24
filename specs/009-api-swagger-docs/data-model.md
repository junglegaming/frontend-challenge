# Data Model — 009 Documentação Swagger/OpenAPI

Esta feature **não introduz persistência**. O "modelo de dados" aqui é a estrutura do **documento OpenAPI derivado** e o mapeamento dos schemas Zod existentes para `components.schemas`. Tudo é gerado em memória a partir do código; nada vai para Vercel Blob.

## Entidade: Documento OpenAPI (derivado, não persistido)

Montado por `src/openapi/document.ts`; memoizado por processo (research D5).

| Campo | Conteúdo |
|---|---|
| `openapi` | `"3.1.0"` (research D2) |
| `info` | `{ title, version, description }` — `version` vem de `apps/api/package.json`; `description` cita as 2 limitações conhecidas (research D8/FR-009) |
| `servers` | `:3000/api` (`vercel dev`), `:4001/api` (`dev:local`), produção `https://<deployment>.vercel.app/api` |
| `tags` | `health`, `auth`, `coins` |
| `paths` | 6 operações (uma por rota existente) — ver `contracts/doc-routes.md` |
| `components.schemas` | derivados do Zod (abaixo) + envelope `Error` |
| `components.securitySchemes` | `bearerAuth` (http/bearer/JWT) |

## Entidade: Schema de Componente (Zod → JSON Schema)

Cada linha é a projeção de um objeto Zod **existente** para `components.schemas`, via `z.toJSONSchema` (research D1/D3). A coluna "io" indica o modo de geração.

| `components.schemas` | Origem Zod (após centralização, research D6) | io | Campos / regras (inalteradas) |
|---|---|---|---|
| `TokenRequest` | `domains/auth/contracts.ts` → `tokenRequestSchema` | input | `{ ownerId: string (trim, min 1) }` |
| `TokenResponse` | montado dos valores reais da rota | output | `{ token: string, expiresAt: string<date-time> }` |
| `AmountRequest` | `domains/coins/contracts.ts` → `amountSchema` | input | `{ amount: integer > 0 }` |
| `TransactionsQuery` (param `limit`) | `domains/coins/contracts.ts` → `transactionsQuerySchema` | input | `limit?: integer [1..200]`, default 50 — documentado como **entrada** (string opcional coerced) |
| `CoinBalanceRecord` | `domains/coins/contracts.ts` → `coinBalanceRecordSchema` | output | `{ ownerId: string, amount: int ≥ 0, version: int ≥ 0, updatedAt: string<date-time> }` |
| `CoinTransactionRecord` | `domains/coins/contracts.ts` → `coinTransactionRecordSchema` | output | `{ txId, ownerId, direction: "credit"\|"debit", amount: int > 0, resultingBalance: int ≥ 0, createdAt: string<date-time> }` |
| `TransactionsResponse` | montado | output | `{ ownerId: string, transactions: CoinTransactionRecord[] }` |
| `HealthResponse` | montado | output | `{ status: "ok" }` |
| `Error` | montado do shape de `lib/errors.ts` | — | `{ error: { code: string, message: string } }` |

> `TokenResponse`, `TransactionsResponse`, `HealthResponse` e `Error` não têm hoje um objeto Zod próprio (são montados em handlers). Opção de implementação (não obrigatória): declarar esses response-schemas em Zod nos `contracts.ts` para também derivá-los — mas sem alterar o que as rotas retornam. O que importa para FR-005 é que **os schemas de request** (a borda validada) sejam fonte única; os de response podem ser derivados dos record-schemas Zod já existentes + envelopes montados.

## Entidade: Esquema de Segurança

| Nome | Definição | Aplicado a |
|---|---|---|
| `bearerAuth` | `{ type: "http", scheme: "bearer", bearerFormat: "JWT" }` | `security` por-operação em `GET /coins/balance`, `POST /coins/topup`, `POST /coins/debit`, `GET /coins/transactions` |
| (nenhum) | — | `GET /health`, `POST /auth/token` (públicas) |

## Mapa de respostas por operação (do contrato da 007)

| Operação | Sucesso | Erros documentados |
|---|---|---|
| `GET /health` | 200 `HealthResponse` | 500 `Error(missing_blob_token)` |
| `POST /auth/token` | 200 `TokenResponse` | 400 `Error(invalid_owner_id)`, 500 `Error(missing_auth_secret)` |
| `GET /coins/balance` | 200 `CoinBalanceRecord` | 401 `Error` |
| `POST /coins/topup` | 200 `CoinBalanceRecord` | 400, 401, 409 `Error(concurrency_conflict)`, 500 `Error` |
| `POST /coins/debit` | 200 `CoinBalanceRecord` | 400, 401, 402 `Error(insufficient_balance)`, 409, 500 `Error` |
| `GET /coins/transactions` | 200 `TransactionsResponse` | 400 `Error(invalid_limit)`, 401 `Error` |
| (qualquer path desconhecido) | — | 404 `Error(route_not_found)` — do catch-all; documentado como resposta default |

**Invariante de integridade**: nenhum schema de componente é escrito à mão em paralelo a um Zod existente; alterar o Zod altera o componente (SC-006). Os status/corpos acima são **cópia fiel** do contrato da 007 — esta feature não os redefine (FR-010).
