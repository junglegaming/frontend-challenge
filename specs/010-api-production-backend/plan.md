# Implementation Plan: Back-end de produção (`apps/api`) funcionando de verdade

**Branch**: `010-api-production-backend` | **Date**: 2026-10-24 (revisão 3: Prisma ORM) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-api-production-backend/spec.md` + pedido do usuário: "colocar orm prisma"

## Summary

Três defeitos reais, dois com a mesma causa: o Vercel Blob **não é um banco**. Ele não tem escrita condicional
atômica (o saldo perde atualizações: 12 → 4 medido) e só serve objetos por URL pública (o hash do admin fica
legível). O plano guarda os dados no **Postgres do Neon** e, a pedido do usuário, passa a acessá-lo pelo
**Prisma ORM 7** (`@prisma/client` com o adaptador `@prisma/adapter-neon` em modo HTTP, que usa por baixo o mesmo
`@neondatabase/serverless`). O Prisma assume o esquema (`schema.prisma`), as migrações (Prisma Migrate) e todas as
leituras e escritas simples; a **única** escrita que precisa ser atômica (alterar saldo + gravar a transação)
continua sendo **uma instrução SQL** executada por `prisma.$queryRaw`, porque o modo HTTP não oferece transação e
uma transação interativa seguraria o bloqueio da linha por várias idas e voltas (research D3, D12). As portas
`CoinsRepository`/`AdminRepository` não mudam: só os adaptadores trocam de Neon puro para Prisma. O contrato HTTP
não muda.

**Pré-requisito**: a constituição 1.5.0 diz "nenhum ORM" e "acessado só por `@neondatabase/serverless`". Este
plano propõe a **emenda 1.6.0** (Complexity Tracking) como primeira tarefa; nenhum código Prisma entra antes dela.

**Histórico das revisões**: 1ª versão: driver `pg` + Docker; 2ª: realinhada à 1.5.0 (`@neondatabase/serverless`
direto, esquema em `src/db/schema.ts`), já implementada; 3ª (esta): Prisma sobre o adaptador Neon.

## Technical Context

**Language/Version**: TypeScript ~6.0 (`module`/`moduleResolution: nodenext`), Node 24 (projeto Vercel `24.x`),
Express 5 (inalterados).

**Primary Dependencies**: adiciona `@prisma/client@7.10.1` e `@prisma/adapter-neon@7.10.1` (dependências) e
`prisma@7.10.1` (dev), versões **exatas**: o dist-tag `latest` do pacote `prisma` aponta hoje para
`8.0.0-rc.27`, enquanto client e adaptador estão em 7.10.1 (research D13). Mantém `@neondatabase/serverless`
(dependência do adaptador, `>0.6.0 <2`, compatível com o `^1.2.0` atual), `express`, `cors`, `zod`,
`jsonwebtoken`, `oxlint`, `tsx`, `vercel`.

**Storage**: Postgres no Neon, um ramo por ambiente (desenvolvimento, preview, produção). Esquema em
`apps/api/prisma/schema.prisma` mapeado para as tabelas existentes (`balances`, `transactions`, `admins`);
migrações versionadas em `apps/api/prisma/migrations/` com as restrições `CHECK` escritas à mão no SQL gerado
(o Prisma não modela `CHECK`). `src/db/schema.ts` e `scripts/migrate.ts` saem.

**Testing**: `scripts/verify-deploy.mjs` (14 checagens, `--repeat N`) contra local, preview, produção e o
`/backend` do site; `smoke-test.mjs` e `admin-smoke-test.mjs` existentes; corrida de 20 pedidos com a mesma
`Idempotency-Key` (prova o mapeamento de erro do Prisma, research D14). e2e do `apps/web` inalterado (SC-008).

**Target Platform**: Vercel Serverless Functions (Node), projeto `nft-marketplace-api`, domínio
`nft-marketplace-api-ochre.vercel.app`; o site chega por `/backend/*`.

**Project Type**: web-service dentro do monorepo pnpm+Nx (alvo: `apps/api`).

**Performance Goals**: SC-006: p95 ≤ 2 s em produção, inclusive a primeira chamada após inatividade em ≥ 90% das
vezes. O Prisma 7 não tem motor binário (o compilador de consultas vem como WASM em base64 dentro do JS), mas
aumenta o pacote da função; a checagem 14 mede a partida a frio antes da promoção.

**Constraints**: contrato HTTP inalterado (FR-014); `server/` e `apps/web` intocados (FR-015); `DATABASE_URL` e
`DATABASE_URL_UNPOOLED` só em variável de ambiente (FR-010); SQL cru só por *tagged template* parametrizado
(`$queryRaw`), nunca `$queryRawUnsafe`/`$executeRawUnsafe`; o cliente gerado não é versionado e precisa existir
no deploy, com `vercel.json` intocado (`framework: null`, `buildCommand: ""`; research D15).

**Scale/Scope**: demo; dezenas de donos, 50 operações concorrentes por saldo. Mudança: 1 emenda, `schema.prisma` +
1 migração inicial, `prisma.config.ts`, `lib/db.ts`, 2 adaptadores de repositório, scripts e documentação.

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1. Base: constituição **v1.5.0** (2026-10-24).*

| Princípio / Seção | Avaliação |
|-------------------|-----------|
| I. Camadas e fronteiras | N/A para `apps/web`. Em `apps/api` (SOLID/DDD): rotas → serviços → portas → adaptadores **Prisma**. Os tipos gerados pelo Prisma ficam **dentro** dos adaptadores; serviços e rotas continuam vendo só os contratos do domínio (`CoinBalanceRecord`, `AdminRecord`). |
| II. Tipagem estrita | OK. Sem `any`. O cliente gerado tipa as consultas do ORM; as linhas do `$queryRaw` continuam validadas com Zod; `BigInt` do Prisma é convertido para `number` seguro na borda do adaptador. |
| III–VII (SPA) | N/A: o `apps/web` não muda; e2e contra mocks (SC-008). |
| Exceção `apps/api` 1.5.0: "**nenhum ORM**" | **VIOLAÇÃO.** Prisma é um ORM. Justificada pelo pedido explícito do usuário; resolvida pela **emenda 1.6.0** (Complexity Tracking), tarefa de entrada. |
| Exceção 1.5.0: "acessado **só** por `@neondatabase/serverless`" | **VIOLAÇÃO parcial.** O transporte continua sendo `@neondatabase/serverless` (o adaptador o usa), mas o código passa a falar com o Prisma. A emenda 1.6.0 reescreve a regra para "Prisma Client com `@prisma/adapter-neon`; nenhum outro driver". |
| Exceção 1.5.0: concorrência "feita pelo banco (`UPDATE ... WHERE amount >= $1` atômico)" | **OK.** A instrução única de D3 é mantida, agora via `$queryRaw`. |
| Exceção 1.5.0: `DATABASE_URL` só em variável de ambiente | **OK**, estendido a `DATABASE_URL_UNPOOLED` (usada só pelo Prisma Migrate). `prisma.config.ts` lê do ambiente e não contém valor. |
| Exceção 1.5.0: "migração testada de ponta a ponta antes de o Blob deixar de ser usado" | **OK, com ordem obrigatória.** Produção ainda roda o código Blob; promover (T042) só depois do `verify-deploy` verde no preview já com Prisma (T041). |
| Exceção 1.4.0 (admins) | **OK**, preservado (FR-009): scrypt, `role: "admin"`, login indistinguível, `/admin/*` somente leitura. |
| Exceção `server/` (1.1.0) | OK. `server/` não é tocado (FR-015). |
| Fluxo: documentação | Atualizar `apps/api/README.md`, `.env.example`, `specs/008-web-production-env/deploy-environments.md`; registrar 1.6.0 e o Sync Impact Report na constituição. |

**Resultado do gate**: duas violações, **justificadas** (pedido explícito do usuário) e com caminho de resolução
(emenda 1.6.0). O plano segue; a implementação não, até a emenda estar no repositório.

**Pós-Fase 1**: o desenho não acrescenta violações. As escolhas de D12 (SQL cru só para a escrita atômica) e D15
(cliente gerado no `postinstall`, `vercel.json` intocado) evitam tocar em outras regras.

## Project Structure

### Documentation (this feature)

```text
specs/010-api-production-backend/
├── plan.md                         # este arquivo
├── research.md                     # Fase 0: decisões D1–D15
├── data-model.md                   # Fase 1: modelos Prisma ↔ tabelas, invariantes, migração inicial
├── quickstart.md                   # Fase 1: implantar, verificar, reverter
├── contracts/
│   ├── api-delta.md                # Fase 1: contrato HTTP inalterado + Idempotency-Key + matriz de variáveis
│   └── verification-suite.md       # Fase 1: checagens do verify-deploy (FR-012), inalterado
├── checklists/requirements.md
└── tasks.md                        # /speckit-tasks (ou /speckit-converge para anexar as tarefas novas)
```

### Source Code (repository root)

```text
package.json                             # pnpm.onlyBuiltDependencies += "prisma", "@prisma/engines"
.specify/memory/constitution.md          # emenda 1.6.0 (gate)

apps/api/
├── vercel.json                          # INALTERADO (framework:null, buildCommand:"")
├── package.json                         # + @prisma/client, @prisma/adapter-neon, prisma (7.10.1 exatos);
│                                        #   postinstall: prisma generate; db:migrate → prisma migrate deploy
├── prisma.config.ts                     # novo: schema, pasta de migrações, URL do Migrate (DATABASE_URL_UNPOOLED)
├── .env.example                         # + DATABASE_URL_UNPOOLED
├── .gitignore                           # + src/generated/
├── prisma/
│   ├── schema.prisma                    # novo: Balance, CoinTransaction, Admin (@@map nas tabelas atuais)
│   └── migrations/
│       ├── migration_lock.toml
│       └── 0_init/migration.sql         # gerado + CHECKs à mão; idêntico ao DDL atual
├── scripts/
│   ├── migrate.ts                       # REMOVIDO (substituído por prisma migrate deploy)
│   ├── seed-admin.ts                    # usa o repositório (agora Prisma); sem mudança de interface
│   └── verify-deploy.mjs                # inalterado
└── src/
    ├── generated/prisma/                # cliente gerado (não versionado; fora do lint)
    ├── db/schema.ts                     # REMOVIDO (substituído por schema.prisma + migração)
    ├── lib/db.ts                        # PrismaClient preguiçoso com PrismaNeonHttp; 500 missing_database_url
    ├── domains/
    │   ├── coins/
    │   │   ├── repository.ts            # porta: INALTERADA
    │   │   ├── prismaCoinsRepository.ts # novo adaptador (substitui neonCoinsRepository.ts)
    │   │   └── service.ts               # troca só o adaptador padrão injetado
    │   └── admin/
    │       ├── repository.ts            # porta: INALTERADA
    │       ├── prismaAdminRepository.ts # novo adaptador (substitui neonAdminRepository.ts)
    │       └── service.ts               # troca só o adaptador padrão injetado
    └── routes/health.ts                 # SELECT 1 via prisma.$queryRaw; mesmos códigos de erro
```

**Structure Decision**: a mudança fica em `apps/api`, e a troca de Neon puro para Prisma acontece só na camada de
adaptadores: as portas, os serviços (exceto a injeção padrão), as rotas e o contrato HTTP ficam iguais. É a
inversão de dependência que o projeto pede, posta à prova. O cliente gerado vai para `src/generated/prisma` (o
gerador `prisma-client` do Prisma 7 exige `output`) e não é versionado.

## Estado em 2026-10-24 (para `/speckit-converge` ou `/speckit-tasks`)

| Fatia | Situação | Efeito do Prisma |
|---|---|---|
| US1 (deploy) | Entregue (produção e `/backend/health` `200`), ainda com código Blob | nenhum; a próxima promoção leva o Prisma |
| US2 (atomicidade, idempotência) | Pronto com Neon puro; 10/10 sem perda localmente (T022) | refazer o adaptador de moedas e **repetir** o gate (T026), inclusive a corrida da mesma chave |
| US3 (dados privados) | Pronto com Neon puro; falta a execução completa local (T033) | refazer o adaptador de admin; T033 roda já sobre o Prisma |
| US4 (operação) | Documentação feita; T039–T043 pendentes (precisam de confirmação) | `db:migrate` vira `prisma migrate deploy`; nova variável `DATABASE_URL_UNPOOLED`; README e 008 atualizados de novo |

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|----------|----------------------|-------------------------------------------|
| ORM (Prisma) em `apps/api`, contra "nenhum ORM" da 1.5.0 | Pedido explícito do usuário. Ganhos concretos: esquema declarativo e migrações versionadas com histórico (substitui o DDL idempotente feito à mão, que a D7 anterior já previa rever na primeira mudança não aditiva), consultas tipadas sem Zod linha a linha nas leituras simples, ferramenta conhecida pela equipe. | **Manter só `@neondatabase/serverless`**: atende a spec, mas não o pedido. **Drizzle/Kysely**: mais leves, mas não são o que foi pedido; a escolha da ferramenta é do usuário. |
| O código deixa de chamar `@neondatabase/serverless` diretamente | O Prisma 7 só fala com o Neon serverless por meio do adaptador `@prisma/adapter-neon`, que encapsula esse mesmo driver. | Não há forma de usar o Prisma chamando o driver diretamente; a regra é reescrita para "Prisma Client + `@prisma/adapter-neon`, nenhum outro driver". |

**Texto proposto para a emenda 1.6.0** (MINOR, expansão material da exceção `apps/api`; entra por
`/speckit-constitution`): na exceção "Monorepo na Vercel", substituir "acessado só por
`@neondatabase/serverless`; nenhum ORM e nenhum outro banco" por "acessado pelo **Prisma ORM** (`@prisma/client`,
`prisma`) com o adaptador `@prisma/adapter-neon` sobre `@neondatabase/serverless`; nenhum outro ORM, driver ou
banco. Esquema e migrações MUST viver em `apps/api/prisma/` (Prisma Migrate). SQL cru só por *tagged template*
parametrizado (`$queryRaw`), nunca pelas variantes `Unsafe`. `DATABASE_URL` e `DATABASE_URL_UNPOOLED` só em
variável de ambiente." Manter todo o resto da exceção literalmente.

## Riscos e dependências

| Risco | Efeito | Tratamento |
|---|---|---|
| Emenda 1.6.0 não aprovada | Prisma não entra | O código Neon puro já atende a spec; sem a emenda, segue-se com ele (plano da revisão 2) |
| Cliente gerado ausente no deploy (Vercel instala, mas `prisma generate` não roda) | A função quebra na importação: `/api/*` responde `500` | `postinstall` em `apps/api` + `onlyBuiltDependencies` na raiz (D15); o preview (T041) prova antes da promoção |
| Forma do erro de unicidade em `$queryRaw` sob adaptador | O replay idempotente concorrente vira `500` em vez de devolver o resultado original | Helper que reconhece `P2002` e o erro de consulta crua com causa de violação de unicidade (D14); a corrida de 20 pedidos com a mesma chave é gate |
| Pacote da função maior (cliente Prisma + compilador WASM) | Partida a frio mais lenta (SC-006) | Checagem 14 no preview antes de promover; se estourar, documentar e medir de novo após o aquecimento |
| `latest` do `prisma` é RC (8.0.0-rc.27) | Instalar sem versão traria CLI 8 com client 7 | Versões exatas 7.10.1 nos três pacotes (D13) |
| Banco de desenvolvimento já tem as tabelas (criadas por `schema.ts`) | `migrate deploy` falharia ao recriar | *Baseline*: `migrate diff` vazio, então `migrate resolve --applied 0_init` (D7); preview e produção ainda não existem e começam limpos |
| Migrate por conexão com *pooler* | Bloqueio consultivo do Migrate falha | Migrate usa `DATABASE_URL_UNPOOLED` (conexão direta); o *runtime* usa `DATABASE_URL` por HTTP |
| Proteção anti-bot recusa rajada do mesmo IP | Falso negativo na concorrência | `verify-deploy` conta à parte (inalterado) |
| Senha do admin de demonstração já esteve legível | Hash exposto | Seed remoto com **senha nova**; Blob apagado (T043) |
