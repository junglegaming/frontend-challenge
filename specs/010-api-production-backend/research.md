# Research: Back-end de produção (`apps/api`)

Sem `NEEDS CLARIFICATION` pendente. Cada decisão abaixo responde a um requisito da spec.

## D1: Armazenamento — Postgres gerenciado (Neon) no lugar do Vercel Blob

**Decision**: guardar saldo, transações e administradores em **PostgreSQL** (Neon, integração do Vercel
Marketplace, que injeta a URL de conexão como variável de ambiente do projeto). Autorizado pela emenda
constitucional 1.5.0.

**Rationale**: o defeito medido (12 → 4) vem de o Blob não ter escrita condicional atômica e de leituras logo
após a escrita serem obsoletas; o hash do admin é legível porque o SDK só grava `access: "public"`. Um banco
relacional resolve as duas coisas de uma vez: atomicidade por instrução/transação (FR-004, FR-005), restrições
de integridade (`CHECK`, `UNIQUE`) e acesso apenas por credencial do servidor (FR-008). Também remove o
problema do CDN anti-bot sob rajada, porque nenhuma leitura passa mais por URL pública.

**Alternatives considered**:
- *Redis (Upstash)*: `INCRBY`/Lua são atômicos, mas o invariante "saldo = soma do histórico" e a listagem
  paginada de donos/admins ficam artesanais; dois tipos de dado, nenhum vencedor claro. Rejeitado.
- *Derivar o saldo do log append-only no Blob*: elimina a perda de atualização, mas mantém admin e dados em URL
  pública (viola FR-008) e a listagem por prefixo é eventualmente consistente. Rejeitado.
- *Manter Blob com mais tentativas*: já medido; a leitura obsoleta não some com retry. Rejeitado.
- *Vercel KV/Edge Config*: não são armazenamento transacional de uso geral. Rejeitado.

## D2: Acesso ao banco: Prisma Client sobre `@prisma/adapter-neon` em modo HTTP (`PrismaNeonHttp`)

**Decision** (revisão 3, pedido "colocar orm prisma"; depende da emenda 1.6.0): um `PrismaClient` criado de forma
preguiçosa, um por instância da função (`apps/api/src/lib/db.ts`), com o adaptador
`new PrismaNeonHttp(DATABASE_URL, {})`. Por baixo, o adaptador usa o mesmo `@neondatabase/serverless` em modo HTTP
da revisão 2. Falta de `DATABASE_URL` continua sendo `500 missing_database_url`.

**Rationale**: o Prisma 7 só conversa com o Neon serverless por adaptador, e o modo HTTP mantém as vantagens da
revisão 2: sem socket nem pool por instância, nada a esgotar na rajada de 50 operações e sem handshake a cada
partida a frio (SC-006). Limitação verificada no código do adaptador 7.10.1: em HTTP, `startTransaction` rejeita
com `"Transactions are not supported in HTTP mode"`, o que vale para `$transaction` interativo **e** em lote.
Isso não afeta o desenho, porque a única escrita que precisa ser atômica é uma instrução só (D3, D12).

**Alternatives considered**:
- *`PrismaNeon` (WebSocket/`Pool`)*: oferece `$transaction`, mas reintroduz conexão por instância e só é
  necessário se a escrita atômica for feita com transação interativa, o que D12 rejeita. Fica como plano B se
  um dia houver escrita atômica de várias instruções. Rejeitado por ora.
- *`@neondatabase/serverless` direto (revisão 2, já implementada)*: atende a spec, mas não o pedido de ORM.
  Substituído.
- *`pg` com `Pool({ max: 1 })`* (escolha da primeira versão deste plano): dava paridade com Postgres em Docker,
  mas a emenda 1.5.0 fixa `@neondatabase/serverless` e proíbe outro driver. Rejeitado.
