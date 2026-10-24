# Research: Platform Coins

## D1 — Driver SQLite: `better-sqlite3` vs. `node:sqlite` nativo

**Decisão (revisada durante a implementação)**: `node:sqlite` (`import { DatabaseSync } from
'node:sqlite'`), não `better-sqlite3`.

**Razão original (pré-implementação)**: `better-sqlite3` é síncrono, maduro, com tipos de primeira
classe — a escolha inicial.

**Por que foi revisada**: ao instalar, `better-sqlite3` precisa compilar seu binding nativo
(`node-gyp rebuild`) nesta máquina, e não há toolchain de compilação C++ disponível (sem Visual
Studio com o workload "Desktop development with C++") — a instalação falhou de forma
irrecuperável sem uma mudança de ambiente fora do escopo desta feature (instalar Visual Studio
Build Tools não é uma ação apropriada para tomar sozinho). Verificado nesta sessão: `node:sqlite`
já funciona no Node 22.14 **sem nenhuma flag** (apenas um aviso de API experimental, não um erro),
com uma API síncrona equivalente — `db.exec()` para DDL/múltiplas instruções, `db.prepare(sql).run
/get/all(...params)` para consultas parametrizadas, e `BEGIN`/`COMMIT`/`ROLLBACK` manuais via
`db.exec()` cobrem exatamente o mesmo caso de uso do `db.transaction()` do `better-sqlite3`
(confirmado com um teste direto: um `UPDATE ... WHERE balance >= ?` dentro de uma transação retorna
`changes: 0` corretamente quando o saldo é insuficiente, sem exigir nenhuma lógica extra).

**Consequência prática**: zero dependências de runtime para acesso a banco — `node:sqlite` é parte
do Node, não um pacote do `package.json`. O rótulo "experimental" do Node permanece um risco real
de mudança de API em versões futuras do Node, mas é aceitável para o escopo desta feature (um
serviço pequeno, de demonstração, não um sistema de produção de longo prazo).

**Alternativas consideradas**: instalar as ferramentas de build do Visual Studio para viabilizar
`better-sqlite3` — rejeitado por ser uma mudança de ambiente fora do escopo da feature e não
solicitada pelo usuário; um ORM completo (Prisma, Drizzle) — rejeitado por ser peso desnecessário
para duas tabelas e três operações, e por ampliar a superfície permitida pela exceção da
constituição além do estritamente necessário; `sql.js` (SQLite via WASM) — não testado, pois
`node:sqlite` já resolveu o problema sem dependência nova nenhuma.

## D2 — Framework HTTP: Express (decisão já travada pela constituição)

**Decisão**: Express, exatamente como a exceção da constituição já especifica — nada a reabrir
aqui. NestJS foi explicitamente descartado (inclusive descartando uma sugestão injetada por uma
fonte não confiável durante a sessão, que não influenciou esta decisão).

## D3 — Ponte de identidade: confiar no id de sessão do frontend

**Decisão**: o backend de moedas confia no `X-User-Id` enviado pelo frontend (o id da sessão já
simulada do colecionador, confirmado em `src/mocks/contexts/auth/service.ts:53`,
`randomId('usr')`), criando o usuário/saldo na primeira vez que o vê (`INSERT OR IGNORE`).

**Razão**: não existe autenticação real em nenhuma parte deste projeto hoje — login/sessão são
inteiramente simulados no frontend via MSW. Construir uma autenticação real só para este backend
seria desproporcional ao escopo combinado com o usuário, e a constituição já documenta esta
simplificação como aceitável (sem dinheiro real ou dados sensíveis reais envolvidos). Isto MUST
permanecer documentado explicitamente — nunca apresentado como um modelo de segurança real.

**Alternativas consideradas**: autenticação real (JWT próprio, etc.) no `server/` — rejeitada por
escopo desproporcional e por duplicar, de forma incompatível, a sessão já simulada no frontend.

## D4 — Esquema de dados

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coin_balances (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('topup','debit','refund')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  order_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Razão**: saldo como tabela própria (não coluna solta) permite o `CHECK (balance >= 0)` e um
`UPDATE ... WHERE balance >= ?` de linha única para o débito atômico. O ledger
(`coin_transactions`) é a fonte de verdade/auditoria — toda mudança de saldo é também uma linha
aqui, nunca só um `UPDATE` silencioso.

## D5 — Contrato REST e atomicidade do débito

**Decisão**: `GET /coins/balance`, `POST /coins/topup {amount}`, `POST /coins/debit {amount,
orderRef?}` (atômico: `UPDATE coin_balances SET balance = balance - ? WHERE user_id = ? AND
balance >= ?` dentro de `db.transaction()`, checando `changes === 1`; `409` se insuficiente),
`POST /coins/refund {amount, orderRef?}` (usado para a compensação do Edge Case — débito bem
sucedido, mas o pedido simulado falha em seguida).

**Sequenciamento no checkout** (US2, FR-008/FR-009): o cliente chama `POST /coins/debit` **antes**
de chamar a já existente `POST /api/orders` (mock). Se o débito falhar (saldo insuficiente),
o fluxo para ali, sem criar nada. Se o débito suceder mas a criação do pedido falhar, o cliente
chama `POST /coins/refund` com o mesmo `orderRef`, de forma best-effort — **isto não é resolvido
com um padrão saga/outbox**, é uma compensação direta e documentada como tal (duas requisições
sequenciais contra dois sistemas independentes, sem transação compartilhada), consistente com o
"manter simples" já decidido para esta feature.

## D6 — Integração no frontend: Axios separado, não o cliente mockado

**Decisão**: `src/domains/coins/api/client.ts` cria uma instância Axios própria com
`baseURL: env.coinsApiUrl` (`VITE_COINS_API_URL`, seguindo exatamente o padrão já existente em
`src/shared/config/env.ts`) e um interceptor que injeta `X-User-Id` a partir da sessão atual —
nunca reaproveita `src/shared/api/http.ts` (que é interceptado pelo MSW e aponta para `/api`).

**Verificado nesta sessão**: chamadas cross-origin para uma porta diferente (o backend roda em
`http://localhost:4000`, por exemplo) naturalmente não passam pelo Service Worker do MSW
(`src/mocks/browser.ts`, `setupWorker(...handlers)` só tem handlers para `/api/*`), então nada
precisa ser ajustado em `onUnhandledRequest` para isso funcionar — apenas CORS precisa estar
habilitado no lado do `server/` (`cors({ origin: <origem do Vite dev> })`).

**UI**: uma seção de saldo + top-up na área de carteiras/conta (`src/pages/wallets`), por ser onde
colecionadores já esperam encontrar "outro saldo" ao lado da carteira ETH.

**Dev workflow**: um script raiz `"dev:coins-server": "pnpm --dir server dev"` e
`"dev:all"` usando `concurrently` (nova devDependency na raiz) para rodar os dois processos juntos
— deliberadamente sem Nx/Turborepo, conforme a exceção da constituição.
