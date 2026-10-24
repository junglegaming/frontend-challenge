# Quickstart: validar a administração das moedas

Guia de validação (não de implementação; ver `tasks.md`). Contrato: `contracts/web-coins-admin-usage.md`; modelo:
`data-model.md`.

## 1. Checagens estáticas

```sh
pnpm typecheck && pnpm lint && pnpm build
node apps/web/scripts/check-production-bundle.mjs
grep -rn "localStorage\|sessionStorage" apps/web/src/domains/coins-admin   # deve vir vazio (FR-005)
```

## 2. E2E com mocks (sem serviço externo)

```sh
pnpm --dir apps/web exec playwright test e2e/admin-coins-login e2e/admin-coins e2e/admin-coins-owner
pnpm --dir apps/web exec playwright test        # suíte completa: sem falhas novas
```

Esperado: entrada com o admin de demonstração do mock (README de `mocks/contexts/coins-admin`); credencial errada com
mensagem idêntica; lista, ida e volta de páginas sem repetir donos; detalhe; expiração (`coins-admin-session-expired`)
volta à entrada; `coins-unavailable` mostra indisponibilidade; sessão do site (`ana@nft.dev`) não abre a área.

## 3. Manual contra o `apps/api` local (ramo de dev)

```sh
pnpm --dir apps/api dev:local
VITE_ENABLE_BACKEND_MOCKS=false BACKEND_PROXY_TARGET=http://localhost:4001 pnpm --dir apps/web dev
```

Abrir `/admin/coins/login`, entrar com um admin semeado no ramo de dev (`pnpm --dir apps/api seed:admin`), navegar
pela lista e por um dono. Na aba Rede: só `/backend/admin/*`, com `Authorization` apenas nessas chamadas.

## 4. Build de produção local

```sh
pnpm --dir apps/web exec playwright test -c playwright.production.config.ts
```

Esperado: `/admin/coins/login` renderiza; o envio vai para `/backend/admin/login` (sem API local ⇒ mensagem de
indisponibilidade); nada para `localhost`/porta 4000.

## 5. Site publicado (depois do deploy autorizado)

Entrar em `https://nft-marketplace-web-wheat.vercel.app/admin/coins/login` com `batata@batata.com`; abrir a lista e um
dono; sair. Somente leitura: nada é alterado no banco.
