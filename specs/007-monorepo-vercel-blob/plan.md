# Implementation Plan: Monorepo na Vercel com Vercel Blob

**Branch**: `007-monorepo-vercel-blob` | **Date**: 2026-10-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-monorepo-vercel-blob/spec.md`

## Summary

Reestrutura o repositório em um workspace **pnpm + Nx** com dois apps implantáveis na Vercel:
`apps/web` (a SPA React existente, movida sem mudança de comportamento) e `apps/api` (um backend
novo, independente do `server/` existente da feature 006, implantado como Vercel Serverless
Functions). O back-end de `apps/api` é um app **Express** (mesmo framework de `server/`, pedido
explícito do usuário), montado atrás de uma única function catch-all da Vercel. `apps/api` persiste
dados exclusivamente via **Vercel Blob**, inclusive dados estruturados (saldo + ledger de transações
de um recurso de exemplo), usando controle de concorrência otimista em nível de aplicação já que
Blob não tem transações nativas. Toda rota de `/coins/*` exige um token assinado (JWT) obtido em
`POST /auth/token`; o id do dono de cada requisição vem exclusivamente da claim verificada do token,
nunca de um header confiado como antes — fechando o vetor trivial de "trocar um header e agir como
outro usuário" (a emissão do token em si continua confiando no id pedido, limitação documentada,
já que o projeto não tem login real em lugar nenhum). As rotas Express ficam organizadas por recurso
(`/auth/token`, `/coins/balance|topup|debit|transactions`) e são documentadas em
`contracts/api-routes.md`. O `server/` e a spec/plan da 006 não são tocados.

## Technical Context

**Language/Version**: TypeScript ~6.0 (React 19.2) para `apps/web`, inalterado; Node.js 22 +
TypeScript para `apps/api`, rodando no runtime Node.js da Vercel.

**Primary Dependencies**: `apps/web` — nenhuma nova dependência de produto (mesmo Axios/TanStack
Query/Zod já usados). Workspace — `nx` (orquestração/cache/grafo de projetos sobre o pnpm existente,
devDependency raiz), `vercel` CLI (dev local + deploy, devDependency). `apps/api` — `express`,
`cors`, `@vercel/blob` (SDK de storage), `jsonwebtoken` (assinatura/verificação de JWT, ver
research.md D10), `zod` (validação de borda, mesmo padrão do resto do projeto), dev-only
`typescript`/`@types/express`/`@types/cors`/`@types/jsonwebtoken`/`@types/node`; **sem** driver de
banco relacional.

**Storage**: Vercel Blob (key→arquivo) para tudo que `apps/api` persiste — sem banco relacional. Um
registro de saldo é um JSON em `coins/balances/<ownerId>.json` com campo `version` para concorrência
otimista; cada transação é um JSON imutável em `coins/transactions/<ownerId>/<timestamp>-<txId>.json`
(ver research.md D5/D6 para o porquê dessa escolha e seus limites).

**Testing**: `apps/web` — suíte Playwright existente, inalterada (continua só contra MSW). `apps/api`
— um script de verificação standalone (mesmo padrão do `server/scripts/smoke-test.mjs` da 006)
rodando contra `vercel dev`, cobrindo topup/debit/saldo-insuficiente e um cenário de escrita
concorrente na mesma chave (valida FR-008/SC-003).

**Target Platform**: Vercel — `apps/web` como projeto de hosting estático/SPA, `apps/api` como
projeto de Serverless Functions; ambos com deploy próprio e independente.

**Project Type**: monorepo web-application — workspace pnpm+Nx com dois apps implantáveis
(`apps/web`, `apps/api`), sem `packages/*` compartilhados por ora (nada precisa ser compartilhado
entre os dois runtimes hoje — ver Project Structure).

**Performance Goals**: nenhuma meta nova; mesma escala de demonstração/protótipo do resto do
projeto.

**Constraints**: `server/` e `specs/006-platform-coins/**` MUST NOT ser modificados (FR-002); o
comportamento e os testes existentes de `apps/web` MUST continuar verdes durante e após a migração
para dentro do workspace (SC-004); toda escrita de registro estruturado no Blob MUST usar
concorrência otimista (FR-008), documentada como mitigação, não eliminação, do risco de corrida
(FR-009); nenhuma ferramenta de monorepo pode acoplar o build de um app ao do outro (FR-004/SC-005);
sem banco relacional introduzido (FR-007); toda rota `/coins/*` MUST exigir um token assinado válido,
com o id do dono vindo só da claim verificada (FR-012/FR-013/SC-006/SC-007); emissão do token
(`/auth/token`) continua confiando no id pedido — limitação MUST ficar documentada, nunca escondida
(FR-015).

**Scale/Scope**: 1 workspace Nx novo (raiz + `apps/web` + `apps/api`), 1 backend novo (~10-12
arquivos: rotas + auth + lib de storage/concorrência + validação), 1 recurso de exemplo completo
(saldo/transações em Blob, protegido por token) provando o padrão ponta a ponta, 2 projetos Vercel.

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1 — ver notas abaixo. Depende da emenda
v1.3.0 (seção "Exceção Pontual: Monorepo na Vercel com Vercel Blob", incluindo Express na stack
permitida e o modelo de identidade revisado para token assinado por requisição), já ratificada antes
deste plano.*

| Princípio | Avaliação |
|-----------|-----------|
| I. Camadas e fronteiras | OK para `apps/web`: a árvore interna (`app/routes → pages → domains → shared`) não muda, só o diretório-pai dela (`src/` passa a viver sob `apps/web/`). `apps/api` fica fora dessa árvore e não participa dessa regra, assim como `server/` já não participa. |
| II. Tipagem estrita | OK. `apps/api` é TypeScript estrito, `any` proibido, mesma convenção de `server/`; contratos de Blob e de token tipados em `apps/api/src/lib/storage` e `apps/api/src/lib/auth`. |
| III. Estado remoto | N/A para `apps/api` (ele é o lado servidor). `apps/web` ganha o domínio `ledger` (FR-017 a FR-019): cliente Axios próprio via proxy `/backend`, TanStack Query com chaves por usuário e cancelamento por `signal`, respostas validadas com Zod, mutations com atualização do cache. Sem UI nova ainda. Escritas não usam chave de idempotência porque a API não a suporta (limitação registrada). |
| IV. Tempo real | N/A — nenhum evento Socket.IO novo. |
| V. Mocks só em `src/mocks` | **Exceção explícita, nova (v1.3.0)** — `apps/api`, como `server/` antes dele, é deliberadamente real, não mock. Nada em `src/mocks`/`apps/web` muda. |
| VI. Acessibilidade/responsividade/fidelidade | N/A — nenhuma tela nova nesta feature. |
| VII. Testes e auditoria | Playwright existente continua intacto (SC-004). `apps/api` tem sua própria verificação separada (smoke test contra `vercel dev`, incluindo os casos sem token/token expirado/token de outro owner), documentada no quickstart, não entra no `pnpm test:e2e`. |
| Restrição de stack / "sem Nx/Turborepo" (ligada à exceção de `server/`, 1.1.0) | Essa frase na exceção de 1.1.0 continua valendo **só para `server/`** — ela nunca proibiu Nx no resto do repositório. A introdução de Nx aqui é coberta pela nova exceção v1.3.0, não por uma violação da de 1.1.0. |
| Modelo de identidade (exceção 1.3.0) | `apps/api` exige token assinado verificado em `/coins/*`; a emissão do token (`/auth/token`) ainda confia no id pedido — limitação explicitamente aceita e documentada, idêntica em espírito à de `server/`, só que um passo mais adiante na cadeia. |

Sem violações além das duas exceções já ratificadas na constituição (1.1.0 para `server/`, 1.3.0
para este workspace). Ver Complexity Tracking para o registro formal.

## Project Structure

### Documentation (this feature)

```text
specs/007-monorepo-vercel-blob/
├── plan.md                    # este arquivo
├── research.md                # Fase 0 — decisões D1-D10
├── data-model.md               # Fase 1 — registros Blob + convenção de paths
├── quickstart.md               # Fase 1 — como rodar o workspace, validar rotas e concorrência
├── contracts/
│   └── api-routes.md           # contrato REST de apps/api
└── tasks.md                    # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
pnpm-workspace.yaml              # novo — declara apps/*, packages/*
nx.json                          # novo — config do workspace Nx (targets, cache)
package.json                     # raiz: + nx, vercel (devDeps); scripts "dev", "build", "typecheck"
                                  #   passam a delegar para `nx run-many` escopado por projeto

apps/web/                        # SPA React existente, movida sem mudança de comportamento
├── src/                         # idêntico ao `src/` atual (app/routes, pages, domains, shared, mocks)
├── e2e/                         # suíte Playwright existente, movida junto
├── public/
├── index.html
├── vite.config.ts
├── tsconfig*.json
├── playwright.config.ts
├── package.json                 # próprio, nome "web", scripts dev/build/typecheck/lint/test:e2e
└── vercel.json                  # config do projeto Vercel de `apps/web` (build estático/SPA)

apps/api/                        # backend novo, independente de server/ — Express, mesma stack de server/
├── package.json                  # próprio, nome "api"; deps: express, cors, @vercel/blob, jsonwebtoken, zod; devDeps: vercel, typescript, tsx, @types/express, @types/cors, @types/jsonwebtoken, @types/node
├── tsconfig.json
├── vercel.json                   # config do projeto Vercel: rewrite de /api/(.*) -> /api/index (runtime Node)
├── .env.example                  # BLOB_READ_WRITE_TOKEN, AUTH_JWT_SECRET, documentados
├── README.md                     # setup, limitação de identidade (emissão confia, uso não), limitação de concorrência do Blob
├── scripts/
│   └── smoke-test.mjs            # verificação standalone (auth: sem token/expirado/token de outro owner; topup/debit/concurrent-write)
├── api/
│   └── index.ts                   # único entry point visto pela Vercel: importa e exporta o app Express
└── src/
    ├── app.ts                     # monta o Express: cors, json parser, routers, error handler (espelha server/src/app.ts)
    ├── server.ts                  # bootstrap `app.listen` opcional, para rodar fora do `vercel dev`
    ├── routes/
    │   ├── health.ts               # router: GET /health
    │   ├── auth.ts                  # router: POST /auth/token (emite JWT para o ownerId pedido)
    │   └── coins.ts                 # router: GET /coins/balance, GET /coins/transactions, POST /coins/topup, POST /coins/debit — todas atrás do middleware de auth
    ├── lib/
    │   ├── blobStore.ts           # get/put JSON no Blob + leitura/escrita com `version` (D5)
    │   ├── auth.ts                  # assina/verifica JWT (jsonwebtoken, segredo via env); middleware requireAuth extrai ownerId só da claim verificada (D10)
    │   └── errors.ts               # middleware de erro Express padronizado (400/401/402/404/409/500)
    └── domains/coins/
        ├── contracts.ts            # CoinBalanceRecord, CoinTransactionRecord
        └── service.ts               # topUp/debit/getBalance com concorrência otimista, recebendo ownerId já autenticado

nx.json + apps/web/project.json + apps/api/project.json   # alvos Nx (build/typecheck/lint/dev) por projeto
```

**Structure Decision**: dois apps implantáveis (`apps/web`, `apps/api`), cada um com seu próprio
projeto Vercel e `package.json` — Nx reconhece os dois como projetos independentes, sem acoplar o
build de um ao do outro (FR-004/SC-005). Nenhum `packages/*` compartilhado é criado nesta feature
(YAGNI — hoje nada precisa ser compartilhado entre o runtime do browser e o runtime serverless); se
uma necessidade real de código compartilhado aparecer depois, um `packages/shared-*` pode ser
adicionado sem reestruturar o que já existe. `server/` permanece exatamente onde está, intocado.

## Complexity Tracking

| Violação (vs. stack original) | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Ferramenta de monorepo (Nx) introduzida no repositório | Pedido explícito do usuário para orquestrar build/typecheck/lint por projeto em dois apps implantáveis separadamente | pnpm workspaces sozinho (sem Nx) resolveria a instalação/linking, mas não dá grafo de tarefas/cache por projeto nem escopo de build independente (FR-004/SC-005) — insuficiente para o que foi pedido |
| Vercel Blob usado para dados estruturados (saldo/transações), não só arquivos | Decisão explícita do usuário, mantida apesar da recomendação em contrário registrada em research.md | Vercel Postgres/KV resolveriam concorrência de forma nativa (transações/INCR atômico), mas foram explicitamente preteridos pelo usuário em favor de Blob para tudo |

Ambas as linhas acima são cobertas pela emenda v1.3.0 da constituição (seção "Exceção Pontual:
Monorepo na Vercel com Vercel Blob", já incluindo Express e o modelo de identidade por token na
stack/comportamento permitidos de `apps/api`), ratificada antes deste plano — nenhuma pendência de
aprovação além do já registrado lá.