- *`@neondatabase/serverless` em modo WebSocket (`Pool`/`Client`)*: permite `BEGIN … COMMIT` interativo, mas
  reintroduz conexão por instância sem necessidade (D3 dispensa a transação interativa). Rejeitado.

## D3: Atomicidade em **uma instrução** SQL (sem laço de retry)

**Decision**: crédito e débito são, cada um, um único comando com CTE que altera o saldo e insere a linha em
`transactions` com o saldo e a versão resultantes:
- **crédito**: `INSERT INTO balances … ON CONFLICT (owner_id) DO UPDATE SET amount = balances.amount + $v`
  (cria o saldo na primeira operação);
- **débito**: `UPDATE balances SET amount = amount - $v WHERE owner_id = $o AND amount >= $v`.

Se o débito não couber (ou o dono não tiver saldo), o `UPDATE` não devolve linha, a transação não é inserida e o
serviço responde `402`. O Postgres serializa as escritas na mesma linha e, em `READ COMMITTED`, reavalia o `WHERE`
sobre a versão mais nova da linha depois de esperar o bloqueio; então 50 operações concorrentes entram em fila,
nenhuma se perde e nenhum débito passa a guarda com um saldo antigo.

**Rationale**: uma instrução é atômica por definição; saldo e histórico entram juntos ou não entram (spec US2
cenário 4). Elimina o `ConcurrencyConflictError` e o "tentar uma vez" do serviço atual.

**Alternatives considered**: transação interativa `BEGIN … SELECT … FOR UPDATE … COMMIT` — correta, mas
exige reter a conexão entre idas e voltas e é mais lenta em serverless; a instrução única dá a mesma garantia.
Nível `SERIALIZABLE` com retry — complexidade desnecessária para uma linha por dono.

**Com Prisma (revisão 3)**: a mesma instrução, executada por `prisma.$queryRaw` (ver D12).

## D4: Invariante "saldo = soma do histórico" garantido pelo banco

**Decision**: `CHECK (amount >= 0)` na tabela de saldo e uma consulta de auditoria
(`SELECT owner_id, saldo, soma_historico`) usada pela verificação (SC-003). Nenhuma escrita altera um lado sem
o outro (D3).

**Rationale**: a restrição torna impossível um saldo negativo mesmo se houver bug no serviço (FR-005).

## D5: Idempotência por `Idempotency-Key` opcional

**Decision**: `POST /coins/topup` e `/coins/debit` aceitam o cabeçalho opcional `Idempotency-Key`. A chave é
gravada em `transactions` com `UNIQUE (owner_id, idempotency_key)`. Mesma chave + mesmo valor/direção →
devolve o resultado original sem reaplicar; mesma chave + valor diferente → `409 idempotency_key_conflict`.
Sem a chave, o comportamento é o atual.

**Rationale**: FR-007. A unicidade no banco evita a corrida entre dois pedidos com a mesma chave. É aditivo:
clientes existentes (`apps/web`) continuam funcionando sem mudança (FR-014).

**Alternatives considered**: chave só em memória/cache — perde-se entre instâncias serverless. Rejeitado.

## D6: Administradores no banco, mesmas garantias de segurança

**Decision**: tabela `admins(id, email UNIQUE, password_hash, role, created_at)`. `id` continua sendo o
`sha256` do e-mail normalizado (compatível com o token já emitido). O hash scrypt, o login indistinguível e o
`dummyHash` não mudam. O script `seed-admin.ts` lê `ADMIN_EMAIL`/`ADMIN_PASSWORD` do ambiente e usa o
repositório.

**Rationale**: FR-008/FR-009/FR-010 — só o armazenamento muda; nenhuma garantia de segurança é enfraquecida.

## D7: Esquema e migrações com Prisma Migrate

