# Implementation Plan: Página de Pagamento (Checkout completo)

**Branch**: `maju` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-checkout-payment/spec.md`

## Summary

Evoluir a página `/checkout` (já existente, versão básica da spec 002) para cobrir todo o fluxo de
"Pagamento e confirmação" do desafio: pré-preenchimento pelo perfil, conexão simulada de carteira
(conectar/recusar/desconectar) com rede compatível, etapa de revisão, revalidação com diferença de valores e
nova confirmação (inclusive por `nft.updated` em tempo real), envio idempotente com estados pendente/recusado
na própria página e retomada após refresh ou sessão expirada. A abordagem é uma máquina de estados pura na
página, hooks locais que consomem domínios e `shared/` pela API pública, e **nenhuma alteração fora de
`src/pages/checkout` e `e2e/checkout`** (ver [research.md](./research.md)).

## Technical Context

**Language/Version**: TypeScript 6 (strict, sem `any`), React 19

**Primary Dependencies**: TanStack Router, TanStack Query, Axios (`@/shared/api/http`), socket.io-client
(`@/shared/realtime/client`), react-hook-form + Zod, Tailwind CSS + shadcn/ui (`@/shared/ui`), `decimal.js`
via `@/shared/lib/eth`, sonner

**Storage**: `sessionStorage` só para o rascunho do checkout por usuário (R6); dados de negócio via REST (MSW)

**Testing**: Playwright (`e2e/checkout/`), axe (helpers existentes), regressão visual em 390/768/1440 px

**Target Platform**: navegadores modernos (Chromium nos testes), desktop e mobile

**Project Type**: SPA web (frontend com backend simulado por MSW)

**Performance Goals**: interações da página com feedback em < 100 ms; skeleton sem CLS no resumo

**Constraints**: alterar apenas `src/pages/checkout/**` e `e2e/checkout/**`; valores ETH como string decimal;
cotação do servidor é a única fonte de totais; mocks/handlers não são alterados

**Scale/Scope**: 1 página, 5 histórias, ~10 componentes/hooks locais, ~6 arquivos de teste E2E

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Como o plano atende | Status |
|---|---|---|
| I. Camadas e fronteiras | Página importa só `@/domains/<d>` (index) e `@/shared/*`; nada importa outra página; rota existente intocada | ✅ |
| II. Tipagem e contratos | DTOs dos domínios reaproveitados; tipos locais (`CheckoutStep`, `QuoteChange`, `CheckoutDraft`) tipados; rascunho validado com Zod na leitura; ETH via `eth` | ✅ |
| III. Estado remoto | Cotação, carteiras, pedido e conexão via Query/mutations; invalidação de carrinho/cotação após resultado; idempotência por `idempotencyKeyFor` | ✅ |
| IV. Tempo real | Assina `nft.updated` e `onReconnect` com cleanup; `order.updated` via `useOrder`; terminais não regridem | ✅ |
| V. Mocks só na rede | Nenhum dado fictício na página; conexão de carteira chama o endpoint MSW existente | ✅ |
| VI. A11y/responsivo/visual | `aria-live`, foco por etapa, status com texto; layout 2 colunas/coluna única; só `shared/ui` + tokens | ✅ |
| VII. Testes | Novos specs E2E por história + a11y + visual; `lint`/`typecheck`/`build` verdes | ✅ |

**Pós-design (Phase 1)**: re-checado — sem violações. Um ponto de atenção registrado abaixo (Complexity
Tracking), não uma violação.

## Project Structure

### Documentation (this feature)

```text
specs/003-checkout-payment/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── checkout-page.md # Phase 1
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

Somente estes caminhos são criados/alterados:

```text
src/pages/checkout/
├── CheckoutPage.tsx                 # orquestra etapas (useReducer + hooks locais)
├── index.ts                         # inalterado
├── README.md                        # atualizar escopo/domínios usados
├── model/
│   ├── checkout-flow.ts             # máquina de estados pura (R1)
│   ├── quote-diff.ts                # snapshot × cotação atual (R3)
│   └── checkout-draft.ts            # rascunho por usuário em sessionStorage + Zod (R6)
├── hooks/
│   ├── use-wallet-connection.ts     # POST /wallets/:id/connect via api compartilhada (R2)
│   ├── use-checkout-realtime.ts     # nft.updated + onReconnect → cotação (R4)
│   └── use-order-outcome.ts         # useOrder + pendingOrderId → confirmed/declined (R5)
└── components/
    ├── CollectorForm.tsx            # + pré-preenchimento, walletId no schema (R7)
    ├── WalletPicker.tsx             # + redes suportadas, aviso de incompatibilidade
    ├── WalletConnectionStatus.tsx   # Desconectada/Conectando/Conectada/Recusada + ações
    ├── OrderSummary.tsx             # + destaque antigo → novo
    ├── ReviewPanel.tsx              # etapa de revisão
    ├── QuoteChangedNotice.tsx       # o que mudou + nova confirmação
    ├── OrderOutcome.tsx             # pendente / recusado + tentar novamente
    └── CheckoutSkeleton.tsx         # skeleton com dimensões estáveis

e2e/checkout/
├── checkout.spec.ts                 # fluxo completo atualizado + a11y + visual
├── wallet-connection.spec.ts
├── quote-change.spec.ts
├── order-outcome.spec.ts
└── session.spec.ts
```

**Structure Decision**: tudo fica dentro da pasta da página. As subpastas `model/` e `hooks/` são internas à
página (imports relativos), seguindo a mesma organização dos domínios descrita em `docs/TEAMS.md`, sem expor
nada para fora.

## Complexity Tracking

| Ponto de atenção | Por que é necessário | Alternativa mais simples rejeitada porque |
|---|---|---|
| Hook de conexão de carteira na página chamando `POST /wallets/:id/connect` pela `api` de `shared` | O domínio `wallets` não exporta essa chamada e o escopo proíbe alterar domínios de outros times | Colocar em `domains/wallets` é o ideal, mas exige mexer em código de outro time; fica como **sugestão para combinar com o dono** e mover depois sem mudar comportamento |
| Assinatura própria de `nft.updated` na página | O sync global do catálogo não atualiza a cotação do checkout | Confiar só na revalidação no envio não "informa a alteração durante a navegação" (CHALLENGE §7) |
