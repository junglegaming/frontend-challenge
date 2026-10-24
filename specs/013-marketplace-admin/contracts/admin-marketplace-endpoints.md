# Contrato: endpoints simulados novos da administração do marketplace

São rotas **do mock** (`/api/admin/*`, MSW, constituição Princípio V); não existe back-end real para elas. Todas
exigem a sessão do site com `role: "admin"` (o `requireAdmin` existente). O restante do contrato `/api/admin/*` (NFTs e
usuários) não muda.

| Rota | Resposta de sucesso | Falhas |
|---|---|---|
| `GET /api/admin/overview` | `200 { products: { total }, users: { total, suspended }, orders: { total, pending, confirmed, declined } }` | `401` sem sessão; `403` não admin |
| `GET /api/admin/orders?status=&page=&pageSize=` | `200 { items: AdminOrderSummary[], page, pageSize, total, totalPages }` | `400 VALIDATION` se `status` não for um dos três estados, `page` ou `pageSize` não forem inteiros ≥ 1 (`pageSize` ≤ 20); `401`; `403` |
| `GET /api/admin/orders/:orderId` | `200 AdminOrderDetail` | `404 NOT_FOUND` (inexistente ou malformado); `401`; `403` |

Regras:

- A lista é ordenada por `createdAt` decrescente (desempate por `id` decrescente) e mostra pedidos de **todos** os
  usuários; `total` e `totalPages` respeitam o filtro.
- Antes de contar ou ler, o mock liquida pedidos pendentes vencidos (o mesmo que `GET /api/orders/:id` faz).
- Somente leitura: não existe `POST`/`PATCH`/`DELETE` em `/api/admin/orders*`.
- `GET /api/orders/:id` (colecionador) continua restrito ao dono do pedido.

## Superfície pública de `@/domains/admin` acrescentada

| Export | Usado por |
|---|---|
| `useAdminOverview()` | `pages/admin-dashboard` |
| `useAdminOrders({ status, page })` | `pages/admin-orders` |
| `useAdminOrder(orderId)` | `pages/admin-order` |
| `useAdminLogout()` (sair do site e ir ao início) | as 7 páginas com `AdminSideMenu` |
| `OrderStatusBadge` | `pages/admin-orders`, `pages/admin-order` |
| `adminOrdersSearchSchema`, `ORDER_STATUS_LABELS`, tipos `AdminOverview`, `AdminOrderSummary`, `AdminOrderDetail`, `AdminOrdersPage` | rotas e páginas |