**Decision** (revisão 3): `apps/api/prisma/schema.prisma` é a fonte do esquema, com modelos mapeados para as
tabelas e colunas que já existem (`@@map`/`@map`, ver `data-model.md`). A migração inicial
`prisma/migrations/0_init/migration.sql` é gerada com `prisma migrate diff --from-empty --to-schema` e recebe à
mão as restrições `CHECK` (o Prisma não as modela), ficando equivalente ao DDL de `src/db/schema.ts`.
`pnpm db:migrate` passa a ser `prisma migrate deploy`, rodado manualmente em cada ambiente, nunca em tempo de
requisição. `src/db/schema.ts` e `scripts/migrate.ts` são removidos.

- **Conexão do Migrate**: `prisma.config.ts` aponta o Migrate para `DATABASE_URL_UNPOOLED` (conexão direta do
  Neon; o Migrate usa bloqueio consultivo, que o *pooler* em modo transação não garante). O *runtime* continua
  em `DATABASE_URL` por HTTP. O arquivo lê `process.env` sem o helper `env()`, para que `prisma generate` (que
  não precisa de banco) funcione sem nenhuma variável, inclusive no deploy.
- **Ramo de desenvolvimento já existente** (tabelas criadas pela revisão 2): *baseline*. Confirmar que
  `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` sai vazio (no
  Prisma 7, `--from-url` foi removido; a URL vem do `prisma.config.ts`), conferir os `CHECK` em `pg_constraint`
  (o diff do Prisma não os compara) e então
  `prisma migrate resolve --applied 0_init`. Preview e produção ainda não foram provisionados (T039) e começam
  limpos com `migrate deploy`.
- **Mudanças futuras**: `prisma migrate dev --create-only`, revisar/editar o SQL (CHECKs), aplicar.

**Rationale**: histórico versionado e revisável no PR, com tabela de controle (`_prisma_migrations`) e caminho
claro para mudanças não aditivas, que a revisão 2 já previa precisar um dia. Os `CHECK` continuam no banco, que é
a rede de segurança de FR-005.

**Alternatives considered**:
- *Manter `schema.ts` idempotente e usar o Prisma só como cliente* (`prisma db pull`): duas fontes de verdade
  para o esquema. Rejeitado.
- *`prisma db push`*: sem histórico de migrações; aceitável só em protótipo. Rejeitado para preview/produção.

## D8: Implantação — a correção do 404 já existe; falta implantar e promover

**Decision**: manter `framework: null` + `buildCommand: ""` + rewrite `/api/(.*)` → `/api/index`
(`apps/api/vercel.json`), implantar um preview, rodar `verify-deploy.mjs`, e só então promover a produção e
verificar o alias. Documentado no quickstart, com volta à versão anterior por `vercel rollback`.

**Rationale**: o preset `express` cria uma função catch-all que colide com `api/index.ts` (diagnóstico da 007
T022). A 007 provou o preview; faltou promover. Separar "corrigir o 404" de "trocar o banco" permite entregar
US1 sozinha (prioridade P1).

## D9: Verificação única e executável contra qualquer ambiente

**Decision**: `scripts/verify-deploy.mjs` com as checagens do contrato `verification-suite.md`, incluindo 50
operações concorrentes e tentativa de leitura direta sem credencial; reaproveita as funções de
`smoke-test.mjs`/`admin-smoke-test.mjs`. Sai com código ≠ 0 e mensagem clara se algo falhar (FR-012, US4).

**Rationale**: um comando prova o ambiente (SC-007, < 5 min). Contra preview protegido, aceita
`PROTECTION_BYPASS` como a 008.

## D10: Dados de demonstração antigos são descartados

**Decision**: produção começa com banco vazio; o admin inicial é recriado por `seed-admin`. Nada é migrado do
Blob. Os objetos antigos do store de Blob são removidos depois da troca (e o store, se não houver outro uso).

**Rationale**: Assumption da spec (dados de demonstração). Migrar saldo e hash de um armazenamento público só
para preservar dados fictícios não compensa; descartar também elimina o hash que já esteve exposto — e como ele
esteve legível, a senha do admin de demonstração deve ser **trocada** ao recriar o admin.

