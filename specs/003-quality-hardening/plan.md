# Implementation Plan: Quality Hardening — Failure Coverage, Rollback Test, A11y/UX Audit

**Branch**: `003-quality-hardening` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-quality-hardening/spec.md`

## Summary

Fecha as lacunas encontradas pela análise de `/speckit-analyze` sobre a feature 002 (já em produção):
adiciona cobertura e2e para os 3 cenários de falha do Princípio VII ainda não testados (preço
alterado, sessão expirada, erro de rede/4xx/5xx), adiciona o teste de rollback otimista do carrinho
que faltava, e resolve os 25 itens de `specs/002-nft-marketplace-screens/checklists/ux-a11y-review.md`
— cada um vira uma pequena correção de código, uma correção de texto no `spec.md` da 002, ou uma
decisão documentada quando a lacuna é aceitável. Sem telas, rotas ou entidades novas.

## Technical Context

**Language/Version**: TypeScript ~6.0 (React 19.2) — inalterado em relação à 002

**Primary Dependencies**: Playwright (novos cenários de e2e), TanStack Query (estados de erro de
`useQuery` já existentes, agora tratados na UI), shadcn/ui/Radix (comportamento de teclado/foco já
embutido, apenas verificado); nenhuma dependência nova

**Storage**: N/A

**Testing**: Playwright (extensão das suítes já existentes em `e2e/{cart,checkout,home}`), oxlint,
`pnpm typecheck`, `pnpm build`, Lighthouse (reaproveitados, não criados)

**Target Platform**: Web (mesmos breakpoints 390/768/1440 da 002)

**Project Type**: web-application (mesma SPA da 002; este é um incremento de qualidade, não uma
nova superfície)

**Performance Goals**: nenhuma meta nova; mantém as da 002 (Lighthouse acessibilidade ≥ 95)

**Constraints**: nenhuma mudança de comportamento visível fora dos estados de erro adicionados;
`pnpm lint`, `pnpm typecheck`, `pnpm build` e os 71 testes Playwright já existentes MUST continuar
verdes (FR-006)

**Scale/Scope**: 3 novos cenários de falha cobertos, 1 teste de rollback adicionado, até ~6 pequenos
ajustes de código (estados de erro ausentes em `CartPage`/`CheckoutPage`/`WalletsPage`, uma região
`aria-live` ausente no resumo do checkout), e 25 itens de checklist triados (ver `research.md`)

## Constitution Check

*GATE: passou antes da Fase 0; reavaliado após a Fase 1 — ver notas abaixo.*

| Princípio | Avaliação |
|-----------|-----------|
| I. Camadas e fronteiras | OK. Nenhuma pasta nova; correções ficam dentro das páginas/domínios já existentes. |
| II. Tipagem estrita | OK. Sem `any`; novos estados de erro reaproveitam `isApiError`/`ApiError` já tipados. |
| III. Estado remoto | É o alvo direto desta feature: os novos estados de erro em `CartPage`/`CheckoutPage`/`WalletsPage` são exatamente o tratamento de erro exigido por este princípio para `useQuery`, hoje ausente. |
| IV. Tempo real | N/A — nenhuma mudança em eventos Socket.IO. |
| V. Mocks só em `src/mocks` | OK. Os novos testes só selecionam cenários já definidos em `src/mocks/scenarios/definitions.ts`; nenhum mock novo é criado. |
| VI. Acessibilidade/responsividade/fidelidade | É o alvo direto da História 3 (auditoria dos 25 itens do checklist). |
| VII. Testes e auditoria | É o alvo direto da História 1: fecha a lacuna "cenários de falha MUST ser cobertos" encontrada pela análise. |

Sem violações; esta feature existe justamente para fechar gaps de conformidade com os Princípios
III e VII encontrados na 002, não para introduzir desvios novos.

## Project Structure

### Documentation (this feature)

```text
specs/003-quality-hardening/
├── plan.md               # este arquivo
├── research.md           # Fase 0 — triagem dos 3 cenários de falha + dos 25 itens do checklist
├── data-model.md         # Fase 1 — "sem entidades novas", referencia specs/002.../data-model.md
├── quickstart.md         # Fase 1 — como rodar os testes novos e revisar a auditoria
├── checklists/requirements.md
└── tasks.md               # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
e2e/
├── cart/cart.spec.ts            # + cenário quantity_exceeds_stock (rollback), + cenário rede/5xx
├── checkout/checkout.spec.ts    # + cenário preço alterado, + cenário sessão expirada
└── home/catalog.spec.ts         # + cenário rede/5xx (se não coberto em cart)

src/pages/
├── cart/CartPage.tsx             # + estado de erro explícito para falha ao carregar o carrinho
├── checkout/CheckoutPage.tsx     # + estado de erro explícito para falha ao carregar carrinho/cotação
│   └── components/OrderSummary.tsx   # + aria-live na região de totais (paridade com CartSummary)
└── wallets/WalletsPage.tsx       # + estado de erro explícito para falha ao carregar carteiras

specs/002-nft-marketplace-screens/
├── spec.md                       # pequenos ajustes de texto (CHK001, CHK004, CHK016, CHK018,
│                                  #   CHK019, CHK022, CHK024, CHK025 — ver research.md)
└── checklists/ux-a11y-review.md  # cada um dos 25 itens marcado [x] com nota, ou deixado [ ] com
                                   #   justificativa registrada nas Notes
```

**Structure Decision**: nenhuma estrutura nova. Todo o trabalho acontece dentro das pastas de página
já existentes da 002 (regra de fronteira inalterada) e nas suítes de e2e já existentes por página;
a única pasta nova é a desta própria feature em `specs/`.

## Complexity Tracking

Sem violações da constituição; nada a justificar.
