# Domínio `orders`

Criação idempotente e consulta de pedidos. Consome `order.updated` e reconcilia com REST após reconexão.
Estados `pending` → `confirmed` | `declined` (terminais).