**Alternatives considered**: script de migração Blob → Postgres — mais código para dados sem valor, e
perpetuaria o hash exposto. Rejeitado.

**Relação com a constituição 1.5.0** ("a migração MUST ser testada de ponta a ponta antes de o Blob deixar de
ser usado"): "migração" é a troca de armazenamento, e o teste exigido é o `verify-deploy` completo no preview já
ligado ao Neon (T041), antes da promoção que tira o Blob da produção (T042) e antes de apagar o Blob (T043).

## D11: Desenvolvimento local contra um ramo Neon, não Postgres em Docker

**Decision**: o `.env.local` de `apps/api` aponta para um **ramo Neon de desenvolvimento** (obtido com
`vercel env pull .env.local` ou criado no console do Neon). Preview e produção usam ramos próprios. Nenhum
ambiente compartilha ramo com outro.

**Rationale**: consequência direta de D2: o driver HTTP fala com o *endpoint* HTTP do Neon, não com um Postgres
comum na porta 5432. Usar o próprio Neon no desenvolvimento dá paridade real de SQL, de driver e de comportamento
de erro (código `23505` na violação de unicidade, usado no replay de idempotência). Ramos do Neon são baratos e
descartáveis.

**Alternatives considered**:
- *Postgres em Docker + proxy HTTP local do Neon* (`local-neon-http-proxy`): funciona, mas acrescenta um container
  e uma configuração de `fetchEndpoint` só para o desenvolvimento, sem ganho para uma demo. Rejeitado.
- *Repositório em memória para desenvolvimento*: útil para testar o serviço, mas não exercita o SQL de
  atomicidade, que é exatamente o que precisa ser provado. Rejeitado como ambiente de desenvolvimento.

## D12: Com Prisma, a escrita atômica continua sendo **uma instrução**, via `$queryRaw`

**Decision**: o adaptador `PrismaCoinsRepository` usa a API tipada do Prisma para tudo, **exceto** a operação que
altera o saldo e grava a transação: essa continua sendo a CTE de D3, executada com `prisma.$queryRaw` (*tagged
template*, parâmetros ligados) e com as linhas validadas por Zod. Leituras (`getBalance`, `listTransactions`,
busca por chave de idempotência) e todo o adaptador de admin (`findUnique`, `upsert` nativo com `ON CONFLICT`,
listagem paginada de donos) usam a API tipada.

**Rationale**: a API tipada do Prisma não expressa "atualiza o saldo **e** insere a transação" num comando só.
Fazer isso com o ORM puro exigiria `$transaction` interativo (`updateMany` com `amount: { gte }` →
`findUnique` → `create`), que:
1. não existe no modo HTTP (D2), e obrigaria a trocar para WebSocket;
2. seguraria o bloqueio da linha do saldo por três idas e voltas em vez de uma; com 50 operações concorrentes
   no mesmo dono, as últimas esperariam a fila inteira e se aproximariam do `timeout` padrão de 5 s da transação
   interativa (risco direto para SC-002 e SC-006).

A instrução única mantém o mesmo tempo de bloqueio da revisão 2, que já passou 10/10 (T022).

**Alternatives considered**:
- *ORM puro com `$transaction` interativo sobre `PrismaNeon` (WebSocket)*: correto, mas com os dois custos acima.
  Rejeitado; é o plano B de D2 se surgir uma escrita de várias instruções.
- *TypedSQL (`prisma/sql/*.sql` + `prisma generate --sql`)*: tiparia a CTE, mas a geração precisa de conexão com
  o banco, o que tornaria o `postinstall` do deploy (D15) dependente de `DATABASE_URL`. Rejeitado.
- *`$queryRawUnsafe`*: proibido pela emenda proposta; nenhum ganho.

## D13: Versões exatas dos pacotes Prisma

**Decision**: `prisma`, `@prisma/client` e `@prisma/adapter-neon` fixados em **`7.10.1`** (sem `^`).

**Rationale**: verificado no registro npm em 2026-10-24: o dist-tag `latest` de `prisma` aponta para
`8.0.0-rc.27` (o `prev` é `7.10.1`), enquanto `@prisma/client` e `@prisma/adapter-neon` estão em `7.10.1`.
`pnpm add prisma` sem versão traria uma CLI 8 RC gerando cliente para um runtime 7. As três versões MUST andar
juntas. O adaptador declara `@neondatabase/serverless` `>0.6.0 <2`, compatível com o `^1.2.0` já instalado.

**Alternatives considered**: Prisma 8 RC — pré-lançamento, fora de questão para produção. Prisma 6 — exige motor
binário por padrão e o gerador antigo; sem motivo para regredir.

## D14: Erro de unicidade da chave de idempotência sob Prisma

**Decision**: o adaptador reconhece a violação de `UNIQUE (owner_id, idempotency_key)` por um helper único
(`isUniqueViolation`): `PrismaClientKnownRequestError` com `code === "P2002"` (API tipada) **ou** `code === "23505"`
(SQLSTATE cru). **Confirmado por teste em 2026-10-24** (Prisma 7.10.1 + `PrismaNeonHttp`): numa corrida de 20
escritas com a mesma chave via `$queryRaw`, 19 falham com `PrismaClientKnownRequestError`, `code: "23505"`, sem
`meta`, e a mensagem cita a restrição `transactions_owner_idempotency_key`. A primeira versão do helper esperava
`P2002`/`P2010` com causa em `meta.driverAdapterError`; não reconhecia o erro real e os pedidos perdedores viravam
`500` (o efeito continuava único). A corrida de 20 pedidos simultâneos com a mesma chave (como na T022; gate T026)
tem de dar 1 efeito e 20 respostas `200` iguais: 5 de 5 execuções passaram após a correção.

**Rationale**: na revisão 2 o driver devolvia `err.code === "23505"` direto; com o Prisma no meio, o erro é
embrulhado. Se o helper não reconhecer o erro, o pedido perdedor da corrida vira `500` (o efeito continua único
graças ao índice, mas a resposta fica errada). O teste de corrida é o gate.

## D15: Cliente gerado: `postinstall`, sem tocar no `vercel.json`

**Decision**: gerador `prisma-client` do Prisma 7 com `output = "../src/generated/prisma"`,
`moduleFormat = "esm"` e `importFileExtension = "js"` (casa com `module: nodenext` do `tsconfig`). O diretório
gerado **não** é versionado (`apps/api/.gitignore`) e fica fora do `oxlint`. `apps/api/package.json` ganha
`"postinstall": "prisma generate"`; a raiz ganha `"prisma"` e `"@prisma/engines"` em
`pnpm.onlyBuiltDependencies` (o pnpm 10 bloqueia os scripts de instalação desses pacotes; verificado: `prisma` tem
`preinstall` e `@prisma/engines` baixa o motor de esquema usado pelo Migrate). `vercel.json` continua com
`buildCommand: ""`.

**Rationale**: o `vercel.json` atual é a correção do `404` da produção (D8), e mexer nele reabre esse risco. O
`postinstall` roda em toda instalação (local e Vercel), então `typecheck`, `lint`, `dev:local` e o deploy sempre
têm o cliente. O Prisma 7 não tem binário de consulta: o compilador vem como JS com WASM em base64
(`query_compiler_fast_bg.postgresql.*` em `@prisma/client/runtime`), então o empacotador da Vercel o rastreia como
JS comum. O preview (T041) prova que o cliente chegou à função antes da promoção.

**Alternatives considered**:
- *`buildCommand: "prisma generate"`*: funciona, mas altera a configuração que corrigiu o `404`. Rejeitado.
- *Versionar o cliente gerado*: arquivos grandes e gerados no PR, risco de ficar fora de sincronia com o
  `schema.prisma`. Rejeitado.
