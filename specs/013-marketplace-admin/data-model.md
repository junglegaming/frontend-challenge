# Data Model: Administração do marketplace completa

Nada é persistido pelo site; o estado vive no mock (`mocks/state.ts`, `orders`, `users`, `nfts`). Os formatos abaixo
viram contratos TypeScript/Zod em `apps/web/src/domains/admin/model/contracts.ts` (Princípio II). O `Order` do recibo
(`@/domains/orders`) é reaproveitado.

## Visão geral (`GET /api/admin/overview`)

| Campo | Tipo | Regra |
|---|---|---|
| `products.total` | inteiro ≥ 0 | NFTs publicados na vitrine (não retirados pelo admin) |
| `users.total` | inteiro ≥ 0 | todas as contas |
| `users.suspended` | inteiro ≥ 0 | contas suspensas; `≤ users.total` |
| `orders.total` | inteiro ≥ 0 | todos os pedidos |
| `orders.pending` / `confirmed` / `declined` | inteiro ≥ 0 | por estado; a soma é `orders.total` |

Calculada ao abrir a tela (sem tempo real). Antes de contar, o mock "liquida" pedidos pendentes vencidos.
Cache: `['admin', 'overview']`.

## Pedido na lista (`AdminOrderSummary`)

| Campo | Tipo | Regra |
|---|---|---|
| `id` | string | identificador do pedido |
| `status` | `pending` \| `confirmed` \| `declined` | |
| `createdAt` | ISO string | base da ordenação (mais recente primeiro; desempate por `id` decrescente) |
| `buyer` | `{ userId, fullName, email }` | usuário dono do pedido e o nome/e-mail registrados no pedido |
| `itemCount` | inteiro ≥ 1 | soma das quantidades das linhas |
| `total` | string decimal (ETH) | `EthAmount`, nunca número de ponto flutuante |
| `network` | rede do pedido | |

## Página de pedidos (`GET /api/admin/orders`)

Parâmetros: `status` (opcional), `page` (inteiro ≥ 1, padrão 1), `pageSize` (padrão e máximo do site: 20).
Resposta: `{ items: AdminOrderSummary[], page, pageSize, total, totalPages }`, onde `total` já respeita o filtro.
Página além do fim ⇒ `items` vazio (a tela mostra o estado vazio e o caminho para a primeira página).

### Estado na URL (`/admin/orders`)

`status?: 'pending' | 'confirmed' | 'declined'`, `page?: inteiro ≥ 1`. O padrão nunca é gravado (primeira página sem
filtro = `/admin/orders`). Valor malformado ⇒ ignorado (primeira página, todos os estados). Trocar o filtro volta à
página 1.

## Pedido no detalhe (`GET /api/admin/orders/:orderId`)

`AdminOrderDetail` = `Order` (id, status, version, createdAt, updatedAt, network, wallet, collector, lines, coupon,
subtotal, discount, networkFee, total, transaction, declineReason) + `userId`. Mesma forma do recibo do comprador, para
os valores serem idênticos (SC-004). Identificador inexistente **ou malformado** ⇒ `404 NOT_FOUND`.

## Erros (admin)

| Situação | Resposta do mock | O que a tela mostra |
|---|---|---|
| Sem sessão | `401` | vai ao login (regra existente) |
| Sessão de colecionador | `403 FORBIDDEN` | início com aviso de acesso negado |
| Pedido inexistente/malformado | `404 NOT_FOUND` | "Pedido não encontrado" + "Voltar para a lista" |
| Falha do serviço simulado | cenários existentes (5xx/rede) | "Não foi possível carregar…" + "Tentar de novo" |

## Menus (estado de apresentação)

| Menu | Itens | Regras |
|---|---|---|
| Admin | Visão geral, Produtos, Usuários, Pedidos, Moedas, (separador) Sair do site | `active` marca o atual com `aria-current="page"`; "Sair do site" encerra a sessão do site e volta ao início |
| Conta | Dados do perfil, Carteiras, Administração (**só** `role === 'admin'`), itens desativados, Sair | o item Administração leva a `/admin` |
| Navbar | + link "Administração" **só** `role === 'admin'` | papel desconhecido (sessão carregando) = oculto |

Clique simples num item de link navega pelo roteador (sem recarregar); com Ctrl/Cmd/Shift/Alt, botão do meio ou
`target`, o navegador age normalmente. Itens desativados continuam inertes.

## Mock

- `OrderService.listAll({ status?, page, pageSize })`, `getAny(orderId)` (sem checar dono; só o handler de admin o usa) e
  `countByStatus()`; todos chamam a liquidação de pendentes vencidos antes de ler.
- Os handlers de `/admin/overview` e `/admin/orders*` usam o `requireAdmin` existente.
- O isolamento do colecionador não muda: `GET /api/orders/:id` continua exigindo o dono.
