# Contrato: como o site usa o serviço de moedas (sem mudá-lo)

Fonte do contrato: `specs/007-monorepo-vercel-blob/contracts/api-routes.md` + `specs/010-api-production-backend/contracts/api-delta.md`.
O site acessa sempre por `/backend/*` (same-origin; Vite proxy em dev/preview, `vercel.json` em produção ⇒ `/api/*`).

| Chamada do site | Quando | Cabeçalhos | Respostas tratadas |
|---|---|---|---|
| `POST /backend/auth/token {ownerId}` | primeira chamada por dono e ~30 s antes de expirar | — | 200 `{token, expiresAt}` |
| `GET /backend/coins/balance` | Carteiras e checkout (método "moedas") | `Authorization` | 200 saldo; 401 ⇒ renova token 1 vez |
| `GET /backend/coins/transactions?limit=5` | Carteiras | `Authorization` | 200 lista (mais recente primeiro) |
| `POST /backend/coins/topup {amount}` | recarga; crédito de volta do checkout | `Authorization`, **`Idempotency-Key`** | 200 saldo; 400; 409 (final) |
| `POST /backend/coins/debit {amount}` | pagamento no checkout | `Authorization`, **`Idempotency-Key`** | 200 saldo; 402 (saldo insuficiente); 409 (final) |

Regras do cliente:

- Nunca chama `/backend/admin/*` (fora de escopo).
- Repete automaticamente só rede/timeout/5xx (no máximo 2 vezes nas queries); nunca 4xx; 401 só renova o token 1 vez.
- Toda escrita leva `Idempotency-Key`; o tipo da função exige a chave.
- Logout/troca de usuário descartam tokens e cache (já implementado: `subscribeSessionToken(clearLedgerTokens)`,
  `queryClient.clear()`).

## Superfície pública do domínio `@/domains/ledger` usada pelas páginas

| Export | Usado por |
|---|---|
| `useLedgerBalance()` | Carteiras, `PaymentMethodPicker` |
| `useLedgerTransactions(limit)` | Carteiras |
| `useLedgerTopUp()` — `mutate({ amount, idempotencyKey })`, otimista | Carteiras |
| `ledgerDebit(ownerId, amount, key)`, `ledgerCredit(ownerId, amount, key)` + `invalidateLedger(queryClient, ownerId)` | Checkout |
| `toCoinsAmount`, `ETH_TO_COINS_RATE` | Checkout, `PaymentMethodPicker` |
| `LedgerError` (`isInsufficientBalance`, `isKeyConflict`, `isRetryable`) | Carteiras, Checkout |
| `coinsKeys(orderKey)` → `{ debit, refund }` | Checkout |
