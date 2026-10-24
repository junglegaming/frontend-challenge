# Quickstart — 009 Documentação Swagger/OpenAPI

Guia de validação da feature. Prova que a documentação existe, é válida, cobre as 6 rotas e não regrediu o contrato da 007. Não contém código de implementação.

## Pré-requisitos

- `pnpm install` na raiz (workspace já configurado pela 007).
- `apps/api/.env.local` com `AUTH_JWT_SECRET` e `BLOB_READ_WRITE_TOKEN` (ver `apps/api/.env.example`). As rotas de doc **não** precisam deles para serem servidas, mas o "Try it out" de `/coins/*` precisa de um token.
- Node 22+/24.x.

## Subir o backend localmente

Qualquer um dos dois serve a documentação de forma idêntica (mesmo path sob `/api`):

```sh
# opção A — paridade com a Vercel
pnpm --dir apps/api run dev:vercel      # http://localhost:3000/api

# opção B — listener simples (tsx)
pnpm --dir apps/api run dev:local       # http://localhost:4001/api
```

## Validar User Story 1 — Swagger UI interativa

1. Abrir no navegador `http://localhost:3000/api/docs` (ou `:4001`).
   - **Esperado**: Swagger UI com título/descrição e as 6 operações agrupadas em `health`, `auth`, `coins`.
2. Expandir `POST /api/coins/topup`.
   - **Esperado**: corpo `{ amount }` (inteiro positivo), cadeado de Bearer, respostas `200/400/401/409/500` com o envelope `Error`.
3. "Try it out" em `GET /api/health` → Execute.
   - **Esperado**: `200 { "status": "ok" }`.
4. Obter um token e autorizar:

   ```sh
   curl -s -X POST http://localhost:3000/api/auth/token \
     -H 'Content-Type: application/json' -d '{"ownerId":"alice"}'
   ```

   Copiar `token`, clicar **Authorize** na UI, colar. "Try it out" em `GET /api/coins/balance` → **200**. Sem autorizar → **401** (SC-003).

## Validar User Story 2 — documento para máquina

1. Buscar o documento:

   ```sh
   curl -s http://localhost:3000/api/openapi.json -o openapi.json -w '%{content_type}\n'
   ```

   - **Esperado**: `application/json`; o corpo tem `openapi` iniciando em `3.1`.
2. Validar com uma ferramenta OpenAPI 3.1 independente (ex.: um validador de spec no CI).
   - **Esperado**: válido, sem erros (SC-002).
3. Conferir no `openapi.json`: 6 operações em `paths`; `components.securitySchemes.bearerAuth`; `security` presente só nas de `/coins/*`; `components.schemas` com `CoinBalanceRecord`, `CoinTransactionRecord`, `AmountRequest`, `TokenRequest`, `Error` (SC-001). Ver `data-model.md`.
4. Conferir que `info.description` cita as 2 limitações (emissão de token confia no `ownerId`; Blob sem garantia transacional / possíveis atualizações perdidas / semântica de `409`) — FR-009.
5. Conferir que **nenhum** segredo/token real aparece no arquivo (SC-007).

## Validar User Story 3 — sem divergência

1. Alterar temporariamente uma regra Zod (ex.: `amountSchema` para `.min(2)` em `domains/coins/contracts.ts`).
2. Rebuscar `GET /api/openapi.json`.
   - **Esperado**: o schema `AmountRequest` reflete a nova regra **sem** nenhuma edição de doc (SC-006).
3. Reverter a alteração.

## Regressão (SC-004) e gates

```sh
pnpm --dir apps/api run typecheck     # sem any, sem erro de tipo
pnpm --dir apps/api run lint
node apps/api/scripts/smoke-test.mjs  # 007 (auth/coins) + novas checagens de doc
```

- **Esperado**: as 6 rotas da 007 respondem exatamente como antes; o smoke-test cobre adicionalmente presença das rotas de doc, status/Content-Type e validade 3.1 (research D10).

## Produção (SC-005) — após deploy

```sh
vercel --prod            # a partir de apps/api (ver apps/api/README.md)
# depois:
curl -s https://<deployment>.vercel.app/api/openapi.json -w '\n%{http_code}\n' | tail -1   # 200
# abrir https://<deployment>.vercel.app/api/docs no navegador
```

- **Esperado**: mesmos `/api/docs` e `/api/openapi.json`, idênticos ao local.
