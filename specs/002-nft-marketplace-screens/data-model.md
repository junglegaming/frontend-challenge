# Data Model: Telas do Marketplace de NFTs (Mobile + Desktop)

Todas as entidades abaixo já existem como contratos tipados em `src/domains/*/model/contracts.ts`;
este documento mapeia cada uma às telas desta feature e marca o que é somente leitura. Nenhum campo
novo é introduzido no backend simulado (ver `research.md` D2/D3).

## SessionUser / Session (`domains/auth`)

Usado por: diálogo de autenticação, estado da Navbar, guard de rotas protegidas.

- `id`, `name`, `email`, `username`: string, obrigatórios.
- `avatarUrl`: `string | null`.
- `Session.token`: string; `expiresAt`: string (ISO) — expiração MUST encerrar a sessão e limpar
  caches privados (Princípio IV).
- `LoginRequest`: `email` (obrigatório, formato e-mail), `password` (obrigatório).
- `SignupRequest`: `name`, `username`, `email`, `password` — todos obrigatórios; `email` MUST ser
  único (conflito tratado como erro inline, FR-006).

## NftSummary / Nft / NftEdition (`domains/catalog`)

Usado por: grade da Home (somente leitura nesta feature; a tela de detalhe já está implementada).

- `category`: um de `NFT_CATEGORIES` (8 valores fixos) — alimenta os facetos de coleção.
- `priceFrom`: `EthAmount` (string decimal) — usado no filtro de faixa de preço e ordenação
  `price_asc`/`price_desc`.
- `version`: number, monotônico — cartões MUST ignorar eventos `nft.updated` com versão menor ou
  igual à já renderizada (Princípio IV, duplicata/evento antigo).
- `CatalogQuery`: `q`, `category[]`, `availability` (`all`|`available`), `minPrice`, `maxPrice`,
  `sort` (`recent`|`price_asc`|`price_desc`|`name_asc`), `page`, `pageSize` — espelha 1:1 o estado
  de busca na URL da Home (FR-001/FR-002).

## Cart / CartItem / Quote (`domains/cart`)

Usado por: Carrinho (leitura/escrita) e resumo do Checkout (leitura da `Quote`).

- `CartItem.quantity`: integer, MUST respeitar `available` e `maxPerOrder` — excesso é clampado na UI
  (edge case do spec) antes mesmo de enviar o `PATCH`.
- `CartItem.status`: `ok | price_changed | quantity_exceeds_stock | sold_out` — cada estado MUST ter
  uma indicação inline distinta na linha do carrinho.
- `Cart.couponCode`: `string | null` — `ApplyCouponRequest.code` inválido MUST deixar `couponCode`
  inalterado e mostrar erro (FR-011).
- `Quote.signature`: string determinística — MUST ser enviada sem alteração em
  `CreateOrderRequest.quoteSignature`; qualquer mudança no carrinho invalida a assinatura e exige
  nova cotação antes de "Confirmar compra" (FR-015).
- `Quote.purchasable`: boolean — `false` MUST bloquear o botão de finalizar compra quando há
  `issues` bloqueantes (`sold_out`, `quantity_exceeds_stock`) ou o carrinho está vazio (FR-012).
- `QuoteIssue`: union discriminada por `type` — cada variante MUST ter uma mensagem inline específica
  (preço mudou, estoque insuficiente, esgotado, cupom removido).

## CreateOrderRequest / Order / OrderLine (`domains/orders`)

Usado por: submissão do Checkout (escrita) e Confirmação de Pedido (leitura).

- `CreateOrderRequest`: `quoteSignature`, `network`, `walletId`, `collector` (`CollectorDetails`) —
  todos obrigatórios; enviado com a chave de idempotência da mutation (D4 do research.md), não como
  campo do payload de domínio.
- `CollectorDetails.fullName`, `.email`: obrigatórios; `.country`: obrigatório no contrato mas sem
  campo visível no design — valor padrão fixo (D2); `.note`: opcional.
- `Order.status`: `pending | confirmed | declined` — a tela de confirmação MUST renderizar um dos
  três estados (FR-017/FR-018); `TERMINAL_ORDER_STATUSES` (`confirmed`, `declined`) marca quando
  parar de aguardar atualização via `order.updated`.
- `Order.lines`: snapshot imutável no momento da criação — MUST NOT ser recalculado a partir do
  catálogo atual, mesmo que o preço do NFT mude depois (constituição: "recibos MUST reproduzir o
  snapshot do pedido").
- `Order.transaction`: `{ hash, explorerUrl } | null` — o link "Ver no Etherscan" (FR-017) só existe
  quando não-nulo (ou seja, apenas em `status: 'confirmed'`).
- `Order.declineReason`: `string | null` — exibido apenas no estado `declined` (FR-018).

## Wallet / WalletInput (`domains/wallets`)

Usado por: tela de Carteiras (leitura/escrita) e seletor de carteira do Checkout (leitura + criação
inline).

- `Wallet.slot`: `primary | secondary` — no máximo uma carteira por slot e por usuário (FR-019/021).
- `Wallet.provider`: um de `WALLET_PROVIDERS` (`metamask`, `coinbase`, `walletconnect`).
- `Wallet.networks`: `Network[]` (não-vazio) — uma carteira MUST suportar ao menos uma rede.
- "Igual à carteira principal" (FR-020): copia os valores de `WalletInput` da carteira `primary` para
  o formulário da `secondary` antes de salvar (não é um campo persistido à parte).

## Profile (`domains/profile`, somente leitura nesta feature)

Usado por: preenchimento de "Nome de exibição/usuário/ENS" no Checkout e Carteiras (D2/D3) — a edição
de perfil em si já está implementada na tela Perfil do Colecionador, fora de escopo aqui.

- `ensName` (sem TLD) + `ensTld` (`.eth | .xyz | .art`) — exibidos juntos como o campo "Nome ENS".
- `walletNickname` — candidato ao campo "Apelido da carteira" quando o usuário ainda não tiver uma
  carteira salva (valor inicial sugerido, não vinculante).

## FavoritesResponse (`domains/favorites`, fora do escopo de escrita nesta feature)

Referenciado apenas pela Home (ícone de favorito nos cartões, já suportado por
`use-favorites`/`use-toggle-favorite` existentes) — nenhuma tela nova desta feature introduz
mutações de favoritos.
