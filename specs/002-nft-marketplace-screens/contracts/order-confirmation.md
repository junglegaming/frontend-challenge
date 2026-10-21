# Contract: Confirmação de Pedido (`pages/order-confirmation`, rota `/orders/$orderId`, protegida)

## Carregamento

- `GET` do `Order` por `orderId` (`domains/orders`); assina `order.updated` enquanto
  `status` não estiver em `TERMINAL_ORDER_STATUSES`.
- `orderId` inexistente ou pertencente a outro usuário → estado "não encontrado" (FR-023), nunca
  dados parciais de outro pedido.

## Estados por `Order.status`

| Status | Conteúdo |
|---|---|
| `pending` | estado de espera (ex.: "Confirmando sua transação…"), sem recibo, sem link de explorador |
| `confirmed` | recibo completo: ID da transação, data, total, carteira, linhas (edições/subtotal), taxa de rede, total, link "Ver no Etherscan" (`Order.transaction.explorerUrl`) |
| `declined` | estado de falha com `Order.declineReason`, sem recibo |

## Imutabilidade do recibo

`Order.lines`/valores são o snapshot do momento da criação (constituição) — a tela MUST renderizar
exatamente esses valores, nunca recalculá-los a partir do catálogo atual.

## Responsivo

- Mesmo conteúdo em desktop e mobile (`Confirmação de Pedido.png` já é um cartão centralizado
  estreito) — em 390 px, o cartão ocupa a largura disponível sem rolagem horizontal.

## Acessibilidade

- Ícone "Thank you" decorativo (`aria-hidden`).
- Link do explorador externo com indicação de abertura em nova aba para leitores de tela.
