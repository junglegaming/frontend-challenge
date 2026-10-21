# Contract: Carrinho (`pages/cart`, rota `/cart`)

## Composição

- Lista de linhas (`CartItem`): imagem, nome, "ID do token", preço unitário, stepper de edições,
  subtotal da linha, remover.
- Painel "Resumo da carteira": campo de cupom + "Aplicar", subtotal, desconto, taxa de rede
  (`Quote.networkFee`), total, botão "Conectar e finalizar", link "Continuar explorando".
- Seção "Colecionadores também viram" (carrossel de sugestões, somente leitura — reaproveita cartões
  do catálogo).

## Interações e requests

| Ação | Request | Atualização otimista? |
|---|---|---|
| +/- quantidade da linha | `UpdateCartItemRequest.quantity` | **Sim** (D5 do research.md) — recalcula linha/; rollback + erro inline se a resposta trouxer `quantity_exceeds_stock` |
| Remover linha | `DELETE /cart/items/:itemId` | Não (otimista opcional, mas sem exigência da constituição aqui) |
| Aplicar cupom | `ApplyCouponRequest` | Não — aguarda confirmação do servidor antes de atualizar `couponCode`/desconto |
| Remover cupom | `DELETE /cart/coupon` | — |
| "Conectar e finalizar" | nenhum request direto — navega para `/checkout` (via `/login?redirect=/checkout` se não autenticado) | — |

## Estados

- Carrinho vazio: substitui a lista + resumo por um estado vazio explícito com CTA para o catálogo
  (FR-010).
- Linha com `status !== 'ok'`: indicação inline específica por tipo (`price_changed` mostra preço
  anterior/novo; `quantity_exceeds_stock` clampa e avisa; `sold_out` desabilita o stepper).
- Cupom inválido: erro inline no campo, sem alterar os totais (FR-011).

## Responsivo

- Desktop: tabela de linhas + sidebar de resumo lado a lado (`Carrinho de NFTs.png`).
- Mobile: linhas empilhadas, resumo abaixo da lista, mesmos controles (stepper, remover, cupom,
  finalizar) sem rolagem horizontal.

## Acessibilidade

- Stepper com `aria-label` incluindo o nome do item ("Diminuir quantidade de Emerald Ape #042");
  valor atual anunciado a cada mudança.
- Totais recalculados anunciados via região `aria-live="polite"` para leitores de tela.
