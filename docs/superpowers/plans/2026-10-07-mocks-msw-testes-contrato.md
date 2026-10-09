# Mocks MSW (REST + Socket.IO) + Testes de Contrato — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** implementar a única fonte de dados falsos do projeto (handlers REST MSW, 18 cenários determinísticos, eventos Socket.IO via `@mswjs/socket.io-binding`, persistência/reset) e os testes de contrato Vitest que validam cada endpoint contra os schemas zod derivados de `docs/api/`.

**Architecture:** contrato (zod) em `src/lib/http/schemas.ts` é a fonte única — handlers validam request **e** garantem response com ele; estado em memória (`src/mocks/db`) hidratado/sincronizado em `localStorage gm_db_v1`; cenários são um *gate* transversal (latência/erro/offline) + hooks por recurso consultados pelos handlers; eventos socket são emitidos pelos mesmos mutations que mudam REST (nunca efeito direto na UI).

**Tech Stack:** MSW `^2.15` (peer do `@mswjs/socket.io-binding`; não usar msw 3.x), `@mswjs/socket.io-binding ^0.2`, `socket.io-client`, `axios`, `decimal.js`, `zod ^4` (presente), `vitest ^5`.

**Decisões de execução (usuário):** branch `main`, **sem commits** (reviews analisam working tree); 18º cenário `socket-queda` aprovado; fixtures usam os paths documentados das imagens (extração Figma fica para outra fase).

---

## Contexto verificado

| Fato | Consequência |
| --- | --- |
| Scaffold existe (`package.json`, `src/`, alias `@/`, tema) mas não há `lib/http`, `lib/money`, `lib/socket`, axios/msw/vitest nem scripts `typecheck`/`test:contract` | T0/T1 criam a fundação mínima de rede exigida pela tarefa |
| `tsc -b` falha hoje: `tsconfig.app.json` sem `paths @/*` e sem `strict` | T0 corrige (gate de verificação exige typecheck limpo) |
| `docs/MOCKS.md` §4 tem 17 cenários; tarefa pede 18; §6/§8 cita queda socket "via cenário" | Criar 18º `socket-queda` + atualizar MOCKS.md §4 |
| `public/assets/nft/` e `scripts/figma-extract.ts` não existem | Fixtures usam os 4 paths de `docs/api/nfts.md`; extração em fase própria |
| Binding API: `ws.link(regexp).addEventListener('connection', conn => toSocketIo(conn))`; emit para browser = `io.client.emit(type, evento)`; cliente precisa `transports: ['websocket']` | T11 |
| `msw@2.15.0` exporta `ws`; network-error do v2 é `HttpResponse.error()` | gate `offline` |
| Delays tornariam a suíte lenta/não-determinística | `sleep()` retorna 0 sob `process.env.VITEST` (documentado) |

**Decisões de contrato (doc+código juntos — divergências anotadas no T12):**
- Reset restaura seed e **mantém** o cenário ativo (switcher reaplica).
- `/_mock/*` fora do gate offline/latência (plano de controle sempre acessível).
- `POST /orders` ordem: body → idempotência → estoque-hook → estoque (409 `INSUFFICIENT_STOCK`) → `quoteVersion` (409 `QUOTE_STALE`) → cupom/carteira → criação.
- `nao-autorizado` força 403 em qualquer `GET /orders/:id`; `cadastro-conflito` força 409 p/ qualquer e-mail; `validacao-api` = 422+fields em profile/senha/carteiras; `cupom-ruim` rejeita `LAUNCH10`/`GREEN5` (422) além de `EXPIRED` (410) e desconhecidos (422).
- `DELETE /api/wallets/:id → 403` e `PATCH` com `address → 403` (linhas novas em `docs/api/wallets.md`).
- `padrao` auto-confirma pedido em 3000 ms fixo; `pagamento-recusado` → `declined` em 3000 ms.

---

## Mapa de arquivos

