# Data Model: Monorepo na Vercel com Vercel Blob

Todos os registros abaixo são objetos JSON armazenados no Vercel Blob (não há banco relacional).
Nenhum ORM/schema de banco é definido aqui — o "schema" é o formato do JSON gravado em cada path.

## CoinBalanceRecord

Representa o saldo atual de um owner (recurso de exemplo que prova o padrão Blob-backed — não
substitui o saldo da 006/`server/`, que é um recurso independente).

**Path**: `coins/balances/<ownerId>.json` — um arquivo por owner, sobrescrito a cada mudança.

| Campo | Tipo | Regras |
|---|---|---|
| `ownerId` | string | igual ao segmento do path; nunca vazio |
| `amount` | integer | saldo atual em "moedas" inteiras; MUST NOT ser negativo |
| `version` | integer | começa em 0 na criação; incrementado em +1 a cada escrita bem-sucedida; usado para a checagem de concorrência otimista (research.md D5) |
| `updatedAt` | string (ISO 8601) | timestamp da última escrita aceita |

**Transições de estado**:
- Inexistente → `{ amount: 0, version: 0 }` na primeira operação (top-up) para um `ownerId` novo.
- `amount` só muda via top-up (+N) ou debit (-N, exigindo `amount >= N` antes da escrita).
- Toda escrita bem-sucedida incrementa `version`; uma escrita cujo `version` esperado não bate com o
  `version` atual no Blob MUST ser rejeitada com 409 (ver contracts/api-routes.md).

**Invariantes**:
- `amount >= 0` sempre, inclusive entre operações concorrentes (garantido pela checagem de
  concorrência, não pelo Blob em si — ver research.md D5 para o limite dessa garantia).

## CoinTransactionRecord

Uma entrada imutável e append-only descrevendo uma única mudança de saldo.

**Path**: `coins/transactions/<ownerId>/<isoTimestamp>-<txId>.json` — um arquivo novo por
transação, nunca sobrescrito; a ordenação lexicográfica do nome (timestamp ISO primeiro) reproduz a
ordem cronológica ao listar com `list({ prefix })`.

| Campo | Tipo | Regras |
|---|---|---|
| `txId` | string (uuid) | identificador único da transação |
| `ownerId` | string | igual ao segmento do path |
| `direction` | `"credit" \| "debit"` | credit = top-up, debit = gasto |
| `amount` | integer | sempre positivo; o sinal vem de `direction`, não do valor |
| `resultingBalance` | integer | valor de `amount` do `CoinBalanceRecord` logo após esta transação ser aplicada |
| `createdAt` | string (ISO 8601) | igual ao timestamp usado no path |

**Relações**: muitos `CoinTransactionRecord` para um `CoinBalanceRecord` (mesmo `ownerId`). O
histórico completo de um owner é reconstruído lendo todas as transações sob seu prefixo, nunca lendo
o `CoinBalanceRecord` retroativamente — `resultingBalance` em cada transação é o que permite auditar
que a sequência de somas bate com o saldo final, sem depender de o snapshot atual nunca ter sido
corrompido.

## AuthToken (conceitual — não é persistido, verificado só pela assinatura)

Representa um JWT emitido por `POST /auth/token` e exigido em toda rota `/coins/*`.

| Claim | Tipo | Regras |
|---|---|---|
| `sub` | string | o `ownerId` para o qual o token foi emitido; única fonte de identidade usada pelos handlers de `/coins/*` — nenhum outro header/query/body é lido para isso |
| `iat` | integer (unix timestamp) | emitido no momento da chamada a `/auth/token` |
| `exp` | integer (unix timestamp) | `iat + 15 minutos` (fixo, documentado); token expirado MUST ser rejeitado com 401 |

**Verificação**: assinatura HS256 contra `AUTH_JWT_SECRET` (variável de ambiente); nenhuma claim é
aceita sem assinatura válida. Não há tabela de tokens — a validade é inteiramente derivada da
assinatura e do `exp`, não de um lookup em storage (stateless).

**Limitação conhecida (ver spec.md Assumptions e research.md D10)**: a emissão em `/auth/token`
confia no `ownerId` que lhe é passado — não há senha nem prova de identidade nesse passo. O que este
registro garante é que, uma vez emitido, um token não pode ser usado para agir como um `ownerId`
diferente do que está em `sub`.

## Workspace Project (conceitual, não é dado persistido)

Usado só para descrever a estrutura do monorepo em `plan.md`/`quickstart.md`; não tem
representação em runtime além dos arquivos `nx.json`/`project.json`.

| Campo | Significado |
|---|---|
| `name` | `web` ou `api` |
| `root` | `apps/web` ou `apps/api` |
| `targets` | `build`, `typecheck`, `lint`, `dev` (e `test:e2e` só para `web`) |
