# Quickstart: validar as moedas do site com o back-end real

Guia de validação (não de implementação; ver `tasks.md`). Contrato: `contracts/web-ledger-usage.md`; modelo:
`data-model.md`.

## Pré-requisitos

- Node 24, pnpm, `pnpm install` na raiz.
- Para o passo 3: `apps/api` rodando localmente contra o **ramo de desenvolvimento** do Neon (nunca o de produção;
  pendência 010 T039).

## 1. Checagens estáticas

```sh
pnpm typecheck && pnpm lint && pnpm build
node apps/web/scripts/check-production-bundle.mjs     # sem localhost no bundle de produção
grep -rn "domains/coins\|VITE_COINS_API_URL\|coinsEnabled" apps/web/src apps/web/e2e   # deve vir vazio
```

## 2. E2E com mocks (sem nenhum serviço externo)

```sh
pnpm --dir apps/web exec playwright test e2e/wallets e2e/checkout e2e/ledger
pnpm --dir apps/web exec playwright test        # suíte completa: só as 6 falhas conhecidas de snapshot
```

Esperado: saldo 0 → recarga → saldo e histórico; repetir a recarga com a mesma chave = um efeito; pagar com moedas;
402 sem pedido; pedido que falha → exatamente um crédito de volta; 409 não é repetido.

## 3. Manual contra o `apps/api` local (ramo de dev)

```sh
pnpm --dir apps/api dev:local                                      # http://localhost:4001/api
VITE_ENABLE_BACKEND_MOCKS=false BACKEND_PROXY_TARGET=http://localhost:4001 pnpm --dir apps/web dev
```

1. Logar (sessão mockada), abrir Carteiras: saldo real; recarregar 100 ⇒ saldo +100; histórico mostra a recarga.
2. Na aba Rede do navegador, todas as chamadas de moedas vão a `/backend/...` com `Idempotency-Key` nas escritas.
3. Checkout com "pagar com moedas": saldo −custo; pedido criado.
4. Saldo insuficiente: mensagem com saldo e custo; nenhum débito no histórico da API.
5. Falha forçada do pedido: cenário `sold-out-at-checkout` (`window.__nftMock`), que esgota a edição no envio do pedido; resultado: um débito e **um** crédito com o mesmo valor no histórico.
6. Clique duplo em "Confirmar compra": um único débito.

## 4. Build de produção local

```sh
pnpm --dir apps/web exec playwright test -c playwright.production.config.ts
```

Esperado: a seção "Moedas da Kurio" **aparece**; sem API atrás do `/backend`, mostra "Serviço de moedas indisponível"
com "tentar de novo"; nenhuma requisição a `localhost`/porta 4000; as de moedas vão a `/backend`.

## 5. Site publicado (depois do deploy do `apps/web`)

```sh
PLAYWRIGHT_BASE_URL=https://nft-marketplace-web-wheat.vercel.app pnpm --dir apps/web exec playwright test -c playwright.production.config.ts
```

Manual: logar, recarregar um valor pequeno, conferir saldo e histórico após recarregar a página (SC-001). Lembrete:
enquanto a 010 T039 não separar os ambientes, isso escreve no banco de produção do `apps/api` (moedas de demonstração).
