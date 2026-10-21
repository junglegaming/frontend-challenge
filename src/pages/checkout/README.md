# Página `checkout` — Pagamento

**Rota:** `/checkout` (protegida)

Etapas: dados do colecionador → carteira e rede (conexão simulada) → revisão → envio → pendente/recusado
(ou recibo em `/orders/$orderId` quando confirmado). Revalida a cotação antes de enviar e exige nova
confirmação se algo mudou (inclusive via `nft.updated`); a tentativa usa uma chave de idempotência que
sobrevive a timeout e refresh; o rascunho fica em `sessionStorage` por usuário para retomar após a sessão
expirar. Detalhes: `specs/003-checkout-payment`.

**Usa os domínios:** `cart`, `wallets`, `orders`, `checkout`, `auth`, `profile`.

```
model/       checkout-flow (máquina de estados), quote-diff, checkout-draft
hooks/       use-wallet-connection, use-checkout-realtime, use-order-outcome
components/  CollectorForm, WalletPicker, WalletConnectionStatus, ReviewPanel,
             OrderSummary, QuoteChangedNotice, OrderOutcome, CheckoutSkeleton
```
