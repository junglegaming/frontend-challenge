# Domínio `admin`

Administração do **marketplace** no site (simulada no MSW, `/api/admin/*`): produtos, usuários, visão geral e pedidos de
todos os usuários (specs/005 e specs/013-marketplace-admin). Quem age é a conta do site com `role === 'admin'`
(ex.: `ana@nft.dev`); a sessão é a mesma do site. O admin das **moedas** é outro contexto (`coins-admin`, outra credencial).

## O que o domínio expõe (`index.ts`)

| Leitura / ação | Endpoint | Observação |
| --- | --- | --- |
| `useAdminOverview()` | `GET /admin/overview` | totais de produtos, usuários (e suspensos) e pedidos por estado; `staleTime: 0` (calculado ao abrir a tela) |
| `useAdminOrders({ status, page })` | `GET /admin/orders?status=&page=&pageSize=` | 20 por página, mais recentes primeiro; `status` ∈ `pending`/`confirmed`/`declined`; parâmetro inválido ⇒ `400` |
| `useAdminOrder(orderId)` | `GET /admin/orders/:orderId` | mesmo conteúdo do recibo do comprador + `userId`; inexistente ou malformado ⇒ `404` "Pedido não encontrado." |
| produtos e usuários | `/admin/nfts`, `/admin/users…` | listagem, criação, suspensão etc. (spec 005) |
| `useAdminLogout()` | — | encerra a sessão do **site** e vai ao início; o menu o chama de "Sair do site" |
| `OrderStatusBadge` | — | selo do estado (texto e cor, nunca só cor), usado pela lista e pelo detalhe |

`adminOrdersSearchSchema` descreve `?status=` e `?page=` da lista: cada chave cai no padrão por conta própria (um `page`
inválido não descarta um `status` válido), e o padrão (todos, página 1) nunca é escrito no endereço.

## Erros

Todas as rotas `/admin/*` exigem administrador: sem sessão `401` (a rota leva ao login e volta), colecionador `403`
(a rota leva ao início com o aviso de acesso negado), recurso inexistente `404`.

## Somente leitura

Pedidos têm só leitura aqui: não há rota que cancele, reembolse ou altere um pedido. O comprador continua lendo apenas
o próprio pedido por `GET /orders/:id` (`403` para os de outros).
