# Página `checkout` — Pagamento

**Rota:** `/checkout` (protegida)

Dados do colecionador → carteira e rede → revisão → envio. Revalida a cotação antes de confirmar,
usa chave de idempotência por tentativa e recupera o pedido após timeout.

**Usa os domínios:** `cart`, `wallets`, `orders`, `auth`.
