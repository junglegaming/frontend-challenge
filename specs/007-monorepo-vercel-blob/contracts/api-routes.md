# API Contract: `apps/api`

Implementado como um app **Express** (`apps/api/src/app.ts`, mesmo framework de `server/`), montado
atrás de uma única Vercel Function catch-all (`apps/api/api/index.ts`). O `vercel.json` reescreve
todo `/api/*` para essa function; um rewrite preserva o path original, então a function recebe
`/api/...` e o Express monta todos os routers sob `/api` (`src/app.ts`). Resultado: o mesmo path em
todo ambiente.

Base paths: `vercel dev` → `http://localhost:3000/api`; `pnpm dev:local` → `http://localhost:4001/api`
(4000 é do `server/`); produção → `https://<deployment>.vercel.app/api`. Mesmo contrato em todos
(SC-002).

Toda rota sob `/api/coins/*` exige um token assinado: header `Authorization: Bearer <token>`,
obtido via `POST /api/auth/token`. O `ownerId` de cada requisição vem exclusivamente da claim `sub`
do token verificado — nenhum header/query/body alternativo é aceito como identidade (ver
constituição v1.3.0 e `data-model.md#AuthToken`). A emissão do token em si ainda confia no `ownerId`
pedido (sem senha/login real — limitação documentada em spec.md Assumptions e research.md D10);
`/api/health` e `/api/auth/token` não exigem token.

Toda rota responde com `Content-Type: application/json`. Erros seguem o formato:

```json
{ "error": { "code": "string", "message": "string" } }
```

## POST /api/auth/token

Emite um token de curta duração para um `ownerId`. Não exige autenticação prévia — este é
exatamente o passo que confia no id pedido (ver limitação acima).

- **Body**: `{ "ownerId": "string" }` — MUST ser uma string não vazia.
- **200**: `{ "token": "string", "expiresAt": "ISO-8601" }` — token JWT assinado (HS256), válido por
  15 minutos a partir da emissão.
- **400**: `ownerId` ausente ou vazio.
- **500**: `AUTH_JWT_SECRET` não configurado (falha rápida, mesmo padrão do token do Blob).

## GET /api/health

Verifica a function e a conexão com o Postgres (`SELECT 1`).

- **200**: `{ "status": "ok" }`
- **500**: `{ "error": { "code": "missing_database_url", "message": "..." } }` quando `DATABASE_URL` não está
  configurado, ou erro estruturado se o banco não responder (FR-010, constituição 1.5.0).

Todas as rotas abaixo (`/api/coins/*`) exigem `Authorization: Bearer <token>`. O `ownerId` usado em
cada operação é sempre o `sub` do token — nunca um valor enviado separadamente pelo chamador.

## GET /api/coins/balance

- **Headers**: `Authorization: Bearer <token>`
- **200**: `{ "ownerId": "string", "amount": number, "version": number, "updatedAt": "ISO-8601" }`
  — se o owner (do token) nunca fez top-up, retorna `amount: 0, version: 0` sem criar nada no Blob
  ainda (lazy: o registro só é criado na primeira escrita).
- **401**: token ausente, expirado ou com assinatura inválida.

## POST /api/coins/topup

Credita o saldo do owner identificado pelo token.

- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "amount": number }` — `amount` MUST ser um inteiro positivo (`> 0`); outra coisa MUST
  retornar `400`.
- **200**: `{ "ownerId": "string", "amount": number, "version": number, "updatedAt": "ISO-8601" }`
  — o `CoinBalanceRecord` já atualizado, e um `CoinTransactionRecord` (`direction: "credit"`) foi
  gravado.
- **400**: body inválido (amount ausente, zero, negativo ou não-inteiro).
- **401**: token ausente, expirado ou com assinatura inválida — nada é lido nem escrito no Blob.
- **500**: falha no banco; nada foi aplicado (crédito/débito são uma única instrução SQL atômica).

## POST /api/coins/debit

Debita o saldo do owner identificado pelo token.

- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "amount": number }` — mesma validação do topup.
- **200**: mesmo formato do topup; `CoinTransactionRecord` com `direction: "debit"`.
- **400**: body inválido.
- **401**: token ausente, expirado ou com assinatura inválida.
- **402**: saldo insuficiente (`amount atual < amount solicitado`) — nada é escrito.
- **500**: igual ao topup.

## GET /api/coins/transactions

Lista o histórico de transações do owner identificado pelo token, mais recente primeiro.

- **Headers**: `Authorization: Bearer <token>`
- **Query** (opcional): `limit` (inteiro, default 50, máximo 200)
- **200**: `{ "ownerId": "string", "transactions": CoinTransactionRecord[] }`
- **400**: `limit` inválido.
- **401**: token ausente, expirado ou com assinatura inválida.

## Rotas de administrador (FR-020 a FR-022)

Token de admin: `role: "admin"`, emitido só por `POST /api/admin/login`. Token de dono em rota de admin
⇒ `403 admin_only`; token de admin em rota de dono (`/coins/*`) ⇒ `403 wrong_token_type`.

### POST /api/admin/login

- **Body**: `{ "email": "string (e-mail válido, ≤ 254)", "password": "string (1–256)" }`
- **200**: `{ "token": "string", "expiresAt": "ISO-8601", "admin": { "id": "string", "email": "string" } }`
- **400**: corpo inválido. **401** `invalid_credentials`: e-mail desconhecido **ou** senha errada, com resposta idêntica.

### GET /api/admin/me · `Authorization: Bearer <token de admin>`

- **200**: `{ "id": "string", "role": "admin" }` · **401** sem token/inválido · **403** token de dono.

### GET /api/admin/owners

- **Query**: `limit` (1–200, default 50), `cursor` (da resposta anterior)
- **200**: `{ "owners": [{ "ownerId": "string", "updatedAt": "ISO-8601" }], "cursor": "string | omitido" }`
  — paginação por `ownerId` (cursor opaco). **400** query inválida.

### GET /api/admin/owners/:ownerId

- `ownerId` MUST casar `[A-Za-z0-9_.-]{1,128}` (sem `/`, que colidiria com o prefixo de outro dono) ⇒ **400** caso contrário.
- **200**: `{ "balance": CoinBalanceRecord, "transactions": CoinTransactionRecord[] }` (até 50, mais recentes primeiro).
