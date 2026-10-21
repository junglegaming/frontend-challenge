# Data Model: Página de Pagamento (003-checkout-payment)

Todos os tipos abaixo são **locais da página** (`src/pages/checkout/model/`). Os contratos de transporte
(`Quote`, `Wallet`, `WalletConnection`, `Order`, `CreateOrderRequest`) vêm dos domínios e não mudam.

## CheckoutStep (máquina de estados — R1)

```text
            NEXT (form válido + carteira conectada + cotação comprável)
   form ─────────────────────────────────────────────────────────▶ review
    ▲  ◀──────────── BACK / WALLET_CHANGED / NETWORK_CHANGED ───────  │
    │                                                                 │ CONFIRM
    │                         QUOTE_CHANGED (diff) ◀── submitting ◀───┘
    │                         (volta para review com aviso)   │
    │                                                         │ ORDER_CREATED
    │   RETRY                                                 ▼
 declined ◀──────────── ORDER_DECLINED ──────────────────── pending
                                                              │ ORDER_CONFIRMED
                                                              ▼
                                                  navega para /orders/$orderId
```

| Estado | Dados extras | Confirmar habilitado? |
|---|---|---|
| `form` | — | não (botão é "Revisar pedido") |
| `review` | `reviewedQuote: Quote`, `change: QuoteChange \| null`, `error: string \| null` | sim, se `purchasable` e carteira conectada |
| `submitting` | `reviewedQuote` | não (ignora cliques — FR-014) |
| `pending` | `orderId` | não |
| `declined` | `orderId`, `reason` | — ("Tentar novamente") |

Regras:
- `WALLET_CHANGED`, `NETWORK_CHANGED` e `WALLET_DISCONNECTED` a partir de `review` voltam para `form`
  (FR-008).
- `QUOTE_CHANGED` só tem efeito em `review`/`submitting`; em `form` o resumo apenas se atualiza.
- `pending`, `declined` e a confirmação ignoram eventos de cotação.
- `ORDER_CONFIRMED`/`ORDER_DECLINED` só saem de `pending` (estados terminais não regridem — FR-015).

## WalletConnectionState (R2)

`idle` → `connecting` → `connected { walletId, network }` | `rejected { message }`.
`DISCONNECT`, troca de carteira ou de rede → `idle`. Nunca persistido.

## QuoteChange (R3)

| Campo | Tipo | Origem |
|---|---|---|
| `lines` | `{ itemId, name, previous: EthAmount, current: EthAmount }[]` | snapshot × cotação atual |
| `removed` | `{ itemId, name }[]` | linhas que sumiram |
| `issues` | `QuoteIssue[]` | `Quote.issues` atual (esgotado, estoque, cupom removido) |
| `networkFee` / `total` | `{ previous, current } \| null` | comparação com `eth` (sem recalcular) |
| `blocking` | `boolean` | `!Quote.purchasable` |

## CheckoutDraft (R6) — `sessionStorage['checkout:draft']`

| Campo | Tipo | Regra |
|---|---|---|
| `userId` | `string` | obrigatório; diferente da sessão atual → rascunho descartado |
| `collector` | `{ fullName, email, note? }` | restaurado no formulário |
| `network` | `Network \| null` | |
| `walletId` | `string \| null` | restaurado como seleção, **sem** conexão |
| `pendingOrderId` | `string \| null` | se presente, abre direto em `pending` |
| `savedAt` | ISO string | rascunhos com mais de 24 h são descartados |

Validado com Zod ao ler (dado externo). Apagado após `ORDER_CONFIRMED`.

## CollectorFormValues (existente, ajustado)

`fullName` (3–60), `email` (válido), `network` (`NETWORKS`), `note` (≤ 280, opcional),
`walletId` (obrigatório; mensagem "Selecione ou adicione uma carteira.").