```
CRIAR:
  .env.example                       src/vite-env.d.ts
  vitest.config.ts                   tsconfig.test.json  (+ refs em tsconfig.json)
  src/lib/money.ts
  src/lib/http/{schemas.ts,endpoints.ts,client.ts}
  src/lib/socket/events.ts           (schemas zod dos 2 eventos + tipos)
  src/types/api.ts
  src/mocks/{browser.ts,server.ts,handlers/index.ts}
  src/mocks/handlers/{_shared.ts,session.ts,nfts.ts,favorites.ts,cart.ts,quote.ts,orders.ts,profile.ts,wallets.ts,mock-control.ts}
  src/mocks/db/{store.ts,persist.ts,reset.ts}
  src/mocks/fixtures/{index.ts,nfts.ts,users.ts,coupons.ts,wallets.ts,orders.ts}
  src/mocks/scenarios/{types.ts,index.ts,gate.ts,timers.ts}
  src/mocks/sockets/handlers.ts
  src/mocks/ui/{switcher.tsx,mount.tsx}
  tests/contract/{setup.ts,helpers.ts,session,nfts,favorites,cart,quote,orders,profile,wallets,scenarios}.spec.ts
  public/mockServiceWorker.js        (msw init)
MODIFICAR:
  package.json (deps+scripts)  tsconfig.app.json (strict+paths)  tsconfig.node.json (vitest.config.ts)
  src/main.tsx (bootstrap mocks + switcher)  AGENTS.md, docs/MOCKS.md, docs/ESTRUTURA.md, docs/api/wallets.md
```

Guarda de arquitetura: `src/mocks/**` importa de `src/lib/**` (permitido); o contrário = zero.

---

## T0 — Dependências e tooling

1. `pnpm add axios decimal.js socket.io-client` · `pnpm add -D msw@^2.15.0 @mswjs/socket.io-binding@^0.2.0 vitest@^5`
2. `package.json` scripts: `"typecheck": "tsc -b"`, `"test:contract": "vitest run"`, `"lint:fix": "eslint . --fix"`.
3. `tsconfig.app.json`: `"strict": true`, `"baseUrl": "."`, `"paths": { "@/*": ["./src/*"] }`.
4. `tsconfig.node.json` include `["vite.config.ts", "vitest.config.ts"]`; novo `tsconfig.test.json` (extends app, `types: ["vite/client","node"]`, `include: ["src","tests"]`); referenciar em `tsconfig.json`.
5. `vitest.config.ts`:
```ts
import path from 'node:path'
import { defineConfig } from 'vitest/config'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'node',
    include: ['tests/contract/**/*.spec.ts'],
    setupFiles: ['tests/contract/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
})
```
6. `pnpm exec msw init public/ --save`.
7. `src/vite-env.d.ts`: `interface ImportMetaEnv { readonly VITE_MOCKS?: string; readonly VITE_MOCK_UI?: string; readonly VITE_MOCK_SCENARIO?: string; readonly VITE_API_BASE_URL?: string }` + `interface ImportMeta { readonly env: ImportMetaEnv }`.
8. `.env.example`: `VITE_MOCKS=true`, `VITE_API_BASE_URL=`, `VITE_MOCK_SCENARIO=`, `VITE_MOCK_UI=0`, `FIGMA_TOKEN=`.
9. Verificar: `pnpm typecheck` → exit 0.

## T1 — Dinheiro + contratos (zod) + instância Axios

**`src/lib/money.ts`** (único lugar com cálculo de ETH):
```ts
import Decimal from 'decimal.js'
const D = Decimal.clone({ precision: 34, rounding: Decimal.ROUND_HALF_UP })
export type Eth = string
export const parseEth = (v: Eth): Decimal => new D(v)
export const zeroEth = (): Eth => '0'
export const addEth = (a: Eth, b: Eth): Eth => formatEth(parseEth(a).add(b))
export const subEth = (a: Eth, b: Eth): Eth => formatEth(parseEth(a).sub(b))
export const cmpEth = (a: Eth, b: Eth): number => parseEth(a).cmp(parseEth(b))
export const mulQty = (price: Eth, qty: number): Eth => formatEth(parseEth(price).mul(qty))
export const percentOf = (amount: Eth, percent: number): Eth => formatEth(parseEth(amount).mul(percent).div(100))
export function formatEth(v: Eth | Decimal, maxDecimals = 18): Eth {
  const s = (v instanceof D ? v : parseEth(v)).toDecimalPlaces(maxDecimals).toFixed()
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}
```

**`src/lib/http/schemas.ts`** — fonte única (APIs do zod 4: `z.email()`, `z.uuid()`, `z.iso.datetime()`, `z.coerce.number()`, `z.record`, `z.discriminatedUnion`):

