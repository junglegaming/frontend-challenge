# 07 — Camada de mocks + testes de contrato

**Onda:** 3 · **Paralela com:** `06-rotas` · **Depende de:** 04, 05 · **Bloqueia:** 08, 09
**Label sugerido:** `mocks` · **Esforço:** G

## Objetivo

Executar o comando **`/mocks`** (`.opencode/commands/mocks.md`): implementar toda a
camada de dados simulados (REST + Socket.IO + cenários) e os testes de contrato que a
validam contra `docs/api/`.

## Como executar

Você vai **implementar** a camada de dados simulados do projeto (REST via MSW, tempo real
via socket.io-binding) e os **testes de contrato** que a validam contra `docs/api/`.
Não implemente telas nem lógica de UI — mocks e testes apenas.

## 0. Pré-condições

- Se `package.json`/`src/` não existirem (scaffolding da fase 1 não executado), **pare e
  avise** para executar o scaffolding antes.
- Leia `AGENTS.md` (regras do projeto, comandos e onde consultar os docs).

## 1. Leitura obrigatória (nesta ordem, antes de escrever código)

| Arquivo                          | O que extrair                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `README.md` §6, §7, §9           | requisitos do enunciado: mocking, tempo real e testes                                                                            |
| `docs/MOCKS.md`                  | **especificação normativa**: ativação, persistência/reset, os 18 cenários, transporte socket, controle em Playwright, limitações |
| `docs/api/README.md`             | envelope de erro, tabela de códigos, convenções (ETH string, paginação, `Idempotency-Key`, `X-Anonymous-Id`)                     |
| `docs/api/*.md` (8 files)        | cada endpoint, payload, regra e erro a mockar                                                                                    |
| `ARCHITECTURE.md` §2, §3, §5, §7 | sessão, tabela de invalidação de cache (eventos devem casar), contrato de eventos `nft.updated`/`order.updated`, `AppError`      |
| `docs/ESTRUTURA.md` §2           | árvore exata de `src/mocks/` e posição de cada arquivo                                                                           |
| `docs/ESTILOS.md` §2             | só se criar o switcher de cenários (identidade visual)                                                                           |

Se algum doc conflitar com outro, o **doc do recurso** (`docs/api/*.md`) vence para o
contrato; `docs/MOCKS.md` vence para comportamento dos cenários. Divergência real →
atualize o doc junto com o código (doc e código sempre juntos).

## 2. Entregável A — camada de mocks

Criar, seguindo a árvore de `docs/ESTRUTURA.md` §2:

1. **Schemas zod** — fonte única dos contratos para request/response
   (`src/lib/http/schemas.ts`, ou local já definido pelo scaffold; `src/types/api.ts`
   re-exporta `z.infer`). Handlers **validam request** e **garantem response** com eles.
2. **Handlers REST** — `src/mocks/handlers/{session,nfts,favorites,cart,quote,orders,profile,wallets}.ts`
   cobrindo 100% dos endpoints de `docs/api/`, com: envelope de erro exato, códigos da
   tabela, paginação/filtros combináveis, merge de carrinho no login, idempotência de
   pedido (replay → mesmo pedido; payload divergente → `409 IDEMPOTENCY_CONFLICT`),
   snapshot imutável do recibo, isolamento por token/`X-Anonymous-Id`.
3. **Controle de mock** — `handlers/mock-control.ts`: `POST /api/_mock/reset`,
   `GET/POST /api/_mock/scenario`, `POST /api/_mock/emit` (formato de `docs/MOCKS.md` §6).
4. **DB** — `src/mocks/db/{store,persist,reset}.ts`: estado em memória hidratado de
   `localStorage gm_db_v1`, sincronizado a cada mutação, reset determinístico ao seed.
5. **Fixtures** — `src/mocks/fixtures/`: 60+ NFTs (≥5 categorias, 0.02–12.30 ETH, 4
   imagens do Figma), 2 usuários (`ana@nft-marketplace.test`/`Ana12345`,
   `bruno@nft-marketplace.test`/`Bruno1234`), 4 cupons (`LAUNCH10`, `GREEN5`, `EXPIRED`, `FAKE`),
   carteiras da Ana, pedidos seed (1 confirmed + 1 pending).
6. **Cenários** — `src/mocks/scenarios/`: todos os 18 da tabela de `docs/MOCKS.md` §4,
   com latência fixa por cenário (nada de aleatório não-semeado), seleção por
   env/`?scenario=`/switcher conforme precedência da §3.
7. **Socket.IO** — `src/mocks/sockets/handlers.ts` com `@mswjs/socket.io-binding`:
   emite `nft.updated`/`order.updated` no formato `ARCHITECTURE.md` §5.1 **sempre que uma
   mutação REST mudar preço/disponibilidade/status** + timers dos cenários (`preco-muda`,
   `pagamento-*`, `timeout-pedido`). Nunca disparar efeito direto na UI.
8. **Bootstrap** — `main.tsx` só carrega mocks quando `VITE_MOCKS` (import dinâmico);
   `src/mocks/browser.ts` e `server.ts` (este para testes).
9. **Switcher dev** — flutuante, montado apenas com `import.meta.env.DEV` ou
   `VITE_MOCK_UI=1`: cenário, status de rede, reset (visual em `docs/ESTILOS.md`).

## 3. Entregável B — testes de contrato

- Runner: **Vitest** (se ausente, adicionar `vitest` devDep, `vitest.config.ts` e o
  script `"test:contract": "vitest run"` no `package.json` — ambiente node).
