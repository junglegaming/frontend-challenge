# Contract: rotas de documentação de `apps/api`

Duas rotas **novas e públicas** (sem `Authorization`), montadas sob `/api` em `src/app.ts` **antes** do catch-all 404 e do error middleware. Mesmo padrão de path das demais: `vercel dev` → `http://localhost:3000/api/...`; `dev:local` → `http://localhost:4001/api/...`; produção → `https://<deployment>.vercel.app/api/...`.

Estas rotas **apenas adicionam** documentação; nenhuma das 6 rotas existentes muda (FR-010). O contrato das 6 rotas documentadas permanece o de `specs/007-monorepo-vercel-blob/contracts/api-routes.md` (autoritativo).

## GET /api/openapi.json

Retorna o documento OpenAPI 3.1 derivado dos schemas Zod (research D1). Público.

- **Headers**: nenhum obrigatório.
- **200**: `Content-Type: application/json`; corpo = documento OpenAPI com:
  - `openapi` iniciando em `"3.1"`;
  - `info.title`, `info.version`, `info.description` (com as 2 limitações conhecidas, FR-009);
  - `servers` dos 3 ambientes;
  - `paths` com as 6 operações existentes (métodos/params/bodies/responses conforme `data-model.md`);
  - `components.schemas` derivados do Zod + `Error`;
  - `components.securitySchemes.bearerAuth` (http/bearer/JWT), referenciado só nas operações `/coins/*`.
- **Nunca**: expõe segredos ou tokens reais (SC-007).
- Idempotente, sem efeitos colaterais; memoizado por processo (research D5).

## GET /api/docs

Serve a Swagger UI interativa. Público.

- **Headers**: nenhum obrigatório.
- **200**: `Content-Type: text/html`; HTML mínimo que carrega os assets da Swagger UI de um CDN público (versão pinada) e inicializa apontando para `./openapi.json` (relativo, resolve para `/api/openapi.json` sob o rewrite).
- **Comportamento**: permite "Authorize" com Bearer e "Try it out" contra a instância em execução (US1). Não altera estado.

## Montagem e não-regressão

- `src/app.ts` monta o `docsRouter` sob `/api` antes do `notFound`/`errorMiddleware`; um path desconhecido continua caindo no `404 route_not_found` existente (documentado como resposta default no OpenAPI).
- `requireAuth` **não** é aplicado às rotas de doc (são públicas, como `health`).
- As rotas de doc não leem Vercel Blob nem exigem `BLOB_READ_WRITE_TOKEN`/`AUTH_JWT_SECRET` para serem servidas.

## Operações documentadas (resumo — fonte: contrato 007)

| Método | Path | Tag | Security | Request | Sucesso |
|---|---|---|---|---|---|
| GET | `/api/health` | health | — | — | 200 HealthResponse |
| POST | `/api/auth/token` | auth | — | TokenRequest | 200 TokenResponse |
| GET | `/api/coins/balance` | coins | bearerAuth | — | 200 CoinBalanceRecord |
| POST | `/api/coins/topup` | coins | bearerAuth | AmountRequest | 200 CoinBalanceRecord |
| POST | `/api/coins/debit` | coins | bearerAuth | AmountRequest | 200 CoinBalanceRecord |
| GET | `/api/coins/transactions` | coins | bearerAuth | `?limit` | 200 TransactionsResponse |

(Erros por operação: ver `data-model.md` → "Mapa de respostas por operação".)