| Grupo | Schemas |
| --- | --- |
| primitivos | `ethSchema` (`/^\d+(\.\d{1,18})?$/`), `isoDateSchema`, `addressSchema` (`/^0x[a-fA-F0-9]{40}$/`), `uuidSchema` |
| erro | `apiErrorCodeSchema` = enum dos 14 códigos de `docs/api/README.md` §3; `errorEnvelopeSchema` `{error:{code,message,fields?,requestId?}}` |
| paginação | `pageSchema` (coerce int ≥1 default 1), `pageSizeSchema` (coerce int 1–48 default 12) |
| sessão | `userPublicSchema`, `sessionSchema`, `signupRequestSchema` (name 2–60, email, senha ≥8+letra+dígito), `loginRequestSchema` (email, password min1, `anonymousId?` uuid) |
| NFT | `nftSchema` (modelo completo de `nfts.md`), `nftListQuerySchema`, `nftListResponseSchema` |
| favoritos | `favoritesResponseSchema` `{ids,count}` |
| carrinho | `cartItemSchema`, `cartSchema`, `addCartItemRequestSchema`, `patchCartItemRequestSchema` |
| cotação | `couponSchema`, `quoteRequestSchema`, `quoteSchema`, `couponValidateRequestSchema`, `couponValidateResponseSchema` |
| pedidos | `orderStatusSchema`, `orderItemSchema`, `orderSchema`, `createOrderRequestSchema` |
| perfil | `profileSchema`, `profilePatchSchema` (name 2–60, username /^[a-z0-9._]{3,30}$/, bio ≤280, avatarUrl data-URL png/jpeg ≤512KB), `passwordRequestSchema` (newPassword ≠ atual via refine) |
| carteiras | `walletSchema`, `walletsListResponseSchema`, `createWalletRequestSchema`, `patchWalletRequestSchema` |
| controle | `SCENARIO_IDS` (18 ids `as const`), `scenarioIdSchema`, `resetResponseSchema`, `scenarioStateSchema {id, source}`, `setScenarioRequestSchema`, `setScenarioResponseSchema` |

**`src/lib/socket/events.ts`** (importa primitivos de `http/schemas` — sem ciclo): `nftUpdatedEventSchema` / `orderUpdatedEventSchema` (com `ts`), `nftUpdatedRequestSchema` / `orderUpdatedRequestSchema` (omit `ts`), `emitRequestSchema` (discriminated union), tipos `NftUpdated`, `OrderUpdated`, `EmitRequest`.

**`src/lib/http/endpoints.ts`**: objeto `endpoints` com os 25 paths (`detail(id)` com `encodeURIComponent`).

**`src/lib/http/client.ts`**:
```ts
export const HTTP_TIMEOUT_MS = 10_000
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: HTTP_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
})
```

**`src/types/api.ts`**: re-export dos tipos inferidos (`Nft`, `Cart`, `Quote`, `Order`, `Profile`, `Wallet`, `Session`, `UserPublic`, `ErrorEnvelope`, `ApiErrorCode`, `ScenarioId`, eventos…).

Verificar: `pnpm typecheck && pnpm lint`.

## T2 — DB + fixtures determinísticas

**`persist.ts`**: `safeStorage()` (localStorage ou Map em memória p/ node), `loadDb/saveDb/clearStorage` na chave `gm_db_v1`.
**`store.ts`**: `MockDb { nfts, users, sessions, carts: Record<OwnerKey,Cart>, favorites, wallets, orders, idempotency, quoteVersions, seq, flags }`; `getDb()` hidrata; `mutate(fn)` aplica+persiste; `bumpQuoteVersion(owner)`; `ownerOf(userId?, anonId?)`.
**`reset.ts`**: `resetDb()` → `clearAllTimers()` + `replaceDb(createSeedDb())` + save.

**Fixtures**:
- `nfts.ts` — 64 NFTs puros/determinísticos: 6 hero (`golden-signal-160` "0.99", `sage-nomad-009`, `golden-frequency-071`, `violet-nomad-314`, `golden-beat-207` "0.02", + 1 hero "12.30"); demais gerados `kurio-<slug>-<n>`; coleção alterna `Kurio Editions`/`Kurio Apes`.
  - **Categorias AND**: `categories = unique([CATS[i%5], CATS[Math.floor(i/5)%5]])` (+ `CATS[(i+3)%5]` se `i%7===0`) → garante todos os 10 pares (teste de cobertura no `nfts.spec`).
  - `image = IMAGES[i%4]` com os 4 paths de `docs/api/nfts.md`; `images = [image]`.
  - `available` pool ≥1 com `SOLD_OUT={11,34,57}` → 0; `editable=false` em `{7,19,46}`; `previousPrice` (i%6) via `percentOf(price,120)`; `edition.total ∈ {1,10,25,50,100}`; `favoritesCount=(i*7)%130`; `version:1`; datas ISO fixas (`2026-08-01T12:00:00.000Z + i*86400000`), sem `Date.now`.
