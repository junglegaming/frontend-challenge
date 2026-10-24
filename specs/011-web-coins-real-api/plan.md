# Implementation Plan: Moedas do site usando o back-end real

**Branch**: `011-web-coins-real-api` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-web-coins-real-api/spec.md`

## Summary

As telas de moedas do `apps/web` (saldo e recarga em Carteiras; "pagar com moedas" no checkout) deixam o cliente do
`server/` (006, escondido em produção) e passam a usar o domínio `ledger`, que já fala com o `apps/api` pelo caminho
same-origin `/backend`. Em dev/e2e o `/backend` é respondido pelo mock MSW do ledger; em produção, pelo `apps/api` real.
O cliente `ledger` é corrigido para o contrato atual da API (409 = conflito de chave, não repetir; toda escrita leva
`Idempotency-Key`), o mock ganha paridade de idempotência, o checkout faz débito → pedido → crédito de volta com chaves
derivadas da chave do pedido, e o domínio `coins` do web é removido. O `apps/api` e o `server/` não mudam.

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19 (inalterados).

**Primary Dependencies**: as já existentes no `apps/web`: TanStack Query/Router, Axios, Zod, MSW, sonner, shadcn/ui,
`decimal.js`. Nenhuma dependência nova.

**Storage**: nenhum no site. Saldo e histórico vivem no `apps/api` (Postgres/Neon, spec 010); em dev/e2e, no
`LedgerService` em memória do mock (`src/mocks/contexts/ledger/service.ts`).

**Testing**: Playwright contra os mocks (`playwright.config.ts`, suíte principal) e contra o build de produção
(`playwright.production.config.ts`); `scripts/check-production-bundle.mjs`; `pnpm lint`/`typecheck`/`build`.

**Target Platform**: navegador (SPA na Vercel, projeto `nft-marketplace-web`); `/backend/*` reescrito para o `apps/api`.

**Project Type**: web app (`apps/web`) no monorepo pnpm+Nx; consome o web-service `apps/api` sem alterá-lo.

**Performance Goals**: SC-005: saldo e recarga visíveis em ≤ 2 s em 95% das vezes no site publicado (dominado pela
latência da API, já medida p95 ~150 ms localmente na 010).

**Constraints**: contrato do `apps/api` inalterado (FR-014); `server/` intocado (FR-013); CSP `connect-src 'self'`, só
same-origin `/backend` (FR-012); build de produção sem `localhost` (SC-007); o e2e principal roda sem serviço externo
(SC-006); fronteiras de camadas verificadas pelo `oxlint` (Princípio I).

**Scale/Scope**: 2 telas (Carteiras, Checkout), 1 domínio corrigido (`ledger`), 1 domínio removido (`coins`), 1 mock
estendido, ~6 arquivos de e2e, docs.

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1. Base: constituição v1.6.0.*

| Princípio / Seção | Avaliação |
|-------------------|-----------|
| I. Camadas e fronteiras | **OK.** Páginas importam só `@/domains/ledger` (API pública). A conversão ETH→moedas sai de `domains/coins` para `domains/ledger/model` (não para a página). Nenhuma página importa outra. |
| II. Tipagem estrita | **OK.** Sem `any`; respostas validadas com os schemas Zod do `ledger` (já existentes); `toCoinsAmount` continua com `decimal.js`; quantidades inteiras. |
| III. Estado remoto disciplinado | **OK.** Tudo via Axios (`ledgerHttp`) + TanStack Query, chaves por usuário (`['ledger', …, userId]`); estados de carregamento/vazio/erro/sucesso; **toda escrita com chave de idempotência** (FR-004); recarga com atualização otimista e rollback; cache e retries documentados no README do domínio. |
| IV. Tempo real | N/A (sem eventos de moedas). Logout/troca de usuário já limpam tokens (`clearLedgerTokens`) e o cache (`queryClient.clear()`). |
| V. Mocks só na rede | **OK.** A simulação do `/backend` vive em `src/mocks/contexts/ledger` (MSW) e ganha idempotência; nenhum dado fictício em componente/hook. O e2e de produção não usa mock do `/backend` (prova a ligação real/indisponível). |
| VI. Acessibilidade e fidelidade | **OK.** Mensagens de erro com `role="alert"`, saldo com `aria-live`, skeletons existentes; labels associadas. Telas mantêm o layout atual (sem novo design). |
| VII. Testes e auditoria | **OK.** E2E por página (`e2e/wallets`, `e2e/checkout`, `e2e/ledger`) contra mocks, incluindo falhas (402, 409, rede, pedido que falha → crédito de volta); snapshots visuais atualizados; lint/typecheck/build verdes. |
| Exceção `apps/web`+`apps/api` (1.2.0+) | **OK.** `apps/web` falando com `apps/api` por `/backend` já é o desenho da 007/008; `apps/api` não muda. |
| Exceção `server/` (1.1.0) | **OK.** `server/` não é modificado; só o cliente do site para ele é removido. |
| Fluxo: documentação | Atualizar `docs/TEAMS.md`, `src/domains/ledger/README.md`, `specs/008-web-production-env/deploy-environments.md`; remover `src/domains/coins/README.md` junto com o domínio. |

**Resultado do gate**: sem violações. Pós-Fase 1: sem violações novas.

## Project Structure

### Documentation (this feature)

```text
specs/011-web-coins-real-api/
├── plan.md              # este arquivo
├── research.md          # Fase 0: decisões D1–D8
├── data-model.md        # Fase 1: entidades no cliente, chaves, estados da operação de checkout
├── quickstart.md        # Fase 1: validar em dev, e2e, produção
├── contracts/
│   └── web-ledger-usage.md  # Fase 1: como o site usa o contrato do apps/api (sem mudá-lo)
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
apps/web/
├── src/
│   ├── domains/
│   │   ├── ledger/
│   │   │   ├── api/client.ts        # remove retry de 409; LedgerError.isKeyConflict; Idempotency-Key opcional
│   │   │   ├── api/queries.ts       # mutações recebem { amount, idempotencyKey }; recarga otimista com rollback;
│   │   │   │                        # funções imperativas ledgerDebit/ledgerCredit para o checkout
│   │   │   ├── model/conversion.ts  # ETH_TO_COINS_RATE, toCoinsAmount (vindos de coins)
│   │   │   ├── model/keys.ts        # coinsKeys(orderKey): chaves derivadas de débito e devolução
│   │   │   ├── model/messages.ts    # ledgerErrorMessage: mensagens do data-model
│   │   │   ├── index.ts             # exporta o que as páginas usam
│   │   │   └── README.md            # Postgres; 402/409; idempotência; cache/retries
│   │   ├── coins/                   # REMOVIDO (cliente do server/)
│   │   └── checkout/model/idempotency.ts   # + rotateIdempotencyKey (troca a chave após devolução)
│   ├── pages/
│   │   ├── wallets/components/CoinsBalanceSection.tsx   # usa ledger; histórico curto; erros específicos
│   │   └── checkout/
│   │       ├── CheckoutPage.tsx                         # débito → pedido → crédito de volta (chaves derivadas)
│   │       └── components/PaymentMethodPicker.tsx       # saldo do ledger (`amount`); sempre visível
│   ├── mocks/contexts/ledger/{handlers.ts,service.ts}   # Idempotency-Key: replay, 409, 400
│   ├── shared/config/env.ts         # remove coinsApiUrl/coinsEnabled
│   └── vite-env.d.ts                # remove VITE_COINS_API_URL
├── .env.example, .env.production    # remove VITE_COINS_API_URL
├── scripts/check-production-bundle.mjs   # sem referência a VITE_COINS_API_URL; continua barrando localhost
├── playwright.production.config.ts       # comentário/env sem VITE_COINS_API_URL
└── e2e/
    ├── ledger/ledger.spec.ts        # 409 não é repetido; idempotência
    ├── wallets/wallets.spec.ts      # saldo, recarga, retry idempotente, indisponibilidade
    ├── checkout/checkout.spec.ts    # pagar com moedas, 402, pedido falha → um crédito de volta
    └── production/hardening.spec.ts # moedas VISÍVEIS; chamadas só a /backend; nada para localhost/4000

docs/TEAMS.md, specs/008-web-production-env/deploy-environments.md   # documentação
```

**Structure Decision**: a mudança fica no `apps/web`, dentro do domínio `ledger` (cliente, hooks, modelo), das duas
páginas consumidoras e do mock. O domínio `coins` é removido por inteiro em vez de adaptado, porque o modelo de
identidade (`X-User-Id`), os campos e os códigos de erro do `server/` não existem no `apps/api`; manter dois domínios de
moedas levaria a página a escolher entre eles.

## Complexity Tracking

Nenhuma violação a justificar.

## Riscos e dependências

| Risco | Efeito | Tratamento |
|---|---|---|
| Ambientes do `apps/api` ainda compartilham o banco de produção (pendência 010 T039) | Testes de preview do site escreveriam em dados de produção | e2e principal usa só o mock; validação manual com API real só no ramo de dev (quickstart); o teste no site publicado usa um dono dedicado e poucas operações |
| E2E de produção local não tem API atrás do `/backend` | Tela de moedas sem dados no build de produção local | O teste de produção passa a verificar o estado de **indisponível** (US1 cen. 4) e que as chamadas vão a `/backend`, nunca a `localhost`; com `PLAYWRIGHT_BASE_URL` (site publicado) verifica o fluxo real |
| Chave do pedido vive só em memória da aba | Recarregar a página no meio do checkout gera nova chave | Aceito (já era assim na 006/004); o crédito de volta usa a mesma chave da tentativa, dentro da aba |
| Crédito de volta falha | Moedas ficam descontadas sem pedido | Mensagem explícita (US2 cen. 5) e nova tentativa com a mesma chave (efeito único); histórico mostra o débito |
| Emissão de token confia no `ownerId` | Qualquer pessoa pode operar o saldo de outra no site publicado | Limitação documentada (FR-016); moedas de demonstração |