- Local: `tests/contract/*.spec.ts` (1 arquivo por recurso + `scenarios.spec.ts`),
  usando `setupServer()` do `msw/node` + instância Axios do projeto.
- Cada teste: chama o endpoint real do handler e **valida a resposta com o schema zod**
  correspondente + envelope de erro; cobre happy path e erros principais por recurso.
- Cenários obrigatórios: replay idempotente (mesmo pedido), `IDEMPOTENCY_CONFLICT`,
  cupom inválido/expirado, sessão expirada, `404` de NFT, `INSUFFICIENT_STOCK`,
  `QUOTE_STALE`, reset restaurando o seed.
- Isolamento: reset do store em `beforeEach`; nenhum teste depende de outro.
- Escopo REST apenas — eventos socket são exercitados por Playwright (fase posterior,
  `docs/MOCKS.md` §8).

## 4. Verificação de pronto

1. `pnpm typecheck` e `pnpm lint` limpos.
2. `pnpm test:contract` verde.
3. `pnpm dev`: `?scenario=lento|offline|sessao-expirada` reflete o comportamento;
   `?reset=1` restaura o seed; switcher só aparece em dev.
4. Determinismo: resetar 2× → mesmo estado (ids, preços, contagens).
5. Guardas de arquitetura: `grep -r "from 'src/mocks\|/mocks/" src/features src/components src/lib` → zero importações de mocks fora da camada de rede; nenhum `fetch` direto.
6. Relatório final: endpoints cobertos × cenários implementados × testes verdes,
   e qualquer desvio documentado no doc correspondente.

## 5. Fora do escopo

Telas/features (`src/features/**`), Playwright, a11y visual, deploy, e qualquer endpoint
não previsto em `docs/api/`.

Observações adicionais do usuário: $ARGUMENTS

## Subtasks

### 07.1 — Schemas zod (fonte única)

- Schemas de request/response usados por handlers **e** testes; `types/api.ts` re-exporta

### 07.2 — Handlers REST (8 recursos)

- session, nfts, favorites, cart, quote, orders, profile, wallets — envelope de erro e
  códigos de `docs/api/README.md` §3, idempotência de pedido (replay → mesmo pedido;
  payload divergente → `409`), merge de carrinho no login, isolamento por token/anon

### 07.3 — Endpoints de controle + switcher

- `handlers/mock-control.ts`: `POST /api/_mock/reset`, `GET/POST /api/_mock/scenario`,
  `POST /api/_mock/emit`
- Switcher dev-only (cenário/status/reset) montado só com `DEV` ou `VITE_MOCK_UI=1`

### 07.4 — DB persistente + reset

- Store em memória hidratado de `gm_db_v1`, sincronizado a cada mutação,
  reset determinístico ao seed

### 07.5 — Fixtures

- 60+ NFTs (≥5 categorias, 0.02–12.30 ETH, 4 imagens), 2 usuários
  (`ana@nft-marketplace.test`/`Ana12345`, `bruno@nft-marketplace.test`/`Bruno1234`),
  4 cupons (`LAUNCH10`, `GREEN5`, `EXPIRED`, `FAKE`), carteiras da Ana,
  pedidos seed (1 confirmed + 1 pending)

### 07.6 — Cenários determinísticos

- Os 18 de `docs/MOCKS.md` §4 com latência fixa por cenário; seleção por
  env/`?scenario=`/switcher na precedência da §3

### 07.7 — Socket.IO (eventos + timers)

- `@mswjs/socket.io-binding`: `nft.updated`/`order.updated` no formato
  `ARCHITECTURE.md` §5.1 emitidos **por mutações REST** + timers dos cenários
  (`preco-muda`, `pagamento-*`, `timeout-pedido`)

### 07.8 — Testes de contrato (Vitest)

- `tests/contract/*.spec.ts`: `setupServer()` + Axios do projeto, validação por schema zod,
  happy path × erros por recurso + cenários-chave (replay idempotente, `QUOTE_STALE`,
  cupom, sessão expirada, 404, estoque); `beforeEach` com reset; script `test:contract`

## Critérios de aceite (gate) — §4 do comando `/mocks`

- [x] `pnpm typecheck && pnpm lint && pnpm test:contract` verdes
- [x] `?scenario=lento|offline|sessao-expirada` comprova comportamento no `pnpm dev`
- [x] Reset 2× → mesmo estado · grep sem import de mocks fora da camada de rede

## Evidências de validação — 08/10/2026

- `pnpm typecheck`, `pnpm lint` e `pnpm test:contract` passaram: 33 testes de contrato em 12 arquivos.
- No navegador com `pnpm dev`: `lento` levou aproximadamente 3 segundos na consulta do catálogo; `offline` retornou erro de transporte; `sessao-expirada` retornou HTTP 401 com `SESSION_EXPIRED` após login.
- Dois resets consecutivos produziram o mesmo conteúdo de `gm_db_v1`; `?reset=1` também restaurou o seed e foi removido da URL.
- Busca com `rg` em `src/features`, `src/components` e `src/lib` não encontrou imports de mocks nem chamadas diretas a `fetch`.
- Verificações adicionais: 34 E2E de bootstrap/rotas passaram em desktop e mobile; builds com e sem mocks passaram; `nft.updated` foi recebido pelo cliente Socket.IO real no navegador.

## Referências

- `.opencode/commands/mocks.md` · `docs/MOCKS.md` · `docs/api/` · `ARCHITECTURE.md`