- `users.ts`: ana (`Ana12345`, favoritos `["golden-signal-160","sage-nomad-009"]`, carteiras, carrinho 2 itens, pedidos seed) e bruno (`Bruno1234`, enxuto); senha `hash:`+`pseudoHash()` (djb2 hex).
- `coupons.ts`: `LAUNCH10` (percent 10), `GREEN5` (percent 5), `EXPIRED` (percent 15, expiresAt 2020), `FAKE` (marcador não persistido → 422).
- `wallets.ts`: `wal_ana_principal` (ethereum, isPrimary) + `wal_ana_ens` (sepolia, ensName "ana.eth").
- `orders.ts`: `ord_seed_confirmed` + `ord_seed_pending` com snapshot/quoteVersion fixos.
- `index.ts`: `createSeedDb()` (quoteVersions=1, seq zerados).

## T3 — Cenários

- `types.ts`: `RequestKind`, `LatencyFn`.
- `index.ts`: `resolveScenario()` (precedência URL → runtime/POST → `gm_scenario` → `VITE_MOCK_SCENARIO` → `padrao`), `getScenario`, `setScenario`, `scenarioIs`, `isTestEnv`, `sleep` (0 em Vitest), `applyUrlScenarioParam` (grava+strip+reload 1×), `applyResetUrlParam` (reset+strip).
- `gate.ts` (chamado no início de todos os handlers REST):
```ts
if (kind === 'control') return undefined
if (scenarioIs('offline')) return HttpResponse.error()
await sleep(latency(kind, url))
if (scenarioIs('erro-5xx') && (kind==='list'||kind==='detail')) return err(500,'INTERNAL',…)
if (scenarioIs('erro-4xx') && kind==='detail') return err(404,'NOT_FOUND',…)
```
  Latência padrao fixa por recurso em 150–400 (auth 200, list 300, detail 250, favorites 150, cart 180, quote 200, coupons 150, orders 400, profile 200, wallets 200, other 150, control 0); `lento` 3000; `latencia-varia` list = `clamp(200, 2400 − (page−1)·600 + fnv1a(method+url)%400, 2500)` (garante fora de ordem), demais `200 + seed%800`.
- `timers.ts`: `schedule`/`clearAllTimers` (unref quando suportado).
- Hooks: `forceEmptyCatalog`, `forceSessionExpired`, `forceForbiddenOrder`, `forceSignupConflict`, `forceFormValidationError`, `forceCouponRejection`, `orderOutcome`, `dropStockBeforeConfirm` (zera available + version++ + espelho cart + bumpQuoteVersion + emite `nft.updated`), `armPriceChange` (preco-muda: 6000 ms após quote com `golden-signal-160`, preço 0.99→1.19, available 8→5, emite `nft.updated`).

## T4 — Infra de handlers + harness de teste (TDD)

**`_shared.ts`**: `fnv()` p/ `requestId` determinístico (`req_`+4 hex), `err(status,code,message,fields?)`, `validation(issues)` (path→fields), `parse(schema,data)`, `requireSession` (401 `UNAUTHORIZED` sem/desconhecido; 401 `SESSION_EXPIRED` expirado ou `forceSessionExpired`), `requireCartOwner` (Bearer OU `x-anonymous-id`; nenhum → 401), `requireIdempotencyKey` (uuid v4 → senão 422 `fields.idempotencyKey`), `json`, `echo` (garante response com schema).

**`mock-control.ts`**: `POST /api/_mock/reset` → `{ok:true}`; `GET /api/_mock/scenario` → `{id,source}`; `POST` → `{ok:true,id}` (id inválido → 422 `fields.id`); `POST /api/_mock/emit` → valida `emitRequestSchema`, monta `ts`, chama `emitSocketEvent`.

**`server.ts`**: `setupServer(...restHandlers)` (REST+controle; sem ws).

