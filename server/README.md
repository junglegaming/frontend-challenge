# coins-server

Real (not mocked) backend for the "platform coins" feature — see
`specs/006-platform-coins/` and the project constitution's v1.1.0 amendment
("Exceção Pontual: Backend Real de Moedas da Plataforma") for why this exists
as an exception to the rest of the project being entirely simulated.

Standalone Node/TypeScript package: its own `package.json` and lockfile, not
part of the frontend's pnpm workspace, not managed by any monorepo tool
(explicitly disallowed by the constitution's exception).

## Setup

```bash
pnpm install
```

## Run

```bash
pnpm dev     # tsx watch, http://localhost:4000 by default
```

Or from the repo root, alongside the frontend:

```bash
pnpm dev:all   # runs the Vite frontend + this server together (concurrently)
```

Environment variables (both optional):

- `PORT` — defaults to `4000`.
- `CORS_ORIGIN` — defaults to `http://localhost:5173` (the Vite dev server's origin).

## ⚠️ Known limitation: identity is trusted, not verified

**This project has no real authentication anywhere** — login/session are entirely simulated in
the frontend (MSW). This server therefore trusts whatever `X-User-Id` header the frontend sends
(its own simulated session user id), creating a user/balance row the first time it sees a new id.
**Any client can claim any user id.** This is acceptable *only* because no real money or sensitive
data is involved — it is an explicit, constitution-documented simplification, never a real
security model. Do not extend this pattern to anything that matters.

## Data

SQLite via Node's built-in `node:sqlite` (not an installed package — see
`specs/006-platform-coins/research.md` D1 for why `better-sqlite3` was replaced: no C++ build
toolchain was available to compile it in the original development environment). The database file
lives at `server/data/coins.db`, created automatically on first run, and is never committed
(`.gitignore`).

## Verification

This server is **not** part of the project's Playwright/e2e suite (which runs entirely against
the mocked frontend layer, unaffected by this feature). Verify it directly:

```bash
pnpm dev                       # in one terminal
node scripts/smoke-test.mjs    # in another, against the running server
```
