# Contract: Coins Backend REST API (`server/`, real, not mocked)

Base URL: `http://localhost:4000` in development (`VITE_COINS_API_URL`). All endpoints require an
`X-User-Id` header (research.md D3 — trusted, not independently verified).

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/coins/balance` | — | `200 { userId, balance }` |
| POST | `/coins/topup` | `{ amount: number }` (inteiro positivo) | `201 { userId, balance, transactionId }` |
| POST | `/coins/debit` | `{ amount: number, orderRef?: string }` | `200 { userId, balance, transactionId }`; `409 { error: 'insufficient_balance', balance }` se `amount > balance` |
| POST | `/coins/refund` | `{ amount: number, orderRef?: string }` | `200 { userId, balance, transactionId }` |

- Ausência de `X-User-Id` → `401`.
- `amount` ausente, zero ou negativo → `400`.
- Todas as respostas de sucesso incluem o `balance` já atualizado, para o cliente não precisar de
  uma segunda chamada a `GET /coins/balance` depois de cada mutação.

## Uso no frontend

- **Saldo + top-up** (`src/pages/wallets`, `CoinsBalanceSection.tsx`): `GET /coins/balance` ao
  carregar; `POST /coins/topup` ao confirmar um valor de recarga; a seção atualiza imediatamente
  após a resposta (sem exigir refresh — FR-003).
- **Pagamento no checkout** (`src/pages/checkout`, `PaymentMethodPicker.tsx` +
  `CheckoutPage.tsx`): ao escolher "pagar com coins", o total do pedido é convertido via
  `ETH_TO_COINS_RATE` (data-model.md) → `POST /coins/debit { amount, orderRef: <chave de
  idempotência do pedido> }` → só em caso de sucesso, prossegue com a criação do pedido mockado já
  existente (`useCreateOrder()`) → se a criação do pedido falhar, `POST /coins/refund` com o mesmo
  `amount`/`orderRef`, best-effort (research.md D5).