**Harness**: `tests/contract/setup.ts` (`http.defaults.baseURL='http://localhost'`, `server.listen({onUnhandledRequest:'error'})`, `beforeEach` → `POST /_mock/reset` + `POST /_mock/scenario {id:'padrao'}`, `afterAll` → `server.close()`); `helpers.ts` (`req`, `loginAs`, `ANON_ID`, `expectEnvelope` com `errorEnvelopeSchema.parse`, `expectValidationError`).

**`session.spec.ts` (TDD, ~10)**: signup 201/422 name/422 senha/409 ana; login 200/401 sem fields; merge anônimo no login; GET session 200/401; logout 204 idempotente + reuso 401. Depois `handlers/session.ts`.

## T5 — NFTs (+ spec ~12)
list default (total 64) · busca q · vazio 200 · **categorias AND + cobertura dos 10 pares** · min/max inclusivo · min>max 422 · sorts · page 99 vazio com total real · pageSize 49 → 422 · detalhe 200 · **404**. `handlers/nfts.ts` com hook `vazio`, tiebreak por id.

## T6 — Favoritos (+ spec ~7)
401 sem token · GET ana · PUT idempotente · PUT 404 NFT inexistente · DELETE 200 idempotente · DELETE 404 inexistente · isolamento bruno.

## T7 — Carrinho (+ spec ~10)
GET anônimo vazio · add 201 · add 404 · add >available **409 `INSUFFICIENT_STOCK`** · qty 0 → 422 · PATCH ok/404/409 (sem alterar) · DELETE 200/404 · isolamento por owner. Espelho de preço do catálogo; toda mutação bumpa `version` + `quoteVersion`.

## T8 — Cotação/cupons (+ spec ~8)
carrinho vazio 422 · `LAUNCH10` (assert exato: discount=percentOf, total=sub−desc+"0.0042") · sem cupom · `FAKE` **422 `COUPON_INVALID`** · `EXPIRED` **410 `COUPON_EXPIRED`** · validate 200/422/410 · item esgotado 409 · `quoteVersion` estável entre quotes e muda após mutação.

## T9 — Pedidos (+ spec ~12 — idempotência)
201 pending (snapshot do servidor) · **replay mesma chave → 200 idêntico** · chave+payload divergente → **409 `IDEMPOTENCY_CONFLICT`** (pedido original intacto) · sem header → 422 · **`QUOTE_STALE`** (quote → PATCH cart → envio com versão antiga; requote → 201) · wallet 404 / rede 422 / sem sessão 401 · GET próprio 200 / outro **403** / desconhecido 404 · padrao auto-confirma em ≤5 s (poll) com txHash/explorerUrl e remove só itens comprados · `pagamento-recusado` → declined + carrinho íntegro · recibo imutável.

`handlers/orders.ts` ordem: gate → session → idempotency key → parse body → lookup chave (hash canônico `{coupon,walletId,network,quoteVersion}`: igual→200, diferente→409) → `dropStockBeforeConfirm()` → estoque 409 → `quoteVersion` 409 → cupom 422/410 → carteira 404 → cria `ord_000N` + grava chave + agenda settle 3000 ms; `timeout-pedido` persiste antes de `sleep(15000)` e replay responde 200 na hora. `settle` emite `order.updated`; confirmed remove itens comprados.

## T10 — Perfil e carteiras (+ specs 8/9)
Perfil: GET · PATCH ok persiste · name curto 422 · username duplicado **409 `fields.username`** · username inválido 422 · bio 281 422 · avatar tipo errado 422 · senha errada `fields.currentPassword` / regras `fields.newPassword` / ok 204 e sessão segue ativa.
Carteiras: lista (isPrimary único) · bruno vazio · POST 201 · endereço duplicado 409 `fields.address` · 3ª carteira 409 `fields.form` ("Limite de duas carteiras atingido") · endereço malformado 422 · PATCH inverte principal · rede com pedido pendente 409 · **DELETE 403** · **PATCH address 403** · 404 id · 403 de outro usuário.

