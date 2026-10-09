# 02 — Scaffolding base (Vite + TS + tooling)

**Onda:** 1 · **Paralela com:** — · **Depende de:** nada · **Bloqueia:** 03, 04, 05
**Label sugerido:** `fase-1-fundacao` · **Esforço:** M

## Objetivo

Criar a base técnica do projeto com a stack obrigatória, scripts e convenções — todo o
resto se apoia aqui.

## Subtasks

### 02.1 — App base (Vite + React + TS strict)

- App Vite + React 19 + TypeScript **strict** com **pnpm** (`pnpm-lock.yaml` versionado)
- Alias `@` → `src/` no `tsconfig` e no Vite
- `index.html` + `main.tsx` mínimo renderizando "NFT Marketplace"

### 02.2 — Tooling de qualidade

- ESLint + Prettier (flat config) com as regras do projeto
- `.gitignore` (node_modules, dist, .env.local, relatórios, traces Playwright)
- `.env.example` com `FIGMA_TOKEN`, `VITE_MOCKS`, `VITE_MOCK_SCENARIO`, `VITE_API_BASE_URL`
  - `.env.local` gitignored

### 02.3 — Scripts do package.json

- `dev`, `build`, `preview`, `typecheck`, `lint`, `lint:fix`, `test:contract`,
  `test:e2e`, `lighthouse`, `fig:extract`

### 02.4 — Instalação da stack

- TanStack Router (plugin file-based) + TanStack Query, Axios, zod, decimal.js, MSW,
  socket.io-client, @mswjs/socket.io-binding, react-hook-form + @hookform/resolvers,
  @fontsource/roboto-mono, vitest, @playwright/test, lighthouse

## Critérios de aceite (gate)

- [x] `pnpm build && pnpm typecheck && pnpm lint` verdes
- [x] `pnpm dev` abre a app

## Referências

- `docs/ESTRUTURA.md` §1, §2, §5, §7 · `AGENTS.md` (comandos)
