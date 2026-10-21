# Contract: Pagamento / Checkout (`pages/checkout`, rota `/checkout`, protegida)

## Pré-condições de entrada

- Sessão ativa (senão redireciona para `/login?redirect=/checkout`, D7).
- Carrinho não-vazio e `Quote.purchasable === true` (senão redireciona para `/cart`, edge case do
  spec).

## Formulário "Perfil do colecionador" (campos → contrato, ver data-model.md e research.md D2)

| Campo | Obrigatório | Fonte |
|---|---|---|
| Nome de exibição | sim | `CollectorDetails.fullName` |
| E-mail | sim | `CollectorDetails.email` |
| Rede | sim | `CreateOrderRequest.network` |
| Endereço da carteira / Tipo de carteira | sim | seleção de `Wallet` existente ou `WalletInput` inline |
| Observação do colecionador | não | `CollectorDetails.note` |
| Nome de usuário / Nome do perfil / Nome ENS / Código de indicação | não (somente leitura/decorativo) | ver research.md D2 |
| "Usar outra carteira?" | — | alterna para um segundo `WalletInput` inline |

Validação client-side (Zod) bloqueia o submit enquanto `fullName`, `email`, `network`,
`wallet`/`walletId` estiverem ausentes (FR-014).

## Painel "Seus NFTs" / resumo

- Reaproveita a `Quote` já calculada no carrinho (linhas, subtotal, desconto, taxa de rede, total).
- Campo de cupom reaproveitado (aplicar aqui também é permitido).
- Seletor de carteira/rede (`radio-group`): lista `GET /wallets` + opção "conectar" por provedor
  (`WALLET_PROVIDERS`).

## Submissão ("Confirmar compra")

1. Revalida a cotação (`Quote.signature` atual) imediatamente antes de enviar.
2. Envia `CreateOrderRequest` com a `idempotencyKey` da sessão de checkout (D4).
3. Sucesso → navega para `/orders/$orderId` (FR-017).
4. Timeout/erro de rede → mantém o formulário preenchido e permite nova tentativa com a mesma chave
   (FR-015, sem pedido duplicado).
5. Mudança na `Quote` entre a entrada na tela e o submit (preço/estoque) → bloqueia o submit e exibe
   o(s) `QuoteIssue` antes de permitir nova tentativa.

## Responsivo

- Desktop: formulário à esquerda, resumo + seleção de carteira à direita (`Pagamento.png`).
- Mobile: formulário, depois resumo, depois seleção de carteira e botão "Confirmar compra", em coluna
  única.

## Acessibilidade

- Campos obrigatórios marcados (`Label` com marcador, igual ao padrão de 001).
- Erros de validação associados por `aria-describedby`; foco move para o primeiro campo inválido ao
  tentar submeter.
