# Contract: Página de Pagamento (`pages/checkout`, rota `/checkout`, protegida)

Evolui `specs/002-nft-marketplace-screens/contracts/checkout.md`. Fonte visual: frame "Pagamento" do Figma.

## Entrada

| Situação | Comportamento |
|---|---|
| Sem sessão | `/login?redirect=/checkout` (guard existente da rota) |
| Carrinho vazio | redireciona para `/cart` com aviso |
| Rascunho do mesmo usuário | restaura formulário, rede e carteira (sem conexão) |
| Rascunho com `pendingOrderId` | abre na etapa "Processando pagamento" |
| Rascunho de outro usuário | descartado |

## Dependências consumidas (somente leitura, API pública)

| Origem | Uso |
|---|---|
| `@/domains/cart` | `cartQueries.view`, `useCartQuote(network)`, `CART_QUERY_KEY`, `Quote`, `QuoteIssue` |
| `@/domains/wallets` | `useWallets`, `WalletForm`, `NETWORKS`, `NETWORK_LABELS`, `PROVIDER_LABELS`, `Wallet`, `WalletConnection` |
| `@/domains/orders` | `useCreateOrder`, `useOrder`, `Order` |
| `@/domains/checkout` | — (chave por tentativa fica na página; ver research.md R5) |
| `@/domains/profile` | `useProfile` (pré-preenchimento) |
| `@/domains/auth` | `useSession` (`userId` do rascunho) |
| `@/shared/api/http` | `api`, `isApiError` (conexão de carteira — R2) |
| `@/shared/realtime/client` | `realtimeClient.subscribe('nft.updated')`, `onReconnect` |

## REST usado

| Chamada | Quando | Erros tratados |
|---|---|---|
| `GET /cart`, `GET /cart/quote?network=` | entrada, troca de rede, antes de enviar, evento/reconnect | rede/5xx → erro com "Tentar novamente" |
| `GET /wallets`, `POST /wallets` | lista / cadastro inline | 422 nos campos |
| `POST /wallets/:id/connect` `{ network }` | botão "Conectar" | 422 `WALLET_REJECTED` → estado recusado; 422 `network` → incompatível |
| `POST /orders` + `Idempotency-Key` | "Confirmar compra" | 409 `QUOTE_STALE`/`AVAILABILITY_CONFLICT` → diff e nova confirmação; `TIMEOUT`/rede → retry com mesma chave; 401 → rascunho + login; 422 → campos |
| `GET /orders/:id` (+ `order.updated`) | etapa pendente | via `useOrder` |

## Regiões da tela

1. **Perfil do colecionador** — Nome de exibição*, E-mail*, Rede*, Observação.
2. **Carteira e rede** — lista de carteiras (apelido, provedor, endereço abreviado, redes suportadas);
   "Usar outra carteira?"; status de conexão (Desconectada / Conectando… / Conectada / Recusada) com botões
   "Conectar", "Tentar novamente", "Desconectar"; aviso de rede incompatível.
3. **Seus NFTs (resumo)** — linhas, aviso de mudanças (antigo → novo), subtotal, desconto, taxa de rede,
   total; skeleton durante carregamento.
4. **Ação principal** — "Revisar pedido" (form) → "Confirmar compra" (review) → "Confirmando…"
   (submitting, desabilitado); "Voltar e editar" na revisão.
5. **Resultado** — "Processando pagamento" (pending, com id do pedido); "Pagamento recusado" com motivo e
   "Tentar novamente" (declined).

## Textos-chave (pt-BR)

- Mudança: "Os valores do pedido mudaram. Revise e confirme novamente."
- Recusa de conexão: "A conexão foi recusada na carteira." + "Tentar novamente"
- Timeout: "Não recebemos a confirmação a tempo. Tente novamente — o mesmo pedido será recuperado."
- Sessão: "Sua sessão expirou. Entre novamente para concluir a compra; seus dados foram guardados."

## Acessibilidade

- Um `aria-live="polite"` para conexão, mudanças de valores, envio e pendência; `role="alert"` para
  bloqueios e recusa.
- Foco: primeiro campo inválido ao tentar avançar; título da etapa ao trocar de etapa.
- Status da conexão com texto + ícone (não só cor).

## Responsivo

- ≥ 1024 px: duas colunas (formulário + carteira | resumo + ação), como no Figma.
- < 1024 px: coluna única — formulário, carteira, resumo, ação. Sem rolagem horizontal em 390/768/1440.
