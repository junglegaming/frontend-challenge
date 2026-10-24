---

description: "Task list template for feature implementation"
---

# Tasks: Platform Coins

**Input**: Design documents from `/specs/006-platform-coins/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: `server/scripts/smoke-test.mjs` is this feature's test coverage for the real backend
(the project's existing Playwright suite deliberately stays on the mocked layer only, per the
spec's Assumptions — it is not touched or extended by this feature).

**Organization**: Tasks are grouped by user story (US1–US2 from `spec.md`). US1 includes the
backend's minimum viable scaffolding (schema, identity middleware, app/server bootstrap) since
nothing in US2 can exist without it — this mirrors how prior features in this project handled a
story that is also effectively foundational.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps the task to US1/US2 from `spec.md`
- File paths are exact and relative to the repository root

---

## Phase 1: Setup

- [X] T001 Create `server/package.json` (`"type": "module"`, name `coins-server`, scripts
      `"dev": "tsx watch src/server.ts"`, `"build": "tsc -p tsconfig.json"`,
      `"start": "node dist/server.js"`) and `server/tsconfig.json` (target/module suited to Node
      ESM, `outDir: dist`, `rootDir: src`, `strict: true`).
- [X] T002 [P] Create `server/.gitignore`: `data/*.db`, `data/*.db-journal`, `data/*.db-wal`,
      `node_modules/`, `dist/` — the SQLite file MUST never be committed (plan.md).
- [X] T003 Install `server/`'s dependencies (`pnpm --dir server add express cors zod` and
      `pnpm --dir server add -D typescript tsx @types/express @types/cors @types/node`) — a fully
      standalone package with its own lockfile, per the constitution's v1.1.0 exception (no
      Nx/Turborepo, not part of the frontend's pnpm workspace). **Revised during implementation**:
      no SQLite package dependency — uses Node's built-in `node:sqlite` instead of `better-sqlite3`
      (research.md D1; no C++ build toolchain available in this environment to compile it).
- [X] T004 [P] Add `"dev:coins-server": "pnpm --dir server dev"` and `"dev:all": "concurrently -n
      web,coins -c blue,green \"pnpm dev\" \"pnpm dev:coins-server\""` to the root `package.json`,
      adding `concurrently` as a root devDependency.

## Phase 2: Foundational

Nenhuma tarefa foundational separada — US1 já inclui toda a infraestrutura mínima do backend
(schema, middleware de identidade, app/server) necessária para qualquer coisa nesta feature
funcionar; US2 depende apenas de US1 estar pronto, não de uma fase à parte.

---

## Phase 3: User Story 1 - Top up a coin balance (Priority: P1) 🎯 MVP

**Goal**: um colecionador autenticado consegue ver seu saldo de coins e recarregá-lo, com o saldo
refletido imediatamente e persistente entre sessões.

**Independent Test**: como colecionador com saldo zero/baixo, recarregar um valor e confirmar que
o saldo exibido aumenta exatamente por esse valor, sem efeitos colaterais; recarregar a página e
confirmar que o saldo continua correto.

### Implementation for User Story 1

- [X] T005 [US1] Create `server/src/db.ts`: conexão `node:sqlite` (`DatabaseSync`) com `server/data/coins.db`
      (cria o diretório `data/` se não existir) e migração idempotente no boot
      (`CREATE TABLE IF NOT EXISTS`) para as 3 tabelas exatas de `data-model.md`/`research.md` D4:
      `users(id TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')))`;
      `coin_balances(user_id TEXT PRIMARY KEY REFERENCES users(id), balance INTEGER NOT NULL
      DEFAULT 0 CHECK (balance >= 0))`; `coin_transactions(id TEXT PRIMARY KEY, user_id TEXT NOT
      NULL, type TEXT NOT NULL CHECK (type IN ('topup','debit','refund')), amount INTEGER NOT NULL
      CHECK (amount > 0), order_ref TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))`.
- [X] T006 [US1] Create `server/src/middleware/identity.ts`: lê o header `X-User-Id`; responde
      `401` se ausente; na primeira vez que vê um id, faz
      `INSERT OR IGNORE INTO users (id) VALUES (?)` seguido de
      `INSERT OR IGNORE INTO coin_balances (user_id, balance) VALUES (?, 0)`; anexa o `userId`
      resolvido ao `request` para as rotas usarem (depends on T005).
- [X] T007 [US1] Create `server/src/routes/coins.ts` com as duas rotas desta história:
      `GET /coins/balance` → `200 { userId, balance }`; `POST /coins/topup` com corpo validado via
      `zod` (`amount` MUST ser um inteiro positivo — rejeitar com `400` caso contrário, contrato
      exato em `contracts/coins-api.md`) → dentro de uma `db.transaction()`, insere uma linha em
      `coin_transactions` (`type: 'topup'`), incrementa `coin_balances.balance`, responde
      `201 { userId, balance, transactionId }` (depends on T005, T006).
- [X] T008 [US1] Create `server/src/app.ts`: `express()` com `express.json()`, `cors()` (origem do
      Vite dev), o middleware de identidade montado antes do router de coins, o router de
      `coins.ts` montado em `/coins`, e um middleware final de tratamento de erro que responde um
      formato JSON consistente (depends on T006, T007).
- [X] T009 [US1] Create `server/src/server.ts`: cria o app (T008), escuta em
      `process.env.PORT ?? 4000`, loga a URL de escuta (depends on T008).
- [X] T010 [US1] Create `server/README.md`: instruções de setup/execução, e a documentação
      explícita (exigida pela constituição v1.1.0) de que o modelo de identidade confia no
      `X-User-Id` enviado pelo cliente sem validação real — é uma simplificação aceita, não um
      modelo de segurança real — e como rodar `server/scripts/smoke-test.mjs`.
- [X] T011 [P] [US1] Create `src/domains/coins/model/contracts.ts`: `CoinBalance { userId: string,
      balance: number }`, `CoinTransaction { id: string, type: 'topup'|'debit'|'refund', amount:
      number, orderRef?: string, createdAt: string }`, `export const ETH_TO_COINS_RATE = 1000`
      (data-model.md).
- [X] T012 [US1] In `src/shared/config/env.ts`, add
      `coinsApiUrl: import.meta.env.VITE_COINS_API_URL ?? 'http://localhost:4000'`, following the
      exact existing pattern of the other `env` fields.
- [X] T013 [US1] Create `src/domains/coins/api/client.ts`: uma instância Axios própria
      (`axios.create({ baseURL: env.coinsApiUrl, headers: { 'Content-Type': 'application/json' }
      })`) — nunca reaproveitar `src/shared/api/http.ts` (depends on T012).
- [X] T014 [US1] Create `src/domains/coins/api/queries.ts`: `useCoinsBalance()` e
      `useTopUpCoins()` — cada hook lê o id do usuário autenticado via `useSession()` (já existente
      em `@/domains/auth`) e envia `X-User-Id: <id>` em cada chamada; `useCoinsBalance` fica
      `enabled: false` enquanto não houver sessão; `useTopUpCoins`, ao suceder, atualiza o cache da
      query de saldo com o valor já retornado pela resposta (sem exigir um refetch — FR-003)
      (depends on T011, T013).
- [X] T015 [US1] Create `src/domains/coins/index.ts` (exporta contratos + os dois hooks) e
      `src/domains/coins/README.md` (escopo: backend real em `server/`, não um mock) (depends on
      T011, T014).
- [X] T016 [US1] Create `src/pages/wallets/components/CoinsBalanceSection.tsx`: mostra o saldo
      atual (estados de carregamento/erro) e um campo de valor + botão de recarga, usando os hooks
      de T014 (depends on T015).
- [X] T017 [US1] Wire `<CoinsBalanceSection />` into `src/pages/wallets/WalletsPage.tsx`, junto da
      carteira já existente (depends on T016).
- [X] T018 [US1] Create `server/scripts/smoke-test.mjs`: script Node standalone que faz requisições
      HTTP diretas contra um `server/` já rodando — recarrega duas vezes e confirma que o saldo
      acumula corretamente (`balance` cresce exatamente pela soma dos dois valores) (depends on
      T007, T008, T009).

**Checkpoint**: saldo e recarga funcionam de ponta a ponta, com persistência real confirmada.

---

## Phase 4: User Story 2 - Pay for a purchase with coins (Priority: P2)

**Goal**: no checkout, um colecionador com saldo suficiente consegue pagar com coins em vez de
carteira, chegando à mesma experiência de confirmação; saldo insuficiente é rejeitado com clareza;
uma falha após o débito é compensada com estorno.

**Independent Test**: com um colecionador que já tem saldo suficiente (de US1) e itens no
carrinho, ir ao checkout, escolher pagar com coins, confirmar, e verificar que o pedido é concluído
e o saldo diminui pelo valor exato em coins do total do pedido.

### Implementation for User Story 2

- [X] T019 [US2] Extend `server/src/routes/coins.ts` (de T007): `POST /coins/debit { amount:
      number, orderRef?: string }` — dentro de uma `db.transaction()`, executa
      `UPDATE coin_balances SET balance = balance - ? WHERE user_id = ? AND balance >= ?` e checa
      `changes === 1`; se zero linhas afetadas, responde `409 { error: 'insufficient_balance',
      balance }` sem nenhuma alteração; em sucesso, insere uma linha `coin_transactions`
      (`type: 'debit'`, incluindo `order_ref` se fornecido) e responde
      `200 { userId, balance, transactionId }` (contrato exato em `contracts/coins-api.md`;
      "insuficiente" significa estritamente menor que o necessário, per spec.md Edge Cases — um
      saldo exatamente igual ao valor MUST ser aceito).
- [X] T020 [US2] Extend `server/src/routes/coins.ts` (de T019): `POST /coins/refund { amount:
      number, orderRef?: string }` — mesmo padrão de `topup` (incrementa o saldo, insere linha
      `type: 'refund'`), usado apenas como compensação de um débito anterior que não completou uma
      compra (spec.md Edge Cases, FR-009), não como uma reversão de uso geral pelo colecionador.
- [X] T021 [US2] Extend `server/scripts/smoke-test.mjs` (de T018): adiciona os cenários de débito
      com saldo suficiente (sucesso, saldo decresce corretamente), débito com saldo insuficiente
      (`409`, saldo inalterado) e estorno (saldo volta a subir pelo valor exato), confirmando a
      matemática do saldo em cada passo (depends on T019, T020).
- [ ] T022 [US2] Extend `src/domains/coins/api/queries.ts` (de T014): adiciona
      `debitCoins(userId: string, amount: number, orderRef?: string)` e
      `refundCoins(userId: string, amount: number, orderRef?: string)` como funções assíncronas
      simples (não hooks) — chamadas imperativamente de dentro do `onSubmit` do checkout, não de
      forma declarativa.
- [ ] T023 [US2] Create `src/pages/checkout/components/PaymentMethodPicker.tsx`: escolha entre
      "Carteira" (reaproveita o conteúdo já existente de `WalletPicker`) e "Coins" (mostra o saldo
      atual via `useCoinsBalance()` de T014, e um aviso quando o saldo for insuficiente para o
      total atual do pedido) (depends on T014, T022).
- [ ] T024 [US2] Modify `src/pages/checkout/CheckoutPage.tsx`: adiciona estado `paymentMethod:
      'wallet' | 'coins'`; em `onSubmit`, quando `paymentMethod === 'coins'`: calcula o valor em
      coins a partir do total da cotação atual e de `ETH_TO_COINS_RATE` (T011); chama
      `debitCoins(userId, amount, idempotencyKeyFor(fresh.data.signature))` (reaproveita a mesma
      chave de idempotência já usada pelo pedido, de `@/domains/checkout`) — em caso de `409`,
      mostra a mensagem de saldo insuficiente e para ali, sem criar nada (FR-007); em caso de
      sucesso, prossegue com o `createOrder.mutateAsync(...)` já existente; se essa chamada
      falhar, chama `refundCoins(userId, amount, mesmoOrderRef)` de forma best-effort antes de
      exibir o erro ao usuário (FR-009, research.md D5 — compensação direta, não uma saga) (depends
      on T022, T023).

**Checkpoint**: pagamento com coins funciona de ponta a ponta, incluindo rejeição por saldo
insuficiente e compensação em caso de falha do pedido.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T025 Run `pnpm lint && pnpm typecheck && pnpm build` (frontend) e corrigir qualquer problema
      introduzido por T011–T024.
- [ ] T026 Run a suíte Playwright completa já existente (`pnpm exec playwright test`, sempre
      conferindo a linha real de "N passed/failed", nunca através de `tail`/`head`) e confirmar
      zero regressões (SC-006) — esta feature não deve alterar o comportamento de nenhum teste já
      existente, já que o backend real é arquiteturalmente separado dos mocks.
- [ ] T027 Run `node server/scripts/smoke-test.mjs` contra uma instância de
      `pnpm dev:coins-server` já rodando, e confirmar que todos os cenários passam.
- [ ] T028 Execute os 4 cenários de validação manual de `quickstart.md` (top-up, pagar com coins,
      saldo insuficiente, compensação por falha do pedido) como validação final.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T004)**: sem dependências — rodar primeiro.
- **Foundational**: nenhuma separada — T005–T010 (dentro de US1) já cumprem esse papel.
- **US1 (Phase 3)**: depende apenas do Setup.
- **US2 (Phase 4)**: depende de US1 estar completo (reaproveita `server/src/routes/coins.ts`,
  `src/domains/coins/api/queries.ts` e o hook `useCoinsBalance` já criados em US1).
- **Polish (Phase 5)**: depende de US1 e US2 estarem completos.

### Within Each User Story

- T005 → T006 → T007 → T008 → T009 é uma cadeia sequencial estrita (cada arquivo depende do
  anterior existir).
- T019 e T020 editam o mesmo arquivo (`server/src/routes/coins.ts`) criado em T007 — sequenciais
  entre si.
- T022, T023, T024 formam uma cadeia sequencial (cada um depende do anterior).

### Parallel Opportunities

- T002 e T004 (Setup) são paralelos entre si e com T001/T003 em parte (T002 não depende de nada;
  T004 só depende de T001 existir o suficiente para editar o `package.json` raiz, não do server
  em si).
- T011 (contratos do domínio `coins`) pode começar em paralelo com T005–T009 (backend) — nenhum
  depende do outro até T013/T014.

## Parallel Example: after Setup

```bash
Task: "Create server/src/db.ts with schema migration"        # US1, T005
Task: "Create src/domains/coins/model/contracts.ts"           # US1, T011 (different files, no dependency)
```

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Setup (T001–T004).
2. Complete Phase 3 (US1 — saldo + recarga, incluindo todo o backend mínimo).
3. **Stop and validate**: rodar `server/scripts/smoke-test.mjs` e conferir o saldo na UI de
   carteiras manualmente.
4. Isso sozinho já prova que o backend real funciona; US2 pode vir depois, de forma independente.

### Incremental Delivery

1. Setup → backend + domínio `coins` no lugar.
2. US1 → validar → saldo e recarga funcionam (MVP desta feature).
3. US2 → validar → pagar com coins no checkout funciona, incluindo os casos de borda.
4. Polish (T025–T028) → execução final verde em lint/typecheck/build/e2e/smoke-test.

## Notes

- `[P]` = arquivos diferentes, sem dependência de uma tarefa incompleta.
- `[Story]` mapeia a tarefa para US1/US2; Setup/Foundational/Polish não carregam rótulo de story.
- `server/` nunca entra no `pnpm test:e2e` existente — ele tem sua própria verificação
  (`smoke-test.mjs`), por decisão explícita já registrada na spec e na constituição.
- Nenhuma nova dependência além das listadas em `plan.md`/Setup pode ser introduzida — nem no
  frontend, nem (além da lista já explicitamente permitida) dentro de `server/`.
