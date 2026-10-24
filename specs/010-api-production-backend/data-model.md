# Data Model: Back-end de produção (`apps/api`)

Três tabelas no Postgres (Neon), descritas em `apps/api/prisma/schema.prisma` e criadas pela migração
`prisma/migrations/0_init` com `pnpm db:migrate` (= `prisma migrate deploy`, research D7). As tabelas, colunas,
restrições e índices são **os mesmos** da revisão 2; o Prisma só passa a descrevê-los. Todas as colunas de valor
são `bigint`. O contrato HTTP não muda (ver `contracts/api-delta.md`): as respostas continuam com os mesmos campos
(`ownerId`, `amount`, `version`, `updatedAt` etc.).

## Modelos Prisma ↔ tabelas

| Modelo Prisma | Tabela | Notas de mapeamento |
|---|---|---|
| `Balance` | `balances` | campos em camelCase com `@map` para snake_case; `ownerId` é `@id`; relação 1-N com `CoinTransaction` |
| `CoinTransaction` | `transactions` | nome do modelo evita confusão com `$transaction` do cliente; `txId` `@id @db.Uuid`; `@@unique([ownerId, idempotencyKey])` e `@@index([ownerId, createdAt(sort: Desc), txId(sort: Desc)])` com os **nomes atuais** dos índices (`map:`) |
| `Admin` | `admins` | `id` `@id`, `email` `@unique`, `passwordHash` `@map("password_hash")` |

Regras de borda (Princípio II): campos `BigInt` chegam ao adaptador como `bigint` do JavaScript e são convertidos
para `number` com verificação de inteiro seguro antes de sair do adaptador; `DateTime` vira ISO string. As linhas
de `$queryRaw` (a escrita atômica, research D12) continuam validadas com Zod. Os tipos gerados pelo Prisma não
saem dos adaptadores: o domínio só vê `CoinBalanceRecord`, `CoinTransactionRecord` e `AdminRecord`.

O Prisma não modela nem compara `CHECK`: os `CHECK` das tabelas abaixo são escritos à mão em
`0_init/migration.sql`. No *baseline* do ramo de desenvolvimento, `prisma migrate diff` confere tabelas, colunas e
índices, e uma consulta a `pg_constraint` confere os `CHECK` (quickstart passo 1).

## `balances`: saldo por dono

| Coluna | Tipo | Regra |
|---|---|---|
| `owner_id` | `text`, **PK** | identificador do dono (claim do token); `CHECK (owner_id <> '')` |
| `amount` | `bigint` | `CHECK (amount >= 0)`: o saldo nunca é negativo (FR-005) |
| `version` | `bigint` | `CHECK (version >= 0)`; `+1` a cada operação aceita (mantém o campo `version` da resposta) |
| `updated_at` | `timestamptz` | instante da última operação aceita |

A linha nasce no primeiro crédito (*upsert*). Dono sem linha ⇒ `GET /coins/balance` devolve saldo `0`, `version`
`0`, sem gravar nada.

## `transactions`: histórico imutável

| Coluna | Tipo | Regra |
|---|---|---|
| `tx_id` | `uuid`, **PK** | gerado pela API |
| `owner_id` | `text` | **FK** para `balances.owner_id` |
| `direction` | `text` | `CHECK (direction IN ('credit','debit'))` |
| `amount` | `bigint` | `CHECK (amount > 0)`; o sinal vem de `direction` |
| `resulting_balance` | `bigint` | `CHECK (resulting_balance >= 0)`; saldo logo após esta operação |
| `resulting_version` | `bigint` | versão do saldo logo após esta operação (permite o replay idempotente devolver a resposta original) |
| `idempotency_key` | `text`, **anulável** | do cabeçalho `Idempotency-Key`; `CHECK` de 1 a 128 caracteres quando presente |
| `created_at` | `timestamptz` | igual ao `updated_at` gravado no saldo pela mesma instrução |

Índices: `UNIQUE (owner_id, idempotency_key)` (research D5; vários `NULL` são permitidos) e
`(owner_id, created_at DESC, tx_id DESC)` para `GET /coins/transactions` (mais recentes primeiro, desempate
estável). Nenhuma rota atualiza ou apaga linhas desta tabela.

## `admins`: administradores

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `text`, **PK** | `sha256` hex do e-mail normalizado (igual ao atual; tokens já emitidos continuam válidos) |
| `email` | `text`, `UNIQUE` | minúsculas, sem espaços nas pontas |
| `role` | `text` | `CHECK (role = 'admin')` |
| `password_hash` | `text` | scrypt com salt (`lib/password.ts`); só sai do adaptador para `authenticateAdmin` |
| `created_at` | `timestamptz` | preservado quando o seed troca a senha (`ON CONFLICT (id) DO UPDATE` só altera o hash) |

## Invariantes (provadas pela verificação)

1. **Saldo = soma do histórico**: para todo dono, `amount = Σ(credit) − Σ(debit)` em `transactions` (SC-003).
   Garantido porque saldo e transação são gravados na **mesma instrução** (research D3); a checagem 11 do
   `verify-deploy` confere.
2. **Sem saldo negativo**: a guarda `WHERE amount >= $v` do débito recusa antes de gravar (`402`); o `CHECK` da
   tabela é a rede de segurança caso um bug escape do adaptador.
3. **Operação idempotente tem efeito único**: a unicidade `(owner_id, idempotency_key)` aborta a instrução inteira
   do segundo pedido concorrente (saldo incluído), que então devolve o resultado do primeiro (SC-005). Com o
   Prisma, o erro chega embrulhado; o reconhecimento é provado pela corrida da mesma chave (research D14).
4. **Isolamento por dono**: toda consulta filtra por `owner_id` vindo **exclusivamente** do token verificado (007
   FR-013); nunca de corpo, cabeçalho ou query.
5. **Nada é legível sem a API**: o banco só aceita a credencial em `DATABASE_URL`, que existe apenas nas variáveis
   do projeto; não há URL pública de objeto (SC-004).

## Transições de estado de uma operação

```text
pedido ─► com chave já gravada, mesma direção e valor ──► 200 com o resultado original (nada gravado)
      ├─► com chave já gravada, direção ou valor diferentes ──► 409 idempotency_key_conflict
      ├─► débito sem saldo ou acima do saldo ──► 402 insufficient_balance (nada gravado)
      ├─► chave nova, mas outro pedido com a mesma chave grava primeiro (violação de unicidade, D14)
      │        ──► instrução desfeita por inteiro ─► relê a chave ─► mesmas regras de replay/409
      └─► aceito ──► saldo e transação gravados juntos ──► 200 com o saldo novo
```

## Dados antigos

Não há migração de dados (research D10): cada ramo Neon remoto começa vazio, e o admin é recriado por
`seed-admin` com **senha nova**. O ramo de desenvolvimento, que já tem as tabelas da revisão 2, recebe *baseline*
(`migrate resolve --applied 0_init`) e mantém os dados. Os objetos antigos do Blob são apagados depois da promoção
verificada (T043).

Tabela de controle nova: `_prisma_migrations`, criada e mantida pelo Prisma Migrate; nenhuma rota a lê.
