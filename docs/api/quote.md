# Contrato — Cotação e Cupons

A cotação é a referência para finalizar o pedido: `POST /api/orders` revalida tudo o que
ela declara e pode responder `QUOTE_STALE`.

## Modelo

```ts
type Coupon = {
  code: string;              // "LAUNCH10" (normalizado uppercase)
  type: "percent" | "fixed";
  value: number;             // percent: 10 → 10%; fixed: "0.05" ETH (string no total)
  description: string;       // "Desconto do lançamento"
  expiresAt?: string;        // ISO
};

type Quote = {
  subtotal: string;          // soma dos lineTotal do carrinho
  discount: string;          // "0" quando sem cupom
  networkFee: string;        // taxa de rede simulada (determinística por cenário)
  total: string;             // subtotal - discount + networkFee (decimal.js)
  currency: "ETH";
  coupon: Coupon | null;
  quoteVersion: number;      // muda quando preço/disponibilidade/cupom mudam
  items: {                   // espelho dos itens avaliados
    nftId: string;
    qty: number;
    unitPrice: string;
    available: number;
  }[];
  available: boolean;        // false → algum item esgotou
  updatedAt: string;
};
```

## Endpoints

### `POST /api/cart/quote` 🔒/anon — calcular resumo

```jsonc
// request
{ "coupon": "LAUNCH10" }      // coupon opcional
// 200 OK → Quote
```

| Status | `code` | Quando / UI |
| ---: | --- | --- |
| 422 | `COUPON_INVALID` | código inexistente → erro no input, resumo sem desconto |
| 410 | `COUPON_EXPIRED` | código expirado → mensagem específica + botão remover |
| 409 | `INSUFFICIENT_STOCK` | item do carrinho esgotou → banner + remover/revalidar item |
| 422 | `VALIDATION_ERROR` | carrinho vazio, `coupon` malformado |

Comportamentos:

- Revalida a cada abertura do carrinho/checkout e após qualquer `nft.updated`.
- `quoteVersion` acompanha a versão dos itens; é enviado em `POST /api/orders`.
- Cupom inválido/expirado **não** impede ver o subtotal — só o desconto.

### `POST /api/coupons/validate` 🔒/anon — validar código isoladamente

```jsonc
// request
{ "code": "LAUNCH10" }
// 200 OK → { "coupon": Coupon }
// 422 COUPON_INVALID | 410 COUPON_EXPIRED
```

Usado pelo `CouponInput` para feedback imediato antes de aplicar.

## Cupons seed (fixtures)

| Código | Efeito | Status |
| --- | --- | --- |
| `LAUNCH10` | 10% de desconto ("Desconto do lançamento") | válido |
| `GREEN5` | 5% de desconto | válido |
| `EXPIRED` | 15%, `expiresAt` no passado | expirado (410) |
| `FAKE` | — | não existe (422) |

## Regras de cálculo

1. Todos os cálculos em `decimal.js` sobre strings (`lib/money.ts`); apresentação com
   até 4 casas para `networkFee`/`total`, 2 casas para preços unitários.
2. `total = subtotal − discount + networkFee`; `networkFee` é determinística
   (fixa por carrinho, ex.: `0.0042`) — varia apenas entre cenários de teste.
3. A API é a referência: a UI **nunca** recalcula o total por conta própria para exibir
   valores finais; usa o espelho local apenas para feedback instantâneo entre refetchs.