## T11 — Socket.IO, bootstrap e switcher
`sockets/handlers.ts`: `ws.link(/\/socket\.io\//)` + `toSocketIo`; `emitSocketEvent` broadcasta `io.client.emit(type, evento)`; `socket-queda` → envia `'41'` após handshake; heartbeat ping `'2'` a 25 s; remove no close. Emit junto de toda mutação REST relevante; nunca tocar UI.
`handlers/index.ts` (`restHandlers` + `handlers` com ws); `browser.ts` (`setupWorker`, `applyResetUrlParam`, `applyUrlScenarioParam`, `start({serviceWorker:{url:'/mockServiceWorker.js'}, onUnhandledRequest:'bypass'})`); `main.tsx` (`MOCKS_ENABLED = VITE_MOCKS !== 'false'`, import dinâmico, switcher só em `DEV || VITE_MOCK_UI==='1'`); switcher flutuante (`bg-surface-card border-border rounded-lg shadow-popover text-xs font-mono`, select cenário 18 opções, select Rede = atalho padrao/lento/offline, botão "Reset cenário", `aria-live`, montagem idempotente).

## T12 — Documentos (doc + código juntos)
1. `docs/MOCKS.md`: §2 reset mantém cenário; §4 **+`socket-queda`** e notas (`nao-autorizado` 403 sempre; `cadastro-conflito` 409 sempre; escopo `validacao-api`; `cupom-ruim` rejeita válidos); §6 shapes dos endpoints de controle + `io.client.emit`/`transports:['websocket']`; §7 latências 0 em Vitest e `/_mock/*` fora do gate offline; limitação: heartbeat/`socket-queda` verificável no Playwright.
2. `docs/api/wallets.md`: DELETE → 403; PATCH com `address` → 403.
3. `docs/ESTRUTURA.md` §2: `lib/http/schemas.ts`, `src/mocks/ui/`, `src/vite-env.d.ts`, `tests/contract/{setup,helpers}.ts`.
4. `AGENTS.md`: célula `pnpm typecheck` → `tsc -b`.
5. Limitações no relatório: imagens pendentes de `fig:extract`; eventos socket verificados estruturalmente nesta fase.

## T13 — Verificação de pronto
```bash
pnpm typecheck                       # exit 0
pnpm lint                            # exit 0
pnpm test:contract                   # verde (~10 arquivos, 80–95 testes)
pnpm dev                             # ?scenario=lento|offline|sessao-expirada; ?reset=1; switcher só em dev
grep -rn "from '@/mocks\|from \"@/mocks\|/mocks/" src/features src/components src/lib   # zero
grep -rn "\bfetch(" src --include='*.ts' --include='*.tsx'                             # zero
grep -rn "parseFloat" src/lib/money.ts src/mocks                                      # zero
```
Relatório final: 25 endpoints × 18 cenários × Nº testes + divergências documentadas.

---

## Cobertura spec → tarefa

| Requisito | Tarefa |
| --- | --- |
| schemas zod + `types/api.ts` | T1 |
| 8 handlers + 100% endpoints, envelope, paginação, merge, idempotência, snapshot, isolamento | T4–T9 |
| mock-control | T4, T11 |
| db store/persist/reset | T2 |
| fixtures | T2 |
| 18 cenários + precedência | T3 + T11 |
| Socket.IO + timers | T3 hooks, T9 settle, T11 |
| Bootstrap | T11 |
| Switcher dev | T11 |
| Vitest + specs 1/recurso + scenarios | T0, T4–T10 |
| Cenários obrigatórios de teste | T8, T9, T10, scenarios.spec |
| Isolamento beforeEach | T4 |
| Verificação + relatório | T13 |

**Fora de escopo:** telas/features, Playwright, a11y visual, deploy, `fig:extract`, `lib/session`/`lib/query`.

---

## Decisões de execução (log)

Registradas durante as revisões — consumidores posteriores DEVEM seguir.

**T0**
- `tsconfig.app.json` sem `baseUrl`/`ignoreDeprecations` (paths resolvem sem baseUrl desde TS 4.1; `ignoreDeprecations "6.0"` mascararia todos os deprecations).
- `.env`/`.env.*` gitignorados (`!.env.example`); `pnpm-workspace.yaml` com `allowBuilds: msw: true` (pnpm 12).

**T1**
- Endpoints: **27 method×path / 22 paths distintos** (o plano cita "25" — imprecisão do plano; cobre tudo o que `docs/api/*` + MOCKS §6 documentam).
- `scenarioSourceSchema` = `url|runtime|storage|env|default` (fonte: precedência §3 — **T3 deve retornar exatamente esses labels** ou o schema muda).
- **`min > max` → 422 NÃO está no schema** (refine de raiz quebraria o mapeamento `fields`): **T5 DEVE** checar no handler via `cmpEth`.
- `createWalletRequestSchema.isPrimary` é obrigatório (doc marca só `ensName`/`note` como opcionais).
- `idempotencyKeySchema` (uuidv4) é o schema do header; `orderSchema.idempotencyKey` é `string` (doc orders.md §1).
- Array de query serializa como chave repetida (`?categories=A&categories=B`) via `paramsSerializer` em `client.ts` — handlers devem ler `getAll('categories')`.

