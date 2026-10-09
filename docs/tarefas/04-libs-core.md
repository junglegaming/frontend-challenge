# 04 — Estrutura de pastas + libs core (http/query/money/session)

**Onda:** 2 · **Paralela com:** `03-tema-shadcn`, `05-msw-assets` · **Depende de:** 02 · **Bloqueia:** 06, 07
**Label sugerido:** `fase-1-fundacao` · **Esforço:** M

## Objetivo

Criar a árvore de diretórios e a camada de suporte tipada (Axios, Query, dinheiro,
erros, sessão, socket) — contrato entre features e rede.

## Subtasks

### 04.1 — Árvore de pastas

- Criar `src/routes`, `features/*` (vazias), `components/{ui,icons,layout,shared}`,
  `lib/{http,query,socket,session}`, `mocks/`, `types/` conforme `docs/ESTRUTURA.md` §2

### 04.2 — `lib/http` (Axios + erros)

- `client.ts`: instância Axios + interceptors (Authorization, mapeamento de erro)
- `errors.ts`: `AxiosError → AppError` union (validation/http/network/canceled)
- `endpoints.ts`: paths centralizados

### 04.3 — `lib/query` (TanStack Query)

- `client.ts`: QueryClient com defaults de `ARCHITECTURE.md` §3.1
- `keys.ts`: factory com `userId` (`"anon"`)

### 04.4 — `lib/money` + `lib/utils`

- `money.ts`: decimal.js (`add/sub/mul/cmp/format/parse`) — ETH string only
- `utils.ts` (`cn()`)

### 04.5 — `lib/session` (esqueleto)

- `context.tsx`: provider mínimo (gm_session, hidratação, login/logout API)
- `guards.ts`: esqueleto do `requireSession` (lógica completa na tarefa 06)

### 04.6 — `lib/socket` + `types/api`

- `socket/client.ts`: criação do socket.io-client (assinaturas na tarefa 14)
- `types/api.ts`: re-exports dos tipos (`z.infer`)

## Critérios de aceite (gate)

- [x] `pnpm typecheck && pnpm lint` verdes
- [x] Nenhum import de `src/mocks` fora de `lib/http`/setup de teste (grep)

## Referências

- `docs/ESTRUTURA.md` §2, §4 · `ARCHITECTURE.md` §1–3, §7 · `docs/api/README.md`
