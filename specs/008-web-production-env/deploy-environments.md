# Ambientes de deploy por projeto

Visão única de **onde cada parte do repositório é publicada**, com variáveis por ambiente. Complementa
`data-model.md` (matriz do front-end) e `quickstart.md` (passo a passo). Arquitetura adotada: **um projeto
Vercel por aplicação** (D1), sem `vercel.json` de serviços na raiz.

## Visão geral

| Projeto | Pasta | Vercel | URL | Estado |
|---|---|---|---|---|
| Front-end | `apps/web` | projeto `nft-marketplace-web` (preset Vite, estático) | `*.vercel.app` | a criar (esta feature) |
| API | `apps/api` | projeto `nft-marketplace-api` (função Express em `api/index.ts`) | `https://nft-marketplace-api-ochre.vercel.app` | publicado, `/api/*` respondendo (2026-10-24) |
| Moedas (006) | `server/` | **não implantável** (SQLite local) | n/a | fora do deploy; o site não o usa mais (moedas via `apps/api`, spec 011) |

Ligação: navegador → `web` (`/backend/*` rewrite) → `api` (`/api/*`). O `web` nunca chama a API por URL
absoluta no código (sem CORS); só o `vercel.json` conhece o domínio da API (destino fixo, D4).

## `apps/web` — variáveis por ambiente

Fonte de verdade: `data-model.md`. Arquivos:

| Arquivo | Ambiente | Versionado |
|---|---|---|
| `apps/web/.env.example` | modelo para desenvolvimento | sim |
| `apps/web/.env.local` | desenvolvimento pessoal | não (`*.local`) |
| `apps/web/.env.production` | build de produção (valores públicos, sem segredos) | **sim** |
| variáveis do projeto Vercel | Preview e Production; sobrescrevem o arquivo | n/a |

| Variável | Desenvolvimento | Preview | Produção |
|---|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | `true` | `true` |
| `VITE_ENABLE_BACKEND_MOCKS` | `true` (padrão em dev) | `false` | `false` |
| `VITE_API_BASE_URL` | `/api` | `/api` | `/api` |
| `VITE_BACKEND_BASE_URL` | `/backend` | `/backend` | `/backend` |
| `VITE_REQUEST_TIMEOUT_MS` | `8000` | `8000` | `8000` |
| `VITE_SOCKET_URL` | `ws://localhost/realtime` | idem | idem (identificador do mock) |
| `BACKEND_PROXY_TARGET` | `http://localhost:3000` | n/a | n/a |

Configurações do projeto Vercel: Root Directory `apps/web`; "incluir arquivos fora do Root Directory"
ligado (workspace pnpm); build `pnpm build`; saída `dist`. Preview e Produção usam o mesmo conjunto (D8).

## `apps/api` — variáveis por ambiente

Segredos: **só** no projeto Vercel (`vercel env add`), nunca em arquivo versionado.

| Variável | Desenvolvimento (`apps/api/.env.local`) | Preview | Produção |
|---|---|---|---|
| `DATABASE_URL` | URL do Postgres (Neon) de dev — `vercel env pull .env.local` | ramo Neon de Preview (URL do *pooler*) | ramo Neon de Produção (URL do *pooler*) |
| `DATABASE_URL_UNPOOLED` | conexão direta do mesmo ramo de dev (só o Prisma Migrate) | conexão direta do ramo de Preview | conexão direta do ramo de Produção |
| `AUTH_JWT_SECRET` | segredo local qualquer | segredo próprio do Preview | segredo **distinto** e forte (32 bytes hex) |
| `PORT` | `4001` (só `dev:local`) | n/a | n/a |

Configurações do projeto Vercel: Root Directory `apps/api`; `framework: null` e `buildCommand: ""` (o preset
`express` devolve `404` em `/api/*`); rewrite `/api/(.*)` → `/api/index` em `apps/api/vercel.json`. A correção
do `404` foi entregue (API respondendo em 2026-10-24); a verificação repetível é `pnpm --dir apps/api verify:deploy`.

Armazenamento (010): Postgres no Neon substitui o Vercel Blob; o saldo é atômico e idempotente. Guia de
implantação e verificação: `specs/010-api-production-backend/quickstart.md`.

## `server/` — moedas (006)

Sem deploy. O site não usa mais o `server/`: desde a spec 011 (`specs/011-web-coins-real-api`) as moedas do site,
inclusive em produção, vêm do `apps/api` pelo caminho `/backend` (domínio `ledger`), e `VITE_COINS_API_URL` deixou de existir.

## Ordem de publicação

1. API corrigida e respondendo `GET /api/health` = `200` (pré-requisito de US2).
2. `web`: `vercel link`, variáveis, `vercel deploy` (preview), validar, `vercel deploy --prod`.
3. Validar `GET <web>/backend/health` = `200` originado da API real.