**T4 (pré-requisito)**
- `requireIdempotencyKey` DEVE usar `idempotencyKeySchema.safeParse` (evita 2ª checagem uuid ad-hoc).

**T10 (pré-requisito)**
- `PATCH /api/wallets/:id` com `address` → 403: checar o **body bruto** (`'address' in body`) ANTES de `patchWalletRequestSchema.parse` (o parse faz strip e esconderia o campo; `.strict()` daria 422, não 403).

**Coordenação / fora de escopo deste plano**
- `src/lib/http/errors.ts` (AxiosError→AppError) + interceptors (auth/401): propriedade da fundação da fase 1 (sessão concorrente). Se ausente ao final do T13 → reportar como pendência.
- `src/lib/session/guards.ts` (sessão concorrente) declara `Session`/`UserPublic` duplicados → sugerir `import type { Session } from '@/types/api'`; não editar (não é nosso escopo).
- `.prettierrc` tem `semi: true` mas o repo é semicolo-less → **não rodar `prettier --write`** sem decisão; reportar no T13.
- `ARCHITECTURE.md` §4 documenta `formatEth(v, { maxDecimals })`; código/ plano usam argumento posicional `maxDecimals = 18` → alinhar doc no T12/T13.
- `z.iso.datetime()` (default) aceita só `Z` — fixtures e docs usam `Z`; sem impacto.
- Sessão paralela é dona de `src/routes|features|lib/session|lib/query|router|main.tsx|tests/contract/{setup,routes.spec}*` — não commitar nada (decisão do usuário) e não editar esses caminhos.

**T2**
- `timers.ts` criado já no T2 (sequencing aprovado) — T3 é dono e estende.
- OwnerKey = `user:<id>` | `anon:<uuid>`; maps são `Partial<Record<OwnerKey,…>>`.
- **T7 obrigação:** chaves ausentes (bruno/anon) devem sintetizar cart vazio (`items:[]`, subtotal `0`, itemCount 0, version 1) e favoritos `{ids:[],count:0}`.
- **T12 obrigação:** `docs/MOCKS.md` §2 lista "coupons" dentro de `gm_db_v1`, mas cupons são fixture estática (`fixtures/coupons.ts`) — reconciliar o doc (não é persistido).
- Cupons: `LAUNCH10`/`GREEN5`/`EXPIRED` em `SEED_COUPONS`; `FAKE_COUPON_CODE` é marcador NÃO persistido (→422 no handler).
- 6º hero `crimson-echo-451` @"12.30" (docs só citam 5 display names + "4 PNGs"); `golden-signal-160.available = 8` (T3 preco-muda 8→5; coerente com edition.total=10).
- Imagens: só os 4 nomes derivados dos display names documentados (`golden-signal-160`, `sage-nomad-009`, `golden-frequency-071`, `violet-nomad-314` `.png`) — arquivos pendentes de `fig:extract` (fora de escopo).
- `mutate` usa try/finally (persiste mesmo em throw) + guarda síncrona; `hydrateDb` mergeia seed↔persistido (nested só `seq`/`flags`; top-level parsed vence quando presente); self-heal com `saveDb(seed)` em load inválido.
- Helpers exportados: `toUserPublic` (strip `passwordHash`), `emptyCart(updatedAt?)` (default epoch `1970-01-01T00:00:00.000Z`), `getSeedNft(id)`, `clearDb()`.
- `ownerOf` retorna `OwnerKey | undefined` (NÃO lança) — handler faz `err(401,'UNAUTHORIZED')`.
- **T3:** `schedule(fn, ms)` sob `VITEST` agenda com `ms=0` (mantém async) — decidiu-se aguardar, documentar em MOCKS §7 no T12.
- **Gate riscos T13:** `pnpm typecheck` e `pnpm lint` podem estar vermelhos por artefatos da sessão concorrente (`size="icon-sm"` em dialog/sheet; `.worktrees/**` sem ignore no eslint) — portões intermediários usam escopo `src/mocks`/`src/lib`; T13 decide correção mínima se persistir.
