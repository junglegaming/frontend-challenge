# 06 — Camada de rotas (TanStack Router file-based)

**Onda:** 3 · **Paralela com:** `07-mocks-e-contrato` · **Depende de:** 02, 04 · **Bloqueia:** 08, 09
**Label sugerido:** `ui` · **Esforço:** M

## Objetivo

Executar o prompt **`routes.md`** (raiz): roteamento completo com guards e search
params tipados, placeholders navegáveis — sem UI de layout nem dados.

## Como executar

- Copiar `routes.md` → `.opencode/commands/routes.md` e rodar `/routes`,
  **ou** colar o conteúdo do arquivo em uma sessão de agente.

## Subtasks

### 06.1 — Setup do router

- Plugin do TanStack Router no `vite.config.ts` (geração do `routeTree.gen.ts`)
- `src/router.tsx` com `createRouter({ routeTree, defaultPreload })`
- Bootstrap do `RouterProvider` no `main.tsx` (dentro do `QueryClientProvider`)

### 06.2 — Arquivos de rota + raiz

- 10 rotas de `docs/ESTRUTURA.md` §3 (4 delas privadas) + `not-found`
- `__root.tsx` com `<Outlet/>` + `errorComponent` mínimo (mensagem + link para `/`)

### 06.3 — Guards de sessão

- `lib/session/guards.ts`: `requireSession` usado **só** em `beforeLoad`
  (redirect `/login?redirect=<rota atual>`; validação anti open-redirect no login:
  só caminhos internos, rejeitar `//`)

### 06.4 — Search params tipados (zod)

- `features/catalog/search-params.ts`: `q`, `categories[]`, `minPrice`, `maxPrice`,
  `sort` enum (default `relevance`), `page` (default 1) — strings vazias → ausentes
- `?qty=` (inteiro ≥1) no detalhe · `?redirect=` no login

### 06.5 — Placeholders navegáveis

- Cada rota: `h1` com o nome da tela + frame de referência + links cruzados
  (todas as rotas alcançáveis por clique) — sem fetch

## Critérios de aceite (gate) — checklist do `routes.md` §3

- [x] URL direta + refresh em todas as rotas
- [x] Privada sem sessão → `/login?redirect=…` ida e volta
- [x] `/?q=abc&page=2` sobrevive a refresh e histórico
- [x] `*` → 404 · `grep` confirma guards não duplicados em componentes
- [x] `pnpm typecheck && pnpm lint` verdes

Validação em 08/10/2026: 32 testes Playwright (desktop 1440 e mobile 390),
13 testes de contrato, typecheck, lint e build aprovados. Testes de rotas em
`tests/e2e/routes.spec.ts`; incluem quantidade na URL, query/hash no retorno,
logout, sessões expiradas/malformadas e rejeição de redirect externo.

O login nesta etapa é um controle de demonstração injetado pelo bootstrap quando
mocks estão ativos; criação da sessão/fixtures ficam em `src/mocks/`. As telas
continuam placeholders sem consultas de dados. Detalhes em `routes.md` §2.

## Referências

- `routes.md` · `docs/ESTRUTURA.md` §3 · `ARCHITECTURE.md` §2
