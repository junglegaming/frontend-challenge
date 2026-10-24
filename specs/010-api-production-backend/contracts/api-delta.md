# Contrato HTTP: o que muda (quase nada)

O contrato completo continua em `specs/007-monorepo-vercel-blob/contracts/api-routes.md` e nada nele é
revogado. Esta feature só troca o armazenamento e a implantação; para quem consome (`apps/web`) a única adição é
um cabeçalho **opcional**.

## Inalterado (FR-001, FR-009, FR-014)

Caminhos, métodos, status e formatos de `GET /api/health`, `POST /api/auth/token`, `GET /api/coins/balance`,
`GET /api/coins/transactions`, `POST /api/coins/topup`, `POST /api/coins/debit`, `POST /api/admin/login`,
`GET /api/admin/me`, `GET /api/admin/owners`, `GET /api/admin/owners/:ownerId`. Tokens (JWT), expiração,
isolamento por dono, `role: "admin"` e login indistinguível permanecem como estão.

## Adicionado: `Idempotency-Key` (opcional)

`POST /api/coins/topup` e `POST /api/coins/debit` aceitam o cabeçalho `Idempotency-Key: <texto 1..128>`.

| Situação | Resposta |
|---|---|
| Sem o cabeçalho | comportamento atual |
| Chave nova | operação aplicada, `200` com o saldo novo |
| Mesma chave, mesmo `amount` e mesma rota | `200` com o resultado original, **sem** novo efeito |
| Mesma chave, `amount` ou rota diferentes | `409 { "error": { "code": "idempotency_key_conflict", ... } }` |
| Chave inválida (vazia ou > 128) | `400 { "error": { "code": "invalid_idempotency_key", ... } }` |

## Mudança de comportamento de erro

- `409 concurrency_conflict` **deixa de ocorrer**: a atomicidade é do banco (research D3). O código continua
  documentado como reservado, mas a API não o devolve mais. Clientes que fazem retry em `409` (o `ledger` do
  `apps/web`) continuam corretos, só não o acionam.
- `GET /api/health`: além de `200 { "status": "ok" }`, passa a checar o banco. Banco inacessível ⇒
  `500 { "error": { "code": "database_unavailable", ... } }`; variável ausente ⇒
  `500 { "error": { "code": "missing_database_url", ... } }` (substitui `missing_blob_token`).

## Variáveis de ambiente (substitui a matriz da 007)

| Variável | Desenvolvimento | Preview | Produção |
|---|---|---|---|
| `DATABASE_URL` | ramo Neon de desenvolvimento (`.env.local`, research D11) | ramo Neon de preview | ramo Neon de produção |
| `DATABASE_URL_UNPOOLED` | conexão direta do mesmo ramo; usada só pelo Prisma Migrate (research D7) | idem, ramo de preview | idem, ramo de produção |
| `AUTH_JWT_SECRET` | qualquer segredo local | segredo próprio | segredo **distinto**, 32 bytes hex |
| `PORT` | `4001` (só `dev:local`) | n/a | n/a |

`BLOB_READ_WRITE_TOKEN` deixa de existir. Segredos só no projeto Vercel / `.env.local` (não versionado). Cada
ambiente tem ramo e segredo próprios; nenhum valor é compartilhado entre preview e produção.

## Rewrite do site (inalterado)

`apps/web/vercel.json`: `/backend/:path*` → `https://nft-marketplace-api-ochre.vercel.app/api/:path*`. Se o
domínio da API mudar, editar e republicar o site.
