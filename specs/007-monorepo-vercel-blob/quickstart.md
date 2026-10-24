# Quickstart: Monorepo na Vercel com Vercel Blob

Guia de validação ponta a ponta desta feature. Não é um guia de implementação — ver `tasks.md`
(gerado por `/speckit-tasks`) para a sequência de construção.

## Pré-requisitos

- Node.js 22, pnpm (já usados no projeto).
- Conta Vercel com um Blob store criado (`vercel blob store add`, ou via dashboard), e o token
  `BLOB_READ_WRITE_TOKEN` gerado para esse store.
- `vercel` CLI instalada (`pnpm dlx vercel --version` funciona sem instalar globalmente, ou como
  devDependency do workspace).

## Setup

```sh
# na raiz do workspace
pnpm install

# apps/api: configurar o token do Blob
cp apps/api/.env.example apps/api/.env.local
# editar apps/api/.env.local e colar BLOB_READ_WRITE_TOKEN=...

# linkar cada app ao seu projeto Vercel (uma vez, interativo)
cd apps/web && vercel link && cd ../..
cd apps/api && vercel link && cd ../..
```

## Rodar localmente

```sh
# os dois juntos, a partir da raiz
pnpm dev:all
# equivalente a rodar em paralelo:
#   nx run web:dev      (vite, igual hoje)
#   nx run api:dev      (vercel dev, dentro de apps/api)
```

## Validar User Story 1 — workspace único

```sh
nx show projects
# MUST listar "web" e "api"

nx run web:typecheck
nx run api:typecheck
# MUST rodar cada um isoladamente, sem disparar o build do outro
```

## Validar User Story 2 — rotas documentadas, local e deployado

```sh
# local (vercel dev rodando em apps/api, porta default 3000)
curl -s http://localhost:3000/api/health

TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"ownerId":"demo-user"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/coins/balance

# deploy de preview
cd apps/api && vercel deploy
# repetir os mesmos curls (emitindo um novo token contra a URL do preview) trocando localhost:3000
# pela URL retornada
```

Esperado: respostas idênticas (mesmo shape, mesmos status codes) nos dois ambientes — é exatamente
o que SC-002 exige.

## Validar User Story 3 — autenticação por token protege as rotas

```sh
# sem token -> 401
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/coins/balance
# MUST imprimir 401

# token de um owner não serve para ler outro owner — a identidade vem só do token (SC-007)
TOKEN_A=$(curl -s -X POST http://localhost:3000/api/auth/token -H "Content-Type: application/json" \
  -d '{"ownerId":"owner-a"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -s -H "Authorization: Bearer $TOKEN_A" http://localhost:3000/api/coins/balance
# MUST retornar o saldo de "owner-a" (ownerId no corpo da resposta == "owner-a"), mesmo que o
# chamador tente mandar outro id em qualquer outro lugar da requisição — o handler ignora isso.
```

O script `smoke-test.mjs` (próxima seção) MUST incluir esses dois casos como parte da sua cobertura,
não só os cenários manuais acima.

## Validar User Story 4 — saldo/transações no Blob, incluindo concorrência

```sh
# dentro de apps/api — contra vercel dev (paridade com produção)
# AUTH_JWT_SECRET igual ao do servidor (usado para gerar um token já expirado, FR-014)
AUTH_JWT_SECRET=... BASE_URL=http://localhost:3000/api node scripts/smoke-test.mjs

# ou contra o listener Express puro (pnpm dev:local, porta 4001) — checagem rápida da lógica,
# não vale como validação de SC-002
AUTH_JWT_SECRET=... BASE_URL=http://localhost:4001/api node scripts/smoke-test.mjs
```

O script `smoke-test.mjs` MUST cobrir, na ordem:

1. `GET /api/coins/balance` sem `Authorization` → `401`, nenhuma leitura no Blob.
2. `POST /api/auth/token` para um `ownerId` novo → token emitido; `GET /api/coins/balance` com esse
   token → `{ amount: 0, version: 0 }`.
3. `POST /api/coins/topup` com `amount: 100` → saldo vira 100, uma transação `credit` criada.
4. `POST /api/coins/debit` com `amount: 40` → saldo vira 60, uma transação `debit` criada.
5. `POST /api/coins/debit` com `amount: 1000` (maior que o saldo) → `402`, saldo permanece 60.
6. **Anti-sequestro de sessão (SC-007)**: emitir um token para `owner-b`; usar o token de `owner-a`
   para chamar as rotas de coins e confirmar que a resposta é sempre sobre `owner-a` — o script MUST
   falhar se, com o token de A, qualquer rota retornar ou alterar dados de B.
7. **Token expirado/adulterado (SC-006)**: chamar uma rota de coins com um token com assinatura
   adulterada (ex. trocar um caractere) → `401`; com um token assinado pelo segredo correto mas com
   `exp` no passado → `401` (o script gera esse token com `AUTH_JWT_SECRET`).
8. **Cenário de concorrência (SC-003)**: disparar 50 `POST /api/coins/topup` com `amount: 1`
   simultaneamente para o mesmo owner (mesmo token); ao final, `GET /api/coins/balance` MUST refletir
   exatamente `+50` sobre o saldo anterior — nenhuma atualização perdida. Requisições que retornarem
   `409` (conflito detectado) MUST ser reenviadas pelo próprio script até serem aceitas, e o script
   MUST falhar se o saldo final não bater com a soma esperada.
9. `GET /api/coins/transactions` → MUST retornar exatamente o número de transações aplicadas, em
   ordem cronológica decrescente.

## Verificar que nada mais quebrou

```sh
nx run web:lint
nx run web:typecheck
nx run web:build
nx run web:test:e2e   # suíte Playwright existente — MUST continuar 100% verde (SC-004)

# server/ (006) continua intocado e funcionando como antes
pnpm --dir server dev   # ou o smoke-test já existente da 006
```
