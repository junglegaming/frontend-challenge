# Quickstart: Quality Hardening — Failure Coverage, Rollback Test, A11y/UX Audit

## Pré-requisitos

- Mesmos da feature 002: `pnpm install`, nenhuma variável de ambiente extra.
- Navegadores do Playwright já instalados (`pnpm exec playwright install chromium`, se necessário).

## Rodar os testes novos/estendidos isoladamente

```bash
pnpm exec playwright test e2e/cart e2e/checkout e2e/home
```

## Cenários de validação manual (um por história)

1. **Cobertura de falhas (US1)** — em qualquer teste/console do navegador, rode
   `window.__nftMock.scenario.select('price-change-at-checkout')`, complete um checkout e confirme
   que a tela avisa sobre a mudança de preço antes de permitir confirmar; repita com
   `'short-session'` (deslogado automaticamente após o TTL curto) e com `'server-error'`
   (estado de erro com ação de retry no catálogo/carrinho).
2. **Rollback do carrinho (US2)** — adicione ao carrinho uma edição cuja quantidade solicitada
   exceda o estoque disponível, aumente a quantidade pelo stepper e confirme que a UI mostra o valor
   otimista e depois reverte, com uma mensagem inline explicando o motivo.
3. **Auditoria (US3)** — abra `specs/002-nft-marketplace-screens/checklists/ux-a11y-review.md` e
   confirme que os 25 itens estão `[x]` com uma nota, ou que a pendência tem uma razão registrada.

## Testes automatizados

```bash
pnpm lint
pnpm typecheck
pnpm test:e2e            # suíte completa — MUST continuar em 71+ testes passando
pnpm build
```

Nenhum teste pré-existente pode regressar (FR-006); os novos testes de cenário de falha e de
rollback MUST ser adicionados às suítes já existentes (`e2e/cart/cart.spec.ts`,
`e2e/checkout/checkout.spec.ts`, `e2e/home/catalog.spec.ts`), não em pastas novas.
