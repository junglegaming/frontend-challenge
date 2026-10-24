# Data Model: Quality Hardening — Failure Coverage, Rollback Test, A11y/UX Audit

Nenhuma entidade nova. Esta feature consome exatamente os contratos já definidos em
`specs/002-nft-marketplace-screens/data-model.md` (Cart/CartItem/Quote, Order, Wallet) e os cenários
de falha já modelados em `src/mocks/scenarios/definitions.ts`. Nenhum campo, contrato ou evento é
adicionado ou alterado.

As únicas mudanças de "forma de dado" são locais à UI, não ao domínio:

- `CartPage`/`CheckoutPage`/`WalletsPage` passam a renderizar o estado `isError` que o `useQuery`
  já expõe (o dado já existe no cliente TanStack Query; só não era lido pela UI).
- `OrderSummary` (checkout) ganha o mesmo atributo `aria-live="polite"` que `CartSummary` já tem —
  não é uma mudança de dado, só de apresentação.
